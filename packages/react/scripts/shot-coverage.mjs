// SPDX-License-Identifier: MIT
// 组件截图够不够：快速模式用它决定能不能跳过整页 vr:fast。
// 规则：改动的每个源文件，连同 src 里所有（传递地）引用它的组件，都得被 browser/*.browser.test.tsx 直接截过；
// 每件一个的 theme/<件名>.css 跟它的件走。共用层（lib 被没截过的件用到、theme.css、tokens、gallery）就不够，照跑 vr:fast。
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'

const IMPORT = /(?:import|export)[^'"]*?from\s*['"](\.[^'"]+)['"]|import\s*['"](\.[^'"]+)['"]/g

const listFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(join(dir, e.name)) : [join(dir, e.name)],
  )
const importsOf = (file) =>
  [...readFileSync(file, 'utf8').matchAll(IMPORT)].map((m) => resolve(dirname(file), m[1] ?? m[2]))
// 从桶文件（src/index.ts 这类）引的名字：（演示文件从 src 的 index 引名字）。
const NAMED_IMPORT = /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"](\.[^'"]*)['"]/g
// `export { Dialog, DialogContent }` 这种列表式导出（原语多半这样写）。
const LIST = /export\s*\{([^}]*)\}(?!\s*from)/g
const DECL = /export\s+(?:default\s+)?(?:function|const|class)\s+([A-Z]\w*)/g

/** Component files the screenshot tests render (package-relative): imported by a browser test, directly or through gallery demo files. */
export function shotTargets(pkgDir) {
  const dir = join(pkgDir, 'browser')
  const srcDir = join(pkgDir, 'src')
  // 组件名 → 声明它的文件（桶文件转出的名字靠它落到具体的件）。
  const declared = new Map()
  for (const f of listFiles(srcDir))
    if (f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
      for (const m of [...readFileSync(f, 'utf8').matchAll(DECL), ...readFileSync(f, 'utf8').matchAll(LIST)])
        for (const name of m[1].split(',').map((n) =>
          n
            .trim()
            .replace(/^type\s+/, '')
            .split(/\s+as\s+/)
            .at(-1),
        ))
          if (/^[A-Z]\w*$/.test(name) && !declared.has(name)) declared.set(name, relative(pkgDir, f))
  const out = new Set()
  const seen = new Set()
  // 截图测试常直接引 gallery 的 *Usage.tsx 演示：穿过 browser/ 与 gallery/ 的文件，落到 src 的第一个文件就是被截的件。
  const walk = (file) => {
    if (seen.has(file)) return
    seen.add(file)
    for (const m of readFileSync(file, 'utf8').matchAll(NAMED_IMPORT)) {
      const target = resolve(dirname(file), m[2])
      const barrel = basename(target).startsWith('index') || existsSync(join(target, 'index.ts'))
      if (!barrel || !target.startsWith(srcDir)) continue
      for (const name of m[1].split(',').map(
        (n) =>
          n
            .trim()
            .replace(/^type\s+/, '')
            .split(/\s+as\s+/)[0],
      ))
        if (declared.has(name)) out.add(declared.get(name))
    }
    for (const raw of importsOf(file)) {
      const t = [raw, `${raw}.tsx`, `${raw}.ts`].find((c) => existsSync(c) && /\.(tsx?|mts)$/.test(c))
      if (!t || basename(t).startsWith('index.')) continue
      if (t.startsWith(srcDir)) out.add(relative(pkgDir, t))
      else if (t.startsWith(join(pkgDir, 'gallery')) || t.startsWith(dir)) walk(t)
    }
  }
  for (const f of existsSync(dir) ? readdirSync(dir) : []) if (f.endsWith('.browser.test.tsx')) walk(join(dir, f))
  return out
}

/** True when the component screenshots alone cover every changed file. */
/**
 * Which component screenshots a change needs, and whether they are enough.
 * names: test names (component file basenames) to run; covered: every changed file, and every component that
 * (transitively) imports it, has a screenshot test named after it, so page-level vr:fast can be skipped.
 */
export function shotPlan(pkgDir, changed) {
  // 截图测试名约定 = 件的文件名（kbd.tsx → 'kbd'）：只有名字对得上的件才算截过，快速模式按名字挑测试跑。
  const dir = join(pkgDir, 'browser')
  const tests = (existsSync(dir) ? readdirSync(dir) : [])
    .filter((f) => f.endsWith('.browser.test.tsx'))
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n')
  const named = (f) => {
    const n = basename(f, '.tsx')
    return new RegExp(`['"\`]${n}['"\`]|^\\s*${n}\\s*:`, 'm').test(tests)
  }
  const targets = new Set([...shotTargets(pkgDir)].filter(named))
  // src 的反向引用图；桶文件（index.ts）与 a2ui 包装只转出，不算「引用它的组件」。
  const src = listFiles(join(pkgDir, 'src')).filter((f) => /\.(tsx?|mts)$/.test(f) && !/\.test\.tsx?$/.test(f))
  const dependents = new Map()
  for (const f of src) {
    const from = relative(pkgDir, f)
    if (basename(f).startsWith('index.') || from.startsWith('src/a2ui/')) continue
    for (const t of importsOf(f)) {
      const to = relative(pkgDir, t)
      dependents.set(to, [...(dependents.get(to) ?? []), from])
    }
  }
  const names = new Set()
  let covered = true
  for (const file of changed) {
    if (/\.test\.tsx?$/.test(file) || file.startsWith('.pixelgate-unit/')) continue
    // 改了截图测试本身（或它的底座）：只影响组件截图，不碰页；跑哪些见 browserTestPlan。
    if (isBrowserShotFile(file)) continue
    const css = /^src\/theme\/(.+)\.css$/.exec(file)
    if (css) {
      if ([...targets].some((t) => basename(t, '.tsx') === css[1])) names.add(css[1])
      else covered = false
      continue
    }
    if (!file.startsWith('src/') || !/\.(tsx?|mts)$/.test(file)) {
      covered = false
      continue
    }
    // 自己和所有传递引用者里，凡是组件（.tsx）都得被截过。
    const seen = new Set([file])
    const queue = [file]
    while (queue.length)
      for (const d of dependents.get(queue.shift()) ?? [])
        if (!seen.has(d)) {
          seen.add(d)
          queue.push(d)
        }
    // 被截过的件按名字跑；没截过的件只有在它是「顶层」（src 里没有别的件再引它）时才算缺口——
    // 内部子件（grid-cells、market-heatmap-cell……）由引它的父件的截图覆盖。
    for (const f of seen)
      if (!f.endsWith('.tsx')) continue
      else if (targets.has(f)) names.add(basename(f, '.tsx'))
      else if (!(dependents.get(f) ?? []).length) covered = false
  }
  return { covered, names }
}

/** 截图测试本身的文件：browser/ 下的测试与底座（render.tsx、open-frame.tsx），加 Vitest 浏览器模式的配置。 */
const isBrowserShotFile = (file) => file.startsWith('browser/') || file === 'vitest.browser.config.ts'
/** 单个截图测试文件（*.browser.test.tsx）；其余 browser/ 下的文件与 vitest.browser.config.ts 是几个文件共用的底座。 */
const isBrowserTestFile = (file) => /^browser\/[^/]+\.browser\.test\.tsx$/.test(file)

const TEST_START = /^\s*test(?:\.\w+)?\(\s*(['"`])([^'"`]+)\1/

/**
 * 一个截图测试文件里的「条目」，按行序：每个 test('名') 的起始行，加 `const items = { 名: <件>, … }` 这种表里的每个键
 * （表里的键由下面的 for 循环变成 test(name)，测试名就是键）。表的条目带 limit：表结束行，之后的行不算它的。
 */
export function testsOf(text) {
  const lines = text.split('\n')
  const out = []
  lines.forEach((line, i) => {
    const m = TEST_START.exec(line)
    if (m) out.push({ line: i + 1, name: m[2] })
  })
  // 表：`const items… = {` 到第一行顶格的 `}`；键在两格缩进。
  const open = lines.findIndex((l) => /^const items\b.*=\s*\{\s*$/.test(l))
  if (open >= 0) {
    const close = lines.findIndex((l, i) => i > open && l.startsWith('}'))
    const limit = close < 0 ? lines.length : close + 1
    for (let i = open + 1; i < limit - 1; i++) {
      const k = /^ {2}(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$]*))\s*:/.exec(lines[i])
      if (k) out.push({ line: i + 1, name: k[1] ?? k[2] ?? k[3], limit })
    }
  }
  // 条目上方紧挨着的注释行跟着它走（「// skipped: …」写在 test 前面，改注释就是改这个测试）。
  for (const t of out) while (t.line > 1 && /^\s*\/\//.test(lines[t.line - 2])) t.line--
  return out.toSorted((a, b) => a.line - b.line)
}

/** `git diff -U0` 的输出 → 新文件里改动涉及的行号（纯删除记在删除处的下一行）。 */
export function changedLines(diff) {
  const lines = new Set()
  for (const m of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const start = Number(m[1])
    const count = m[2] === undefined ? 1 : Number(m[2])
    if (count === 0) lines.add(start + 1)
    else for (let i = 0; i < count; i++) lines.add(start + i)
  }
  return lines
}

/**
 * 改了截图测试时跑哪些（#201：原来一改就整套，两核机器上约 6 分钟）。
 * - 改动落在某几个 test('名') 里：只跑这几个名字；
 * - 落在 test 之外（import、辅助函数、循环头）：这个文件的全部测试名；
 * - 底座（render.tsx、open-frame.tsx、vitest.browser.config.ts）改了：不跑整套，退回代表件（shared: true）。
 * diffOf(file)：该文件相对 base 的 -U0 差异；未跟踪的新文件没有差异，按「全文件」算。
 */
export function browserTestPlan(pkgDir, changed, diffOf = () => '') {
  const files = changed.filter(isBrowserShotFile)
  const shared = files.some((f) => !isBrowserTestFile(f))
  const names = new Set()
  const precise = new Set() // 改动正好落在这几个 test 里（优先截）
  const unnamed = new Set() // 认不出任何测试名的文件：整个文件跑
  const fileWide = new Set() // 落在 test 之外、只能按整个文件跑的测试文件
  for (const file of files.filter(isBrowserTestFile)) {
    const path = join(pkgDir, file)
    if (!existsSync(path)) continue
    const tests = testsOf(readFileSync(path, 'utf8'))
    const diff = diffOf(file)
    const lines = diff ? changedLines(diff) : null
    let wide = lines === null
    if (lines)
      for (const line of lines) {
        const owner = tests.findLast((t) => t.line <= line)
        // 表的条目只管到表结束；表之后（循环体、辅助函数）的改动属于整个文件。
        if (owner && !(owner.limit && line > owner.limit)) {
          names.add(owner.name)
          precise.add(owner.name)
        } else wide = true
      }
    if (wide) {
      fileWide.add(file)
      if (!tests.length) unnamed.add(file)
      for (const t of tests) names.add(t.name)
    }
  }
  return { shared, names, precise, fileWide, unnamed, files: files.filter(isBrowserTestFile) }
}

/** 相对 base 的 -U0 差异，给 browserTestPlan 用。 */
export const gitDiffOf = (pkgDir, base) => (file) =>
  spawnSync('git', ['diff', '-U0', base, '--', file], { cwd: pkgDir, encoding: 'utf8' }).stdout ?? ''

/** True when the component screenshots alone cover every changed file. */
export const coveredByShots = (pkgDir, changed) => shotPlan(pkgDir, changed).covered

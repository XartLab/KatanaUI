// SPDX-License-Identifier: MIT
// 组件截图够不够：快速模式用它决定能不能跳过整页 vr:fast。
// 规则：改动的每个源文件，连同 src 里所有（传递地）引用它的组件，都得被 browser/*.browser.test.tsx 直接截过；
// 每件一个的 theme/<件名>.css 跟它的件走。共用层（lib 被没截过的件用到、theme.css、tokens、gallery）就不够，照跑 vr:fast。
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
    if (file.startsWith('browser/')) {
      // 改了截图测试本身：fast.mjs 只截 diff 里新加 / 改动的那几项（#247），不算缺口，不退回整页 vr:fast。
      continue
    }
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
  return { covered, names, browserTestsChanged: changed.some((f) => f.startsWith('browser/')) }
}

/** True when the component screenshots alone cover every changed file. */
export const coveredByShots = (pkgDir, changed) => shotPlan(pkgDir, changed).covered

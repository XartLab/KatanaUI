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
/**
 * 每张组件截图都用到的共用底座（不在 browser/ 里）：vite.config.ts（vitest.browser.config.ts 引它的 sourceConditions）、
 * 字体与样式入口（render.tsx 引的 fonts.css、ui.css、字体文件）、截图用的字体插件 shot/（#216）。命中就退回代表件。
 * 本包外的 tokens 包与依赖版本（pixelgate-cli、playwright）由 fast.mjs 算出来，从 extraShared 传进来。
 * pixelgate.*.config.ts 与 pixelgate.shared.ts 只给整页回归用，vitest.browser.config.ts 没引它们，不在其中。
 */
const SHOT_BASE = [/^vite\.config\.ts$/, /^src\/fonts\.css$/, /^src\/fonts\//, /^src\/ui\.css$/, /^shot\//]
const isShotBase = (file) => SHOT_BASE.some((re) => re.test(file))

/** 这几个包的版本变了，截图的像素就可能整体变。 */
const SHOT_DEPS = /pixelgate-cli|playwright|@vitest\/browser/

/** 条目名字取自 test('名')；`${` 是模板名，认不出。 */
const TEST_START = /^\s*(?:test|it)((?:\.\w+)?)\(\s*(['"`])([^'"`]+)\2/
// 任何看起来像在声明测试的写法（含 test.each、多行声明、模板名）：不是上面解析出的条目、也不是下面两种已知写法，就是「认不出」。
const TEST_LIKE = /\b(?:test|it)\b(?:\.\w+)*\s*[(`.]/
const KNOWN_DESCRIBE = /^\s*describe\(\s*(?:theme|(['"`])[^'"`$]+\1)\s*,/
const DESCRIBE_LIKE = /\bdescribe\b/

/** 从 text 的 open 位置（一个 `(`）起数括号，返回配平的 `)` 的位置；跳过字符串、模板、注释。配不平返回 -1。 */
function matchParen(text, open) {
  let depth = 0
  for (let i = open; i < text.length; i++) {
    const c = text[i]
    if (c === '/' && text[i + 1] === '/') {
      const nl = text.indexOf('\n', i)
      if (nl < 0) return -1
      i = nl - 1
    } else if (c === '/' && text[i + 1] === '*') {
      const e = text.indexOf('*/', i + 2)
      if (e < 0) return -1
      i = e + 1
    } else if (c === "'" || c === '"') {
      // 字符串不跨行：同一行找不到收尾引号就当成 JSX 文字里的撇号，不算字符串。
      let j = i + 1
      while (j < text.length && text[j] !== c && text[j] !== '\n') j += text[j] === '\\' ? 2 : 1
      if (text[j] === c) i = j
    } else if (c === '`') {
      let j = i + 1
      while (j < text.length && text[j] !== '`') {
        if (text[j] === '\\') j += 2
        else if (text[j] === '$' && text[j + 1] === '{') {
          const end = matchBrace(text, j + 1)
          if (end < 0) return -1
          j = end + 1
        } else j++
      }
      if (j >= text.length) return -1
      i = j
    } else if (c === '(') depth++
    else if (c === ')' && --depth === 0) return i
  }
  return -1
}
/** 模板里 `${…}` 的配平（里面的字符串与嵌套模板不再细扒，认不出时返回 -1）。 */
function matchBrace(text, open) {
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}' && --depth === 0) return i
    else if (text[i] === '`') return -1
  }
  return -1
}

/**
 * 一个截图测试文件里的「条目」，按行序，每条带起止行（1 起，含上方紧挨着的注释行）：
 * 每个 test('名')（起止由括号配平算出）、`const items = { 名: <件>, … }` 表里的每个键（表里的键由下面的 for 循环变成
 * test(name)，测试名就是键；条目从键那行到下一个键之前）。skip 标记 test.skip / test.todo。
 * unparsed：文件里有认不出的写法（test.each、多行声明、模板名、it 之外的变体、括号配不平……），调用方要整个文件跑。
 */
export function parseTests(text) {
  const lines = text.split('\n')
  const lineStarts = []
  let off = 0
  for (const l of lines) {
    lineStarts.push(off)
    off += l.length + 1
  }
  const lineOf = (idx) => lineStarts.findLastIndex((s) => s <= idx) + 1
  const entries = []
  let unparsed = false
  // 表：`const items… = {` 到第一行顶格的 `}`；键在两格缩进。
  const open = lines.findIndex((l) => /^const items\b.*=\s*\{\s*$/.test(l))
  const close = open < 0 ? -1 : lines.findIndex((l, i) => i > open && l.startsWith('}'))
  const hasLoop = open >= 0 && close > open
  lines.forEach((line, i) => {
    if (/^\s*\/\//.test(line)) return
    const m = TEST_START.exec(line)
    if (m) {
      const mod = m[1].slice(1)
      if (m[3].includes('${') || (mod && !['skip', 'todo', 'only', 'concurrent', 'sequential'].includes(mod)))
        return void (unparsed = true)
      const openIdx = lineStarts[i] + line.indexOf('(', line.indexOf(m[0].trim()))
      const end = matchParen(text, openIdx)
      if (
        end < 0 ||
        text.slice(end + 1, text.indexOf('\n', end) < 0 ? undefined : text.indexOf('\n', end)).trim() !== ''
      )
        return void (unparsed = true)
      entries.push({ line: i + 1, end: lineOf(end), name: m[3], skip: mod === 'skip' || mod === 'todo', call: true })
    } else if (TEST_LIKE.test(line)) {
      // 表之后的 for 循环里的 test(name, …) 是已知写法（名字是表里的键）。
      if (!(hasLoop && /^\s*test\(\s*name\s*,/.test(line))) unparsed = true
    } else if (DESCRIBE_LIKE.test(line) && /\bdescribe\b\s*[.(]/.test(line) && !KNOWN_DESCRIBE.test(line))
      unparsed = true
  })
  if (hasLoop) {
    const keys = []
    for (let i = open + 1; i < close; i++) {
      const k = /^ {2}(?:'([^']+)'|"([^"]+)"|([A-Za-z_$][\w$]*))\s*:/.exec(lines[i])
      if (k) keys.push({ line: i + 1, name: k[1] ?? k[2] ?? k[3] })
    }
    // 键上方紧挨着的注释行跟着它走；条目到下一个键（含它的注释）之前。
    for (const k of keys) while (k.line > open + 2 && /^\s*\/\//.test(lines[k.line - 2])) k.line--
    keys.forEach((k, i) => entries.push({ ...k, end: (keys[i + 1]?.line ?? close + 1) - 1, skip: false }))
  }
  // test 上方紧挨着的注释行跟着它走（「// skipped: …」写在 test 前面，改注释就是改这个测试）。
  for (const t of entries.filter((e) => e.call)) while (t.line > 1 && /^\s*\/\//.test(lines[t.line - 2])) t.line--
  entries.sort((a, b) => a.line - b.line)
  // 条目不许互相重叠（重叠说明括号配平出了岔子）。
  for (let i = 1; i < entries.length; i++) if (entries[i].line <= entries[i - 1].end) unparsed = true
  return { entries, unparsed }
}

/** 向后兼容：只要条目。 */
export const testsOf = (text) => parseTests(text).entries

/**
 * `git diff -U0` 的输出 → 新文件里改动涉及的行号。纯删除 `@@ -a,n +b,0 @@` 删在第 b 与 b+1 行之间，两行都记。
 * 返回 null：有内容却一行都解析不出（带颜色码、外部 diff、格式不认得），调用方按整个文件算。
 */
export function changedLines(diff) {
  const lines = new Set()
  for (const m of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const start = Number(m[1])
    const count = m[2] === undefined ? 1 : Number(m[2])
    if (count === 0) {
      if (start > 0) lines.add(start)
      lines.add(start + 1)
    } else for (let i = 0; i < count; i++) lines.add(start + i)
  }
  return lines
}

/**
 * 改了截图测试时跑哪些（#201：原来一改就整套，两核机器上约 6 分钟）。原则：漏截比多截危险，任何解析不确定都退回「该文件全部」。
 * - 改动的每一行都落在某个 test 的 [起, 止] 里：只跑这几个名字；
 * - 有行落在所有 test 之外（import、hook、辅助函数、循环体）：这个文件所有认得的测试名；
 * - 文件里有认不出的写法，或 diff 取不到 / 有内容却解析出 0 行：整个文件跑（whole）；
 * - skip / todo 的不算名字；只改了它们时什么也不截（skippedOnly）；
 * - 底座（browser/ 里的非测试文件、vitest.browser.config.ts、SHOT_BASE、extraShared）改了：退回代表件（shared: true）。
 * diffOf(file)：该文件相对 base 的 -U0 差异字符串；取不到返回 null；未跟踪的新文件返回 ''，按「全文件」算。
 */
export function browserTestPlan(pkgDir, changed, diffOf = () => '', extraShared = false) {
  const files = changed.filter(isBrowserShotFile)
  const shared = extraShared || changed.some(isShotBase) || files.some((f) => !isBrowserTestFile(f))
  const names = new Set()
  const precise = new Set() // 改动正好落在这几个 test 里（优先截）
  const whole = new Set() // 整个文件跑
  const skippedOnly = new Set() // 改动只落在 skip / todo 的测试上
  const fileWide = new Set() // 落在 test 之外、按全部测试名跑的文件
  for (const file of files.filter(isBrowserTestFile)) {
    const path = join(pkgDir, file)
    if (!existsSync(path)) continue
    const { entries, unparsed } = parseTests(readFileSync(path, 'utf8'))
    if (unparsed) {
      whole.add(file)
      continue
    }
    const diff = diffOf(file)
    let lines = null // null = 当作整个文件
    let uncertain = diff === null // git 失败
    if (diff) {
      lines = changedLines(diff)
      if (lines.size === 0) uncertain = true // 有内容却一行都认不出
    }
    if (uncertain) {
      whole.add(file)
      continue
    }
    const hit = new Set()
    let wide = lines === null
    if (lines)
      for (const line of lines) {
        const owner = entries.find((t) => t.line <= line && line <= t.end)
        if (owner) hit.add(owner)
        else wide = true
      }
    // 纯删除落在两个不同条目之间（删掉了夹在它们中间的 hook）：邻居不同就算 test 之外。
    if (lines && !wide) {
      for (const m of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+),0 @@/gm)) {
        const start = Number(m[1])
        const before = entries.find((t) => t.line <= start && start <= t.end)
        const after = entries.find((t) => t.line <= start + 1 && start + 1 <= t.end)
        if (before !== after) wide = true
      }
    }
    if (wide) {
      fileWide.add(file)
      for (const t of entries) if (!t.skip) names.add(t.name)
      if (!entries.some((t) => !t.skip)) skippedOnly.add(file)
    } else {
      const live = [...hit].filter((t) => !t.skip)
      for (const t of live) {
        names.add(t.name)
        precise.add(t.name)
      }
      if (!live.length) skippedOnly.add(file)
    }
  }
  return { shared, names, precise, fileWide, whole, skippedOnly, files: files.filter(isBrowserTestFile) }
}

/**
 * 相对 base 的 -U0 差异，给 browserTestPlan 用。--no-color --no-ext-diff：用户的 git 配了 color.diff=always 或 diff.external 也照样解析；
 * git 以非 0 退出返回 null（按整个文件算）。
 */
export const gitDiffOf = (pkgDir, base) => (file) => {
  const r = spawnSync('git', ['diff', '-U0', '--no-color', '--no-ext-diff', '--no-textconv', base, '--', file], {
    cwd: pkgDir,
    encoding: 'utf8',
  })
  return r.status === 0 ? r.stdout : null
}

/** -t 的模式：某个截图测试文件里所有 Graphite 的测试（外层再包 describe 也认得：「logo-provider > graphite > x」）。 */
export const GRAPHITE_ALL = '(^| > )graphite > '
/** vitest JSON 报告里一张都没跑到（名字对不上、全被跳过）算失败，不能假通过。 */
export const ranAnyShot = (report) => Boolean(report?.numPassedTests)

/** 本包之外会改变组件截图像素的东西是否变了：tokens 包的任何改动，或 package.json / pnpm-lock.yaml 里 pixelgate-cli、playwright、@vitest/browser 的版本行。 */
export function shotExternalChanged(root, base, allChanged) {
  if (allChanged.some((f) => f.startsWith('packages/tokens/'))) return true
  const diff = spawnSync(
    'git',
    [
      'diff',
      '-U0',
      '--no-color',
      '--no-ext-diff',
      base,
      '--',
      'pnpm-lock.yaml',
      'packages/react/package.json',
      'package.json',
    ],
    { cwd: root, encoding: 'utf8' },
  )
  if (diff.status !== 0) return true // 看不清就按变了算
  return diff.stdout.split('\n').some((l) => /^[+-](?![+-])/.test(l) && SHOT_DEPS.test(l))
}

/** True when the component screenshots alone cover every changed file. */
export const coveredByShots = (pkgDir, changed) => shotPlan(pkgDir, changed).covered

// SPDX-License-Identifier: MIT
// 视觉回归快速模式（pnpm vr:fast）：只截这次改动影响到的页，graphite、dpr 1、Vite 开发服务器。
// 改动文件取 `git diff HEAD`（工作区加暂存区）加未跟踪的新文件；`--base <ref>` 改成跟某个分支比（含已提交的）。
// 映射规则在 vr-fast-map.ts（纯函数，有单测）；没有影响到任何页就直接说「无视觉改动」退出 0。
// 用法：pnpm vr:fast [--base <ref>] [--files a,b（直接指定改动文件，仓库根相对路径）] [--dry] [-u]；-u 把比出来有变化的页直接收为新基线。
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, posix, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const baseRef = args.includes('--base') ? args[args.indexOf('--base') + 1] : undefined
if (args.includes('--base') && !baseRef) {
  console.error('--base 后面要给一个 git 引用，例如 --base origin/main')
  process.exit(2)
}

const git = (...gitArgs) => {
  const result = spawnSync('git', gitArgs, { cwd: pkgDir, encoding: 'utf8' })
  if (result.status !== 0) {
    console.error(`git ${gitArgs.join(' ')} 失败：${result.stderr.trim()}`)
    process.exit(2)
  }
  return result.stdout.trim()
}
const root = git('rev-parse', '--show-toplevel')
const lines = (text) => text.split('\n').filter(Boolean)
// 路径统一成仓库根相对：--relative 不带参数以 cwd 为准，所以在仓库根跑。
const gitRoot = (...gitArgs) => {
  const result = spawnSync('git', gitArgs, { cwd: root, encoding: 'utf8' })
  if (result.status !== 0) {
    console.error(`git ${gitArgs.join(' ')} 失败：${result.stderr.trim()}`)
    process.exit(2)
  }
  return result.stdout.trim()
}
const filesArg = args.includes('--files') ? args[args.indexOf('--files') + 1] : undefined
const changed = filesArg
  ? filesArg.split(',')
  : [
      ...new Set([
        ...lines(gitRoot('diff', '--name-only', baseRef ?? 'HEAD')),
        ...lines(gitRoot('ls-files', '--others', '--exclude-standard')),
      ]),
    ]

const { parseDemoFiles, parseReexports, selectPages, onlyNames } = await import(
  pathToFileURL(join(pkgDir, 'scripts/vr-fast-map.ts')).href
)
const { PAGES } = await import(pathToFileURL(join(pkgDir, 'gallery/registry.ts')).href)

// 出口：包的各个入口文件（与 gallery/source-map.ts 同一套读法，那边靠 Vite 的 import.meta.glob，Node 里自己读目录）。
const exportFiles = new Map()
const entries = ['src/index.ts']
for (const dir of readdirSync(join(pkgDir, 'src'), { withFileTypes: true })) {
  if (!dir.isDirectory()) continue
  for (const sub of [
    `src/${dir.name}`,
    ...readdirSync(join(pkgDir, 'src', dir.name), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => `src/${dir.name}/${d.name}`),
  ]) {
    if (existsSync(join(pkgDir, sub, 'index.ts'))) entries.push(`${sub}/index.ts`)
  }
}
for (const entry of entries) {
  const dir = `${posix.dirname(entry)}/`
  for (const [file, names] of parseReexports(dir, readFileSync(join(pkgDir, entry), 'utf8'))) {
    exportFiles.set(file, [...(exportFiles.get(file) ?? []), ...names])
  }
}

// 反向引用图：谁 import 了谁（相对引入，src/ 内）。
const walk = (dir) =>
  readdirSync(join(pkgDir, dir), { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? walk(`${dir}/${entry.name}`)
      : /\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)
        ? [`${dir}/${entry.name}`]
        : [],
  )
const resolveImport = (from, spec) => {
  const base = posix.normalize(posix.join(posix.dirname(from), spec))
  return [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`].find(
    (candidate) => /\.tsx?$/.test(candidate) && existsSync(join(pkgDir, candidate)),
  )
}
const dependents = new Map()
const addEdge = (target, importer) => dependents.set(target, [...(dependents.get(target) ?? []), importer])
// 出口名 → 它所在的源文件：从桶文件（index.ts）引名字的，边直接连到真正的源文件，不然所有页都会经由桶文件连成一片。
const fileOfName = new Map()
for (const [file, names] of exportFiles) for (const name of names) fileOfName.set(name, file)
const isBarrel = (file) => /(^|\/)index\.tsx?$/.test(file)
for (const file of [...walk('src'), ...walk('gallery')]) {
  if (isBarrel(file)) continue
  for (const match of readFileSync(join(pkgDir, file), 'utf8').matchAll(/(?:\{([^}]*)\}\s*)?from\s+'(\.[^']*)'/g)) {
    const target = resolveImport(file, match[2])
    if (!target) continue
    if (!isBarrel(target)) addEdge(target, file)
    else {
      for (const raw of (match[1] ?? '').split(',')) {
        const name = raw
          .replace(/^\s*type\s+/, '')
          .split(/\s+as\s+/)[0]
          .trim()
        const source = fileOfName.get(name)
        if (source) addEdge(source, file)
      }
    }
  }
}
const demoFiles = parseDemoFiles(readFileSync(join(pkgDir, 'gallery/demos.tsx'), 'utf8'))

const selection = selectPages(changed, { pages: PAGES, exportFiles, dependents, demoFiles })
const names = onlyNames(selection, new Set(PAGES.map((page) => page.id)))

if (names.length === 0) {
  console.log('无视觉改动：这次改的文件没有影响到任何文档站页。')
  process.exit(0)
}
if (selection.shared) {
  console.log('共用层改动（样式、令牌、工具、原语或认不出的文件），快速模式只跑代表页：合并前请跑 pnpm vr 全量。')
  for (const file of selection.unmapped) console.log(`  认不出归哪页，按共用层处理：${file}`)
}
console.log(`影响 ${names.length} 页：${names.join(' ')}`)
if (flag('--dry')) process.exit(0)

const result = spawnSync(
  'pnpm',
  [
    'exec',
    'pixelgate',
    'run',
    '--config',
    'pixelgate.fast.config.ts',
    ...(flag('-u') ? ['-u'] : []),
    ...names.flatMap((name) => ['--only', name]),
  ],
  { cwd: pkgDir, stdio: 'inherit', shell: process.platform === 'win32' },
)
process.exit(result.status ?? 1)

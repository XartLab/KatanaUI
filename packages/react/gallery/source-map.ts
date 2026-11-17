// SPDX-License-Identifier: MIT
// 页头的「包」与「源码」：从包的各个出口文件（src/index.ts、src/blocks/index.ts、src/quant/index.ts、src/quant/format/index.ts）
// 读出「出口名 → 源文件」与「出口名 → 子路径」，不手抄。

const RAW = import.meta.glob(['../src/index.ts', '../src/*/index.ts', '../src/*/*/index.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const REPO = 'https://github.com/XartLab/KatanaUI/blob/main/packages/react/src/'
/** 有自己子路径出口的入口（package.json 的 exports）。 */
const ENTRY: Record<string, string> = {
  '': '@katana-ui/react',
  'blocks/': '@katana-ui/react/blocks',
  'quant/': '@katana-ui/react/quant',
  'quant/format/': '@katana-ui/react/quant/format',
}

const SOURCES = new Map<string, string>()
const PACKAGES = new Map<string, string>()

/** 把 a/b/../c 规整成 a/c。 */
function normalize(path: string) {
  const out: string[] = []
  for (const part of path.split('/')) {
    if (part === '..') out.pop()
    else if (part !== '.' && part !== '') out.push(part)
  }
  return out.join('/')
}

// 深的入口先读：同一个名字以它真正所在的子包为准（顶层入口常常只是转出口）。
const entries = Object.entries(RAW)
  .map(([key, source]) => ({ dir: key.replace(/^\.\.\/src\//, '').replace(/index\.ts$/, ''), source }))
  .sort((a, b) => b.dir.length - a.dir.length)

for (const { dir, source } of entries) {
  for (const match of source.matchAll(/export\s*\{([\s\S]*?)\}\s*from\s*'\.\/([^']+)'/g)) {
    const file = normalize(`${dir}${match[2]}`)
    if (file.endsWith('index.ts')) continue
    for (const raw of match[1]!.split(',')) {
      const name = raw
        .replace(/^\s*type\s+/, '')
        .split(/\s+as\s+/)
        .pop()!
        .trim()
      if (!name) continue
      if (!SOURCES.has(name)) SOURCES.set(name, file)
      if (!PACKAGES.has(name) && ENTRY[dir]) PACKAGES.set(name, ENTRY[dir]!)
    }
  }
}

/** 一页的源文件：先找跟页标题同名的出口（DataGrid 页 → DataGrid），再按出口顺序找。 */
export function sourceOf(exports: readonly string[], title = ''): { path: string; href: string } | undefined {
  const named = title.split(' ')[0] ?? ''
  for (const name of [named, ...exports]) {
    const file = SOURCES.get(name)
    if (file) return { path: `src/${file}`, href: `${REPO}${file}` }
  }
  return undefined
}

/** 这一页从哪个入口引：按页标题同名的出口所在的入口；找不到就是包的根入口。 */
export function packageOf(exports: readonly string[], title = ''): string {
  const named = title.split(' ')[0] ?? ''
  for (const name of [named, ...exports]) {
    const entry = PACKAGES.get(name)
    if (entry) return entry
  }
  return '@katana-ui/react'
}

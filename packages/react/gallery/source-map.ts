// SPDX-License-Identifier: MIT
// 页头的「源码」链接：从包的出口文件（src/index.ts、src/quant/index.ts）读出「出口名 → 源文件」，不手抄。
const RAW = import.meta.glob(['../src/index.ts', '../src/quant/index.ts'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>
const indexSource = RAW['../src/index.ts'] ?? ''
const quantSource = RAW['../src/quant/index.ts'] ?? ''

const REPO = 'https://github.com/XartLab/KatanaUI/blob/main/packages/react/src/'

function parse(source: string, base: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const match of source.matchAll(/export\s*\{([\s\S]*?)\}\s*from\s*'\.\/([^']+)'/g)) {
    const file = `${base}${match[2]}`
    for (const raw of match[1]!.split(',')) {
      const name = raw
        .replace(/^\s*type\s+/, '')
        .split(/\s+as\s+/)
        .pop()!
        .trim()
      if (name && !map.has(name)) map.set(name, file)
    }
  }
  return map
}

const SOURCES = new Map([...parse(quantSource, 'quant/'), ...parse(indexSource, '')])

/** 一页的源文件（取第一个能找到的出口），给 GitHub 链接与显示用。 */
export function sourceOf(exports: readonly string[]): { path: string; href: string } | undefined {
  for (const name of exports) {
    const file = SOURCES.get(name)
    if (file) return { path: `src/${file}`, href: `${REPO}${file}` }
  }
  return undefined
}

export const packageOf = (group: string) => (group === 'quant' ? '@katana-ui/react/quant' : '@katana-ui/react')

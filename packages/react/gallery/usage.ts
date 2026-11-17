// SPDX-License-Identifier: MIT
import type { ComponentType } from 'react'

// 每页的「用法」（#1902）：usage/<页 id 的大驼峰>Usage.tsx（button → ButtonUsage.tsx）是真实可运行的最小例子，导出同名组件（组件文件的命名规则）。页上渲染它，同时把这个文件的源码（Vite ?raw）原样展示出来、可复制，
// 所以例子不会跟代码对不上。源码里引包的路径写成包外的人会写的 `@katana-ui/react`（下面 publicSource 按固定映射换，只换引入路径，别的一字不动）。

const modules = import.meta.glob('./usage/*.tsx', { eager: true }) as Record<string, Record<string, ComponentType>>
const raws = import.meta.glob('./usage/*.tsx', { eager: true, query: '?raw', import: 'default' }) as Record<
  string,
  string
>

const PUBLIC_NAME: Readonly<Record<string, string>> = {
  index: '@katana-ui/react',
  quotes: '@katana-ui/react/quotes',
  quant: '@katana-ui/react/quant',
  'quant/format': '@katana-ui/react/quant/format',
  blocks: '@katana-ui/react/blocks',
  a2ui: '@katana-ui/react/a2ui',
}

/** 包内的相对引入换成包外的写法。 */
export function publicSource(raw: string): string {
  return raw
    .replaceAll(
      /'\.\.\/\.\.\/src\/(index|quotes|quant\/format|quant|blocks|a2ui)'/g,
      (_, entry: string) => `'${PUBLIC_NAME[entry]}'`,
    )
    .trimEnd()
}

export type PageUsage = { Usage: ComponentType; source: string }

/** 页 id（短横线小写）→ 用法组件与文件的名字：button → ButtonUsage，multi-select → MultiSelectUsage。 */
export const usageName = (id: string): string =>
  `${id
    .split('-')
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join('')}Usage`

const byName: Readonly<Record<string, PageUsage>> = Object.fromEntries(
  Object.entries(modules).flatMap(([path, mod]) => {
    const name = path.replace(/^\.\/usage\//, '').replace(/\.tsx$/, '')
    const Usage = mod[name]
    return Usage ? [[name, { Usage, source: publicSource(raws[path]!) }]] : []
  }),
)

/** 一页的用法；没有就是 undefined（registry.test.tsx 要求每页都有）。 */
export const usageOf = (id: string): PageUsage | undefined => byName[usageName(id)]

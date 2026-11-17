# Treemap

一格一项，面积按大小，颜色按涨跌分七档（跟涨跌配色走），格子够大才写名字和数；点组头下钻，底部是色例。排布用 d3-hierarchy 的 squarify。从应用的分析视图提来。

## Provide

`*` marks a required prop.

### Treemap

排布由调用方先用 layoutTreemap 算好再传 blocks；工具条（下拉、返回钮）从 toolbar 传。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `blocks` * | `readonly TreemapBlock<T>[]` | — | The result of layoutTreemap. |
| `heads` | `boolean` | `false` | Draw group headers (clickable to drill down); pass false after drilling down. |
| `describe` * | `(data: T) => { name: string; text: string; change: number \| null }` | — | What to write on a cell: the name, the text of the number, and the change used for color (null means none). |
| `limit` | `number` | `0.03` | Where the color scale ends (as a decimal); changes are cut at plus or minus limit into seven steps from -3 to +3. |
| `legendText` * | `(step: number) => string` | — | Text for each step of the color scale (-3 to +3). |
| `toolbar` | `ReactNode` | — | A row above the cells. |
| `cellKey` | `(data: T) => string` | — | A stable key per cell (a symbol code, say), so a cell that moves or resizes keeps its identity and glides to the new place; the index is used when omitted. |
| `onGroup` | `(name: string) => void` | — | Called when a group header is clicked. |
| `onItem` | `(data: T) => void` | — | Called when a cell is clicked; when given, cells are focusable buttons that trigger on Enter. |
| `classes` | `TreemapClasses` | `{}` | Extra class names per part. |

### layoutTreemap(items, grouped)

items 是 { data, size, group }；size 不是正数的项不画；grouped 为 false 整张一块。colorStep(change, limit) 返回 −3 到 3 或 null。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `width` | `number` | — | Width of the layout box. |
| `height` | `number` | — | Height of the layout box. |
| `head` | `number` | — | Height reserved for each group header. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Treemap, layoutTreemap, type TreemapItem } from '@katana-ui/react'

type Tile = { name: string; change: number }
const ITEMS: readonly TreemapItem<Tile>[] = [
  { group: 'Sector 1', size: 600, data: { name: 'A', change: 0.031 } },
  { group: 'Sector 1', size: 300, data: { name: 'B', change: -0.012 } },
  { group: 'Sector 2', size: 220, data: { name: 'C', change: 0 } },
]

export function TreemapUsage() {
  return (
    <Treemap
      blocks={layoutTreemap(ITEMS, true)}
      heads
      describe={(item) => ({ name: item.name, text: `${(item.change * 100).toFixed(2)}%`, change: item.change })}
      legendText={(step) => `${step}%`}
    />
  )
}
```

## States

- 默认：一格一项，面积按大小，颜色七档。
- 分组下钻：点组头只剩那一组，工具条里自己放返回钮。
- 格子太小时只留色块，不写字。
- 没有涨跌数的格子用中性色。

## Don't

- 不要用于项目数很多又没法下钻的场景，小格会糊成一片。
- 不要把排布放进渲染里重算：先用 layoutTreemap 排好再传 blocks。

## Composition

```
Treemap
  div（工具条）
  div（画布）
    div（一组）
      button（组头）
      div（一格：名字 · 数）
  ol（色例，五档）
```

## Keyboard

- `Tab`：到可点的格子与组头
- `Enter`：点开格子（组头是原生按钮，Enter / Space 都行）

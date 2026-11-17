# AnimatedList

新闻快讯、成交回报这类往上顶的信息流：新条目从上方弹性插入并带蓝线高亮，旧条目被挤着下移，超出 maxVisible 的从底部淡出。鼠标停在列表上时新条目先攒着、不往下挤，移开后一次进来，攒了几条可提示。递减（越旧越淡）默认关，信息流要让每一条都读得清。

## Provide

`*` marks a required prop.

### AnimatedList

条目按显示顺序从上到下给，id 稳定；列表自己比较前后两次的 id 决定谁进谁出。放进 NewsFeed 的列表前面做「新到」区，或给成交回报、炸板提醒这类短流用。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly AnimatedListItem[]` | — | Rows from top to bottom; the list animates whatever changes between renders. |
| `label` * | `string` | — | Accessible name of the whole list. |
| `maxVisible` | `number` | — | Show at most this many rows; the rest are dropped from the bottom (default: all). |
| `enterFrom` | `'top' \| 'bottom'` | `'top'` | Where new rows come from: top slides down, bottom slides up. |
| `recede` | `boolean` | `false` | Older rows get smaller and fainter the further down they are. |
| `stagger` | `number` | `STAGGER_STEP` | Delay between rows that arrive in the same frame, in seconds. |
| `highlightNew` | `boolean` | `true` | Flash the left accent on rows that arrived after the first render. |
| `pauseOnHover` | `boolean` | `true` | Hold back new rows while the pointer is over the list; they enter when it leaves. |
| `pendingLabel` | `(count: number) => string` | — | Text of the "n waiting" chip shown while rows are held back; no chip when omitted. |
| `onItemClick` | `(id: string) => void` | — | Makes every row a button. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { AnimatedList, Button } from '@katana-ui/react'

export function AnimatedListUsage() {
  const [rows, setRows] = useState([{ id: 'n1', content: <p>Fab capacity guidance raised</p> }])
  const add = () =>
    setRows((list) => [{ id: `n${list.length + 1}`, content: <p>Headline {list.length + 1}</p> }, ...list])
  return (
    <>
      <Button onClick={add}>New headline</Button>
      <AnimatedList label="Headlines" items={rows} maxVisible={5} />
    </>
  )
}
```

## States

- 新条目：从上方 14px 处缩放弹入（弹簧 0.25s），带 k-live-enter 的蓝线高亮；一次来几条依次落下。
- 被挤下移：layout 动画，位置平滑过渡。
- 悬停：新条目攒着，pendingLabel 给了就出「n 条新快讯」；移开后一起进来。
- 超出 maxVisible：最老的从底部淡出。

## Don't

- 不要拿它画上千行的表格：每行是一个 layout 动画，行多了用 DataGrid 或 NewsFeed 的虚拟滚动。
- 不要在信息流上开 recede 再叠高亮：越旧越淡会让人漏读。
- onItemClick 开着时每条要给 label。

## Composition

```
AnimatedList
  div
    span（pendingLabel，role=status）
    ul（aria-live=polite）
      motion.li（一条）
```

## Keyboard

- `Tab`：onItemClick 开着时在每条按钮间走
- `Enter / Space`：点中当前条

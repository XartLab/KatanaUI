# QuoteCard

一只品种一张卡：名字与代码、最新价（大）、涨跌与涨跌幅、可选的迷你图与底部一行；QuoteStrip 是一排小号的卡，放不下横向滚动。值是数（统一行情行的 last / change / changePct），整行 {...row} 直接摊进来，价格文字由 formatPrice 写。

## Provide

`*` marks a required prop.

### QuoteCard

方向由 change 的正负定（没有 change 看 changePct，也可传 tone）；迷你图的读屏名在 labels.spark。旧的 price / percent 与字符串 change、sparkLabel 照认一个版本（@deprecated）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | `string` | — | Name of the symbol; the symbol code takes its place when omitted. |
| `symbol` | `string` | — | Code, small and muted beside the name. |
| `last` | `number` | — | Last price. |
| `change` | `number \| string` | — | Change amount, signed (a preformatted string is deprecated). |
| `changePct` | `number` | — | Change as a percentage (1.5 means 1.5%). |
| `formatPrice` | `FormatPrice` | — | Writes the last price and the change amount; two decimals when omitted. |
| `tone` | `QuoteTone` | — | Up, down or flat; derived from change (then changePct) when omitted. |
| `price` | `string` | — | Deprecated: use last with formatPrice. |
| `percent` | `string` | — | Deprecated: use changePct. |
| `spark` | `readonly number[]` | — | Values of the mini chart, oldest to newest; no chart is drawn when omitted. |
| `labels` | `QuoteCardLabels` | — | Accessible texts. |
| `sparkLabel` | `string` | — | Deprecated: use labels.spark. |
| `footer` | `ReactNode` | — | A line under the card, often a RangeBar. |
| `size` | `'md' \| 'sm'` | `'md'` | sm is a narrow horizontal card used inside QuoteStrip. |
| `onSelect` | `() => void` | — | When given the whole card renders as a button. |
| `className` | `string` | — | Extra class name on the root. |

### QuoteStrip

items 是 QuoteCard 的属性加 id；每张卡用小号。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Accessible name (required). |
| `items` * | `readonly (QuoteCardProps & { id: string })[]` | — | The cards: the props of each QuoteCard plus an id. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { QuoteCard } from '@katana-ui/react'

export function QuoteCardUsage() {
  return <QuoteCard name="Alpha" symbol="AAA" price="11.80" change="+1.80" percent="+18.00%" tone="up" />
}
```

## States

- 默认：名字、价、涨跌；可带迷你图与底部一行。
- 可点：整张卡是按钮，悬停提亮、按下缩到 0.98、键盘焦点有环。
- 小号（QuoteStrip 里）：148 宽，放不下横向滚动。
- 价格变了：闪一次涨跌色；迷你图新点追加时线平滑延伸。

## Don't

- 不要在卡里再放可点的子元素：给了 onSelect 整张卡已是按钮。
- 不要把一排卡折行成网格：一排就是横向滚动。

## Composition

```
QuoteCard
  span（名字 · 代码）
  span（价）
  span（三角 · 涨跌 · 涨跌幅）
  Sparkline
  span（footer）
QuoteStrip
  div role=list
    div role=listitem
      QuoteCard size=sm
```

## Keyboard

- `Tab / Enter`：有 onSelect 时到卡上、触发

# QuoteCard

一只品种一张卡：名字与代码、最新价（大）、涨跌与涨跌幅、可选的迷你图与底部一行；QuoteStrip 是一排小号的卡，放不下横向滚动。

## Provide

`*` marks a required prop.

### QuoteCard

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` * | `string` | — | Name of the symbol. |
| `symbol` | `string` | — | Code, small and muted beside the name. |
| `price` * | `string` | — | The already formatted price. |
| `change` | `string` | — | The already formatted change amount, signed. |
| `percent` | `string` | — | The already formatted change percentage, signed. |
| `tone` | `QuoteTone` | `'flat'` | Up, down or flat. |
| `spark` | `readonly number[]` | — | Values of the mini chart, oldest to newest; no chart is drawn when omitted. |
| `sparkLabel` | `string` | — | Accessible name of the mini chart. |
| `footer` | `ReactNode` | — | A line under the card, often a RangeBar. |
| `size` | `'md' \| 'sm'` | `'md'` | sm is a narrow horizontal card used inside QuoteStrip. |
| `onSelect` | `() => void` | — | When given the whole card renders as a button. |
| `className` | `string` | — | Extra class name on the root. |

### QuoteStrip

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

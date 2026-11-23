# TradeTape

最近的成交：时间、价格（按主动方向着涨跌色：主动买走涨色、主动卖走跌色）、数量。新成交从顶上滑入并带蓝线高亮一阵（共用层 live.ts），首次渲染的不闪；大单阈值 largeSize 由调用方传，量不小于它的行整行淡底加粗；aggregate 把紧挨着的同价同方向成交并成一行，右边写笔数（×3），量十进制精确相加，聚合行取最老那笔的 id 当标识，并进新成交时不会再当新行进场一次。只留最近 maxRows 行。只吃 props，调用方把增量并进列表、按从新到旧整份传。

## Provide

`*` marks a required prop.

### TradeTape

trades 从新到旧，id 要稳定；时间默认写 UTC 的时分秒，要本地时区传 formatTime。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `trades` * | `readonly Trade[]` | — | Trades newest first; ids must be stable so new ones can be told apart. |
| `priceDecimals` * | `number` | — | Decimal places of a price. |
| `sizeDecimals` * | `number` | — | Decimal places of a size. |
| `labels` * | `TradeTapeLabels` | — | Texts. |
| `largeSize` | `number` | — | Highlight rows whose size is at least this; none when omitted. |
| `aggregate` | `boolean` | `false` | Merge consecutive trades at the same price and side into one row. |
| `maxRows` | `number` | `DEFAULT_MAX_ROWS` | Rows to keep, counted after merging; default 50. |
| `formatTime` | `(time: number) => string` | `clockText` | How a timestamp is written; defaults to UTC HH:MM:SS. |
| `formatPrice` | `(price: number) => string` | — | How a price is written; defaults to fixed priceDecimals places. |
| `formatSize` | `(size: number) => string` | — | How a size is written; defaults to fixed sizeDecimals places. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { TradeTape, type Trade } from '@katana-ui/react/blocks'

// 演示数据：编出来的，不是行情。从新到旧，id 稳定。
const T0 = Date.UTC(2026, 10, 22, 9, 30, 0)
const TRADES: Trade[] = [
  { id: 6, time: T0 + 6000, price: 100.01, size: 0.4, side: 'buy' },
  { id: 5, time: T0 + 5000, price: 100.01, size: 0.2, side: 'buy' },
  { id: 4, time: T0 + 4000, price: 100, size: 6.5, side: 'sell' },
  { id: 3, time: T0 + 3000, price: 100.01, size: 1.1, side: 'buy' },
  { id: 2, time: T0 + 2000, price: 100, size: 0.3, side: 'sell' },
  { id: 1, time: T0 + 1000, price: 100, size: 0.7, side: 'sell' },
]

export function TradeTapeUsage() {
  return (
    <div style={{ maxWidth: 360 }}>
      <TradeTape
        trades={TRADES}
        priceDecimals={2}
        sizeDecimals={3}
        largeSize={5}
        aggregate
        labels={{
          list: '成交明细',
          columns: { time: '时间', price: '价格', size: '数量' },
          sides: { buy: '主动买', sell: '主动卖' },
          count: (n) => `×${n}`,
          large: '大单',
          empty: '还没有成交',
        }}
      />
    </div>
  )
}
```

## States

- 逐笔：一笔一行。聚合：只并紧挨着、同价、同方向的成交，夹了别的价或方向就断开，次序不变。
- 大单：量不小于 largeSize（聚合行按合计量比）整行淡底、数量加粗，读屏多读一句 labels.large。
- 新成交：从顶上滑入，蓝线高亮约 1.2 秒；没有成交写 labels.empty。

## Don't

- 不要靠颜色单独表达方向：件里已经带了读屏用的「主动买 / 主动卖」文字，自己换版式时保留它。
- 成交号要稳定且唯一：用数组下标当 id，每来一笔所有行都会被当成新行高亮。
- 不要在这里存历史：只留最近 maxRows 行，更早的走调用方的历史查询。

## Composition

```
TradeTape
  列头（时间 | 价格 | 数量）
  list：行（时间 · 价格 · ×n 徽标 + 数量）
```

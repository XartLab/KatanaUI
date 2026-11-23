# SeatTable

一只票上榜当日的买入前五与卖出前五席位，左右并排（容器窄于 560px 上下排）：每行名次、席位名、游资标签（调用方给）、买入额、卖出额、净额（万 / 亿写法，净额正涨负跌跟 data-updown），每侧一行合计，表下一行写买入合计与卖出合计之差。席位清单与金额由调用方给，件只按买入额 / 卖出额取前几名（默认 5）、算净额与合计；取不到写「—」，不写 0。多只票上榜的横向总览用 NetBuyBar。

## Provide

`*` marks a required prop.

### SeatTable

渲染一个 section，每侧一张 table；不透传别的属性。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `buy` * | `readonly Seat[]` | — | Seats that bought, in any order; the table keeps the top `limit` by buy amount. |
| `sell` * | `readonly Seat[]` | — | Seats that sold, in any order; the table keeps the top `limit` by sell amount. |
| `limit` | `number` | `5` | How many seats each side shows; 5 by default. |
| `labels` | `SeatTableLabels` | `cnLabelsZh.seatTable` | Text pack; the Simplified Chinese default is used when omitted. |
| `className` | `string` | — | Extra class names. |

### Seat

一个席位：name、可选 tag（游资标签）、buy 与 sell（元，取不到是 null）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` * | `string` | — | Seat name (a brokerage branch or the institutional seat). |
| `tag` | `string` | — | Hot-money tag of the seat, written by the caller; leave it out for unknown seats. |
| `buy` | `number \| null` | — | Amount bought in yuan; null when unavailable. |
| `sell` | `number \| null` | — | Amount sold in yuan; null when unavailable. |

### rankSeats(seats, side, limit)

纯函数：按一侧金额取前 limit 个，取不到的排最后，同额保持传入次序。

### seatNet(seat)

纯函数：买入 − 卖出；任一方取不到是 null。

### seatTotal(seats, field)

纯函数：一列的合计，只加有的，全取不到是 null。

### amountTone(value)

纯函数：正 up、负 down、零或取不到 flat。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { SeatTable } from '@katana-ui/react/cn'

export function SeatTableUsage() {
  return (
    <SeatTable
      buy={[
        { name: 'Example branch A', tag: 'Hot money', buy: 126_800_000, sell: 2_300_000 },
        { name: 'Institutional seat', tag: 'Institution', buy: 95_200_000, sell: 0 },
        { name: 'Example branch B', buy: 81_000_000, sell: 30_400_000 },
      ]}
      sell={[
        { name: 'Institutional seat', tag: 'Institution', buy: 0, sell: 108_200_000 },
        { name: 'Example branch C', buy: 3_000_000, sell: 91_000_000 },
        { name: 'Example branch D', buy: 25_000_000, sell: 63_000_000 },
      ]}
      labels={{
        region: 'Dragon-tiger seats',
        buyTitle: 'Top buyers',
        sellTitle: 'Top sellers',
        columns: { seat: 'Seat', buy: 'Bought', sell: 'Sold', net: 'Net' },
        total: 'Total',
        netTotal: 'Net total',
        empty: 'No seats',
        unavailable: 'Not available',
        tableAria: (title) => `${title} seats`,
      }}
    />
  )
}
```

## States

- 默认：买入前五、卖出前五各一张表，买入侧突出买入列，卖出侧突出卖出列；净额正涨负跌。
- 席位多于 limit：只留金额最大的前几个；少于就有几个画几个。
- 金额取不到：写「—」，净额也写「—」（不拿 0 凑）。
- 没有任何席位：写一行空态文字，不画表。

## Don't

- 不要在包里维护游资名单或席位别名：标签由调用方给。
- 不要传色值：净额的涨跌只靠语义色调。
- 不要用它做多只票的总览：用 NetBuyBar。

## Composition

```
SeatTable
  买入侧 section
    h4 · table（名次 | 席位名 + 标签 | 买入 | 卖出 | 净额）· 合计行
  卖出侧 section（同上）
  买入合计与卖出合计之差
```

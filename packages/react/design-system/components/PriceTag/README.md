# PriceTag

夹在一句话或一行里的「名字 价格 涨跌」，数字等宽对齐，涨跌带三角与颜色，跟着周围的字号走。值是数（last、changePct，跟统一行情行同名），价格文字由 formatPrice 写。

## Provide

`*` marks a required prop.

### PriceTag

方向由 changePct 的正负定（也可传 tone 盖过）；旧的 price / change 字符串照认一个版本（@deprecated）。不可交互，没有键盘操作。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | `string` | — | Symbol name or code; only price and change are shown when omitted. |
| `last` | `number` | — | Last price. |
| `changePct` | `number` | — | Change as a percentage (1.5 means 1.5%); not shown when omitted. |
| `formatPrice` | `FormatPrice` | `plainPrice` | Writes the last price; two decimals when omitted. |
| `price` | `string` | — | Deprecated: use last with formatPrice. |
| `change` | `string` | — | Deprecated: use changePct. |
| `tone` | `QuoteTone` | — | Up, down or flat: sets the color and the triangle (none for flat); derived from changePct when omitted. |
| `label` | `string` | — | The whole sentence read by screen readers, including the direction; the visible text is read when omitted. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { PriceTag } from '@katana-ui/react'

export function PriceTagUsage() {
  return <PriceTag name="BTCUSDT" price="106,977.4" change="+1.20%" tone="up" />
}
```

## States

- 涨、跌：涨跌文字带三角与对应颜色。
- 平：没有三角，用弱色。
- 只有价格：不写名字与涨跌。
- 价格变了：闪一次涨跌色（ReadoutFlash），约 1 秒落回。

## Don't

- 不要只靠颜色表达涨跌：三角与带符号的文字必须在。
- 不要传写好的价格字符串：传数与 formatPrice，品种精度由调用方定。
- 不要拿它当按钮：要可点用 QuoteCard 的 onSelect。

## Composition

```
PriceTag
  span（名字）
  span（价）
  span（三角 · 涨跌）
```

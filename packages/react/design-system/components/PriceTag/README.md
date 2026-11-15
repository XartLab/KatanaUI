# PriceTag

夹在一句话或一行里的「名字 价格 涨跌」，数字等宽对齐，涨跌带三角与颜色，跟着周围的字号走。

## Provide

`*` marks a required prop.

### PriceTag

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | `string` | — | Symbol name or code; only price and change are shown when omitted. |
| `price` * | `string` | — | The already formatted price. |
| `change` | `string` | — | The already formatted change, signed (for example "+1.20%"). |
| `tone` | `QuoteTone` | `'flat'` | Up, down or flat: sets the color and the triangle (none for flat). |
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

## Don't

- 不要只靠颜色表达涨跌：三角与带符号的文字必须在。
- 不要在包里格式化数字，价与涨跌由调用方传好。

## Composition

```
PriceTag
  span（名字）
  span（价）
  span（三角 · 涨跌）
```

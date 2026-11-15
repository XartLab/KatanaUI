# RangeBar

一条横线从最低到最高，标记指着现价在区间里的位置，两端写最低与最高。用来看当日区间、52 周区间。

## Provide

`*` marks a required prop.

### RangeBar

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `low` * | `number` | — | Lowest value; no marker is drawn when high is not greater than low. |
| `high` * | `number` | — | Highest value. |
| `value` * | `number` | — | Current value; it sticks to the edge when outside the range. |
| `format` | `(value: number) => string` | `plain.format` | How to write a number; at most two decimals when omitted. |
| `label` * | `string` | — | Accessible name (role=meter), required, for example "Day range". |
| `lowLabel` | `string` | — | Small caption above the low end, such as "Low"; nothing when omitted. |
| `highLabel` | `string` | — | Small caption above the high end, such as "High". |
| `className` | `string` | — | Extra class name on the root. |

### rangeShare(low, high, value)

现价在区间里的位置 0 到 1；算不出是 null。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { RangeBar } from '@katana-ui/react'

export function RangeBarUsage() {
  return <RangeBar low={9.5} high={12.5} value={11.8} label="Day range" lowLabel="Low" highLabel="High" />
}
```

## States

- 现价在区间内：标记停在对应位置，标记按弹簧滑动。
- 现价在区间外：标记贴边。
- 最高不大于最低或数不是有限数：不画标记，只留两端的数。

## Don't

- 不要拿它画没有上下界的量。
- 不要省略 label：它是 role=meter，读屏要名字。

## Composition

```
RangeBar role=meter
  span（最低）
  span（轨道：填充 · 标记）
  span（最高）
```

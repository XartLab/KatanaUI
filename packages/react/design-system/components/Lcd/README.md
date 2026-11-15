# Lcd

点阵小标签在上、LCD 数字在中、一行灰色小字在下的读数窗；没有数据显示「—」。

## Provide

`*` marks a required prop.

### Lcd

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Small dot-matrix label. |
| `value` * | `string \| null` | — | The reading; pass null when there is no data and it shows a dash. |
| `inline` | `boolean` | — | Put the label and the number on one line. |
| `fill` | `boolean` | — | Fill the cell it sits in (one per cell in a KPI row); by default it shrinks to its content. |
| `tone` | `LcdTone` | `'neutral'` | Number color: neutral, up, down, focus (orange) or warning (amber). |
| `note` | `string` | — | A 10px line under the number (unit, basis); do not put a second value here. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Lcd } from '@katana-ui/react'

export function LcdUsage() {
  return (
    <>
      <Lcd label="PNL" value="+1,284.50" tone="up" note="USDT today" />
      <Lcd label="LAST" value={null} />
    </>
  )
}
```

## States

- 有值：标签在上、数字在中、小字在下。
- 没有数据：数字位置写「—」，不写 0。
- 色调：up、down、accent、warn，或不着色。

## Don't

- 不要在没有数据时写 0。
- 不要在件里写死币种与位数，由调用方传。

## Composition

```
Lcd
```

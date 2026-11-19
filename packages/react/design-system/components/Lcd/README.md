# Lcd

点阵小标签在上、LCD 数字在中、一行灰色小字在下的读数窗；没有数据显示「—」。

## Provide

`*` marks a required prop.

### Lcd

数字由调用方格式化好传字符串，件不算；变了闪一下涨跌色（ReadoutFlash）。fill 撑满格子（KPI 行），inline 标签与数字同一行。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Small dot-matrix label. |
| `value` * | `string \| null` | — | The reading; pass null when there is no data and it shows a dash. |
| `inline` | `boolean` | — | Put the label and the number on one line. |
| `fill` | `boolean` | — | Fill the cell it sits in (one per cell in a KPI row); by default it shrinks to its content. |
| `tone` | `LcdTone` | `'neutral'` | Number color: neutral, ok, warn, danger; up, down, flat (price direction, follows data-updown); accent (current focus). |
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
- tone：neutral 不着色；ok、warn、danger 取 --k-status-*；up、down、flat 取 --k-tone-*（跟 data-updown 换红绿）；accent 是当前关注。

## Don't

- 不要在没有数据时写 0。
- 不要在件里写死币种与位数，由调用方传。

## Composition

```
Lcd
```

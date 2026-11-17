# ChangeText

百分数的涨跌幅文字，写成「+1.23%」；颜色只读 --pnl-up / --pnl-down，根上设 data-updown="cn" 就互换成红涨绿跌；零不着色。

## Provide

`*` marks a required prop.

### ChangeText

其余属性透传给 span。四舍五入成 0 的小负数也按「平」处理，不带正负号。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` * | `number` | — | A percentage already (1.5 means 1.5%). |
| `digits` | `number` | `2` | Number of decimal places. |
| `arrow` | `boolean` | — | Put an up or down triangle before the text (none for flat) so direction does not rely on color alone. |
| `flash` | `boolean` | `false` | Flash up or down color when value changes (for numbers that update live; off by default so static tables stay still). |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ChangeText } from '@katana-ui/react/quant'

export function ChangeTextUsage() {
  return (
    <>
      <ChangeText value={1.234} />
      <ChangeText value={-0.5} arrow />
    </>
  )
}
```

## States

- 涨：带 + 号，颜色取 pnl-up；跌：带 - 号，颜色取 pnl-down。
- 平：舍入到 digits 位后是 0 就不带号、不着色，继承周围的字色。
- 根元素设 data-updown="cn" 时 pnl-up 与 pnl-down 互换（红涨绿跌），件不用改。

## Don't

- 不要自己写 is-up、is-down 类去着色。
- 不要把已经乘过 100 的值再乘一次。
- 没有行情时不要传 0，写 — 。

## Composition

```
ChangeText（内部：ToneText）
```

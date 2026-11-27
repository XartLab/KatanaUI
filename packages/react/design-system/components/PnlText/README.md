# PnlText

盈亏文字：字由调用方格式化好（币种、位数、符号都由调用方定），本件只按方向着色，颜色规则同 ChangeText。

## Provide

`*` marks a required prop.

### PnlText

其余属性透传给 span。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` * | `number \| string \| null \| undefined` | — | Only decides the direction; 0, empty and unparseable values count as flat. |
| `tone` | `Tone` | — | Overrides the direction when it is not given by the sign of value (a loss written as a positive number, say). |
| `arrow` | `boolean` | — | Put an up or down triangle before the text. |
| `flash` | `boolean` | `false` | Flash up or down color when value changes (for numbers that update live; off by default so static tables stay still). |
| `as` | `'span' \| 'strong'` | — | Which element to render. |
| `children` * | `ReactNode` | — | The text to show. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { PnlText } from '@katana-ui/react/quotes'

export function PnlTextUsage() {
  return (
    <>
      <PnlText value="12.5">+12.50</PnlText>
      <PnlText value="-3">-3.00</PnlText>
    </>
  )
}
```

## States

- 盈：pnl-up；亏：pnl-down；零或没有值：不着色。
- 亏损额写成正数时传 tone="down"。

## Don't

- 不要在件里拼币种与位数，由调用方传。
- 不要用颜色以外没有符号或箭头的写法表达盈亏。

## Composition

```
PnlText（内部：ToneText）
```

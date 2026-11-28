# OtpField

一次性验证码输入（交易二次验证、短信码）：每格一个字，当前格的外框用弹簧滑到下一格，字翻进来，空格里一根闪的光标。一个透明的真输入框接键盘、粘贴与自动填充。改自 SmoothUI（MIT）。

## Provide

`*` marks a required prop.

### OtpField

其余属性透传给里面真正的 input。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `disabled` | `boolean \| undefined` | `false` | Dim the cells and ignore the keyboard. |
| `aria-label` * | `string \| undefined` | — | Defines a string value that labels the current element. |
| `autoFocus` | `boolean \| undefined` | `false` | Focus the field on mount. |
| `name` | `string \| undefined` | — | Form field name of the real input. |
| `length` | `number` | `6` | Number of cells. |
| `value` | `string` | — | The code typed so far (controlled). |
| `defaultValue` | `string` | `''` | The initial code (uncontrolled). |
| `onValueChange` | `(value: string) => void` | — | Called with the filtered code on every change. |
| `onComplete` | `(value: string) => void` | — | Called once when every cell is filled. |
| `mask` | `boolean` | `false` | Show a dot instead of each character (shared screens). |
| `groupSize` | `number` | — | Insert a gap after every this many cells, for example 3 for 123 456. |
| `pattern` | `keyof typeof PATTERNS` | `'digits'` | Which characters are accepted: digits only, or letters and digits. |
| `invalid` | `boolean` | `false` | Show the danger border and set aria-invalid. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { OtpField } from '@katana-ui/react'

export function OtpFieldUsage() {
  return (
    <OtpField aria-label="Trade verification code" length={6} groupSize={3} onComplete={(code) => console.log(code)} />
  )
}
```

## States

- 空：第一格显示光标；输入：字翻进格里，外框滑到下一格；填满：触发 onComplete。
- mask：格里显示圆点。groupSize：分组之间留一道间隔。
- 错误（invalid）：格与外框变危险色，aria-invalid。禁用：降到 45%。

## Don't

- 不要拿它收不定长的口令，长度固定才用。
- 它只在末尾输入与退格，不做格间方向键；输错了退格重来。
- 读屏名（aria-label）必须传，格子本身对读屏隐藏。

## Composition

```
OtpField
  span（格子 × length，aria-hidden）
  span（当前格的外框）
  input（透明，真正的输入）
```

## Keyboard

- `Tab`：聚焦
- `0-9`：输入一位（pattern=alphanumeric 时字母也行）
- `Backspace`：删最后一位
- `Ctrl/⌘ + V`：粘贴整串，超出长度的截掉

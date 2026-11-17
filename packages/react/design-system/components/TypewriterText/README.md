# TypewriterText

一个字一个字地打出来，可以带光标、循环。文字变长（新文字以已打出的部分开头）时接着往下打，不从头重来，所以流式追加的 AI 回复和交易建议可以直接把累积的文字传进来。读屏读完整的句子，不读打到一半的字。

## Provide

`*` marks a required prop.

### TypewriterText

整句放在 sr-only 里，打字的过程是 aria-hidden，读屏不会读到半句话。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `caret` | `boolean` | `false` | Shows a blinking caret after the text. |
| `children` * | `string` | — | The full text to type out; if it grows from what is already shown, typing continues instead of restarting. |
| `className` | `string` | — | Extra class names for the root element. |
| `loop` | `boolean` | `false` | Types the text over and over, with a short pause between rounds. |
| `onComplete` | `() => void` | — | Called once when the whole text has been typed (not in loop mode). |
| `speed` | `number` | `50` | Milliseconds per character. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { TypewriterText } from '@katana-ui/react'

export function TypewriterTextUsage() {
  return <TypewriterText caret>Trim 1,200 shares before the close.</TypewriterText>
}
```

## States

- 打字中：根上有 data-typing。
- 打完：触发一次 onComplete（循环时不触发）；loop 为真则停 1 秒后重打。
- 文字被换成别的（不是追加）：从头打。

## Don't

- 不要用它显示用户必须马上读到的告警：先出整句，再决定要不要动画。

## Composition

```
TypewriterText
  span.sr-only
  span（已打出的字，aria-hidden）
  span.k-tw-caret（caret 时）
```

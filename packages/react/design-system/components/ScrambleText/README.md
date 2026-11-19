# ScrambleText

文字先乱成随机字符再落回真字：trigger="hover" 在悬停或键盘聚焦时扰一次（SmoothUI scramble-hover）；trigger="change" 在文字变了时扰一次，代码、价格换了用它。数字只换成数字、字母只换成字母、标点不动，宽度跟着原字走；settle="left-to-right" 从左到右一位一位定下来，比整串一起定更好读。

## Provide

`*` marks a required prop.

### ScrambleText

读屏读真实文字（sr-only），乱码是 aria-hidden；hover 只在有悬停的指针设备上生效。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` * | `string` | — | The real text; this is what is shown at rest and what assistive technology reads. |
| `className` | `string` | — | Extra class names for the root element. |
| `duration` | `number` | `600` | Total scramble time in milliseconds. |
| `glyphs` | `string` | — | Characters to draw from instead of matching digits with digits and letters with letters. |
| `settle` | `ScrambleSettle` | `'together'` | together: everything resolves at the end; left-to-right: one character after another. |
| `speed` | `number` | `30` | Milliseconds between two scrambled frames. |
| `trigger` | `ScrambleTrigger` | `'hover'` | hover scrambles on pointer hover or keyboard focus inside; change scrambles whenever the text changes. |

### scrambleFrame

纯函数 (原文, 进度, settle, glyphs)：算某一刻的一帧乱码，进度越大 left-to-right 定下的位越多。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ScrambleText } from '@katana-ui/react'

export function ScrambleTextUsage() {
  return (
    <>
      <ScrambleText>Open order ticket</ScrambleText>
      <ScrambleText settle="left-to-right" trigger="change">
        106,977.40
      </ScrambleText>
    </>
  )
}
```

## States

- 静止：显示真文字。
- 扰动中：根上有 data-scrambling，按 speed 一帧一帧换字符，duration 到了落回真字。
- 悬停中途移开或失焦：立刻回到真字。

## Don't

- 不要在比例字体里扰数字：数字宽度不一样会晃，价格配等宽字体（--font-mono）。
- 不要拿它当唯一的变化提示：涨跌另有颜色和符号。

## Composition

```
ScrambleText
  span.sr-only
  span（当前一帧，aria-hidden）
```

# TextReveal

文字一块一块进场：整段、按行、按词或按字，从上下左右某一侧来，可带一点模糊与缩放，按顺序、从中间向外或从两头向中间错峰。SmoothUI 的 17 个文字进场原件（blur-out-up、bottom-up-letters、per-word-crossfade、soft-blur-in、stagger-from-center、mask-reveal-up 等）是同一个机制的不同参数，这里合成一个件：preset 取原件的参数，再改任一项就是自己的变体。新闻标题进场、结论句出现都用它。

## Provide

`*` marks a required prop.

### TextReveal

读屏读完整的句子（sr-only 副本），逐块的字是 aria-hidden。by="all" 时整段就是一块，不拆。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` | `string` | — | The text to reveal; for `by="line"` separate lines with a newline or pass `lines`. |
| `className` | `string` | — | Extra class names for the root element. |
| `delay` | `number` | — | Delay before the first piece starts, in milliseconds. |
| `distance` | `number` | — | Overrides the preset's travel distance, in pixels. |
| `duration` | `number` | — | Overrides the preset's duration of one piece, in milliseconds. |
| `ease` | `TextRevealEase` | — | Overrides the preset's easing, as a cubic-bezier of four numbers. |
| `from` | `TextRevealFrom` | — | Which side the text arrives from. |
| `lines` | `readonly string[]` | — | Explicit lines for `by="line"`; takes precedence over children. |
| `mask` | `boolean` | — | Clips each piece to its own box so it rises out from behind an edge. |
| `blur` | `number` | — | Starting blur in pixels; 0 means no blur filter at all. |
| `order` | `TextRevealOrder` | — | Which pieces start first: in reading order, from the middle outwards, or from both ends inwards. |
| `preset` | `TextRevealPreset` | — | A named starting point; every SmoothUI original is one of these, and any other prop overrides it. |
| `replayKey` | `string \| number` | — | Changing this value plays the reveal again from the start. |
| `scale` | `number` | — | Starting scale; below 1 grows in, above 1 settles down. |
| `stagger` | `number` | — | Delay between one piece and the next, in milliseconds. |
| `by` | `TextRevealBy` | — | Splits into the whole text, lines, words or characters. |
| `triggerOnView` | `boolean` | — | Waits until the text scrolls into view before playing. |

### TEXT_REVEAL_PRESETS

17 个原件的参数表，键是原件名（短横线小写）；值只有时长、位移、模糊、缩放这些数，直接来自原件。

### TEXT_REVEAL_EASES

原件用到的六条三次贝塞尔缓动：out、steep、tv、calm、soft、overshoot（过冲）。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { TextReveal } from '@katana-ui/react'

export function TextRevealUsage() {
  return (
    <>
      <TextReveal preset="per-word-crossfade">Fed holds rates steady and signals one cut</TextReveal>
      <TextReveal by="char" from="top" order="center">
        Order filled
      </TextReveal>
    </>
  )
}
```

## States

- 进场前：每块透明，按 from 偏到一侧，带 blur 与 scale 的起点。
- 播放中：每块按 stagger 与 order 的次序到位，到位后不再动。
- triggerOnView 且还没滚进视口：保持进场前的样子，进视口才播。
- replayKey 变了：从头再播一遍。

## Don't

- 不要给整页的表格或长段落按字进场：按字适合 40px 以上的短标题，长文用 by="word" 或 by="line"。
- 不要在行情刷新时反复用：它是出现一次的进场，数据变化用 TextMorph 或 RollingText。

## Composition

```
TextReveal
  span.sr-only（整句）
  motion.span（逐块，aria-hidden）
```

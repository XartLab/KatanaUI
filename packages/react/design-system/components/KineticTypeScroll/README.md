# KineticTypeScroll

随滚动，一道「波」从第一个词走到最后一个词：波峰上的词放大、拉开字距、上浮、变亮，过了就回落；字体是可变字体时还能随之变粗（给 weightRange）。标题与分段大字用。

## Provide

`*` marks a required prop.

### KineticTypeScroll

整句放在 sr-only，逐词是 aria-hidden。字重默认不动，给了 weightRange 才随波变化（需要可变字体）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `align` | `KineticTypeScrollAlign` | `'center'` | Horizontal alignment of the wrapped words. |
| `className` | `string` | — | Extra class names for the root element. |
| `container` | `RefObject<HTMLElement \| null>` | — | Scrollable ancestor whose progress drives the effect; the page itself when omitted. |
| `dimRange` | `Range` | `DEFAULT_DIM` | Opacity at rest and at each word's peak. |
| `liftRange` | `Range` | `DEFAULT_LIFT` | Vertical offset in pixels at rest and at each word's peak. |
| `offset` | `ScrollOffsetTuple` | `DEFAULT_OFFSET` | Motion scroll offset notation, forwarded to useScroll. |
| `scaleRange` | `Range` | `DEFAULT_SCALE` | Scale at rest and at each word's peak. |
| `stagger` | `number` | `DEFAULT_STAGGER` | Fractional gap between the peaks of two neighbouring words, from 0 to 1. |
| `trackingRange` | `Range` | `DEFAULT_TRACKING` | Letter spacing in pixels at rest and at each word's peak. |
| `weightRange` | `Range` | — | Variable-font weight at rest and at each word's peak; leave out when the font is not variable. |
| `words` * | `readonly string[]` | — | The words to animate, in order. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { KineticTypeScroll } from '@katana-ui/react'

export function KineticTypeScrollUsage() {
  return <KineticTypeScroll words={['Risk', 'on', 'returns', 'as', 'yields', 'fall']} />
}
```

## States

- 没滚到：所有词在静止值（略小、略暗）。
- 滚动中：波峰处的词到峰值，前后的词按距离过渡。
- 滚过：回到静止值。

## Don't

- 不要用在正文：字距与大小在变，正文阅读会被打断。

## Composition

```
KineticTypeScroll
  div
    span.sr-only
    motion.span（一个词，aria-hidden）
```

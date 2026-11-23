# ScrollRevealParagraph

一段话随滚动一个词一个词地亮起来：每个词叠两层，底层是暗字，上层按滚动进度的一小段从 0 渐到 1。适合长篇研报摘要、说明页的导读。在某个滚动容器里滚时传 container。

## Provide

`*` marks a required prop.

### ScrollRevealParagraph

整段放在 sr-only，读屏读到全文，与滚动位置无关。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `className` | `string` | — | Extra class names for the root element. |
| `container` | `RefObject<HTMLElement \| null>` | — | Scrollable ancestor whose progress drives the reveal; the page itself when omitted. |
| `offset` | `UseScrollOptions['offset']` | `DEFAULT_OFFSET` | Which part of the scroll range reveals the paragraph, in motion's scroll offset notation. |
| `paragraph` * | `string` | — | The paragraph to reveal word by word. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ScrollRevealParagraph } from '@katana-ui/react'

export function ScrollRevealParagraphUsage() {
  return (
    <ScrollRevealParagraph paragraph="Breadth narrowed for a third session as megacap leadership held the index up." />
  )
}
```

## States

- 还没滚到：全是暗字。
- 滚动中：按进度从前往后逐词变亮。
- 滚过：全文亮着。

## Don't

- 不要用在需要一眼读完的重点：未点亮的暗字对比度低。

## Composition

```
ScrollRevealParagraph
  p
    span.sr-only
    span（一个词：暗字 + 亮字叠层，aria-hidden）
```

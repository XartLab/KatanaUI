# ScrollImageReveal

图片随滚动进度揭开：擦除、帘子、圆形、百叶、缩放五种遮罩，里面的图再做反向视差；once 时揭开后不再合上。适合首页、策略介绍页配图；盘中界面里的图表不用它。必须写 alt。

## Provide

`*` marks a required prop.

### ScrollImageReveal

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `alt` * | `string` | — | Accessible description of the image. |
| `className` | `string` | — | Extra classes for the wrapper. |
| `container` | `RefObject<HTMLElement \| null>` | — | Ref to a scrollable ancestor that drives progress instead of the window. |
| `direction` | `ScrollImageRevealDirection` | `'left'` | Reveal direction. |
| `mask` | `ScrollImageRevealMask` | `'wipe'` | How the image is uncovered while scrolling. |
| `offset` | `ScrollOffset` | `DEFAULT_OFFSET` | Motion `useScroll` offset tuple, e.g. |
| `once` | `boolean` | `false` | Freeze the reveal once fully open instead of re-hiding on scroll-up. |
| `parallax` | `number` | `DEFAULT_PARALLAX_PX` | Counter-parallax travel of the image, in pixels. |
| `rounded` | `string` | `DEFAULT_ROUNDED` | Tailwind rounded-* class applied to the frame; defaults to the token radius. |
| `src` * | `string` | — | Image URL. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ScrollImageReveal } from '@katana-ui/react'

export function ScrollImageRevealUsage() {
  return (
    <div style={{ height: 160, overflowY: 'auto' }}>
      <div style={{ height: 120 }} />
      <ScrollImageReveal
        alt="Sample chart"
        mask="wipe"
        src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
      />
      <div style={{ height: 200 }} />
    </div>
  )
}
```

## States

- 滚动进入：遮罩随进度打开，弹簧跟随。
- once：打开后停在全开。

## Don't

- 不要揭开需要立刻看到的图：滚到一半时图还是缺的。
- alt 必填：图是内容，不是装饰。

## Composition

```
ScrollImageReveal
  motion.div（clip-path 或 mask）
    motion.img
```

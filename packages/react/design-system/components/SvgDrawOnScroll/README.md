# SvgDrawOnScroll

SVG 路径的笔画长度跟滚动进度走，多条路径依次画；marker 挂在笔尖，位置由路径本身的几何算出。适合策略复盘页的权益曲线入场、引导页的路线图；曲线要读数时用 EquityCurve。

## Provide

`*` marks a required prop.

### SvgDrawOnScroll

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `className` | `string` | — | Extra classes for the wrapper. |
| `container` | `RefObject<HTMLElement \| null>` | — | Ref to a scrollable ancestor that drives progress instead of the window. |
| `marker` | `ReactNode` | — | Rides the tip of the drawn stroke, positioned from the path's own geometry. |
| `offset` | `ScrollOffset` | `DEFAULT_OFFSET` | Motion `useScroll` offset tuple, e.g. |
| `once` | `boolean` | `false` | Freeze fully drawn once complete instead of undrawing on scroll-up. |
| `path` | `string` | — | Single path's `d`. |
| `paths` | `string[]` | — | Multiple paths, drawn one after another across the scroll range. |
| `stroke` | `string` | `DEFAULT_STROKE` | Stroke color; CSS color or var(--token). |
| `strokeWidth` | `number` | `DEFAULT_STROKE_WIDTH` | Stroke width in viewBox units. |
| `viewBox` | `string` | `DEFAULT_VIEW_BOX` | SVG viewBox of the path data. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { SvgDrawOnScroll } from '@katana-ui/react'

export function SvgDrawOnScrollUsage() {
  return (
    <div tabIndex={0} role="region" aria-label="Scroll example" style={{ height: 160, overflowY: 'auto' }}>
      <div style={{ height: 120 }} />
      <SvgDrawOnScroll path="M4,86 C14,84 18,70 28,72 S44,56 52,58 S66,36 76,30 S90,12 96,8" stroke="var(--accent)" />
      <div style={{ height: 200 }} />
    </div>
  )
}
```

## States

- 滚动：按进度画出路径，弹簧跟随。
- once：画完停在全长。
- marker：笔尖的标记点随进度移动。

## Don't

- 不要拿它读数：画到一半的曲线没有刻度。
- SVG 是 aria-hidden：曲线说明的内容要另外写成文字。

## Composition

```
SvgDrawOnScroll
  svg（aria-hidden）> motion.path × 路径数
  motion.div（marker，可选）
```

# Squircle

把元素用 clip-path 裁成曲率连续的圆角矩形（苹果图标那种角）：比 border-radius 的圆弧过渡柔和。smoothing 为 0 就是普通圆角，1 把曲线推到很深。边框改成沿同一条曲线画的 SVG 描边（CSS 边框会被裁断）。本系统的面板默认直角，这件只给头像、徽标、图标底这类单个小方块用。

## Provide

`*` marks a required prop.

### Squircle

裁切会连阴影与焦点环一起裁掉：不要给它放要伸出去的东西。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `as` | `ElementType` | — | Element to render, a div by default. |
| `children` | `ReactNode` | — | What goes inside the shape. |
| `radius` | `number` | `DEFAULT_RADIUS` | Corner radius in pixels. |
| `smoothing` | `number` | `DEFAULT_SMOOTHING` | 0 is a plain round corner, 1 pushes the curve far into the edges. |
| `border` | `boolean` | `false` | Draw a hairline along the curve; a CSS border would be clipped. |
| `className` | `string` | — | Extra class name on the element. |
| `style` | `CSSProperties` | — | Inline style on the element; size and background go here. |

### squirclePath

纯函数 (宽, 高, 半径, 平滑度)：返回 clip-path: path() 用的 SVG 路径。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Squircle } from '@katana-ui/react'

export function SquircleUsage() {
  return <Squircle radius={24} smoothing={0.6} className="size-24 bg-surface-3" />
}
```

## States

- smoothing 0：与 border-radius 一样。
- smoothing 0.6（默认）：柔和的连续曲率。
- border：沿曲线的 1px 描边。

## Don't

- 不要用在要带焦点环的可聚焦元素上：焦点环会被裁掉。
- 不要在一个面板里混用 Squircle 与直角：整块面板统一。

## Composition

```
Squircle
  div（clip-path）
    children
    svg（描边，border 时）
```

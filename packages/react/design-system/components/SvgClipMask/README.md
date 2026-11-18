# SvgClipMask

内容按一条 objectBoundingBox 路径（内置 blob、拱、菱形、波浪，或自定义）裁成异形；可循环变形、随滚动换形、悬停换形。变形的路径要有相同的命令结构。适合头像、封面图的异形裁切；数据图表不裁。

## Provide

`*` marks a required prop.

### SvgClipMask

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `animate` | `SvgClipMaskAnimate` | `'none'` | "morph" cycles through morphPaths forever, "scroll" steps through them as the container scrolls, "hover" swaps to morphPaths[0] on hover. |
| `children` * | `ReactNode` | — | Content clipped by the shape. |
| `className` | `string` | — | Extra classes for the wrapper. |
| `container` | `RefObject<HTMLElement \| null>` | — | Ref to a scrollable ancestor that drives "scroll" mode instead of the window. |
| `duration` | `number` | `DEFAULT_MORPH_DURATION` | Seconds for one full "morph" loop. |
| `morphPaths` | `string[]` | — | Paths to cycle between for "morph"/"scroll"/"hover". |
| `path` | `string` | — | Custom path data, in objectBoundingBox (0..1) coordinates. |
| `shape` | `SvgClipMaskShape` | `'blob'` | Named shape or a custom path in 0 to 1 coordinates. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { SvgClipMask } from '@katana-ui/react'

// 裁切路径按外框算：外框给定宽高（这里由外面一层定成 128 × 128），不然被父级撑宽，形状跟着拉扁。
export function SvgClipMaskUsage() {
  return (
    <div style={{ width: 128, height: 128 }}>
      <SvgClipMask shape="blob">
        <div style={{ width: 128, height: 128, background: 'var(--accent)' }} />
      </SvgClipMask>
    </div>
  )
}
```

## States

- 静态：按 shape 或 path 裁。
- morph：在 morphPaths 之间循环插值。
- scroll：随滚动进度换下一条。
- hover：悬停换成 morphPaths 的第二条（精细指针）。

## Don't

- 不要用结构不同的路径做变形：浏览器按位置插值，结构不同会跳。
- 被裁掉的部分点不到，也看不到：别把可点的东西放在边角。

## Composition

```
SvgClipMask
  svg（aria-hidden）> defs > clipPath > path
  div（clip-path）> children
```

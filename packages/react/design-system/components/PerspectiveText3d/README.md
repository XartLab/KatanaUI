# PerspectiveText3d

文字摆在一个 3D 平面上，词或行沿 Z 轴错开深度；整个平面随滚动进度、指针位置倾斜（driver），或固定一个角度。大标题的装饰。

## Provide

`*` marks a required prop.

### PerspectiveText3D

整句放在 sr-only，各段是 aria-hidden；children 与 text 二选一。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` | `string` | — | The text, as an alternative to `text`. |
| `className` | `string` | — | Extra class names for the root element. |
| `container` | `RefObject<HTMLElement \| null>` | — | Scrollable ancestor observed when `driver` is scroll; the page itself when omitted. |
| `depth` | `number` | `40` | Z-axis separation between neighbouring lines or words, in pixels. |
| `driver` | `PerspectiveTextDriver` | `'static'` | What tilts the plane: scroll progress, the pointer position, or nothing (a fixed tilt). |
| `perspective` | `number` | `800` | CSS perspective distance, in pixels. |
| `rotateX` | `number` | `8` | Maximum rotation around the X axis, in degrees. |
| `rotateY` | `number` | `10` | Maximum rotation around the Y axis, in degrees. |
| `split` | `PerspectiveTextSplit` | `'words'` | Separate depth per line (split on newline) or per word. |
| `text` | `string` | — | The text to lay out in depth. |

### splitDepthSegments

纯函数 (内容, split)：按词或按换行切成要错开深度的段。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { PerspectiveText3D } from '@katana-ui/react'

export function PerspectiveText3dUsage() {
  return <PerspectiveText3D driver="pointer" text="Net exposure by sector" />
}
```

## States

- static：固定倾斜 rotateX、rotateY。
- pointer：随指针在上面的位置倾斜，移开回正。
- scroll：随滚动进度在 ±rotate 之间倾斜。

## Don't

- 不要用在小字号或表格里：透视会让小字发虚。

## Composition

```
PerspectiveText3D
  div（perspective）
    span.sr-only
    motion.div（preserve-3d，倾斜）
      div（一段，translateZ，aria-hidden）
```

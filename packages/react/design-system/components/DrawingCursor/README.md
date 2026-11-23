# DrawingCursor

指针划过留下一条会渐渐消失的线，画布叠在内容上，线宽随速度变细；可选不消退，当作批注，ref 提供 clear 与 toDataURL。只在有精确指针的设备上启用。适用在图表截图上圈一下给同事看；不是正式的绘图工具。

## Provide

`*` marks a required prop.

### DrawingCursor

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `blend` | `GlobalCompositeOperation` | `'source-over'` | Canvas composite operation used for the strokes. |
| `children` | `ReactNode` | — | Content drawn over; the canvas sits above it and never blocks the pointer. |
| `className` | `string` | — | Extra classes for the wrapper. |
| `clearOnLeave` | `boolean` | `true` | Erase all strokes when the pointer leaves the area. |
| `color` | `string` | `DEFAULT_COLOR` | Stroke color: any CSS color or a var(--token). |
| `decay` | `number` | `DEFAULT_DECAY` | Milliseconds for a stroke to fade out; 0 keeps strokes forever. |
| `lineWidth` | `number` | `DEFAULT_LINE_WIDTH` | Stroke width in pixels at rest. |
| `paused` | `boolean` | `false` | Stop drawing and fading; existing strokes freeze. |
| `ref` | `Ref<DrawingCursorHandle>` | — | Imperative handle with `clear` and `toDataURL`. |
| `smoothing` | `number` | `DEFAULT_SMOOTHING` | Curve smoothing, 0 (polyline) to 1 (round). |
| `taper` | `boolean` | `true` | Thin the stroke as the pointer speeds up. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { DrawingCursor } from '@katana-ui/react'

export function DrawingCursorUsage() {
  return (
    <DrawingCursor decay={800}>
      <div style={{ height: 160, display: 'grid', placeItems: 'center' }}>Draw on the chart</div>
    </DrawingCursor>
  )
}
```

## States

- 指针在区域里：留笔迹，decay 毫秒后消退。
- 没有笔迹：停掉动画帧。
- decay=0：笔迹不消退，直到 clear 或指针离开（clearOnLeave）。
- 触屏：不启用。

## Don't

- 不要当绘图工具：没有撤销与图层，笔迹只在画布里。
- 不要盖在可点击的图表上：它不挡指针事件，但划线会让人误以为在操作图表。

## Composition

```
DrawingCursor
  children
  div（aria-hidden）
    canvas
```

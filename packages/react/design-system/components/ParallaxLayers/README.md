# ParallaxLayers

多层内容随滚动（可选再随指针）按各自的深度错位移动，每层可加模糊与透明度；container 指向滚动容器时跟它滚。适合首页头图、章节引子；数据、表格不放进去。深度 0 不动，1 动得最多。

## Provide

`*` marks a required prop.

### ParallaxLayers

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `className` | `string` | — | Extra classes for the wrapper. |
| `container` | `RefObject<HTMLElement \| null>` | — | Ref to a scrollable ancestor that drives progress instead of the window. |
| `direction` | `ParallaxDirection` | `'vertical'` | Axis the layers shift along while scrolling. |
| `layers` * | `ParallaxLayer[]` | — | Layers from back to front, each with its own depth speed and content. |
| `pointerParallax` | `boolean` | `false` | Also react to pointer position on hover-capable devices. |
| `range` | `number` | `DEFAULT_RANGE_PX` | Maximum travel, in pixels, at depth 1. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { ParallaxLayers } from '@katana-ui/react'

export function ParallaxLayersUsage() {
  return (
    <div style={{ height: 160, overflow: 'hidden' }}>
      <ParallaxLayers
        layers={[
          { id: 'far', depth: 0.2, content: <div style={{ padding: 16 }}>Far</div> },
          { id: 'near', depth: 1, content: <div style={{ padding: 16 }}>Near</div> },
        ]}
      />
    </div>
  )
}
```

## States

- 滚动：每层按 depth 乘以 range 平移，弹簧跟随。
- pointerParallax：精细指针下再随指针偏移，最多 20px。

## Don't

- 不要把要读的正文放进最前面的层：它在动，读不稳。
- 不要不给容器高度：层是绝对定位，容器高度要自己定。

## Composition

```
ParallaxLayers
  div（relative，量滚动进度）
    motion.div × layers（absolute，各自位移）
```

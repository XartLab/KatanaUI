# CursorImageTrail

指针在区域里移动，每隔一段距离在光标处放一张图，带随机倾斜，弹出、停留、淡出；移动越快，图越大停得越久。只在有精确指针的设备上启用。适用首页、作品集式的页面；不进盯盘界面。

## Provide

`*` marks a required prop.

### CursorImageTrail

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `children` * | `ReactNode` | — | Content the trail is laid over; it receives the pointer. |
| `className` | `string` | — | Extra classes for the wrapper. |
| `distance` | `number` | `DEFAULT_DISTANCE` | Pointer travel in pixels between two spawned images. |
| `imageSize` | `number` | `DEFAULT_IMAGE_SIZE` | Side of each square image in pixels. |
| `images` * | `CursorTrailImage[]` | — | Images cycled through in order; every image needs its own `alt`. |
| `lifetime` | `number` | `DEFAULT_LIFETIME` | How long one image lives in milliseconds; fast strokes live longer. |
| `poolSize` | `number` | `DEFAULT_POOL_SIZE` | Maximum images alive at once. |
| `rotate` | `number` | `DEFAULT_ROTATE` | Maximum random tilt in degrees, either direction. |
| `velocityScale` | `number` | `DEFAULT_VELOCITY_SCALE` | How strongly pointer speed enlarges and prolongs an image. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { CursorImageTrail } from '@katana-ui/react'

const IMAGES = [
  { alt: 'Sample chart', src: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' },
]

export function CursorImageTrailUsage() {
  return (
    <CursorImageTrail images={IMAGES} imageSize={48}>
      <div style={{ height: 160, display: 'grid', placeItems: 'center' }}>Move the pointer here</div>
    </CursorImageTrail>
  )
}
```

## States

- 指针在区域里：按 distance 放图，循环用 poolSize 张图。
- 指针离开且图都播完：停掉动画帧。
- 触屏或无精确指针：不启用，只渲染 children。

## Don't

- 不要放进有操作的区域：图在内容上，会让人以为能点。
- 每张图都要写 alt（读屏会跳过这层，但是不写会让 lint 报错）。

## Composition

```
CursorImageTrail
  children
  div（aria-hidden）
    img × poolSize
```

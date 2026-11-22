# PixelFlowField

canvas 上一片方、圆或十字的像素格随流场漂，格子取样一个词或一张图：被覆盖的格子亮、强调色、墨色三档，指针划过会推开格子，scatter 加一就把字炸开再聚拢。适用连接中、加载中的占位页；只当底。字在画布里，要读的内容另外放文字。

## Provide

`*` marks a required prop.

### PixelFlowField

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `cellSize` | `number` | `DEFAULT_CELL_SIZE` | Cell size in CSS pixels. |
| `children` | `ReactNode` | — | Foreground content, always painted above the decorative field. |
| `className` | `string` | — | Extra classes for the positioned wrapper element. |
| `colors` | `string[]` | `DEFAULT_COLORS` | Three ramp stops, dim to bright: `[field, accent, ink]`. |
| `gap` | `number` | `DEFAULT_GAP` | Gap between cells in CSS pixels. |
| `paused` | `boolean` | `false` | Freezes the field on its current frame. |
| `pointerRadius` | `number` | `DEFAULT_POINTER_RADIUS` | Radius in CSS pixels within which the pointer disturbs cells. |
| `pointerStrength` | `number` | `DEFAULT_POINTER_STRENGTH` | How hard the pointer shoves cells, from 0 to 1. |
| `scatter` | `number` | `0` | Increment this to blow the field apart and let it re-form. |
| `shape` | `PixelFlowFieldShape` | `'square'` | Shape drawn for every cell. |
| `speed` | `number` | `DEFAULT_SPEED` | Flow speed multiplier. |
| `src` | `string` | — | Image URL sampled instead of `text`. |
| `text` * | `string` | — | Word sampled into the grid (required; also repeat it in real text, the canvas is decorative). |
| `weight` | `number` | `DEFAULT_WEIGHT` | Font weight used when rasterising `text`. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { PixelFlowField } from '@katana-ui/react'

export function PixelFlowFieldUsage() {
  return (
    <div style={{ position: 'relative', height: 160, border: '1px solid var(--line-100)' }}>
      <PixelFlowField className="h-full w-full" text="LINK">
        <span />
      </PixelFlowField>
    </div>
  )
}
```

## States

- 运行：屏内且标签页可见时每帧画；格数封顶 1.4 万。
- scatter 变化：格子重新随机散开再聚回。
- 暂停或屏外：停在当前帧。
- canvas 不可用：CSS 点阵。

## Don't

- 不要用它显示要读的字：画布里的字不能被读屏读到、也不能复制。
- src 的图要允许跨域读取，读不了就退回 text。

## Composition

```
PixelFlowField
  div（aria-hidden）
    canvas
  div（children）
```

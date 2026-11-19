# PixelBrushCanvas

在小网格上画像素画：铅笔、橡皮、填充、直线、矩形，撤销最多 50 步，自带色板与工具条（showTools）。键盘可用：方向键移动，空格落笔，B、E、G 切笔，Ctrl 或 Cmd 加 Z 撤销。所有文案走必填的 labels。适合给头像、策略图标做像素风小图；不是通用绘图工具。

## Provide

`*` marks a required prop.

### PixelBrushCanvas

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `brush` | `PixelBrushCanvasBrush` | — | Currently active brush tool. |
| `className` | `string` | — | Extra classes for the wrapper. |
| `color` | `number` | — | Index into `palette` for the active paint color. |
| `grid` | `boolean` | `false` | Show gridlines between pixel cells. |
| `height` | `number` | `DEFAULT_GRID_HEIGHT` | Height of the art grid, in pixel cells (not CSS px). |
| `initial` | `number[][]` | — | Optional initial artwork as a 2D array (rows of `height`, cols of `width`) of palette indices. |
| `labels` * | `PixelBrushCanvasLabels` | — | All visible and announced text (required). |
| `onBrushChange` | `(brush: PixelBrushCanvasBrush) => void` | — | Called when the active brush changes. |
| `onChange` | `(pixels: Uint8Array) => void` | — | Fires with a snapshot of the pixel buffer on every mutation. |
| `onColorChange` | `(color: number) => void` | — | Called when the active color changes. |
| `palette` | `string[]` | `DEFAULT_PALETTE` | Available paint colors, as CSS color strings. |
| `pixelSize` | `number` | `DEFAULT_PIXEL_SIZE` | Size of a single pixel cell, in CSS px. |
| `ref` | `Ref<PixelBrushCanvasHandle>` | — | Imperative handle: clear, undo and export the canvas. |
| `showTools` | `boolean` | `true` | Render the built-in color/brush palette below the canvas. |
| `width` | `number` | `DEFAULT_GRID_WIDTH` | Width of the art grid, in pixel cells (not CSS px). |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { PixelBrushCanvas, type PixelBrushCanvasLabels } from '@katana-ui/react'

const LABELS: PixelBrushCanvasLabels = {
  canvas: 'Pixel canvas',
  palette: 'Colors',
  tools: 'Brushes',
  brushes: { pencil: 'Pencil', eraser: 'Eraser', fill: 'Fill', line: 'Line', rect: 'Rectangle' },
  color: (index) => `Color ${index + 1}`,
  cell: (column, row, colorIndex) =>
    `Column ${column}, row ${row}, ${colorIndex === null ? 'empty' : `color ${colorIndex + 1}`}`,
  anchor: (column, row) => `Anchor at column ${column}, row ${row}`,
}

export function PixelBrushCanvasUsage() {
  return <PixelBrushCanvas labels={LABELS} width={12} height={8} pixelSize={16} grid />
}
```

## States

- 空：全部透明。
- 落笔或拖动：onChange 收到整张像素缓冲的拷贝。
- 直线与矩形：按下起点、松开终点；键盘用空格设起点再按一次完成。

## Don't

- 不要当通用绘图工具：只有一层、最多九色、没有缩放。
- labels 必填：读屏名与播报的文案由调用方给。

## Composition

```
PixelBrushCanvas
  div[role=application]
    canvas
    div（光标框）
    span[aria-live]
  fieldset（色板）
  fieldset（工具）
```

## Keyboard

- `↑ ↓ ← →`：移动光标格
- `Space`：在光标格落笔（直线、矩形：设起点，再按一次完成）
- `B / E / G`：切到铅笔、橡皮、填充
- `Ctrl / Cmd + Z`：撤销

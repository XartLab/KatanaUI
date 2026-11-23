// SPDX-License-Identifier: MIT
import { PixelBrushCanvas, type PixelBrushCanvasLabels } from '../../src/index'

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

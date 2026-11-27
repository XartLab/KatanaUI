// SPDX-License-Identifier: MIT
/**
 * Canvas painting of ArcadePixel: resolving palette colors from CSS variables and drawing one frame (lit pixels, bloom, unlit dot matrix).
 * 像素屏的画法（G3，体检 §7：精灵数据与渲染分开）：一帧怎么画、调色板里的 CSS 变量引用怎么读成颜色；不碰 React。
 * 取自 SmoothUI arcade-pixel（MIT，Copyright (c) Eduardo Calvo，出处见 arcade-pixel.tsx 文件头）。G3 起不写死颜色：
 * 读不出变量时退回元素自己的文字色（currentColor），打字落地的闪光取 --lcd-fg（改前两处都是写死的 #ffffff）。
 */

/**
 * `fillStyle` cannot resolve CSS custom properties, so `var()` palette
 * entries are read off the live element before the first paint.
 */
const CSS_CUSTOM_PROPERTY_NAME = /^--[\w-]+$/
const CSS_VAR_PREFIX = 'var('

interface CssVariableParts {
  fallback?: string
  name: string
}

const parseCssVariable = (color: string): CssVariableParts | null => {
  const trimmed = color.trim()
  if (!(trimmed.startsWith(CSS_VAR_PREFIX) && trimmed.endsWith(')'))) {
    return null
  }

  const inner = trimmed.slice(CSS_VAR_PREFIX.length, -1).trim()
  const commaIndex = inner.indexOf(',')
  const name = (commaIndex === -1 ? inner : inner.slice(0, commaIndex)).trim()
  if (!CSS_CUSTOM_PROPERTY_NAME.test(name)) {
    return null
  }

  if (commaIndex === -1) {
    return { name }
  }

  const fallback = inner.slice(commaIndex + 1).trim()
  return fallback.length > 0 ? { fallback, name } : { name }
}

export const resolveColor = (element: HTMLElement, color: string): string => {
  const parsed = parseCssVariable(color)
  if (!parsed) {
    return color
  }
  const computed = getComputedStyle(element).getPropertyValue(parsed.name).trim()
  if (computed) {
    return computed
  }
  return parsed.fallback ? resolveColor(element, parsed.fallback) : getComputedStyle(element).color
}

/**
 * Palettes arrive as arrays, which are a fresh reference on every render when
 * written inline. Serialising them gives the render effect a stable dependency.
 * The separator is a unit separator rather than a space, because a modern colour
 * such as `oklch(0.72 0.2 145)` contains spaces of its own.
 */
export const PALETTE_SEPARATOR = '\u001f'

export type FrameState = {
  done: boolean
  /** Column range currently landing with a type-reveal flash. */
  flashEnd: number
  flashStart: number
  offsetColumns: number
  revealedColumns: number
  visible: boolean
}

export type PaintOptions = {
  bloomAlpha: number
  /** Color of the columns that just landed while typing. */
  flashColor: string
  columnsInView: number
  frame: FrameState
  grid: number[][]
  height: number
  matrixColor: string
  palette: string[]
  /** Column span after which the grid repeats, for a seamless marquee. */
  period: number
  pixelSize: number
  stride: number
  width: number
}

export const isSameFrame = (a: FrameState, b: FrameState): boolean =>
  a.visible === b.visible &&
  a.revealedColumns === b.revealedColumns &&
  a.offsetColumns === b.offsetColumns &&
  a.flashStart === b.flashStart &&
  a.flashEnd === b.flashEnd

const BLOOM_BLUR_PX = 5
const MATRIX_ALPHA = 0.07

/** Crisp, opaque pixels: one fillRect per lit cell. */
const paintLitPixels = (ctx: CanvasRenderingContext2D, options: PaintOptions): void => {
  const { frame, period, pixelSize, stride, width } = options
  const repeats = period > 0 ? [0, period] : [0]

  for (const [rowIndex, row] of options.grid.entries()) {
    const y = rowIndex * stride
    for (const [columnIndex, value] of row.entries()) {
      if (!value || columnIndex >= frame.revealedColumns) {
        continue
      }
      const isFlashing = columnIndex >= frame.flashStart && columnIndex < frame.flashEnd
      const color = isFlashing ? options.flashColor : (options.palette[value] ?? options.palette.at(-1))
      if (!color || color === 'transparent') {
        continue
      }
      ctx.fillStyle = color
      for (const repeat of repeats) {
        const x = (columnIndex + repeat - frame.offsetColumns) * stride
        if (x + pixelSize < 0 || x > width) {
          continue
        }
        ctx.fillRect(x, y, pixelSize, pixelSize)
      }
    }
  }
}

/**
 * Phosphor bleed. One blurred self-composite in `lighter` mode costs a single
 * draw call, where a per-pixel `shadowBlur` would cost one blur per lit cell.
 */
const paintBloom = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, options: PaintOptions): void => {
  if (options.bloomAlpha <= 0) {
    return
  }
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = options.bloomAlpha
  ctx.filter = `blur(${BLOOM_BLUR_PX}px)`
  ctx.drawImage(canvas, 0, 0, options.width, options.height)
  ctx.restore()
}

/**
 * The unlit dot matrix behind the message. Drawn last with `destination-over`
 * so it never dulls a lit pixel, and phase-locked to the marquee offset so the
 * dots and the message always sit on the same sub-cell grid.
 */
const paintDotMatrix = (ctx: CanvasRenderingContext2D, options: PaintOptions): void => {
  const { columnsInView, frame, pixelSize, stride } = options
  const phase = frame.offsetColumns - Math.floor(frame.offsetColumns)
  ctx.save()
  ctx.globalCompositeOperation = 'destination-over'
  ctx.globalAlpha = MATRIX_ALPHA
  ctx.fillStyle = options.matrixColor
  for (let rowIndex = 0; rowIndex < options.grid.length; rowIndex++) {
    const y = rowIndex * stride
    for (let column = 0; column <= columnsInView; column++) {
      ctx.fillRect((column - phase) * stride, y, pixelSize, pixelSize)
    }
  }
  ctx.restore()
}

export const paintFrame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, options: PaintOptions): void => {
  ctx.clearRect(0, 0, options.width, options.height)
  if (options.frame.visible) {
    paintLitPixels(ctx, options)
    paintBloom(ctx, canvas, options)
  }
  paintDotMatrix(ctx, options)
}

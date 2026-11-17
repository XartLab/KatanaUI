// SPDX-License-Identifier: MIT
// 改自 SmoothUI pixel-brush-canvas（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）。像素画板：在小网格上用铅笔、橡皮、填充、直线、矩形画像素画，带撤销、键盘操作（方向键移动、空格落笔）与自带的色板和工具条。相对原件：所有文案（读屏名、工具名、播报）改成必填的 labels 属性；默认色板与网格线走 token（画布不认 var()，挂载时解成 RGB）；去掉 useReducedMotion。
import { cn } from '../../lib/cn.ts'
import { motion } from 'motion/react'
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { MAX_DPR, clamp, resolveCssColors } from '../shared.ts'

export type PixelBrushCanvasBrush = 'pencil' | 'eraser' | 'fill' | 'line' | 'rect'

export interface PixelBrushCanvasHandle {
  /** Erases every pixel back to the empty state. */
  clear: () => void
  /** Returns a copy of the raw pixel buffer (palette indices, 0 = empty). */
  getPixels: () => Uint8Array
  /** Exports the current drawing as a PNG data URL. */
  toDataURL: () => string
  /** Reverts the last committed stroke, fill, line, rect or clear. */
  undo: () => void
}

/** All text the component shows or announces; the caller supplies it so the component carries no language of its own. */
export interface PixelBrushCanvasLabels {
  /** Announcement when a line or rectangle anchor is set (columns and rows start at 1). */
  anchor: (column: number, row: number) => string
  /** Visible name of each brush tool. */
  brushes: Record<PixelBrushCanvasBrush, string>
  /** Accessible name of the drawing grid. */
  canvas: string
  /** Announcement when the cursor lands on a cell; `colorIndex` is null for an empty cell. */
  cell: (column: number, row: number, colorIndex: number | null) => string
  /** Accessible name of one color swatch (index starts at 0). */
  color: (index: number) => string
  /** Accessible name of the color palette group. */
  palette: string
  /** Accessible name of the brush tool group. */
  tools: string
}

export interface PixelBrushCanvasProps {
  /** Currently active brush tool. Uncontrolled if omitted. */
  brush?: PixelBrushCanvasBrush
  /** Extra classes for the wrapper. */
  className?: string
  /** Index into `palette` for the active paint color. Uncontrolled if omitted. */
  color?: number
  /** Show gridlines between pixel cells. */
  grid?: boolean
  /** Height of the art grid, in pixel cells (not CSS px). */
  height?: number
  /** Optional initial artwork as a 2D array (rows of `height`, cols of `width`) of palette indices. Negative values mean empty. */
  initial?: number[][]
  /** All visible and announced text (required). */
  labels: PixelBrushCanvasLabels
  /** Called when the active brush changes. */
  onBrushChange?: (brush: PixelBrushCanvasBrush) => void
  /** Fires with a snapshot of the pixel buffer on every mutation. */
  onChange?: (pixels: Uint8Array) => void
  /** Called when the active color changes. */
  onColorChange?: (color: number) => void
  /** Available paint colors, as CSS color strings. */
  palette?: string[]
  /** Size of a single pixel cell, in CSS px. */
  pixelSize?: number
  /** Imperative handle: clear, undo and export the canvas. */
  ref?: Ref<PixelBrushCanvasHandle>
  /** Render the built-in color/brush palette below the canvas. */
  showTools?: boolean
  /** Width of the art grid, in pixel cells (not CSS px). */
  width?: number
}

interface Cell {
  x: number
  y: number
}

interface BoundingBox {
  maxX: number
  maxY: number
  minX: number
  minY: number
}

interface BrushOption {
  shortcut?: string
  value: PixelBrushCanvasBrush
}

const DEFAULT_GRID_WIDTH = 16
const DEFAULT_GRID_HEIGHT = 16
const DEFAULT_PIXEL_SIZE = 20
const MAX_UNDO_STEPS = 50
const GRID_LINE_WIDTH = 1
const EMPTY_CELL_VALUE = 0
/** 网格线的 token；画布认不得 var()，挂载时解成 RGB。 */
const GRID_LINE_TOKEN = 'var(--line-200)'
const FALLBACK_GRID_LINE = 'rgb(120, 120, 120)'
const GRID_LINE_ALPHA = 0.35
const FALLBACK_SWATCH: [number, number, number] = [128, 128, 128]

/** 默认色板：九个 token，跟主题走（墨、红、橙、琥珀、绿、蓝、紫、粉、底）。 */
const DEFAULT_PALETTE: string[] = [
  'var(--ink-100)',
  'var(--signal-red)',
  'var(--accent)',
  'var(--signal-amber)',
  'var(--signal-green)',
  'var(--signal-blue)',
  'var(--series-4)',
  'var(--series-7)',
  'var(--bg-000)',
]

/** 把 CSS 颜色（含 var(--token)）解成画布能用的 rgb() 串。 */
const toCanvasColors = (colors: string[], host: HTMLElement): string[] =>
  resolveCssColors(colors, host, [FALLBACK_SWATCH]).map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`)

/** 色板选中圈与工具条滑块的弹簧，照原件（SmoothUI pixel-brush-canvas）：bounce 0.1、0.25 秒。 */
const BRUSH_SPRING = { bounce: 0.1, duration: 0.25, type: 'spring' } as const

const BRUSH_OPTIONS: BrushOption[] = [
  { shortcut: 'B', value: 'pencil' },
  { shortcut: 'E', value: 'eraser' },
  { shortcut: 'G', value: 'fill' },
  { value: 'line' },
  { value: 'rect' },
]

const createInitialPixels = (gridWidth: number, gridHeight: number, initial?: number[][]): Uint8Array => {
  const pixels = new Uint8Array(gridWidth * gridHeight)
  if (!initial) {
    return pixels
  }
  for (let y = 0; y < gridHeight; y++) {
    const row = initial[y]
    if (!row) {
      continue
    }
    for (let x = 0; x < gridWidth; x++) {
      const value = row[x]
      if (value === undefined || value < 0) {
        continue
      }
      pixels[y * gridWidth + x] = value + 1
    }
  }
  return pixels
}

const drawCell = (
  ctx: CanvasRenderingContext2D,
  pixels: Uint8Array,
  gridWidth: number,
  x: number,
  y: number,
  cellSize: number,
  palette: string[],
  gridColor: string | null,
) => {
  const value = pixels[y * gridWidth + x]
  const left = x * cellSize
  const top = y * cellSize
  ctx.clearRect(left, top, cellSize, cellSize)
  if (value !== EMPTY_CELL_VALUE) {
    ctx.fillStyle = palette[value - 1] ?? palette[0] ?? '#000000'
    ctx.fillRect(left, top, cellSize, cellSize)
  }
  if (gridColor) {
    ctx.strokeStyle = gridColor
    ctx.lineWidth = GRID_LINE_WIDTH
    ctx.globalAlpha = GRID_LINE_ALPHA
    ctx.strokeRect(left + 0.5, top + 0.5, cellSize - 1, cellSize - 1)
    ctx.globalAlpha = 1
  }
}

const drawRegion = (
  ctx: CanvasRenderingContext2D,
  pixels: Uint8Array,
  gridWidth: number,
  gridHeight: number,
  cellSize: number,
  palette: string[],
  gridColor: string | null,
  box: BoundingBox,
) => {
  const startX = Math.max(0, box.minX)
  const startY = Math.max(0, box.minY)
  const endX = Math.min(gridWidth - 1, box.maxX)
  const endY = Math.min(gridHeight - 1, box.maxY)
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      drawCell(ctx, pixels, gridWidth, x, y, cellSize, palette, gridColor)
    }
  }
}

/** Iterative (stack-based) flood fill — never recursive, so it cannot blow the call stack. */
const floodFillIterative = (
  pixels: Uint8Array,
  gridWidth: number,
  gridHeight: number,
  startX: number,
  startY: number,
  newValue: number,
): BoundingBox | null => {
  const targetValue = pixels[startY * gridWidth + startX]
  if (targetValue === newValue) {
    return null
  }
  const stack: Cell[] = [{ x: startX, y: startY }]
  const box: BoundingBox = {
    maxX: startX,
    maxY: startY,
    minX: startX,
    minY: startY,
  }
  while (stack.length > 0) {
    const cell = stack.pop()
    if (!cell) {
      break
    }
    const { x, y } = cell
    if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
      continue
    }
    if (pixels[y * gridWidth + x] !== targetValue) {
      continue
    }
    pixels[y * gridWidth + x] = newValue
    box.minX = Math.min(box.minX, x)
    box.maxX = Math.max(box.maxX, x)
    box.minY = Math.min(box.minY, y)
    box.maxY = Math.max(box.maxY, y)
    stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 })
  }
  return box
}

/** Bresenham line rasterization, bounded by the known max step count. */
const getLineCells = (start: Cell, end: Cell): Cell[] => {
  const cells: Cell[] = []
  const dx = Math.abs(end.x - start.x)
  const dy = Math.abs(end.y - start.y)
  const stepX = end.x >= start.x ? 1 : -1
  const stepY = end.y >= start.y ? 1 : -1
  const maxSteps = Math.max(dx, dy) + 1
  let { x, y } = start
  let error = dx - dy
  for (let step = 0; step < maxSteps; step++) {
    cells.push({ x, y })
    if (x === end.x && y === end.y) {
      break
    }
    const doubledError = error * 2
    if (doubledError > -dy) {
      error -= dy
      x += stepX
    }
    if (doubledError < dx) {
      error += dx
      y += stepY
    }
  }
  return cells
}

const getRectOutlineCells = (start: Cell, end: Cell): Cell[] => {
  const minX = Math.min(start.x, end.x)
  const maxX = Math.max(start.x, end.x)
  const minY = Math.min(start.y, end.y)
  const maxY = Math.max(start.y, end.y)
  const cells: Cell[] = []
  for (let x = minX; x <= maxX; x++) {
    cells.push({ x, y: minY })
    if (maxY !== minY) {
      cells.push({ x, y: maxY })
    }
  }
  for (let y = minY; y <= maxY; y++) {
    cells.push({ x: minX, y })
    if (maxX !== minX) {
      cells.push({ x: maxX, y })
    }
  }
  return cells
}

const getCellFromPoint = (
  clientX: number,
  clientY: number,
  rect: DOMRect,
  gridWidth: number,
  gridHeight: number,
  cellSize: number,
): Cell => {
  const scaleX = rect.width / (gridWidth * cellSize) || 1
  const scaleY = rect.height / (gridHeight * cellSize) || 1
  const rawX = (clientX - rect.left) / scaleX
  const rawY = (clientY - rect.top) / scaleY
  return {
    x: clamp(Math.floor(rawX / cellSize), 0, gridWidth - 1),
    y: clamp(Math.floor(rawY / cellSize), 0, gridHeight - 1),
  }
}

interface ToolPaletteProps {
  brush: PixelBrushCanvasBrush
  colorIndex: number
  labels: PixelBrushCanvasLabels
  onSelectBrush: (brush: PixelBrushCanvasBrush) => void
  onSelectColor: (index: number) => void
  palette: string[]
}

const ToolPalette = ({ brush, colorIndex, labels, onSelectBrush, onSelectColor, palette }: ToolPaletteProps) => {
  const brushIndicatorId = `pixel-brush-tool-${useId()}`

  return (
    <div className="flex flex-wrap items-center gap-3">
      <fieldset aria-label={labels.palette} className="m-0 flex items-center gap-1.5 border-0 p-0">
        {palette.map((hex, index) => {
          const isSelected = index === colorIndex
          return (
            <button
              aria-label={labels.color(index)}
              aria-pressed={isSelected}
              className={cn(
                'relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full',
                'shadow-[inset_0_0_0_1px_var(--line-200)] outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
              )}
              // biome-ignore lint/suspicious/noArrayIndexKey: palette is a flat color list with no stable id and colors may repeat
              key={`${hex}-${index}`}
              onClick={() => onSelectColor(index)}
              style={{ backgroundColor: hex }}
              type="button"
            >
              {isSelected && (
                // A brand ring around a swatch fights the colour the swatch is
                // showing. The selection halo is neutral chrome instead — the
                // gap-then-ring every colour picker uses — so it reads the same
                // against every hue in the palette.
                <motion.span
                  animate={{ opacity: 1, scale: 1 }}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full ring-2 ring-ink ring-offset-2 ring-offset-surface-0"
                  initial={{ opacity: 0, scale: 0.6 }}
                  transition={BRUSH_SPRING}
                />
              )}
            </button>
          )
        })}
      </fieldset>
      {/* Tool selection borrows the language of `Tabs`: the whole
          group is a recessed track and the active tool is a solid chip raised
          out of it, which reads instantly at this size without any fill. */}
      <fieldset
        aria-label={labels.tools}
        className="m-0 flex items-center gap-0.5 rounded-[var(--radius-md)] border-0 bg-surface-2 p-1"
      >
        {BRUSH_OPTIONS.map((option) => {
          const isActive = option.value === brush
          return (
            <button
              aria-keyshortcuts={option.shortcut}
              aria-pressed={isActive}
              className={cn(
                'k-text-caption relative cursor-pointer rounded-[var(--radius-sm)] px-2.5 py-1.5 outline-none',
                'transition-colors duration-150 ease-out',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-0',
                isActive ? 'text-ink' : 'text-ink-3 hover:text-ink',
              )}
              key={option.value}
              onClick={() => onSelectBrush(option.value)}
              type="button"
            >
              {isActive && (
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-[var(--radius-sm)] bg-surface-4 shadow-[0_0_0_1px_var(--line-200)]"
                  layoutId={brushIndicatorId}
                  transition={BRUSH_SPRING}
                />
              )}
              <span className="relative">{labels.brushes[option.value]}</span>
            </button>
          )
        })}
      </fieldset>
    </div>
  )
}

export const PixelBrushCanvas = ({
  brush,
  className,
  color,
  grid = false,
  height = DEFAULT_GRID_HEIGHT,
  initial,
  labels,
  onBrushChange,
  onChange,
  onColorChange,
  palette = DEFAULT_PALETTE,
  pixelSize = DEFAULT_PIXEL_SIZE,
  ref,
  showTools = true,
  width = DEFAULT_GRID_WIDTH,
}: PixelBrushCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const pixelsRef = useRef<Uint8Array>(createInitialPixels(width, height, initial))
  const undoStackRef = useRef<Uint8Array[]>([])
  const paintRef = useRef<{ colors: string[]; grid: string }>({ colors: [], grid: FALLBACK_GRID_LINE })
  const isPaintingRef = useRef(false)
  const lastPaintedRef = useRef<Cell | null>(null)
  const dragStartRef = useRef<Cell | null>(null)
  const anchorRef = useRef<Cell | null>(null)

  const [internalColor, setInternalColor] = useState(color ?? 0)
  const [internalBrush, setInternalBrush] = useState<PixelBrushCanvasBrush>(brush ?? 'pencil')
  const [cursor, setCursor] = useState<Cell>({ x: 0, y: 0 })
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    if (color !== undefined) {
      // oxlint-disable-next-line react/set-state-in-effect -- 挂载后才知道环境，必须在 effect 里设
      setInternalColor(color)
    }
  }, [color])

  useEffect(() => {
    if (brush !== undefined) {
      // oxlint-disable-next-line react/set-state-in-effect -- 挂载后才知道环境，必须在 effect 里设
      setInternalBrush(brush)
    }
  }, [brush])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    if (pixelsRef.current.length !== width * height) {
      pixelsRef.current = createInitialPixels(width, height, initial)
      undoStackRef.current = []
    }
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    const cssWidth = width * pixelSize
    const cssHeight = height * pixelSize
    canvas.style.width = `${cssWidth}px`
    canvas.style.height = `${cssHeight}px`
    canvas.width = Math.round(cssWidth * dpr)
    canvas.height = Math.round(cssHeight * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }
    // 画布认不得 var()：色板与网格线在这里解成 RGB，之后重画都读 paintRef。
    const host = wrapperRef.current ?? canvas
    paintRef.current = {
      colors: toCanvasColors(palette, host),
      grid: toCanvasColors([GRID_LINE_TOKEN], host)[0] ?? FALLBACK_GRID_LINE,
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawRegion(
      ctx,
      pixelsRef.current,
      width,
      height,
      pixelSize,
      paintRef.current.colors,
      grid ? paintRef.current.grid : null,
      {
        maxX: width - 1,
        maxY: height - 1,
        minX: 0,
        minY: 0,
      },
    )
  }, [width, height, pixelSize, palette, grid, initial])

  const redrawRegion = useCallback(
    (box: BoundingBox) => {
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx) {
        return
      }
      drawRegion(
        ctx,
        pixelsRef.current,
        width,
        height,
        pixelSize,
        paintRef.current.colors,
        grid ? paintRef.current.grid : null,
        box,
      )
    },
    [width, height, pixelSize, grid],
  )

  const notifyChange = useCallback(() => {
    onChange?.(pixelsRef.current.slice())
  }, [onChange])

  const pushUndoSnapshot = useCallback(() => {
    const stack = undoStackRef.current
    if (stack.length >= MAX_UNDO_STEPS) {
      stack.shift()
    }
    stack.push(pixelsRef.current.slice())
  }, [])

  const announceFocusedCell = (x: number, y: number) => {
    const value = pixelsRef.current[y * width + x]
    setAnnouncement(labels.cell(x + 1, y + 1, value === EMPTY_CELL_VALUE ? null : value - 1))
  }

  const setCellValue = (x: number, y: number, value: number): boolean => {
    if (pixelsRef.current[y * width + x] === value) {
      return false
    }
    pixelsRef.current[y * width + x] = value
    redrawRegion({ maxX: x, maxY: y, minX: x, minY: y })
    return true
  }

  const commitCells = (cells: Cell[], value: number) => {
    pushUndoSnapshot()
    let changed = false
    const box: BoundingBox = { maxX: -1, maxY: -1, minX: width, minY: height }
    for (const cell of cells) {
      if (cell.x < 0 || cell.x >= width || cell.y < 0 || cell.y >= height) {
        continue
      }
      if (pixelsRef.current[cell.y * width + cell.x] === value) {
        continue
      }
      pixelsRef.current[cell.y * width + cell.x] = value
      changed = true
      box.minX = Math.min(box.minX, cell.x)
      box.minY = Math.min(box.minY, cell.y)
      box.maxX = Math.max(box.maxX, cell.x)
      box.maxY = Math.max(box.maxY, cell.y)
    }
    if (changed) {
      redrawRegion(box)
      notifyChange()
    } else {
      undoStackRef.current.pop()
    }
  }

  const applyFillAt = (x: number, y: number) => {
    pushUndoSnapshot()
    const box = floodFillIterative(pixelsRef.current, width, height, x, y, internalColor + 1)
    if (box) {
      redrawRegion(box)
      notifyChange()
    } else {
      undoStackRef.current.pop()
    }
  }

  const clear = useCallback(() => {
    pushUndoSnapshot()
    pixelsRef.current.fill(EMPTY_CELL_VALUE)
    redrawRegion({ maxX: width - 1, maxY: height - 1, minX: 0, minY: 0 })
    notifyChange()
  }, [width, height, pushUndoSnapshot, redrawRegion, notifyChange])

  const undo = useCallback(() => {
    const snapshot = undoStackRef.current.pop()
    if (!snapshot) {
      return
    }
    pixelsRef.current = snapshot
    redrawRegion({ maxX: width - 1, maxY: height - 1, minX: 0, minY: 0 })
    notifyChange()
  }, [width, height, redrawRegion, notifyChange])

  useImperativeHandle(
    ref,
    () => ({
      clear,
      getPixels: () => pixelsRef.current.slice(),
      toDataURL: () => canvasRef.current?.toDataURL() ?? '',
      undo,
    }),
    [clear, undo],
  )

  const selectBrush = (next: PixelBrushCanvasBrush) => {
    setInternalBrush(next)
    anchorRef.current = null
    onBrushChange?.(next)
  }

  const selectColor = (index: number) => {
    setInternalColor(index)
    onColorChange?.(index)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const cell = getCellFromPoint(event.clientX, event.clientY, rect, width, height, pixelSize)
    wrapperRef.current?.focus()
    setCursor(cell)

    if (internalBrush === 'pencil' || internalBrush === 'eraser') {
      event.currentTarget.setPointerCapture(event.pointerId)
      isPaintingRef.current = true
      lastPaintedRef.current = null
      pushUndoSnapshot()
      const value = internalBrush === 'eraser' ? EMPTY_CELL_VALUE : internalColor + 1
      if (setCellValue(cell.x, cell.y, value)) {
        notifyChange()
      } else {
        undoStackRef.current.pop()
      }
      lastPaintedRef.current = cell
    } else if (internalBrush === 'fill') {
      applyFillAt(cell.x, cell.y)
    } else {
      dragStartRef.current = cell
    }
    announceFocusedCell(cell.x, cell.y)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isPaintingRef.current) {
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const cell = getCellFromPoint(event.clientX, event.clientY, rect, width, height, pixelSize)
    const last = lastPaintedRef.current
    if (last && last.x === cell.x && last.y === cell.y) {
      return
    }
    const value = internalBrush === 'eraser' ? EMPTY_CELL_VALUE : internalColor + 1
    if (setCellValue(cell.x, cell.y, value)) {
      notifyChange()
    }
    lastPaintedRef.current = cell
    setCursor(cell)
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (isPaintingRef.current) {
      isPaintingRef.current = false
      lastPaintedRef.current = null
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      return
    }
    const start = dragStartRef.current
    if (start && (internalBrush === 'line' || internalBrush === 'rect')) {
      const rect = event.currentTarget.getBoundingClientRect()
      const end = getCellFromPoint(event.clientX, event.clientY, rect, width, height, pixelSize)
      const cells = internalBrush === 'line' ? getLineCells(start, end) : getRectOutlineCells(start, end)
      commitCells(cells, internalColor + 1)
      announceFocusedCell(end.x, end.y)
    }
    dragStartRef.current = null
  }

  const moveCursor = (dx: number, dy: number) => {
    const nextX = clamp(cursor.x + dx, 0, width - 1)
    const nextY = clamp(cursor.y + dy, 0, height - 1)
    setCursor({ x: nextX, y: nextY })
    announceFocusedCell(nextX, nextY)
  }

  const paintAtCursor = () => {
    if (internalBrush === 'pencil' || internalBrush === 'eraser') {
      pushUndoSnapshot()
      const value = internalBrush === 'eraser' ? EMPTY_CELL_VALUE : internalColor + 1
      if (setCellValue(cursor.x, cursor.y, value)) {
        notifyChange()
      } else {
        undoStackRef.current.pop()
      }
      announceFocusedCell(cursor.x, cursor.y)
    } else if (internalBrush === 'fill') {
      applyFillAt(cursor.x, cursor.y)
      announceFocusedCell(cursor.x, cursor.y)
    } else {
      const anchor = anchorRef.current
      if (!anchor) {
        anchorRef.current = { x: cursor.x, y: cursor.y }
        setAnnouncement(labels.anchor(cursor.x + 1, cursor.y + 1))
        return
      }
      const cells = internalBrush === 'line' ? getLineCells(anchor, cursor) : getRectOutlineCells(anchor, cursor)
      commitCells(cells, internalColor + 1)
      anchorRef.current = null
      announceFocusedCell(cursor.x, cursor.y)
    }
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const isUndoShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z'
    if (isUndoShortcut) {
      event.preventDefault()
      undo()
      return
    }
    switch (event.key) {
      case 'ArrowUp': {
        event.preventDefault()
        moveCursor(0, -1)
        return
      }
      case 'ArrowDown': {
        event.preventDefault()
        moveCursor(0, 1)
        return
      }
      case 'ArrowLeft': {
        event.preventDefault()
        moveCursor(-1, 0)
        return
      }
      case 'ArrowRight': {
        event.preventDefault()
        moveCursor(1, 0)
        return
      }
      case ' ':
      case 'Spacebar': {
        event.preventDefault()
        paintAtCursor()
        return
      }
      default:
        break
    }
    const lowerKey = event.key.toLowerCase()
    if (lowerKey === 'e') {
      selectBrush('eraser')
    } else if (lowerKey === 'b') {
      selectBrush('pencil')
    } else if (lowerKey === 'g') {
      selectBrush('fill')
    }
  }

  return (
    <div className={cn('inline-flex flex-col gap-3', className)}>
      <div className="inline-block rounded-[var(--radius-md)] border border-line bg-surface-2 p-2">
        {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: role="application" is the keyboard-operable pixel grid; no semantic element models 2D arrow-key navigation */}
        <div
          aria-label={labels.canvas}
          className="relative inline-block rounded-[var(--radius-sm)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onKeyDown={handleKeyDown}
          ref={wrapperRef}
          role="application"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: role="application" must be focusable to be keyboard-operable
          tabIndex={0}
        >
          <canvas
            className="block touch-none rounded-[var(--radius-sm)]"
            onPointerDown={handlePointerDown}
            onPointerLeave={handlePointerUp}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            ref={canvasRef}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute border-2 border-[var(--accent)]"
            style={{
              height: pixelSize,
              left: cursor.x * pixelSize,
              top: cursor.y * pixelSize,
              width: pixelSize,
            }}
          />
          <span aria-live="polite" className="sr-only">
            {announcement}
          </span>
        </div>
      </div>
      {showTools ? (
        <ToolPalette
          brush={internalBrush}
          colorIndex={internalColor}
          labels={labels}
          onSelectBrush={selectBrush}
          onSelectColor={selectColor}
          palette={palette}
        />
      ) : null}
    </div>
  )
}

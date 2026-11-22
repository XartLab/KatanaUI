// SPDX-License-Identifier: MIT
// 改自 SmoothUI dither-chart（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 抖动点阵图：先在低分辨率画布上画一张普通图，再按 Bayer 矩阵把每个像素的透明度量化成「有点 / 没点」，放大回来就是一颗颗方点拼的图，像素风。
// 与 DotMatrix 的分工：DotMatrix 是 SVG 里的固定 4px 点阵纹理（给回撤面、区间面填充），DitherChart 是整张图都用点阵表现的小图（线、柱、堆叠、环、仪表、漏斗、热力），用在总览卡里的装饰性概览。
// 它是画布图，不可悬停取值，读屏靠 description；要读准数的图请用 Sparkline、EquityCurve 等 SVG 图。
// 与原件的差别：① 去掉气泡款（用得少）；② 颜色是 CSS 颜色（可以是 token），画布不认 var()，所以每次画前把它解析成实色；默认调色板是强调色与次要文字色；
// ③ 原件按数据自动拼的英文读屏句换成必填的 description；④ 画入动画 900ms、缓动 cubic-bezier(.23,1,.32,1) 照原件，进入视口才开始。
import { useCallback, useEffect, useRef } from 'react'
import { cn } from '../lib/cn.ts'

export const DITHER_CHART_VARIANTS = ['line', 'bar', 'stacked', 'donut', 'gauge', 'funnel', 'heatmap'] as const
export type DitherChartVariant = (typeof DITHER_CHART_VARIANTS)[number]
export type DitherChartMatrixOrder = 2 | 4 | 8

export type DitherChartPoint = {
  /** Numeric value of the point. */
  value: number
}
export type DitherChartSeries = {
  /** Overrides the palette colour of this series. */
  color?: string
  points: readonly DitherChartPoint[]
}

export type DitherChartProps = {
  /**
   * One series each; donut, gauge and funnel read the first, heatmap draws one row per series, the others draw every series.
   * 每个序列一组点；环、仪表、漏斗只读第一个序列，热力图一个序列一行。
   */
  data: readonly DitherChartSeries[]
  /** What the chart says, in a sentence, for screen readers. */
  description: string
  /** Which chart to draw. */
  variant?: DitherChartVariant
  /** Width in CSS pixels. */
  width?: number
  /** Height in CSS pixels. */
  height?: number
  /** Side of one dither pixel in CSS pixels. */
  pixelSize?: number
  /** Bayer matrix order; a larger one gives finer gradations. */
  matrix?: DitherChartMatrixOrder
  /** Any CSS colours, cycled per series (per slice for donut). */
  palette?: readonly string[]
  /** Draw the chart in when it scrolls into view. */
  animate?: boolean
  /** Extra class name on the figure. */
  className?: string
}

// 画入动画时长与缓动：来自 SmoothUI dither-chart。
const DRAW_IN_MS = 900
// 每个序列的点阵密度（透明度）梯度，序列之间靠它区分。
const TONE_RAMP = [1, 0.68, 0.46, 0.3, 0.2]
const AREA_TONE = 0.45
const TRACK_TONE = 0.16
const HEATMAP_MIN_TONE = 0.08
const INSET = 1
const BAR_FILL = 0.72
const FUNNEL_GAP = 1
const DONUT_INNER = 0.55
const GAUGE_INNER = 0.62
const GAUGE_START = Math.PI * 0.75
const GAUGE_SWEEP = Math.PI * 1.5
const GAUGE_MAX = 100
const TURN = Math.PI * 2

const bayer = (order: number): number[][] => {
  if (order <= 1) return [[0]]
  const half = bayer(order / 2)
  const size = half.length
  const offsets = [
    [0, 2],
    [3, 1],
  ]
  return Array.from({ length: order }, (_, y) =>
    Array.from(
      { length: order },
      (_, x) => half[y % size]![x % size]! * 4 + offsets[y < size ? 0 : 1]![x < size ? 0 : 1]!,
    ),
  )
}
const MATRICES: Record<DitherChartMatrixOrder, number[][]> = { 2: bayer(2), 4: bayer(4), 8: bayer(8) }

const bezier = (t: number, a: number, b: number) => {
  const inverse = 1 - t
  return 3 * inverse * inverse * t * a + 3 * inverse * t * t * b + t * t * t
}
/** cubic-bezier(.23, 1, .32, 1) 的缓出：二分求 x 对应的参数，再取 y。 */
const easeOut = (progress: number) => {
  let low = 0
  let high = 1
  let t = progress
  for (let i = 0; i < 16; i += 1) {
    if (bezier(t, 0.23, 0.32) < progress) low = t
    else high = t
    t = (low + high) / 2
  }
  return bezier(t, 1, 1)
}

type Paint = {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  progress: number
  series: readonly DitherChartSeries[]
  color: (index: number) => string
  tone: (index: number) => number
}

const maxValue = (series: readonly DitherChartSeries[]) =>
  Math.max(1e-9, ...series.flatMap((one) => one.points.map((point) => point.value)))
const longest = (series: readonly DitherChartSeries[]) => Math.max(1, ...series.map((one) => one.points.length))

function ring(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  start: number,
  end: number,
) {
  ctx.beginPath()
  ctx.arc(cx, cy, outer, start, end)
  ctx.arc(cx, cy, inner, end, start, true)
  ctx.closePath()
  ctx.fill()
}

const PAINTERS: Record<DitherChartVariant, (paint: Paint) => void> = {
  line({ ctx, width, height, progress, series, color, tone }) {
    const max = maxValue(series)
    const base = height - INSET
    const usable = base - INSET
    series.forEach((one, i) => {
      const { points } = one
      if (points.length < 2) return
      const step = (width - INSET * 2) / (points.length - 1)
      const at = points.map((point, index) => ({
        x: INSET + step * index,
        y: base - (point.value / max) * usable * progress,
      }))
      const paint = color(i)
      ctx.fillStyle = paint
      ctx.globalAlpha = tone(i) * AREA_TONE
      ctx.beginPath()
      ctx.moveTo(at[0]!.x, base)
      for (const p of at) ctx.lineTo(p.x, p.y)
      ctx.lineTo(INSET + step * (points.length - 1), base)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = paint
      ctx.globalAlpha = tone(i)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(at[0]!.x, at[0]!.y)
      for (const p of at) ctx.lineTo(p.x, p.y)
      ctx.stroke()
    })
  },
  bar({ ctx, width, height, progress, series, color, tone }) {
    const max = maxValue(series)
    const groups = longest(series)
    const base = height - INSET
    const usable = base - INSET
    const slot = (width - INSET * 2) / groups
    const barWidth = Math.max(1, (slot * BAR_FILL) / series.length)
    for (let g = 0; g < groups; g += 1) {
      const start = INSET + slot * g + (slot - barWidth * series.length) / 2
      series.forEach((one, i) => {
        const h = ((one.points[g]?.value ?? 0) / max) * usable * progress
        ctx.fillStyle = color(i)
        ctx.globalAlpha = tone(i)
        ctx.fillRect(start + barWidth * i, base - h, barWidth, h)
      })
    }
  },
  stacked({ ctx, width, height, progress, series, color, tone }) {
    const groups = longest(series)
    let maxTotal = 1
    for (let g = 0; g < groups; g += 1)
      maxTotal = Math.max(
        maxTotal,
        series.reduce((sum, one) => sum + (one.points[g]?.value ?? 0), 0),
      )
    const base = height - INSET
    const usable = base - INSET
    const slot = (width - INSET * 2) / groups
    const barWidth = Math.max(1, slot * BAR_FILL)
    for (let g = 0; g < groups; g += 1) {
      const x = INSET + slot * g + (slot - barWidth) / 2
      let stacked = 0
      series.forEach((one, i) => {
        const h = ((one.points[g]?.value ?? 0) / maxTotal) * usable * progress
        ctx.fillStyle = color(i)
        ctx.globalAlpha = tone(i)
        ctx.fillRect(x, base - stacked - h, barWidth, h)
        stacked += h
      })
    }
  },
  donut({ ctx, width, height, progress, series, color, tone }) {
    const points = series[0]?.points ?? []
    if (points.length === 0) return
    const total = points.reduce((sum, point) => sum + point.value, 0) || 1
    const outer = Math.min(width, height) / 2 - INSET
    let angle = -Math.PI / 2
    points.forEach((point, i) => {
      const sweep = (point.value / total) * TURN * progress
      ctx.fillStyle = color(i)
      ctx.globalAlpha = tone(i)
      ring(ctx, width / 2, height / 2, outer, outer * DONUT_INNER, angle, angle + sweep)
      angle += sweep
    })
  },
  gauge({ ctx, width, height, progress, series, color, tone }) {
    const ratio = Math.min(1, Math.max(0, (series[0]?.points[0]?.value ?? 0) / GAUGE_MAX))
    const outer = Math.min(width, height) / 2 - INSET
    const inner = outer * GAUGE_INNER
    ctx.fillStyle = color(0)
    ctx.globalAlpha = TRACK_TONE
    ring(ctx, width / 2, height / 2, outer, inner, GAUGE_START, GAUGE_START + GAUGE_SWEEP)
    ctx.globalAlpha = tone(0)
    ring(ctx, width / 2, height / 2, outer, inner, GAUGE_START, GAUGE_START + GAUGE_SWEEP * ratio * progress)
  },
  funnel({ ctx, width, height, progress, series, color, tone }) {
    const points = series[0]?.points ?? []
    if (points.length === 0) return
    const max = maxValue(series)
    const row = (height - INSET * 2) / points.length
    points.forEach((point, i) => {
      const w = (point.value / max) * (width - INSET * 2) * progress
      ctx.fillStyle = color(i)
      ctx.globalAlpha = tone(i)
      ctx.fillRect((width - w) / 2, INSET + row * i, w, Math.max(1, row - FUNNEL_GAP))
    })
  },
  heatmap({ ctx, width, height, progress, series, color }) {
    const max = maxValue(series)
    const columns = longest(series)
    const w = (width - INSET * 2) / columns
    const h = (height - INSET * 2) / series.length
    ctx.fillStyle = color(0)
    series.forEach((one, r) => {
      for (let c = 0; c < columns; c += 1) {
        ctx.globalAlpha = (HEATMAP_MIN_TONE + ((one.points[c]?.value ?? 0) / max) * (1 - HEATMAP_MIN_TONE)) * progress
        ctx.fillRect(INSET + w * c, INSET + h * r, w, h)
      }
    })
  },
}

/** 画布不认 var()：借一个临时元素让浏览器把任意 CSS 颜色算成实色。 */
function solid(host: HTMLElement, value: string): string {
  const probe = document.createElement('span')
  probe.style.color = value
  probe.style.display = 'none'
  host.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  return resolved
}

/** 逐像素按 Bayer 阈值把透明度量化成 0 或 255。 */
function dither(ctx: CanvasRenderingContext2D, width: number, height: number, order: DitherChartMatrixOrder) {
  const image = ctx.getImageData(0, 0, width, height)
  const pixels = image.data
  const matrix = MATRICES[order]
  const levels = order * order
  for (let y = 0; y < height; y += 1) {
    const row = matrix[y % order]!
    for (let x = 0; x < width; x += 1) {
      const at = (y * width + x) * 4 + 3
      pixels[at] = pixels[at]! / 255 > (row[x % order]! + 0.5) / levels ? 255 : 0
    }
  }
  ctx.putImageData(image, 0, 0)
}

export function DitherChart({
  data,
  description,
  variant = 'line',
  width = 320,
  height = 180,
  pixelSize = 3,
  matrix = 4,
  palette = ['var(--accent)', 'var(--ink-300)'],
  animate = true,
  className,
}: DitherChartProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const buffer = useRef<HTMLCanvasElement | null>(null)
  const draw = useCallback(
    (progress: number) => {
      const element = canvas.current
      if (!element || data.length === 0) return
      const low = buffer.current ?? document.createElement('canvas')
      buffer.current = low
      const lw = Math.max(1, Math.round(width / pixelSize))
      const lh = Math.max(1, Math.round(height / pixelSize))
      low.width = lw
      low.height = lh
      const context = low.getContext('2d', { willReadFrequently: true })
      if (!context) return
      const colors = palette.map((one) => solid(element, one))
      const own = data.map((one) => (one.color ? solid(element, one.color) : null))
      PAINTERS[variant]({
        ctx: context,
        width: lw,
        height: lh,
        progress,
        series: data,
        // 序列自带颜色就用它，没有就按序号轮着取调色板。
        color: (index) => own[index] ?? colors[index % colors.length]!,
        tone: (index) => TONE_RAMP[index % TONE_RAMP.length]!,
      })
      context.globalAlpha = 1
      dither(context, lw, lh, matrix)
      const ratio = window.devicePixelRatio || 1
      element.width = Math.round(width * ratio)
      element.height = Math.round(height * ratio)
      const out = element.getContext('2d')
      if (!out) return
      out.imageSmoothingEnabled = false
      out.clearRect(0, 0, element.width, element.height)
      out.drawImage(low, 0, 0, lw, lh, 0, 0, element.width, element.height)
    },
    [data, height, matrix, palette, pixelSize, variant, width],
  )
  useEffect(() => {
    const element = canvas.current
    if (!element) return
    if (!animate) {
      draw(1)
      return
    }
    let frame = 0
    let elapsed = 0
    let last = 0
    let running = false
    draw(0)
    const tick = (time: number) => {
      if (last === 0) last = time
      elapsed += time - last
      last = time
      const progress = Math.min(1, elapsed / DRAW_IN_MS)
      draw(easeOut(progress))
      if (progress < 1) frame = requestAnimationFrame(tick)
      else running = false
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !running && elapsed < DRAW_IN_MS) {
          running = true
          last = 0
          frame = requestAnimationFrame(tick)
        } else if (!entry.isIntersecting && running) {
          cancelAnimationFrame(frame)
          running = false
        }
      }
    })
    observer.observe(element)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [animate, draw])
  return (
    <figure
      data-slot="dither-chart"
      data-variant={variant}
      className={cn('m-0 inline-flex flex-col gap-(--space-2) text-ink', className)}
    >
      <canvas
        ref={canvas}
        aria-hidden="true"
        tabIndex={-1}
        className="block"
        style={{ width, height }}
        width={width}
        height={height}
      />
      <span className="sr-only">{description}</span>
    </figure>
  )
}

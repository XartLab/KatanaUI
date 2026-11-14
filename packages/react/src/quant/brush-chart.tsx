// SPDX-License-Identifier: MIT
// 概览刷选条加主图联动：下面一条整段序列的概览，上面套一个可拖的窗口，主图只画窗口里的那一段。
// 功能参照 Arc 的 Brush chart 与 Window range（uiarc.dev/components/charts，2026-11-14 读，只取功能），实现原创；外观照我们的 token。
// 交互（照 TradingView 底部的时间范围滑条与 Observable 的 brush 的惯例，Arc 的页面没写键位）：
//   拖窗口中间平移、拖两端缩放、点窗口外的地方把窗口移到那里居中；三处都是 role="slider"，←→ 一点、Shift+←→ 三点、Home / End 到头尾。
//   主图上指针或 ←→ 扫读，十字线与读数跟着走（useScrubber）。
import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { SCRUB_BIG_STEP, useScrubber } from '../lib/use-scrubber.ts'
import {
  BRUSH_MIN_SPAN,
  brushIndexAt,
  centerWindow,
  clampWindow,
  moveWindow,
  resizeWindow,
  type BrushWindow,
} from './brush-model.ts'
import { DotFill, useDotId } from './chart-kit/dot-fill.tsx'
import { EndMarker } from './chart-kit/end-marker.tsx'
import { LcdTooltip } from './chart-kit/lcd-tooltip.tsx'
import { PlotGrid, PlotYAxis } from './chart-kit/plot-axes.tsx'
import { areaPath, extent, linePath, makePlot, pct, PLOT_W } from './series-geometry.ts'

export type BrushLabels = {
  /** 窗口左端手柄的读屏名。 */
  start: string
  /** 窗口右端手柄的读屏名。 */
  end: string
  /** 窗口整体（平移）的读屏名。 */
  window: string
}

export type BrushStripProps = {
  values: readonly number[]
  window: BrushWindow
  onWindowChange: (window: BrushWindow) => void
  formatX: (index: number) => string
  labels: BrushLabels
  minSpan?: number
  height?: number
  className?: string
}

type Drag = { mode: 'move' | 'start' | 'end'; x: number; width: number; from: BrushWindow }

/** 只有概览条：SeriesExplorer 这类自己画主图的件用它。 */
export function BrushStrip({
  values,
  window,
  onWindowChange,
  formatX,
  labels,
  minSpan = BRUSH_MIN_SPAN,
  height = 40,
  className,
}: BrushStripProps) {
  const count = values.length
  const [drag, setDrag] = useState<Drag | null>(null)
  const plot = makePlot(count, extent(values), { height, padTop: 4, padBottom: 4, exact: true })
  const dotId = useDotId('brush-strip')
  const [start, end] = window

  const begin = (mode: Drag['mode']) => (event: PointerEvent<HTMLElement>) => {
    event.stopPropagation()
    const strip = event.currentTarget.closest('[data-slot="brush-strip"]')!
    event.currentTarget.setPointerCapture(event.pointerId)
    setDrag({ mode, x: event.clientX, width: strip.getBoundingClientRect().width, from: window })
  }
  const move = (event: PointerEvent<HTMLElement>) => {
    if (!drag || !(drag.width > 0)) return
    const points = ((event.clientX - drag.x) / drag.width) * count
    const [from, to] = drag.from
    if (drag.mode === 'move') onWindowChange(moveWindow(drag.from, points, count))
    else if (drag.mode === 'start') onWindowChange(resizeWindow(drag.from, 'start', from + points, count, minSpan))
    else onWindowChange(resizeWindow(drag.from, 'end', to - 1 + points, count, minSpan))
  }
  const stop = () => setDrag(null)
  const key = (target: 'move' | 'start' | 'end') => (event: KeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const unit = event.shiftKey ? SCRUB_BIG_STEP : 1
    const dir = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
    let next: BrushWindow | null = null
    if (target === 'move') {
      if (dir) next = moveWindow(window, dir * unit, count)
      else if (event.key === 'Home') next = moveWindow(window, -count, count)
      else if (event.key === 'End') next = moveWindow(window, count, count)
    } else if (target === 'start') {
      if (dir) next = resizeWindow(window, 'start', start + dir * unit, count, minSpan)
      else if (event.key === 'Home') next = resizeWindow(window, 'start', 0, count, minSpan)
      else if (event.key === 'End') next = resizeWindow(window, 'start', end, count, minSpan)
    } else if (dir) next = resizeWindow(window, 'end', end - 1 + dir * unit, count, minSpan)
    else if (event.key === 'Home') next = resizeWindow(window, 'end', 0, count, minSpan)
    else if (event.key === 'End') next = resizeWindow(window, 'end', count, count, minSpan)
    if (!next) return
    event.preventDefault()
    onWindowChange(next)
  }
  const jump = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    if (!(box.width > 0)) return
    const at = brushIndexAt((event.clientX - box.left) / box.width, count)
    onWindowChange(centerWindow(window, at, count))
  }
  const left = (start / count) * 100
  const width = ((end - start) / count) * 100

  return (
    <div
      className={cn('k-brush-strip', className)}
      data-slot="brush-strip"
      data-dragging={drag ? drag.mode : undefined}
      style={{ height }}
      onPointerDown={jump}
    >
      <svg viewBox={`0 0 ${PLOT_W} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <DotFill id={dotId} color="var(--ink-300)" />
        </defs>
        <path className="k-brush-strip-area" fill={`url(#${dotId})`} d={areaPath(values, plot, plot.domain[0])} />
        <path className="k-brush-strip-line" d={linePath(values, plot)} />
      </svg>
      <div className="k-brush-dim" style={{ left: 0, width: `${left}%` }} />
      <div className="k-brush-dim" style={{ left: `${left + width}%`, right: 0 }} />
      <div
        className="k-brush-window"
        data-slot="brush-window"
        role="slider"
        tabIndex={0}
        aria-label={labels.window}
        aria-valuemin={0}
        aria-valuemax={Math.max(0, count - (end - start))}
        aria-valuenow={start}
        aria-valuetext={`${formatX(start)} – ${formatX(end - 1)}`}
        style={{ left: `${left}%`, width: `${width}%` }}
        onPointerDown={begin('move')}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={stop}
        onKeyDown={key('move')}
      />
      <span
        className="k-brush-handle is-start"
        data-slot="brush-handle-start"
        role="slider"
        tabIndex={0}
        aria-label={labels.start}
        aria-valuemin={0}
        aria-valuemax={end - minSpan}
        aria-valuenow={start}
        aria-valuetext={formatX(start)}
        onPointerDown={begin('start')}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={stop}
        style={{ left: `${left}%` }}
        onKeyDown={key('start')}
      />
      <span
        className="k-brush-handle is-end"
        data-slot="brush-handle-end"
        role="slider"
        tabIndex={0}
        aria-label={labels.end}
        aria-valuemin={start + minSpan - 1}
        aria-valuemax={count - 1}
        aria-valuenow={end - 1}
        aria-valuetext={formatX(end - 1)}
        onPointerDown={begin('end')}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={stop}
        style={{ left: `${left + width}%` }}
        onKeyDown={key('end')}
      />
    </div>
  )
}

export type BrushChartProps = {
  /** 整段序列，从旧到新；主图画窗口里的那段，概览条画全部。 */
  values: readonly number[]
  /** 整张图的读屏名。 */
  label: string
  /** 第几个点写成什么（时间轴刻度与读数都用它）；由调用方定格式。 */
  formatX: (index: number) => string
  formatValue: (value: number) => string
  labels: BrushLabels
  /** 受控窗口；不给就自己管，起点是 defaultWindow 或整段。 */
  window?: BrushWindow
  defaultWindow?: BrushWindow
  onWindowChange?: (window: BrushWindow) => void
  minSpan?: number
  /** 主图高（px）。 */
  height?: number
  /** 概览条高（px）。 */
  brushHeight?: number
  className?: string
}

const X_TICKS = 4

export function BrushChart({
  values,
  label,
  formatX,
  formatValue,
  labels,
  window: controlled,
  defaultWindow,
  onWindowChange,
  minSpan = BRUSH_MIN_SPAN,
  height = 160,
  brushHeight = 40,
  className,
}: BrushChartProps) {
  const count = values.length
  const [inner, setInner] = useState<BrushWindow | undefined>(defaultWindow)
  const window = clampWindow(controlled ?? inner ?? [0, count], count, minSpan)
  const change = (next: BrushWindow) => {
    const clamped = clampWindow(next, count, minSpan)
    if (controlled === undefined) setInner(clamped)
    onWindowChange?.(clamped)
  }
  const slice = values.slice(window[0], window[1])
  const scrub = useScrubber({ count: slice.length })
  const plot = makePlot(slice.length, extent(slice), { height })
  const dotId = useDotId('brush-main')
  const active = scrub.index
  const value = active === null ? null : slice[active]!
  const lastTick = Math.max(0, slice.length - 1)
  const xTicks = Math.min(X_TICKS, slice.length)

  return (
    <figure className={cn('k-brush', className)} data-slot="brush-chart" aria-label={label}>
      <div
        className="k-brush-main"
        style={{ height }}
        data-slot="brush-main"
        {...scrub.props}
        aria-label={label}
        role="group"
      >
        <svg viewBox={`0 0 ${PLOT_W} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <DotFill id={dotId} color="var(--ink-300)" />
          </defs>
          <PlotGrid plot={plot} />
          <path className="k-brush-area" fill={`url(#${dotId})`} d={areaPath(slice, plot, plot.domain[0])} />
          <path className="k-brush-line" data-slot="brush-line" d={linePath(slice, plot)} />
        </svg>
        <PlotYAxis plot={plot} format={formatValue} />
        {slice.length > 0 && (
          <EndMarker
            x={plot.xAt(active ?? lastTick)}
            y={plot.yAt(slice[active ?? lastTick]!)}
            value={active === null ? formatValue(slice[lastTick]!) : undefined}
          />
        )}
        {active !== null && value !== null && (
          <>
            <span className="k-plot-cross" data-slot="brush-cross" style={{ left: pct(plot.xAt(active)) }} />
            <LcdTooltip
              style={{ left: pct(plot.xAt(active)), top: 0 }}
              side={active > lastTick / 2 ? 'left' : 'right'}
              title={formatX(window[0] + active)}
              rows={[{ key: 'v', label, value: formatValue(value) }]}
            />
          </>
        )}
      </div>
      <div className="k-plot-xaxis" aria-hidden="true">
        {Array.from({ length: xTicks }, (_, i) => {
          const at = xTicks === 1 ? 0 : Math.round((i / (xTicks - 1)) * lastTick)
          return (
            <span
              key={at}
              style={{ left: pct(plot.xAt(at)) }}
              data-align={i === 0 ? 'start' : i === xTicks - 1 ? 'end' : 'mid'}
            >
              {formatX(window[0] + at)}
            </span>
          )
        })}
      </div>
      <div className="k-plot-readout" data-slot="brush-readout" aria-live="polite">
        {active !== null && value !== null ? `${formatX(window[0] + active)}  ${formatValue(value)}` : null}
      </div>
      <BrushStrip
        values={values}
        window={window}
        onWindowChange={change}
        formatX={formatX}
        labels={labels}
        minSpan={minSpan}
        height={brushHeight}
      />
    </figure>
  )
}

// SPDX-License-Identifier: MIT
// 权益曲线（组件卡 EquityCurve，design/katana-console components/EquityCurve，2026-10-17 读；#1931 从应用的 panels/kit 搬进来）：
// 上区权益线 2px series-1，基准线 1px 灰虚线；下区镜像回撤面用点阵 / 斜线纹理（读 CSS 变量，见 theme/chart-kit.css），不用实色；
// 末点 signal-orange 旁标最终值；线性 / 对数纵轴；底下一条概览刷选条，拖窗口只看一段；右上三件（表格视图、导出、全屏）。
// 实时刷新：新点追加时权益线与基准线平滑延伸（共用层 lib/live-line.ts），末点滑到新位置并闪一圈光晕；窗口停在最新点时跟着最新点走（宽度不变），用户拖到别处就不动它。回撤面积没有做过场，直接换。
// 横轴是时间（照 TradingView 策略测试器的权益曲线）：点按自己的时刻摆。包里不带语言，文字与数值格式都由调用方传。
import { useRef, useState, type PointerEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { useLineExtend, type LinePoint } from '../lib/live-line.ts'
import { useValueFlash } from '../lib/live.ts'
import { useScrubber } from '../lib/use-scrubber.ts'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import { BrushStrip, type BrushLabels } from './brush-chart.tsx'
import { clampWindow, type BrushWindow } from './brush-model.ts'
import { ChartActions, type ChartActionsLabels } from './chart-kit/chart-actions.tsx'
import { DotFill, useDotId } from './chart-kit/dot-fill.tsx'
import { EndMarker } from './chart-kit/end-marker.tsx'
import { LcdTooltip } from './chart-kit/lcd-tooltip.tsx'
import { PlotGrid, PlotYAxis } from './chart-kit/plot-axes.tsx'
import { canLog, defaultTimeTicks, drawdownY, equityPlot, timeX, type EquityScale } from './equity-curve-model.ts'
import { linePath, pct, PLOT_W } from './series-geometry.ts'

export type EquityCurvePoint = {
  /** 这一点的时刻（毫秒）：横轴按它摆。 */
  time: number
  equity: number
  /** 离此前高点的距离，≤ 0。 */
  drawdown: number
  /** 提示窗第一行（序号与时刻）。 */
  title: string
  /** 已按币种位数格式化的文字；组件不格式化数值。 */
  equityText: string
  drawdownText: string
}

export type EquityCurveLabels = {
  /** 回撤的名字（图例、提示窗、表头）。 */
  drawdown: string
  /** 表格视图的列头：时刻。 */
  time: string
  scale: { group: string; linear: string; log: string }
  brush: BrushLabels
  actions: ChartActionsLabels
}

export type EquityCurveProps = {
  points: readonly EquityCurvePoint[]
  /** 标题：一行只写名字，后面跟图例。 */
  title: string
  /** 口径与读法，放在标题的悬停提示里，不占一行。 */
  hint?: string
  /** 上区那条线叫什么（图例与提示窗：权益 / 净盈亏）。 */
  name: string
  /** 基准线：与 points 一一对应的数值；不给就不画。 */
  benchmark?: { name: string; values: readonly number[] }
  /** 整张图的读屏名。 */
  label: string
  /** 纵轴刻度与基准读数的写法（按币种位数）。 */
  axis: (value: number) => string
  /** 横轴刻度：宿主按自己的时区与密度给（整点、整日）；不给就在窗口里均分 5 个，用 formatTime 写。 */
  xTicks?: (start: number, end: number) => readonly { time: number; label: string }[]
  formatTime: (time: number) => string
  labels: EquityCurveLabels
  /** 窗口变了（拖概览条）：给宿主把别的东西（成交表）跟着窗口筛。 */
  onWindowChange?: (window: BrushWindow) => void
  onExport?: () => void
  onFullscreen?: () => void
  /** 来源与口径行（读自哪里、几点的数）。 */
  source?: string
  className?: string
}

const EQUITY_H = 128
const DRAWDOWN_H = 56
const PAD = { top: 10, bottom: 6 }

/** 坐标写成路径（M…L…），位数与 linePath 一样。 */
const pathText = (points: readonly LinePoint[]) =>
  points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join('')

/** 一条会延伸的线：d 仍由调用方按 linePath 给（断开的线也照旧），新点追加时在属性上做过场。 */
function ExtendingLine({
  d,
  values,
  coords,
  className,
  slot,
}: {
  d: string
  values: readonly number[]
  coords: readonly LinePoint[]
  className: string
  slot: string
}) {
  const ref = useRef<SVGPathElement>(null)
  useLineExtend(ref, 'd', values, coords, pathText)
  return <path ref={ref} className={className} data-slot={slot} d={d} />
}

export function EquityCurve({
  points,
  title,
  hint,
  name,
  benchmark,
  label,
  axis,
  xTicks,
  formatTime,
  labels,
  onWindowChange,
  onExport,
  onFullscreen,
  source,
  className,
}: EquityCurveProps) {
  const total = points.length
  const [scale, setScale] = useState<EquityScale>('linear')
  const [windowState, setWindow] = useState<BrushWindow | null>(null)
  const [table, setTable] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const dotId = useDotId('equity-dd')
  // 窗口的右端贴着最新点时，新点来了窗口跟着走（宽度不变）；渲染时调整状态，免得先画一帧旧窗口。
  const [seenTotal, setSeenTotal] = useState(total)
  if (total !== seenTotal) {
    setSeenTotal(total)
    if (windowState && total > seenTotal && windowState[1] >= seenTotal)
      setWindow([windowState[0] + (total - seenTotal), total])
  }
  const endFlash = useValueFlash(points[total - 1]?.equity)
  const window = clampWindow(windowState ?? [0, total], total, 2)
  const shown = points.slice(window[0], window[1])
  const count = shown.length
  const scrub = useScrubber({ count, index: hover, onIndexChange: setHover })
  if (total === 0 || count === 0) return null

  const equities = shown.map((point) => point.equity)
  const bench = benchmark === undefined ? null : benchmark.values.slice(window[0], window[1])
  const logOk = canLog([...equities, ...(bench ?? [])])
  const mode: EquityScale = scale === 'log' && logOk ? 'log' : 'linear'
  const start = shown[0]!.time
  const end = shown[count - 1]!.time
  const xAt = (index: number) => timeX(shown[index]!.time, start, end)
  const plot = equityPlot([...equities, ...(bench ?? [])], mode, EQUITY_H, PAD, xAt)
  const deepest = Math.min(0, ...shown.map((point) => point.drawdown))
  const deepestPoint = shown.find((point) => point.drawdown === deepest)!
  const zeroY = 4
  const ddY = (value: number) => drawdownY(value, deepest, DRAWDOWN_H - 6, zeroY)
  const ddLine = shown.map((point, index) => `${index === 0 ? 'M' : 'L'}${xAt(index)},${ddY(point.drawdown)}`).join('')
  const ddArea = deepest === 0 ? '' : `${ddLine}L${xAt(count - 1)},${zeroY}L${xAt(0)},${zeroY}Z`
  const active = scrub.index
  const lastIndex = count - 1
  const marked = shown[active ?? lastIndex]!
  const lineCoords = equities.map((value, index) => [plot.xAt(index), plot.yAt(value)] as const)
  const benchCoords = (bench ?? []).map((value, index) => [plot.xAt(index), plot.yAt(value)] as const)
  const ticks = (xTicks ?? ((a, b) => defaultTimeTicks(a, b, 5, formatTime)))(start, end)

  // 悬停取横向最近的点（点不等距，不能按格数换算）；同一时刻的几笔取最后那笔。
  const move = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    if (!(box.width > 0)) return
    const at = ((event.clientX - box.left) / box.width) * PLOT_W
    let nearest = 0
    for (let index = 1; index < count; index++)
      if (Math.abs(xAt(index) - at) <= Math.abs(xAt(nearest) - at)) nearest = index
    setHover(nearest)
  }
  const change = (next: BrushWindow) => {
    setWindow(next)
    setHover(null)
    onWindowChange?.(next)
  }

  return (
    <figure className={cn('k-eq', className)} data-slot="equity-curve" data-scale={mode}>
      <div className="k-eq-head">
        <h4 className="k-eq-title" title={hint}>
          {title}
        </h4>
        <span className="k-eq-key" aria-hidden="true">
          <i className="k-eq-key-line" />
          {name}
        </span>
        {benchmark && (
          <span className="k-eq-key" aria-hidden="true">
            <i className="k-eq-key-bench" />
            {benchmark.name}
          </span>
        )}
        <span className="k-eq-key" aria-hidden="true">
          <i className="k-eq-key-dd" />
          {labels.drawdown}
        </span>
        <ToggleGroup
          size="sm"
          className="k-eq-scale"
          aria-label={labels.scale.group}
          value={mode}
          onValueChange={(next) => setScale(next === 'log' ? 'log' : 'linear')}
        >
          <ToggleGroupItem value="linear">{labels.scale.linear}</ToggleGroupItem>
          <ToggleGroupItem value="log" disabled={!logOk}>
            {labels.scale.log}
          </ToggleGroupItem>
        </ToggleGroup>
        <ChartActions
          labels={labels.actions}
          tableView={table}
          onTableView={setTable}
          onExport={onExport}
          onFullscreen={onFullscreen}
        />
      </div>

      {table ? (
        <div className="k-eq-table" tabIndex={0} role="region" aria-label={label} data-slot="equity-table">
          <table>
            <thead>
              <tr>
                <th scope="col">{labels.time}</th>
                <th scope="col">{name}</th>
                {benchmark && <th scope="col">{benchmark.name}</th>}
                <th scope="col">{labels.drawdown}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((point, index) => (
                <tr key={`${point.time}-${index}`}>
                  <th scope="row">{point.title}</th>
                  <td>{point.equityText}</td>
                  {bench && <td>{axis(bench[index]!)}</td>}
                  <td>{point.drawdownText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="k-eq-body">
          <div
            className="k-eq-main"
            style={{ height: EQUITY_H }}
            role="slider"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={lastIndex}
            aria-valuenow={active ?? lastIndex}
            aria-valuetext={`${marked.title}  ${marked.equityText}`}
            data-slot="equity-main"
            tabIndex={0}
            onPointerMove={move}
            onPointerLeave={scrub.pointer.onPointerLeave}
            onKeyDown={scrub.keys.onKeyDown}
            onBlur={scrub.keys.onBlur}
          >
            <svg viewBox={`0 0 ${PLOT_W} ${EQUITY_H}`} preserveAspectRatio="none" aria-hidden="true">
              <PlotGrid plot={plot} />
              {bench && (
                <ExtendingLine
                  className="k-eq-bench"
                  slot="equity-bench"
                  d={linePath(bench, plot)}
                  values={bench}
                  coords={benchCoords}
                />
              )}
              <ExtendingLine
                className="k-eq-line"
                slot="equity-line"
                d={linePath(equities, plot)}
                values={equities}
                coords={lineCoords}
              />
            </svg>
            <PlotYAxis plot={plot} format={axis} />
            <EndMarker
              x={plot.xAt(active ?? lastIndex)}
              y={plot.yAt(marked.equity)}
              side={(active ?? lastIndex) > count / 2 ? 'left' : 'right'}
              value={active === null ? marked.equityText : undefined}
              // 跟着最新点时末点随线滑到新位置（和线的延伸同一档时长）；悬停看历史时不滑，免得拖影。
              style={
                active === null
                  ? {
                      transition:
                        'left var(--dur-reorder) var(--ease-snappy), top var(--dur-reorder) var(--ease-snappy)',
                    }
                  : undefined
              }
              flash={active === null ? endFlash : undefined}
            />
            {active !== null && (
              <>
                <span className="k-plot-cross" data-slot="equity-cross" style={{ left: pct(xAt(active)) }} />
                <LcdTooltip
                  style={{ left: pct(xAt(active)), top: 0 }}
                  side={active > count / 2 ? 'left' : 'right'}
                  title={marked.title}
                  rows={[
                    { key: 'equity', label: name, value: marked.equityText },
                    ...(bench ? [{ key: 'bench', label: benchmark!.name, value: axis(bench[active]!) }] : []),
                    { key: 'dd', label: labels.drawdown, value: marked.drawdownText },
                  ]}
                />
              </>
            )}
          </div>
          <div className="k-eq-dd" style={{ height: DRAWDOWN_H }} data-slot="equity-drawdown" aria-hidden="true">
            <svg viewBox={`0 0 ${PLOT_W} ${DRAWDOWN_H}`} preserveAspectRatio="none">
              <defs>
                <DotFill id={dotId} color="color-mix(in srgb, var(--pnl-down) 60%, transparent)" />
              </defs>
              <line className="k-ck-grid" x1={0} x2={PLOT_W} y1={zeroY} y2={zeroY} />
              {ddArea && (
                <path className="k-eq-dd-area" data-slot="equity-dd-area" d={ddArea} fill={`url(#${dotId})`} />
              )}
            </svg>
            <span className="k-ck-ytick" style={{ top: zeroY }}>
              0
            </span>
            {deepest !== 0 && (
              <span className="k-ck-ytick" style={{ top: ddY(deepest) }}>
                {deepestPoint.drawdownText}
              </span>
            )}
          </div>
          <div className="k-plot-xaxis k-eq-xaxis" aria-hidden="true">
            {ticks.map((tick, index) => (
              <span
                key={tick.time}
                style={{ left: pct(timeX(tick.time, start, end)) }}
                data-align={index === 0 ? 'start' : index === ticks.length - 1 ? 'end' : 'mid'}
              >
                {tick.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <BrushStrip
        values={points.map((point) => point.equity)}
        window={window}
        onWindowChange={change}
        formatX={(index) => points[index]!.title}
        labels={labels.brush}
        minSpan={2}
        height={40}
      />
      {source && (
        <figcaption className="k-eq-source" data-slot="equity-source">
          {source}
        </figcaption>
      )}
    </figure>
  )
}

// SPDX-License-Identifier: MIT
// 序列探索积木：区间按钮、三张 KPI 卡（值 加 相对上一期的变化，数字滚动）、序列开关、「对比上一期」开关、堆叠柱加净值线、下面的刷选条、明细表。
// 功能参照 Arc 的 Revenue explorer（uiarc.dev/components/blocks/revenue-explorer，2026-11-14 读，只取页面写出的功能与交互），实现原创，外观照我们的 token。
// 我们的用法：盈亏探索（已实现 / 手续费 / 资金费 堆叠，净盈亏与权益是线）。#1908 的 KPI Chart 直接拼这里的 BrushStrip 与 useScrubber。
// 决定（Arc 的页面没写，照同类产品定）：
//   默认区间是 ranges 里最后一个（惯例是「全部」排最后）；拖刷选条改窗口后区间按钮不再亮（窗口已不是那个区间），再点区间按钮回到它。
//   「对比上一期」画紧挨在窗口前面、一样长的那一段的第一条折线，按下标对齐，用虚线；前面没有足够的点就不画，开关禁用。
//   KPI 的变化是 (这期 - 上期) / |上期|，上期没有或为 0 写破折号；只有一个有值的点都没有的 KPI 写破折号。
import { useState } from 'react'
import { cn } from '../../lib/cn'
import { useScrubber } from '../../lib/use-scrubber'
import { RollingText } from '../../katana/rolling-text'
import { Switch } from '../../primitives/switch'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group'
import { BrushStrip, type BrushLabels } from '../../quant/brush-chart'
import { clampWindow, type BrushWindow } from '../../quant/brush-model'
import { linePath, makePlot, pct, PLOT_W } from '../../quant/series-geometry'
import {
  changeRatio,
  chartExtent,
  pointValue,
  previousWindow,
  rangeWindow,
  reduceWindow,
  stackPoint,
  type KpiDef,
  type RangeDef,
  type SeriesDef,
  type SeriesPoint,
} from './series-explorer-model'

export type SeriesExplorerColumn = {
  key: string
  label: string
  /** 这一行这一格写什么字。 */
  text: (point: SeriesPoint) => string
  /** 给了就按正负着涨跌色（盈亏列）；不给中性色。 */
  tone?: (point: SeriesPoint) => number | null
}

export type SeriesExplorerLabels = {
  /** 图的读屏名。 */
  chart: string
  /** 区间按钮那一组的读屏名。 */
  ranges: string
  /** 序列开关那一组的读屏名。 */
  series: string
  /** 「对比上一期」开关的字。 */
  compare: string
  /** 悬停框里上一期那一行的名字。 */
  previous: string
  /** 明细表的读屏名。 */
  table: string
  /** 明细表第一列（时间）的表头。 */
  time: string
  /** 一个点都没有时写的字。 */
  empty: string
  brush: BrushLabels
}

export type SeriesExplorerProps = {
  points: readonly SeriesPoint[]
  series: readonly SeriesDef[]
  ranges: readonly RangeDef[]
  /** 不给取 ranges 的最后一个。 */
  defaultRange?: string
  /** 三张 KPI 卡（多了少了也行，版面按个数排）。 */
  kpis: readonly KpiDef[]
  columns: readonly SeriesExplorerColumn[]
  labels: SeriesExplorerLabels
  /** 时间戳写成什么：横轴、悬停框、明细表第一列都用它；时区与语言由调用方定。 */
  formatAt: (at: number) => string
  /** 图上的数写成什么：纵轴刻度与悬停框。 */
  formatValue: (value: number) => string
  /** 相对上一期的变化（比例，0.12 是涨 12%）写成什么。 */
  formatChange: (ratio: number) => string
  /** 图高（px）。 */
  chartHeight?: number
  className?: string
}

const X_TICKS = 5
/** 柱宽占一格的比例（待定：没有出处，同 WaterfallChart 的取值）。 */
const BAR_SHARE = 0.6
const SERIES_COLORS = [
  'var(--series-1)',
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)',
  'var(--series-6)',
  'var(--series-7)',
]
const colorOf = (series: SeriesDef, index: number) => series.color ?? SERIES_COLORS[index % SERIES_COLORS.length]!
const toneOf = (value: number | null) => (value === null || value === 0 ? 'flat' : value > 0 ? 'up' : 'down')

export function SeriesExplorer({
  points,
  series,
  ranges,
  defaultRange,
  kpis,
  columns,
  labels,
  formatAt,
  formatValue,
  formatChange,
  chartHeight = 220,
  className,
}: SeriesExplorerProps) {
  const [rangeKey, setRangeKey] = useState(defaultRange ?? ranges[ranges.length - 1]?.key ?? '')
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set())
  const [compare, setCompare] = useState(false)
  // 拖刷选条得到的窗口，记着是在哪个区间下拖的：换区间就作废（渲染时推导，不走 effect）。
  const [dragged, setDragged] = useState<{ range: string; window: BrushWindow } | null>(null)
  const count = points.length
  const range = ranges.find((item) => item.key === rangeKey)
  const base = rangeWindow(points, range?.months ?? null)
  const window = dragged !== null && dragged.range === rangeKey ? clampWindow(dragged.window, count) : base
  const length = window[1] - window[0]
  const previous = previousWindow(window)
  const shown = points.slice(window[0], window[1])

  const visible = series.filter((item) => !hidden.has(item.key))
  const barKeys = visible.filter((item) => item.kind === 'bar').map((item) => item.key)
  const lines = visible.filter((item) => item.kind === 'line')
  const compareKey = lines[0]?.key ?? null
  const comparing = compare && previous !== null && compareKey !== null
  const ghost = comparing
    ? points.slice(previous[0], previous[1]).map((point) => pointValue(point, compareKey) ?? Number.NaN)
    : []
  const scrub = useScrubber({ count: length, mode: 'band' })
  const active = scrub.index
  const plot = makePlot(
    length,
    chartExtent(
      points,
      window,
      barKeys,
      lines.map((item) => item.key),
      ghost,
    ),
    {
      height: chartHeight,
      band: true,
    },
  )
  const barWidth = plot.step * BAR_SHARE
  const overviewKey = (lines[0] ?? series.find((item) => item.kind === 'line'))?.key
  const overview = points.map((point) =>
    overviewKey === undefined ? Number.NaN : (pointValue(point, overviewKey) ?? Number.NaN),
  )
  const xTicks = Math.min(X_TICKS, length)
  const activePoint = active === null ? null : shown[active]!
  // 明细表最新的在最上面。
  const rows = shown.map((point, i) => ({ point, i })).reverse()

  if (count === 0)
    return (
      <div className={cn('k-sx', className)} data-slot="series-explorer" data-empty="true">
        <p className="k-sx-empty">{labels.empty}</p>
      </div>
    )

  return (
    <div className={cn('k-sx', className)} data-slot="series-explorer" data-range={rangeKey}>
      <div className="k-sx-bar">
        <ToggleGroup
          variant="sm"
          aria-label={labels.ranges}
          value={dragged !== null && dragged.range === rangeKey ? null : rangeKey}
          onValueChange={(next) => {
            setRangeKey(next)
            setDragged(null)
          }}
        >
          {ranges.map((item) => (
            <ToggleGroupItem key={item.key} value={item.key}>
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <label className="k-sx-compare">
          <Switch
            checked={comparing}
            disabled={previous === null || compareKey === null}
            onCheckedChange={setCompare}
            aria-label={labels.compare}
          />
          <span>{labels.compare}</span>
        </label>
      </div>

      <div className="k-sx-kpis" data-slot="series-kpis">
        {kpis.map((kpi) => {
          const current = reduceWindow(points, window, kpi.series, kpi.reduce)
          const before = previous === null ? null : reduceWindow(points, previous, kpi.series, kpi.reduce)
          const ratio = changeRatio(current, before)
          return (
            <div key={kpi.key} className="k-sx-kpi" data-slot="series-kpi" data-key={kpi.key}>
              <span className="k-sx-kpi-label">{kpi.label}</span>
              <span className="k-sx-kpi-value" data-slot="series-kpi-value">
                {current === null ? '—' : <RollingText text={kpi.format(current)} value={current} animate />}
              </span>
              <span className="k-sx-kpi-change" data-slot="series-kpi-change" data-tone={toneOf(ratio)}>
                {ratio === null ? '—' : formatChange(ratio)}
              </span>
            </div>
          )
        })}
      </div>

      <div className="k-sx-chips" role="group" aria-label={labels.series}>
        {series.map((item, index) => (
          <button
            key={item.key}
            type="button"
            className="k-sx-chip"
            data-slot="series-chip"
            data-key={item.key}
            aria-pressed={!hidden.has(item.key)}
            onClick={() =>
              setHidden((current) => {
                const next = new Set(current)
                if (!next.delete(item.key)) next.add(item.key)
                return next
              })
            }
          >
            <i style={{ background: colorOf(item, index) }} />
            {item.label}
          </button>
        ))}
      </div>

      <div
        className="k-sx-chart"
        style={{ height: chartHeight }}
        role="group"
        aria-label={labels.chart}
        data-slot="series-chart"
        {...scrub.props}
      >
        <svg viewBox={`0 0 ${PLOT_W} ${chartHeight}`} preserveAspectRatio="none" aria-hidden="true">
          {plot.ticks.map((tick) => (
            <line key={tick.value} className="k-plot-grid" x1={0} x2={PLOT_W} y1={tick.y} y2={tick.y} />
          ))}
          <line className="k-wf-zero" x1={0} x2={PLOT_W} y1={plot.yAt(0)} y2={plot.yAt(0)} />
          {shown.map((point, i) =>
            stackPoint(point, barKeys).map((segment) => {
              const top = Math.min(plot.yAt(segment.from), plot.yAt(segment.to))
              const bottom = Math.max(plot.yAt(segment.from), plot.yAt(segment.to))
              const index = series.findIndex((item) => item.key === segment.key)
              return (
                <rect
                  key={`${point.at}-${segment.key}`}
                  className="k-sx-bar-rect"
                  data-slot="series-bar"
                  data-series={segment.key}
                  data-index={i}
                  data-active={active === i ? 'true' : undefined}
                  style={{ fill: colorOf(series[index]!, index) }}
                  x={plot.xAt(i) - barWidth / 2}
                  y={top}
                  width={barWidth}
                  height={Math.max(0.5, bottom - top)}
                />
              )
            }),
          )}
          {comparing && <path className="k-sx-ghost" data-slot="series-compare" d={linePath(ghost, plot)} />}
          {lines.map((item) => {
            const index = series.findIndex((entry) => entry.key === item.key)
            return (
              <path
                key={item.key}
                className="k-sx-line"
                data-slot="series-line"
                data-series={item.key}
                style={{ stroke: colorOf(item, index) }}
                d={linePath(
                  shown.map((point) => pointValue(point, item.key) ?? Number.NaN),
                  plot,
                )}
              />
            )
          })}
        </svg>
        {plot.ticks.map((tick) => (
          <span key={tick.value} className="k-plot-ytick" style={{ top: tick.y }}>
            {formatValue(tick.value)}
          </span>
        ))}
        {active !== null && activePoint !== null && (
          <>
            <span className="k-plot-cross" data-slot="series-cross" style={{ left: pct(plot.xAt(active)) }} />
            <div
              className="k-sx-tip"
              data-slot="series-tip"
              data-side={active > length / 2 ? 'left' : 'right'}
              style={{ left: pct(plot.xAt(active)) }}
            >
              <strong>{formatAt(activePoint.at)}</strong>
              {visible.map((item) => {
                const index = series.findIndex((entry) => entry.key === item.key)
                const value = pointValue(activePoint, item.key)
                return (
                  <span key={item.key} className="k-sx-tip-row" data-series={item.key}>
                    <i style={{ background: colorOf(item, index) }} />
                    {item.label}
                    <b>{value === null ? '—' : formatValue(value)}</b>
                  </span>
                )
              })}
              {comparing && (
                <span className="k-sx-tip-row" data-slot="series-tip-previous">
                  {labels.previous}
                  <b>{Number.isFinite(ghost[active]) ? formatValue(ghost[active]!) : '—'}</b>
                </span>
              )}
            </div>
          </>
        )}
      </div>
      <div className="k-plot-xaxis" aria-hidden="true">
        {Array.from({ length: xTicks }, (_, i) => {
          const at = xTicks === 1 ? 0 : Math.round((i / (xTicks - 1)) * (length - 1))
          return (
            <span
              key={at}
              style={{ left: pct(plot.xAt(at)) }}
              data-align={i === 0 ? 'start' : i === xTicks - 1 ? 'end' : 'mid'}
            >
              {formatAt(shown[at]!.at)}
            </span>
          )
        })}
      </div>

      <BrushStrip
        values={overview}
        window={window}
        onWindowChange={(next) => setDragged({ range: rangeKey, window: next })}
        formatX={(index) => formatAt(points[index]!.at)}
        labels={labels.brush}
        height={44}
      />

      <div className="k-sx-table" tabIndex={0} role="region" aria-label={labels.table} data-slot="series-table">
        <table>
          <thead>
            <tr>
              <th scope="col">{labels.time}</th>
              {columns.map((column) => (
                <th key={column.key} scope="col">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ point, i }) => (
              <tr key={point.at} data-active={active === i ? 'true' : undefined}>
                <th scope="row">{formatAt(point.at)}</th>
                {columns.map((column) => (
                  <td key={column.key} data-tone={column.tone ? toneOf(column.tone(point)) : undefined}>
                    {column.text(point)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

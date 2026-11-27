// SPDX-License-Identifier: MIT
/**
 * IntradaySeries: minute series on the A-share session axis (09:30–15:00, optional 09:15 auction), the lunch break squeezed to a thin seam.
 * Series share one X axis; those with different units go on a left or a right value axis. A dashed "same time yesterday" line can sit behind each line.
 * One crosshair reads every series at once; a missing minute leaves a gap (the line is never drawn through it).
 * 盘中分钟线（#260，KATANAview#2164 的「盘中分钟线」原型件：市场温度、炸板率、涨跌家数趋势、昨日涨停 / 连板 / 破板的分时表现与量能）。
 * 时段轴复用 session.ts（09:15–15:00，午休压成一道细缝）；多序列共用 X 轴，单位不同分左右两轴；十字光标读全部序列（鼠标移动，或聚焦后 ← → 一格、Shift 三格、Home / End、Esc）。
 * 数据与文字都由调用方传：包里不带数据源、不带交易日历、不带语言（labels 的默认是英文）。图画在 viewBox 里，文字、十字线与悬停窗是叠上去的 HTML（同 DerivativesCard）。
 * 颜色：序列用 series-1..7 按顺序（折进「其他」的规则同 assignSeries）；昨日同时段是同色虚线、淡一档。涨跌色不上线（线是名字，不是涨跌）。
 */
import { useState, type CSSProperties, type PointerEvent } from 'react'
import { LcdTooltip, type LcdTooltipRow } from '../lib/chart/chart-kit/lcd-tooltip.tsx'
import { assignSeries } from '../lib/chart/chart-kit/series-colors.ts'
import { PLOT_W } from '../lib/chart/series-geometry.ts'
import { cn } from '../lib/cn.ts'
import { useScrubber } from '../lib/use-scrubber.ts'
import { formatClock } from './session.ts'
import {
  intradayAxis,
  intradayPath,
  intradayPoints,
  intradayRuns,
  intradaySeams,
  intradayTicks,
  intradayTimes,
  intradayX,
  intradayY,
  nearestTimeIndex,
  valueAtMinute,
  type IntradayPoint,
} from './intraday-series-model.ts'

export type { IntradayPoint } from './intraday-series-model.ts'

/** One series of the chart. */
export type IntradaySeriesItem = {
  /** Stable key (also decides the color: series-1.. in the order given). */
  key: string
  /** Name in the legend and the crosshair window. */
  name: string
  /** Minute points of today. */
  points: readonly IntradayPoint[]
  /** The same period yesterday, drawn as a dashed line (lines only); omit for none. 昨日同时段，画成虚线（只有折线用）。 */
  previous?: readonly IntradayPoint[]
  /** Which value axis: left (default) or right. Give series of different units different sides. 画在哪条值轴：默认左；单位不同的放右。 */
  axis?: 'left' | 'right'
  /** line (default) or bar (volume, counts per minute; the axis then includes 0). */
  kind?: 'line' | 'bar'
  /** How a value of this series is written in the legend and the crosshair window; defaults to String(value). */
  format?: (value: number) => string
}

/** Texts of IntradaySeries (the package ships no text; the defaults are English). */
export type IntradaySeriesLabels = {
  /** Shown when there is nothing to draw. */
  empty: string
  /** Name of the dashed line of a series ("Limit-ups · yesterday"). */
  previous: (name: string) => string
  /** Written where a value is missing. */
  missing: string
  /** Accessible name of the plot: the chart name plus the latest values. */
  plotAria: (label: string, latest: string) => string
}

export const defaultIntradayLabels: IntradaySeriesLabels = {
  empty: 'No data',
  previous: (name) => `${name} · yesterday`,
  missing: '—',
  plotAria: (label, latest) => `${label}. ${latest}`,
}

export type IntradaySeriesProps = {
  /** Series to draw; they share the time axis. */
  series: readonly IntradaySeriesItem[]
  /** Accessible name of the whole chart (a full sentence). */
  label: string
  /** Draw the call auction (09:15–09:25) before the open; default false, the axis starts at 09:30. */
  auction?: boolean
  /**
   * Largest gap in trading minutes between two points that is still joined by a line: 1 (default) leaves a gap at any missing minute; give 5 for five-minute data.
   * 两点之间隔几个交易分钟还连线：默认 1，缺一分钟就留空；5 分钟线给 5。
   */
  gapMinutes?: number
  /** Plot height in px; 200 by default. */
  height?: number
  /** Tick text of the left value axis; defaults to the first left series' format. */
  formatLeft?: (value: number) => string
  /** Tick text of the right value axis; defaults to the first right series' format. */
  formatRight?: (value: number) => string
  /** Texts; English defaults. */
  labels?: Partial<IntradaySeriesLabels>
  /** Extra class names. */
  className?: string
}

const PAD = 6
const asText = (value: number) => String(value)

export function IntradaySeries({
  series,
  label,
  auction = false,
  gapMinutes = 1,
  height = 200,
  formatLeft,
  formatRight,
  labels: labelsProp,
  className,
}: IntradaySeriesProps) {
  const labels = { ...defaultIntradayLabels, ...labelsProp }
  const axisOptions = { auction }
  const colors = assignSeries(series.map((item) => item.key))
  const rows = series.map((item) => ({
    item,
    side: item.axis === 'right' ? ('right' as const) : ('left' as const),
    bar: item.kind === 'bar',
    today: intradayPoints(item.points, axisOptions),
    previous: item.kind === 'bar' || !item.previous ? [] : intradayPoints(item.previous, axisOptions),
  }))
  const axisOf = (side: 'left' | 'right') => {
    const group = rows.filter((row) => row.side === side)
    const values = group.flatMap((row) =>
      [...row.today, ...row.previous].flatMap((point) => (point.value === null ? [] : [point.value])),
    )
    return {
      axis: intradayAxis(values, { includeZero: group.some((row) => row.bar) }),
      format: (side === 'left' ? formatLeft : formatRight) ?? group[0]?.item.format ?? asText,
    }
  }
  const left = axisOf('left')
  const right = axisOf('right')
  const times = intradayTimes(...rows.flatMap((row) => [row.today, row.previous]))
  const drawable = rows.some((row) => row.today.some((point) => point.value !== null))
  const [index, setIndex] = useState<number | null>(null)
  const scrub = useScrubber({ count: times.length, index, onIndexChange: setIndex })

  if (!drawable) {
    return (
      <div
        className={cn('k-isr', className)}
        data-slot="intraday-series"
        data-empty="true"
        role="group"
        aria-label={label}
      >
        <p className="k-isr-empty" role="status" style={{ minHeight: height }}>
          {labels.empty}
        </p>
      </div>
    )
  }

  const domainOf = (side: 'left' | 'right') => (side === 'left' ? left.axis : right.axis) ?? left.axis ?? right.axis!
  const writeOf = (side: 'left' | 'right') => (side === 'left' ? left : right)
  const lastOf = (points: ReturnType<typeof intradayPoints>) =>
    points.findLast((point) => point.value !== null)?.value ?? null
  const text = (item: IntradaySeriesItem, value: number | null) =>
    value === null ? labels.missing : (item.format ?? asText)(value)
  const latest = rows.map((row) => `${row.item.name} ${text(row.item, lastOf(row.today))}`).join(', ')
  const grid = (left.axis ?? right.axis)!
  const active = index === null ? null : (times[index] ?? null)
  const activeX = active === null ? null : intradayX(active, axisOptions)
  const tipRows: (LcdTooltipRow & { value: string })[] =
    active === null
      ? []
      : rows.flatMap((row) => {
          const base: LcdTooltipRow & { value: string } = {
            key: row.item.key,
            label: row.item.name,
            value: text(row.item, valueAtMinute(row.today, active)),
            swatch: colors[row.item.key],
          }
          return row.previous.length
            ? [
                base,
                {
                  key: `${row.item.key}:previous`,
                  label: labels.previous(row.item.name),
                  value: text(row.item, valueAtMinute(row.previous, active)),
                  swatch: colors[row.item.key],
                },
              ]
            : [base]
        })
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    if (!(box.width > 0)) return
    const next = nearestTimeIndex(times, (event.clientX - box.left) / box.width, axisOptions)
    if (next !== null && next !== index) setIndex(next)
  }

  return (
    <div className={cn('k-isr', className)} data-slot="intraday-series" role="group" aria-label={label}>
      <ul className="k-isr-legend" data-slot="intraday-legend">
        {rows.map((row) => (
          <li
            key={row.item.key}
            className="k-isr-legend-item"
            style={{ '--k-isr-color': colors[row.item.key] } as CSSProperties}
          >
            <i className="k-isr-key" data-shape={row.bar ? 'bar' : 'line'} />
            <span className="k-isr-name">{row.item.name}</span>
            <span className="k-isr-latest">{text(row.item, lastOf(row.today))}</span>
            {row.previous.length > 0 && (
              <span className="k-isr-prev-key" title={labels.previous(row.item.name)} data-slot="intraday-previous-key">
                <i className="k-isr-key" data-shape="dash" />
                <span className="sr-only">{labels.previous(row.item.name)}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
      <div
        className="k-isr-plot"
        data-slot="intraday-plot"
        data-right={right.axis ? '' : undefined}
        data-active={active === null ? undefined : formatClock(active)}
        style={{ height }}
        role="group"
        aria-label={labels.plotAria(label, latest)}
        {...scrub.keys}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setIndex(null)}
      >
        <svg viewBox={`0 0 ${PLOT_W} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          {grid.ticks.map((tick) => {
            const y = intradayY(tick, grid.domain, height, PAD)
            return <line key={tick} className="k-ck-grid" x1={0} x2={PLOT_W} y1={y} y2={y} />
          })}
          {intradaySeams(axisOptions).map((seam) => (
            <rect
              key={seam.from}
              className="k-isr-seam"
              data-slot="intraday-seam"
              x={seam.from * PLOT_W}
              width={(seam.to - seam.from) * PLOT_W}
              y={0}
              height={height}
            />
          ))}
          {rows.map((row) => {
            const axis = domainOf(row.side)
            const style = { '--k-isr-color': colors[row.item.key] } as CSSProperties
            if (row.bar) {
              const zero = intradayY(Math.max(0, axis.domain[0]), axis.domain, height, PAD)
              return (
                <g
                  key={row.item.key}
                  className="k-isr-bars"
                  data-slot="intraday-bars"
                  data-key={row.item.key}
                  style={style}
                >
                  {row.today.flatMap((point) => {
                    if (point.value === null) return []
                    const y = intradayY(point.value, axis.domain, height, PAD)
                    return [
                      <rect
                        key={point.minutes}
                        x={point.x * PLOT_W - 1.5}
                        width={3}
                        y={Math.min(y, zero)}
                        height={Math.max(1, Math.abs(zero - y))}
                      />,
                    ]
                  })}
                </g>
              )
            }
            return (
              <g key={row.item.key} style={style}>
                {row.previous.length > 0 && (
                  <path
                    className="k-isr-line"
                    data-slot="intraday-previous"
                    data-key={row.item.key}
                    data-dashed=""
                    d={intradayPath(intradayRuns(row.previous, gapMinutes), axis.domain, PLOT_W, height, PAD)}
                  />
                )}
                <path
                  className="k-isr-line"
                  data-slot="intraday-line"
                  data-key={row.item.key}
                  d={intradayPath(intradayRuns(row.today, gapMinutes), axis.domain, PLOT_W, height, PAD)}
                />
              </g>
            )
          })}
        </svg>
        {left.axis?.ticks.map((tick) => (
          <span
            key={tick}
            className="k-ck-ytick"
            data-slot="intraday-ytick"
            style={{ top: Math.round(intradayY(tick, left.axis!.domain, height, PAD)) }}
          >
            {left.format(tick)}
          </span>
        ))}
        {right.axis?.ticks.map((tick) => (
          <span
            key={tick}
            className="k-isr-rtick"
            data-slot="intraday-rtick"
            style={{ top: Math.round(intradayY(tick, right.axis!.domain, height, PAD)) }}
          >
            {writeOf('right').format(tick)}
          </span>
        ))}
        {activeX !== null && active !== null && (
          <>
            <span className="k-plot-cross" data-slot="intraday-cross" style={{ left: `${activeX * 100}%` }} />
            <LcdTooltip
              style={{ left: `${activeX * 100}%`, top: 0 }}
              side={activeX > 0.5 ? 'left' : 'right'}
              title={formatClock(active)}
              rows={tipRows}
            />
          </>
        )}
      </div>
      <div className="k-isr-xaxis" data-slot="intraday-xaxis" aria-hidden="true">
        {intradayTicks(axisOptions).map((tick) => (
          <span key={tick.text} style={{ left: `${tick.x * 100}%` }}>
            {tick.text}
          </span>
        ))}
      </div>
      <span className="sr-only" aria-live="polite">
        {active === null
          ? ''
          : `${formatClock(active)}: ${tipRows.map((row) => `${row.label} ${row.value}`).join(', ')}`}
      </span>
    </div>
  )
}

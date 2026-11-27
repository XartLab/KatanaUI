// SPDX-License-Identifier: MIT
/**
 * ValuationBand: the history of a valuation multiple (PE, PB…) as a line, with historical percentile bands behind it (20 / 50 / 80 by default) and the current point labelled with its percentile.
 * 估值带（#260，KATANAview#2164 的「估值带」原型件：A / 港 / 美股指数与品种的市盈率、市净率历史）：估值历史曲线，背后铺历史分位带（默认 20 / 50 / 80，可配），
 * 当前点标出估值与分位数字；移动鼠标或聚焦后 ← → 逐点读（时间、估值、这个值在整段历史里的分位）。
 * 分位的口径：按传进来的整段历史算（含当前，线性插值），不是滚动窗口；要看近五年就只传近五年（见 valuation-band-model.ts）。
 * 颜色：分位带是中性前景色的浓度（越高越深，不用涨跌色——估值高低不是涨跌，也不是好坏），线用 series-1，当前点用强调色。
 * 数据、文字都由调用方给：包里不带语言（labels 的默认是英文）、不带数据源；缺值断线，不当 0。
 */
import type { CSSProperties } from 'react'
import { EndMarker } from '../lib/chart/chart-kit/end-marker.tsx'
import { LcdTooltip } from '../lib/chart/chart-kit/lcd-tooltip.tsx'
import { PlotGrid, PlotYAxis } from '../lib/chart/chart-kit/plot-axes.tsx'
import { linePath, makePlot, niceTicks, pct, PLOT_W } from '../lib/chart/series-geometry.ts'
import { cn } from '../lib/cn.ts'
import { useScrubber } from '../lib/use-scrubber.ts'
import {
  DEFAULT_PERCENTILES,
  finiteValues,
  lastIndexWithValue,
  valuationLevels,
  valuationPercentile,
  type ValuationPoint,
} from './valuation-band-model.ts'

export type { ValuationPoint } from './valuation-band-model.ts'

/** Texts of ValuationBand (the package ships no text; the defaults are English). */
export type ValuationBandLabels = {
  /** Shown when the history has no value. */
  empty: string
  /** A percentile level, e.g. "P20". */
  percentile: (p: number) => string
  /** Current point label: the value and its percentile, e.g. "18.4 · P37". */
  current: (value: string, rank: number) => string
  /** Names of the lines in the hover window. */
  valueName: string
  rankName: string
  /** Accessible name of the plot: the chart name plus the current reading. */
  plotAria: (label: string, summary: string) => string
  /** The sentence read for the current reading, e.g. "Now 18.4, at the 37th percentile of the history". */
  summary: (value: string, rank: number) => string
  /** Written where a value is missing. */
  missing: string
}

export const defaultValuationLabels: ValuationBandLabels = {
  empty: 'No data',
  percentile: (p) => `P${p}`,
  current: (value, rank) => `${value} · P${Math.round(rank)}`,
  valueName: 'Value',
  rankName: 'Percentile',
  plotAria: (label, summary) => `${label}. ${summary}`,
  summary: (value, rank) => `Now ${value}, at percentile ${Math.round(rank)} of the history`,
  missing: '—',
}

export type ValuationBandProps = {
  /** The history, oldest first. A missing value (null) breaks the line and is left out of the percentiles. */
  points: readonly ValuationPoint[]
  /** Accessible name of the whole chart (a full sentence, e.g. "CSI 300 PE history"). */
  label: string
  /** Percentile levels to draw, between 0 and 100 exclusive; 20 / 50 / 80 by default. */
  percentiles?: readonly number[]
  /** How a value is written (axis, labels, hover window); defaults to two decimals. */
  formatValue?: (value: number) => string
  /** How a time is written on the axis and in the hover window; defaults to the text or number as given. */
  formatTime?: (time: string | number) => string
  /** Plot height in px; 180 by default. */
  height?: number
  /** Texts; English defaults. */
  labels?: Partial<ValuationBandLabels>
  /** Extra class names. */
  className?: string
}

const PAD = 8
const fixed2 = (value: number) => value.toFixed(2)
const asTime = (time: string | number) => String(time)

export function ValuationBand({
  points,
  label,
  percentiles = DEFAULT_PERCENTILES,
  formatValue = fixed2,
  formatTime = asTime,
  height = 180,
  labels: labelsProp,
  className,
}: ValuationBandProps) {
  const labels = { ...defaultValuationLabels, ...labelsProp }
  const scrub = useScrubber({ count: points.length })
  const values = finiteValues(points)
  if (values.length === 0) {
    return (
      <div
        className={cn('k-vb', className)}
        data-slot="valuation-band"
        data-empty="true"
        role="group"
        aria-label={label}
      >
        <p className="k-vb-empty" role="status" style={{ minHeight: height }}>
          {labels.empty}
        </p>
      </div>
    )
  }
  const levels = valuationLevels(points, percentiles)
  const nice = niceTicks(
    Math.min(...values, ...levels.map((l) => l.value)),
    Math.max(...values, ...levels.map((l) => l.value)),
    4,
  )
  const plot = makePlot(points.length, nice.domain, { height, padTop: PAD, padBottom: PAD, exact: true })
  const plotWithTicks = { ...plot, ticks: nice.ticks.map((value) => ({ value, y: plot.yAt(value) })) }
  const series = points.map((point) => (typeof point.value === 'number' ? point.value : Number.NaN))
  // 分位带：从区间下沿到最低线、线与线之间、最高线到区间上沿；由低到高越来越深。
  const edges = [nice.domain[0], ...levels.map((l) => l.value), nice.domain[1]]
  const bands = edges.slice(0, -1).map((from, i) => ({ i, from, to: edges[i + 1]! }))
  const nowIndex = lastIndexWithValue(points)
  const now = points[nowIndex]!.value!
  const nowRank = valuationPercentile(points, now)!
  const summary = labels.summary(formatValue(now), nowRank)
  const active = scrub.index
  const activePoint = active === null ? null : points[active]!
  const activeValue = activePoint && typeof activePoint.value === 'number' ? activePoint.value : null
  const ticks = [0, Math.floor((points.length - 1) / 2), points.length - 1].filter((v, i, all) => all.indexOf(v) === i)

  return (
    <div className={cn('k-vb', className)} data-slot="valuation-band" role="group" aria-label={label}>
      <div
        className="k-vb-plot"
        data-slot="valuation-plot"
        style={{ height }}
        role="group"
        aria-label={labels.plotAria(label, summary)}
        {...scrub.props}
      >
        <svg viewBox={`0 0 ${PLOT_W} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          {bands.map((band) => (
            <rect
              key={band.i}
              className="k-vb-band"
              data-slot="valuation-bandfill"
              data-band={band.i}
              data-bands={bands.length}
              x={0}
              width={PLOT_W}
              y={plot.yAt(band.to)}
              height={Math.max(0, plot.yAt(band.from) - plot.yAt(band.to))}
            />
          ))}
          <PlotGrid plot={plotWithTicks} />
          {levels.map((level) => (
            <line
              key={level.p}
              className="k-vb-level"
              data-slot="valuation-level"
              data-p={level.p}
              x1={0}
              x2={PLOT_W}
              y1={plot.yAt(level.value)}
              y2={plot.yAt(level.value)}
            />
          ))}
          <path className="k-vb-line" data-slot="valuation-line" d={linePath(series, plot)} />
        </svg>
        <PlotYAxis plot={plotWithTicks} format={formatValue} />
        {levels.map((level) => (
          <span
            key={level.p}
            className="k-vb-ptick"
            data-slot="valuation-ptick"
            data-p={level.p}
            style={{ top: Math.round(plot.yAt(level.value)) }}
          >
            {labels.percentile(level.p)} <b>{formatValue(level.value)}</b>
          </span>
        ))}
        <EndMarker
          x={plot.xAt(nowIndex)}
          y={plot.yAt(now)}
          value={labels.current(formatValue(now), nowRank)}
          side={nowIndex > (points.length - 1) / 2 ? 'left' : 'right'}
        />
        {active !== null && activePoint && (
          <>
            <span className="k-plot-cross" data-slot="valuation-cross" style={{ left: pct(plot.xAt(active)) }} />
            <LcdTooltip
              style={{ left: pct(plot.xAt(active)), top: 0 }}
              side={active > (points.length - 1) / 2 ? 'left' : 'right'}
              title={formatTime(activePoint.time)}
              rows={[
                {
                  key: 'value',
                  label: labels.valueName,
                  value: activeValue === null ? labels.missing : formatValue(activeValue),
                  swatch: 'var(--series-1)',
                },
                {
                  key: 'rank',
                  label: labels.rankName,
                  value:
                    activeValue === null ? labels.missing : `P${Math.round(valuationPercentile(points, activeValue)!)}`,
                },
              ]}
            />
          </>
        )}
      </div>
      <div className="k-vb-xaxis" data-slot="valuation-xaxis" aria-hidden="true">
        {ticks.map((index) => (
          <span key={index} style={{ left: pct(plot.xAt(index)), '--k-vb-x': index } as CSSProperties}>
            {formatTime(points[index]!.time)}
          </span>
        ))}
      </div>
      <span className="sr-only" aria-live="polite">
        {activePoint
          ? `${formatTime(activePoint.time)}: ${activeValue === null ? labels.missing : `${formatValue(activeValue)}, P${Math.round(valuationPercentile(points, activeValue)!)}`}`
          : ''}
      </span>
    </div>
  )
}

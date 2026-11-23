// SPDX-License-Identifier: MIT
/**
 * KPI chart: a headline value with its change, and a multi-line chart whose tooltip follows the pointer or the arrow keys.
 * KPI 图（KATANAview #1908 第一批）：标题、大号当前值、较上期的变化（涨跌色），下面几条线并看（权益、回撤、夏普），图例、首中末三处横轴字、页脚一行。
 * 两种纵轴：shared 几条线同一单位共用一根轴（带刻度）；normalized 各自按自己的最低到最高压到同一高度（单位不同的线并看，不画刻度，提示窗写真值）。
 * 扫读用 useScrubber（指针跟手、←→ 一格、Shift 三格、Home / End、Esc 清掉），比例尺与路径用 series-geometry，提示窗是 chart-kit 的 LcdTooltip，
 * 不另写一套（#1917 定的分工）。功能参照 affectUI 的 KPI Chart（affectui.com/components/kpi-chart，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创）。
 * 跟它不同：加了 normalized 纵轴（它只适合同单位的线）；线 2px 不填面、不用涨跌色（dataviz.md）。没有数据时写 emptyText，不画样本。包里不带语言。
 */
import { cn } from '../lib/cn.ts'
import { useScrubber } from '../lib/use-scrubber.ts'
import { assignSeries } from '../lib/chart/chart-kit/series-colors.ts'
import { LcdTooltip } from '../lib/chart/chart-kit/lcd-tooltip.tsx'
import { PlotGrid, PlotYAxis } from '../lib/chart/chart-kit/plot-axes.tsx'
import { linePath, makePlot, pct, PLOT_W } from '../lib/chart/series-geometry.ts'
import type { Tone } from '../lib/tone.ts'
import {
  axisIndexes,
  hasKpiData,
  kpiCount,
  kpiRange,
  plotValues,
  type KpiScale,
  type KpiSeries,
} from './kpi-chart-model.ts'

export type KpiChartProps = {
  /** Card title. */
  title: string
  /** Accessible name of the chart. */
  label: string
  /** Headline value, already formatted. */
  value?: string
  /** Change against the previous period as a fraction (0.12 is +12%); omit to hide. */
  delta?: number | null
  /** How the change is written; defaults to a signed percent with one decimal. */
  formatDelta?: (delta: number) => string
  /** One label per point (dates); the axis writes the first, middle and last. */
  labels: readonly string[]
  /** Longer per-point headers for the tooltip; falls back to labels. */
  tooltipLabels?: readonly string[]
  /** Lines, about six at most. */
  series: readonly KpiSeries[]
  /** shared (default): one y axis; normalized: each line scaled to its own range, no y ticks. */
  scale?: KpiScale
  /** How values are written on the axis and in the tooltip; a line's own format wins in the tooltip. */
  format?: (value: number) => string
  /** Controlled point index; null when nothing is marked. */
  index?: number | null
  /** Called when the marked point changes (pointer, arrows, Esc). */
  onIndexChange?: (index: number | null) => void
  /** Point marked while nobody scrubs; defaults to the last point. */
  defaultIndex?: number
  /** Text in the plot when there is nothing to draw. */
  emptyText: string
  /** Footer line, such as the source. */
  footer?: string
  /** Plot height in pixels. */
  height?: number
  /** Extra class name on the root. */
  className?: string
}

/** 纵向留白：线不贴上下边（series-geometry 默认也是 8）。 */
const PAD = 8
/** 默认绘图区高度：照 underwater-chart 的 120 加一档，几条线叠着看要多一点高度。待定（没有实测依据）。 */
const DEFAULT_HEIGHT = 160

const defaultDelta = (delta: number) => `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${Math.abs(delta * 100).toFixed(1)}%`
const toneOf = (delta: number): Tone => (delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat')

export function KpiChart({
  title,
  label,
  value,
  delta,
  formatDelta = defaultDelta,
  labels,
  tooltipLabels,
  series,
  scale = 'shared',
  format = String,
  index,
  onIndexChange,
  defaultIndex,
  emptyText,
  footer,
  height = DEFAULT_HEIGHT,
  className,
}: KpiChartProps) {
  const count = kpiCount(series)
  const scrub = useScrubber({ count, index, onIndexChange })
  const colors = assignSeries(series.map((line) => line.key))
  const empty = !hasKpiData(series)
  const plot = makePlot(count, kpiRange(series, scale), {
    height,
    padTop: PAD,
    padBottom: PAD,
    exact: scale === 'normalized',
  })
  const active = scrub.index
  const marked =
    active ?? (defaultIndex !== undefined && defaultIndex >= 0 && defaultIndex < count ? defaultIndex : count - 1)
  const valueOf = (line: KpiSeries, at: number) => {
    const raw = line.values[at]
    return typeof raw === 'number' && Number.isFinite(raw) ? (line.format ?? format)(raw) : '–'
  }
  const header = (at: number) => tooltipLabels?.[at] ?? labels[at] ?? ''
  const summary = (at: number) =>
    `${header(at)}  ${series.map((line) => `${line.label} ${valueOf(line, at)}`).join('  ')}`

  return (
    <figure className={cn('k-kpi', className)} data-slot="kpi-chart" data-scale={scale}>
      <div className="k-kpi-head">
        <span className="k-kpi-title">{title}</span>
        {value !== undefined && (
          <span className="k-kpi-value" data-slot="kpi-value">
            {value}
          </span>
        )}
        {typeof delta === 'number' && Number.isFinite(delta) && (
          <span className="k-kpi-delta" data-slot="kpi-delta" data-tone={toneOf(delta)}>
            {formatDelta(delta)}
          </span>
        )}
      </div>
      <ul className="k-kpi-legend" aria-hidden="true">
        {series.map((line) => (
          <li key={line.key}>
            <i style={{ background: line.color ?? colors[line.key] }} />
            {line.label}
          </li>
        ))}
      </ul>
      {empty ? (
        <div className="k-kpi-empty" style={{ height }} data-slot="kpi-empty">
          {emptyText}
        </div>
      ) : (
        <div className="k-kpi-body">
          <div
            className="k-kpi-main"
            style={{ height }}
            role="slider"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={Math.max(0, count - 1)}
            aria-valuenow={marked}
            aria-valuetext={summary(marked)}
            data-slot="kpi-main"
            {...scrub.props}
          >
            <svg viewBox={`0 0 ${PLOT_W} ${height}`} preserveAspectRatio="none" aria-hidden="true">
              {scale === 'shared' && <PlotGrid plot={plot} />}
              {series.map((line) => (
                <path
                  key={line.key}
                  className="k-kpi-line"
                  data-slot="kpi-line"
                  data-key={line.key}
                  d={linePath(plotValues(line, scale), plot)}
                  style={{ stroke: line.color ?? colors[line.key] }}
                />
              ))}
            </svg>
            {scale === 'shared' && <PlotYAxis plot={plot} format={format} />}
            {series.map((line) => {
              const y = plotValues(line, scale)[marked]
              if (y === undefined || !Number.isFinite(y)) return null
              return (
                <i
                  key={line.key}
                  className="k-kpi-dot"
                  data-slot="kpi-dot"
                  style={{
                    left: pct(plot.xAt(marked)),
                    top: Math.round(plot.yAt(y)),
                    background: line.color ?? colors[line.key],
                  }}
                />
              )
            })}
            {active !== null && (
              <>
                <span className="k-plot-cross" data-slot="kpi-cross" style={{ left: pct(plot.xAt(active)) }} />
                <LcdTooltip
                  style={{ left: pct(plot.xAt(active)), top: 0 }}
                  side={active > count / 2 ? 'left' : 'right'}
                  title={header(active)}
                  rows={series.map((line) => ({
                    key: line.key,
                    label: line.label,
                    value: valueOf(line, active),
                    swatch: line.color ?? colors[line.key],
                  }))}
                />
              </>
            )}
          </div>
          <div className="k-plot-xaxis k-kpi-xaxis" aria-hidden="true">
            {axisIndexes(count).map((at, i, all) => (
              <span
                key={at}
                style={{ left: pct(plot.xAt(at)) }}
                data-align={i === 0 ? 'start' : i === all.length - 1 ? 'end' : 'mid'}
              >
                {labels[at] ?? ''}
              </span>
            ))}
          </div>
        </div>
      )}
      {footer !== undefined && <figcaption className="k-dist-source">{footer}</figcaption>}
    </figure>
  )
}

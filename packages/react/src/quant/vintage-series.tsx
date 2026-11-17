// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { cn } from '../lib/cn.ts'
import { useScrubber } from '../lib/use-scrubber.ts'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import { ChartActions } from '../lib/chart/chart-kit/chart-actions.tsx'
import { ChartTable, type ChartViewProps } from '../lib/chart/chart-kit/chart-table.tsx'
import { LcdTooltip, type LcdTooltipRow } from '../lib/chart/chart-kit/lcd-tooltip.tsx'
import { PlotGrid, PlotYAxis } from '../lib/chart/chart-kit/plot-axes.tsx'
import { linePath, makePlot, pct, PLOT_W } from '../lib/chart/series-geometry.ts'
import {
  knownValue,
  normalizeVintages,
  revisionStats,
  vintageExtent,
  type VintageObservation,
} from './vintage-series-model.ts'

// 按发布时间画的宏观序列（point-in-time，框架第十节：别把后来修订的数当成当时已知）。横轴是统计期，一条线是「当时已知值」
// （默认每期的首次发布值；给 asOf 就是截至那一刻已知的最后一次发布），一条是「最新修订值」；每次发布画一个点，同一期的几个点之间连一条细竖线，
// 线的长短就是修订幅度；下面一条小图画每期修订了多少（最新 − 首次，涨跌发散阶，没修订过的期不画）。
// 坐标、网格、十字线与 LCD 读数复用 SeriesExplorer 的那套（series-geometry、chart-kit、useScrubber，键位同它：←→ 逐点，Shift 三点，Home / End，Esc 清除）。
// 颜色：当时已知 ink-100 实线，最新修订 chart-bench 虚线（事后才看得到的数，灰虚线），都不用橙与蓝。文字全由 props 传。

/** 发布点超过这么多期就不画点（只留线与修订竖线）：点是 HTML 叠层，太密也看不清；视觉取值，待定。 */
const DOTS_UP_TO = 72
const X_TICKS = 5
const STRIP_H = 64

export type VintageMode = 'known' | 'latest' | 'both'

export type VintageSeriesLabels = {
  /** 图的读屏名。 */
  chart: string
  /** 切换三个选项那一组的读屏名与各选项的字。 */
  mode: string
  known: string
  latest: string
  both: string
  /** 修订幅度小图的名字（也是读屏名）。 */
  revisions: string
  /** 读数里「累计修订」那一行的名字。 */
  revision: string
  /** 给了 asOf、这一期当时还没发布时，读数里写什么。 */
  notYet: string
  /** 顶上四个读数的名字。 */
  stats: { revised: string; meanAbs: string; bias: string; largest: string }
  /** 没有数据时写的字。 */
  empty: string
}

export type VintageSeriesProps = ChartViewProps & {
  observations: readonly VintageObservation[]
  labels: VintageSeriesLabels
  /** 统计期写成什么（横轴、读数标题、表格第一列）。 */
  formatPeriod: (period: number) => string
  /** 发布时刻写成什么。 */
  formatAt: (at: number) => string
  formatValue: (value: number) => string
  /** 变化与修订写成什么（带正负号）。 */
  formatDelta: (delta: number) => string
  /** 「当时已知」取截至这一刻的最后一次发布；不给取每期首次发布值。 */
  asOf?: number
  defaultMode?: VintageMode
  /** 主图高（px）。 */
  chartHeight?: number
  /** 右上小标，例「演示数据」。 */
  badge?: string
  className?: string
}

export function VintageSeries({
  observations,
  labels,
  formatPeriod,
  formatAt,
  formatValue,
  formatDelta,
  asOf,
  defaultMode = 'both',
  chartHeight = 220,
  badge,
  className,
  actionLabels,
  tableLabel,
  tableHead,
  source,
  onExport,
  onFullscreen,
}: VintageSeriesProps) {
  const [mode, setMode] = useState<VintageMode>(defaultMode)
  const [tableView, setTableView] = useState(false)
  const rows = normalizeVintages(observations)
  const count = rows.length
  const scrub = useScrubber({ count, mode: 'point' })
  const active = scrub.index

  if (count === 0)
    return (
      <div className={cn('k-vs', className)} data-slot="vintage-series" data-empty="true">
        <p className="k-vs-empty">{labels.empty}</p>
      </div>
    )

  const knownSteps = rows.map((row) => knownValue(row, asOf))
  const known = knownSteps.map((step) => step?.value ?? Number.NaN)
  const latest = rows.map((row) => row.latest.value)
  const stats = revisionStats(rows)
  const plot = makePlot(count, vintageExtent(rows), { height: chartHeight })
  const revisions = rows.map((row) => row.revision)
  const revExtent = revisions.reduce<[number, number]>(
    (acc, value) => (value === null ? acc : [Math.min(acc[0], value), Math.max(acc[1], value)]),
    [0, 0],
  )
  const strip = makePlot(count, revExtent, { height: STRIP_H, band: true, tickCount: 3, padTop: 6, padBottom: 6 })
  const showKnown = mode !== 'latest'
  const showLatest = mode !== 'known'
  const dots = count <= DOTS_UP_TO
  const xTicks = Math.min(X_TICKS, count)
  const activeRow = active === null ? null : rows[active]!
  const barW = strip.step * 0.6

  const tip = (): { title: string; rows: LcdTooltipRow[] } | null => {
    if (activeRow === null) return null
    const lines: LcdTooltipRow[] = activeRow.steps.map((step, i) => ({
      key: `s${i}`,
      label: step.note === undefined ? formatAt(step.at) : `${formatAt(step.at)} · ${step.note}`,
      value: `${formatValue(step.value)}${step.delta === null ? '' : ` (${formatDelta(step.delta)})`}`,
    }))
    if (asOf !== undefined && knownSteps[active!] === null)
      lines.unshift({ key: 'not', label: labels.known, value: labels.notYet })
    if (activeRow.revision !== null)
      lines.push({ key: 'rev', label: labels.revision, value: formatDelta(activeRow.revision) })
    return { title: formatPeriod(activeRow.period), rows: lines }
  }
  const tooltip = tip()

  return (
    <figure className={cn('k-vs', className)} data-slot="vintage-series" data-mode={mode}>
      <div className="k-vs-bar">
        <ToggleGroup
          variant="sm"
          aria-label={labels.mode}
          value={mode}
          onValueChange={(next) => {
            if (next === 'known' || next === 'latest' || next === 'both') setMode(next)
          }}
        >
          <ToggleGroupItem value="known">{labels.known}</ToggleGroupItem>
          <ToggleGroupItem value="latest">{labels.latest}</ToggleGroupItem>
          <ToggleGroupItem value="both">{labels.both}</ToggleGroupItem>
        </ToggleGroup>
        {badge === undefined ? null : <span className="k-vs-badge">{badge}</span>}
        <ChartActions
          labels={actionLabels}
          tableView={tableView}
          onTableView={setTableView}
          onExport={onExport}
          onFullscreen={onFullscreen}
        />
      </div>
      <dl className="k-vs-stats" data-slot="vintage-stats">
        <div data-metric="revised">
          <dt>{labels.stats.revised}</dt>
          <dd>
            {stats.revised} / {count}
          </dd>
        </div>
        <div data-metric="meanAbs">
          <dt>{labels.stats.meanAbs}</dt>
          <dd>{stats.meanAbs === null ? '—' : formatValue(stats.meanAbs)}</dd>
        </div>
        <div data-metric="bias">
          <dt>{labels.stats.bias}</dt>
          <dd>{stats.bias === null ? '—' : formatDelta(stats.bias)}</dd>
        </div>
        <div data-metric="largest">
          <dt>{labels.stats.largest}</dt>
          <dd>
            {stats.largest === null
              ? '—'
              : `${formatPeriod(stats.largest.period)} ${formatDelta(stats.largest.revision)}`}
          </dd>
        </div>
      </dl>
      {tableView && (
        <ChartTable
          slot="vintage-series-table"
          numeric={[2, 3, 4]}
          label={tableLabel}
          head={tableHead}
          rows={rows.flatMap((row) =>
            row.steps.map((step, i) => ({
              key: `${row.period}-${i}`,
              cells: [
                formatPeriod(row.period),
                formatAt(step.at),
                formatValue(step.value),
                step.delta === null ? '—' : formatDelta(step.delta),
                i === 0 ? '—' : formatDelta(step.value - row.first.value),
              ],
            })),
          )}
        />
      )}
      <div hidden={tableView} className="k-vs-body">
        <div
          className="k-vs-plots"
          role="slider"
          aria-label={labels.chart}
          aria-valuemin={0}
          aria-valuemax={Math.max(0, count - 1)}
          aria-valuenow={active ?? count - 1}
          aria-valuetext={(() => {
            const row = rows[active ?? count - 1]!
            const step = knownSteps[active ?? count - 1]
            return `${formatPeriod(row.period)}  ${labels.known} ${step ? formatValue(step.value) : labels.notYet}  ${labels.latest} ${formatValue(row.latest.value)}`
          })()}
          data-slot="vintage-chart"
          {...scrub.props}
        >
          <div className="k-vs-main" style={{ height: chartHeight }} data-slot="vintage-main">
            <svg viewBox={`0 0 ${PLOT_W} ${chartHeight}`} preserveAspectRatio="none" aria-hidden="true">
              <PlotGrid plot={plot} />
              {showKnown &&
                showLatest &&
                rows.map((row, i) =>
                  row.revision === null ? null : (
                    <line
                      key={row.period}
                      className="k-vs-span"
                      data-slot="vintage-span"
                      x1={plot.xAt(i)}
                      x2={plot.xAt(i)}
                      y1={plot.yAt(row.first.value)}
                      y2={plot.yAt(row.latest.value)}
                    />
                  ),
                )}
              {showLatest && <path className="k-vs-latest" data-slot="vintage-latest" d={linePath(latest, plot)} />}
              {showKnown && <path className="k-vs-known" data-slot="vintage-known" d={linePath(known, plot)} />}
            </svg>
            <PlotYAxis plot={plot} format={formatValue} />
            {dots &&
              rows.map((row, i) =>
                row.steps.map((step, s) => {
                  const last = s === row.steps.length - 1
                  const knownStep = knownSteps[i]
                  const isKnown = knownStep !== null && knownStep!.at === step.at && knownStep!.value === step.value
                  const role = isKnown ? 'known' : last ? 'latest' : 'mid'
                  if (role === 'known' ? !showKnown : role === 'latest' ? !showLatest : !(showKnown && showLatest))
                    return null
                  return (
                    <i
                      key={`${row.period}-${s}`}
                      className="k-vs-dot"
                      data-slot="vintage-release"
                      data-role={role}
                      data-active={active === i ? 'true' : undefined}
                      style={{ left: pct(plot.xAt(i)), top: plot.yAt(step.value) }}
                    />
                  )
                }),
              )}
            {active !== null && tooltip !== null && (
              <>
                <span className="k-plot-cross" data-slot="vintage-cross" style={{ left: pct(plot.xAt(active)) }} />
                <LcdTooltip
                  className="k-vs-tip"
                  style={{ left: pct(plot.xAt(active)), top: 0 }}
                  side={active > count / 2 ? 'left' : 'right'}
                  title={tooltip.title}
                  rows={tooltip.rows}
                />
              </>
            )}
          </div>
          <div className="k-vs-strip" style={{ height: STRIP_H }} data-slot="vintage-revisions">
            <svg viewBox={`0 0 ${PLOT_W} ${STRIP_H}`} preserveAspectRatio="none" aria-hidden="true">
              <line className="k-plot-zero" x1={0} x2={PLOT_W} y1={strip.yAt(0)} y2={strip.yAt(0)} />
              {rows.map((row, i) => {
                if (row.revision === null || row.revision === 0) return null
                const y0 = strip.yAt(0)
                const y1 = strip.yAt(row.revision)
                return (
                  <rect
                    key={row.period}
                    className="k-vs-rev"
                    data-slot="vintage-rev"
                    data-tone={row.revision > 0 ? 'up' : 'down'}
                    data-active={active === i ? 'true' : undefined}
                    x={strip.xAt(i) - barW / 2}
                    y={Math.min(y0, y1)}
                    width={barW}
                    height={Math.max(0.5, Math.abs(y1 - y0))}
                  />
                )
              })}
            </svg>
            <span className="k-vs-strip-title">{labels.revisions}</span>
            {active !== null && <span className="k-plot-cross" style={{ left: pct(plot.xAt(active)) }} />}
          </div>
        </div>
        <div className="k-plot-xaxis k-vs-xaxis" aria-hidden="true">
          {Array.from({ length: xTicks }, (_, i) => {
            const at = xTicks === 1 ? 0 : Math.round((i / (xTicks - 1)) * (count - 1))
            return (
              <span
                key={at}
                style={{ left: pct(plot.xAt(at)) }}
                data-align={i === 0 ? 'start' : i === xTicks - 1 ? 'end' : 'mid'}
              >
                {formatPeriod(rows[at]!.period)}
              </span>
            )
          })}
        </div>
        <div className="k-vs-legend" data-slot="vintage-legend">
          <span className="k-vs-key" data-role="known" hidden={!showKnown}>
            <i aria-hidden="true" />
            {labels.known}
          </span>
          <span className="k-vs-key" data-role="latest" hidden={!showLatest}>
            <i aria-hidden="true" />
            {labels.latest}
          </span>
        </div>
      </div>
      {source === undefined ? null : <p className="k-dist-source">{source}</p>}
    </figure>
  )
}

// SPDX-License-Identifier: MIT
// 季节性图（SeasonalChart）：几年的走势按 366 格日历叠在一张图上（同一个日期每年同一格），纵轴是相对年初基准（上一年最后一个收盘价）的涨跌幅，看某段时间是不是年年涨或年年跌。
// 功能参照 TradingView 小组件 Seasonal Chart（tradingview.com/widget-docs/widgets/charts/seasonal-chart，2026-11-23 读：页面只写「多年季节性形态图，把各年的价格表现叠在一起」；
// 横轴是月还是日、默认几年、今年怎么标、有没有图例开关，页面没写，待核对）。只取功能，不嵌、不抄代码与样式值。
// 我们的做法：横轴 1 月 1 日到 12 月 31 日，月份刻度的字由调用方给；最新的一年（或 highlight 指定的那年）2px 实线，其余年 1.25px 淡显；
// 图例是一排年份开关（aria-pressed），各带这一年最后一个点的涨跌幅，点了隐去 / 显出那一年，至少留一年；给了 hidden / onHiddenChange 就受控。
// 悬停或键盘走（←→ 一天，Shift 三天，PageUp / PageDown 月初，Home / End，Esc 清除；没选中时第一下落在最新一年的最后一个点）出 LCD 读数，列出这一天各年的涨跌幅：
// 往年最后一个点之后沿用到年底，最新一年还没到的日子写「—」。给了 actionLabels 就在右上画共用的图操作，表格视图每月一行、每年一列写月末涨跌幅。
// 数据由调用方传（先用 seasonalSeries 按年切好），件不取数据；颜色按年份在完整列表里的次序取 series-*（assignSeries，筛掉的年不让剩下的换色）。
import { useState, type PointerEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { scrubIndexAt } from '../lib/use-scrubber.ts'
import { formatPercentChange } from '../lib/chart/format/index.ts'
import { ChartActions, type ChartActionsLabels } from '../lib/chart/chart-kit/chart-actions.tsx'
import { ChartTable } from '../lib/chart/chart-kit/chart-table.tsx'
import { LcdTooltip } from '../lib/chart/chart-kit/lcd-tooltip.tsx'
import { assignSeries } from '../lib/chart/chart-kit/series-colors.ts'
import { extent, linePath, makePlot, pct, PLOT_W } from '../lib/chart/series-geometry.ts'
import {
  CALENDAR_MONTH_START,
  calendarDayText,
  monthClose,
  seasonalKey,
  seasonalValueAt,
  toggleHidden,
  YEAR_DAYS,
  type SeasonalYear,
} from './seasonal-model.ts'

export type SeasonalChartLabels = {
  /** Accessible name of the chart (it is a slider over the days when focused). */
  chart: string
  /** Accessible name of the row of year toggles. */
  legend: string
  /** Twelve month names for the axis and the readout title, written by the caller. */
  months: readonly string[]
  /** Text in place of the chart when there is no year with at least two points. */
  empty: string
  /** Head of the month column in the table view; empty when omitted. */
  month?: string
}

export type SeasonalChartProps = {
  /** Years to overlay, each with its points by calendar slot (build them with seasonalSeries). */
  years: readonly SeasonalYear[]
  /** Year drawn bold; the latest year by default. */
  highlight?: number
  /** Years hidden at first render (uncontrolled); the legend toggles them. */
  defaultHidden?: readonly number[]
  /** Years hidden (controlled): with it the caller owns the legend state and defaultHidden is ignored. */
  hidden?: readonly number[]
  /** Called with the new list of hidden years when a legend toggle is pressed; the last visible year cannot be hidden. */
  onHiddenChange?: (hidden: number[]) => void
  /** Height of the plot in pixels, 220 by default. */
  height?: number
  /** Number of decimals of the percentages in the readout, legend and table, 2 by default. */
  digits?: number
  /** Texts for screen readers, month names and the empty state, written by the caller (required). */
  labels: SeasonalChartLabels
  /** Names of the chart actions at the top right (table view, export, fullscreen); no actions when omitted. */
  actionLabels?: ChartActionsLabels
  /** Accessible name of the table view (one row per month, one column per shown year); labels.chart when omitted. */
  tableLabel?: string
  /** Export button of the chart actions; no button when omitted. */
  onExport?: () => void
  /** Fullscreen button of the chart actions; no button when omitted. */
  onFullscreen?: () => void
  /** Small line under the chart (source, how the change is measured), written by the caller. */
  source?: string
  /** Extra class name on the root. */
  className?: string
}

const PAD = { top: 10, bottom: 10 }

export function SeasonalChart({
  years,
  highlight,
  defaultHidden = [],
  hidden,
  onHiddenChange,
  height = 220,
  digits = 2,
  labels,
  actionLabels,
  tableLabel,
  onExport,
  onFullscreen,
  source,
  className,
}: SeasonalChartProps) {
  const [innerHidden, setInnerHidden] = useState<readonly number[]>(defaultHidden)
  const [tableView, setTableView] = useState(false)
  const [day, setDay] = useState<number | null>(null)
  const off = hidden ?? innerHidden
  const usable = years.filter((entry) => entry.points.length >= 2)
  const colors = assignSeries(usable.map((entry) => String(entry.year)))
  const latest = usable.at(-1)
  const bold = highlight ?? latest?.year
  const shown = usable.filter((entry) => !off.includes(entry.year))

  if (latest === undefined) {
    return (
      <figure className={cn('k-seasonal', className)} data-slot="seasonal-chart">
        <div className="k-seasonal-empty" style={{ height }} data-slot="seasonal-empty">
          {labels.empty}
        </div>
      </figure>
    )
  }

  const plot = makePlot(
    YEAR_DAYS,
    extent(
      shown.flatMap((entry) => entry.points.map((point) => point.pct)),
      true,
    ),
    {
      height,
      padTop: PAD.top,
      padBottom: PAD.bottom,
    },
  )
  const xOfDay = (at: number) => (at / (YEAR_DAYS - 1)) * PLOT_W
  // linePath 按下标摆点：把每年的点铺成 366 格的数组（没有点的日子是 NaN）会让节假日把线断开；所以用只有这一年那些点的 xAt。
  const pathOf = (entry: SeasonalYear) =>
    linePath(
      entry.points.map((point) => point.pct),
      { ...plot, xAt: (index) => xOfDay(entry.points[index]!.day) },
    )
  const written = (value: number | null) => (value === null ? '—' : formatPercentChange(value, digits))
  // 往年最后一个点之后沿用到年底；最新一年（还在走的今年）过了最后一个点不读，写「—」。
  const valueAt = (entry: SeasonalYear, at: number) => seasonalValueAt(entry.points, at, entry.year !== latest.year)
  const anchor = latest.points.at(-1)!.day
  const rows =
    day === null
      ? []
      : shown.map((entry) => ({
          key: String(entry.year),
          label: String(entry.year),
          value: written(valueAt(entry, day)),
          swatch: colors[String(entry.year)],
        }))
  const table = tableView && actionLabels !== undefined

  const toggle = (year: number) => {
    // 至少留一年：最后一条线不让关。
    const next = toggleHidden(
      off,
      year,
      usable.map((entry) => entry.year),
    )
    if (next === null) return
    if (hidden === undefined) setInnerHidden(next)
    onHiddenChange?.(next)
  }
  const move = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const next = scrubIndexAt(event.clientX - box.left, box.width, YEAR_DAYS)
    if (next !== null && next !== day) setDay(next)
  }

  return (
    <figure className={cn('k-seasonal', className)} data-slot="seasonal-chart">
      <div className="k-seasonal-bar">
        <div className="k-seasonal-legend" role="group" aria-label={labels.legend} data-slot="seasonal-legend">
          {usable.map((entry) => {
            const on = !off.includes(entry.year)
            return (
              <button
                key={entry.year}
                type="button"
                className={cn('k-seasonal-key', entry.year === bold && 'is-bold')}
                aria-pressed={on}
                data-slot="seasonal-key"
                onClick={() => toggle(entry.year)}
              >
                <i style={on ? { background: colors[String(entry.year)] } : undefined} aria-hidden="true" />
                {entry.year}{' '}
                <span className="k-seasonal-key-value" data-slot="seasonal-key-value">
                  {written(entry.points.at(-1)!.pct)}
                </span>
              </button>
            )
          })}
        </div>
        {actionLabels === undefined ? null : (
          <ChartActions
            labels={actionLabels}
            tableView={table}
            onTableView={setTableView}
            onExport={onExport}
            onFullscreen={onFullscreen}
          />
        )}
      </div>
      {table && (
        <ChartTable
          slot="seasonal-table"
          label={tableLabel ?? labels.chart}
          head={[labels.month ?? '', ...shown.map((entry) => String(entry.year))]}
          numeric={shown.map((_, index) => index + 1)}
          rows={CALENDAR_MONTH_START.map((_, month) => ({
            key: String(month),
            cells: [
              labels.months[month] ?? String(month + 1),
              ...shown.map((entry) => written(monthClose(entry.points, month))),
            ],
          }))}
        />
      )}
      <div className="k-seasonal-plotwrap" hidden={table}>
        <div
          className="k-seasonal-plot"
          style={{ height }}
          role="slider"
          tabIndex={0}
          aria-label={labels.chart}
          aria-valuemin={0}
          aria-valuemax={YEAR_DAYS - 1}
          aria-valuenow={day ?? 0}
          aria-valuetext={
            day === null
              ? undefined
              : `${calendarDayText(day, labels.months)}  ${rows.map((row) => `${row.label} ${row.value}`).join('  ')}`
          }
          data-slot="seasonal-plot"
          onPointerMove={move}
          onPointerLeave={() => setDay(null)}
          onBlur={() => setDay(null)}
          onKeyDown={(event) => {
            if (event.altKey || event.ctrlKey || event.metaKey) return
            const next = seasonalKey(day, event.key, event.shiftKey, anchor)
            if (next === undefined) return
            event.preventDefault()
            setDay(next)
          }}
        >
          <svg viewBox={`0 0 ${PLOT_W} ${height}`} preserveAspectRatio="none" aria-hidden="true">
            {plot.ticks.map((tick) => (
              <line key={tick.value} className="k-ck-grid" x1={0} x2={PLOT_W} y1={tick.y} y2={tick.y} />
            ))}
            {CALENDAR_MONTH_START.slice(1).map((start) => (
              <line key={start} className="k-seasonal-month" x1={xOfDay(start)} x2={xOfDay(start)} y1={0} y2={height} />
            ))}
            <line className="k-plot-zero" x1={0} x2={PLOT_W} y1={plot.yAt(0)} y2={plot.yAt(0)} />
            {shown
              .filter((entry) => entry.year !== bold)
              .map((entry) => (
                <path
                  key={entry.year}
                  className="k-seasonal-line"
                  data-slot="seasonal-line"
                  data-year={entry.year}
                  d={pathOf(entry)}
                  style={{ stroke: colors[String(entry.year)] }}
                />
              ))}
            {shown
              .filter((entry) => entry.year === bold)
              .map((entry) => (
                <path
                  key={entry.year}
                  className="k-seasonal-line is-bold"
                  data-slot="seasonal-line"
                  data-year={entry.year}
                  d={pathOf(entry)}
                  style={{ stroke: colors[String(entry.year)] }}
                />
              ))}
          </svg>
          {plot.ticks.map((tick) => (
            <span key={tick.value} className="k-seasonal-ytick" style={{ top: Math.round(tick.y) }} aria-hidden="true">
              {`${tick.value > 0 ? '+' : ''}${tick.value}%`}
            </span>
          ))}
          {day !== null && (
            <>
              <span className="k-plot-cross" style={{ left: pct(xOfDay(day)) }} />
              <LcdTooltip
                style={{ left: pct(xOfDay(day)), top: 0 }}
                side={day > YEAR_DAYS / 2 ? 'left' : 'right'}
                title={calendarDayText(day, labels.months)}
                rows={rows}
              />
            </>
          )}
        </div>
        <div className="k-plot-xaxis k-seasonal-xaxis" aria-hidden="true">
          {CALENDAR_MONTH_START.map((start, index) => (
            <span
              key={start}
              style={{ left: pct(xOfDay(start)) }}
              data-align={index === 0 ? 'start' : 'mid'}
              data-even={index % 2 === 1 ? 'true' : undefined}
            >
              {labels.months[index]}
            </span>
          ))}
        </div>
      </div>
      {source && <figcaption className="k-seasonal-source">{source}</figcaption>}
    </figure>
  )
}

// SPDX-License-Identifier: MIT
// 多品种走势卡（SymbolOverview）：上面一排品种页签（代码、最新价、涨跌幅），中间一张走势，底下一排区间按钮。
// 功能参照 TradingView 小组件 Symbol Overview（tradingview.com/widget-docs/widgets/charts/symbol-overview，2026-11-23 读：页面写「最新报价加一张简单走势」；
// 它的 Indices overview 与 Comparison chart 两个演示页的配置里有 symbols（几只品种）、dateRanges（1d、1m、3m、12m、60m、all）、chartType（area / line）、
// scaleMode（Normal / Percentage：百分比口径比几只品种）、changeMode（price-and-percent）、hideMarketStatus、hideSymbolLogo，悬停出浮动读数）。
// 几只品种在页面上是页签还是列表，演示页没写，待核对；我们用页签（Tabs，一页一只，键盘照 Radix 的左右键）。只取功能，不嵌、不抄代码与样式值；不用 TradingView 蓝。
// 我们的做法：price 口径只画选中的那只（面积或折线）；percent 口径把所有品种按相对各自起点的涨跌幅叠在一张图上，选中的那条加粗，页签上的色块兼作图例。
// 区间按钮只回调，数据由调用方按区间换（件不切数据）。坐标、网格、读数复用 lib/chart（series-geometry、chart-kit 的 LCD 读数、配色 assignSeries），
// 键位同 useScrubber（←→ 逐点，Shift 三点，Home / End，Esc 清除）。文字全由调用方传。
import { useId, useState, type PointerEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { scrubKey } from '../lib/use-scrubber.ts'
import { formatPercentChange } from '../lib/chart/format/index.ts'
import { LcdTooltip } from '../lib/chart/chart-kit/lcd-tooltip.tsx'
import { assignSeries } from '../lib/chart/chart-kit/series-colors.ts'
import { areaPath, extent, linePath, makePlot, pct, PLOT_W, type Plot } from '../lib/chart/series-geometry.ts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs.tsx'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import { ChangeText } from './change-text.tsx'
import { plainPrice, type FormatPrice } from './quote-row.ts'
import { nearestIndex, percentSeries, timeSpan, timeX } from './symbol-overview-model.ts'

export type SymbolOverviewItem = {
  /** Stable id of the symbol; the tab value. */
  id: string
  /** Symbol code shown on the tab. */
  symbol: string
  /** Display name, shown under the code on the tab. */
  name?: string
  /** Latest price. */
  last: number
  /** Change as a percentage (1.5 means +1.5%). */
  changePct: number
  /** Price values from oldest to newest, one per entry of times. */
  values: readonly number[]
  /** Millisecond timestamp of each value, ascending; the line is laid out by time. */
  times: readonly number[]
}

export type SymbolOverviewRange = {
  /** Stable id of the range (1d, 1m, 12m, all). */
  id: string
  /** Button text ("1D", "1M"), written by the caller. */
  label: string
}

export type SymbolOverviewLabels = {
  /** Accessible name of the row of symbol tabs. */
  tabs: string
  /** Accessible name of the row of range buttons. */
  ranges: string
  /** Accessible name of the chart (it is a slider over the points when focused). */
  chart: string
  /** Text in place of the chart when the selected symbol has fewer than two values. */
  empty: string
}

export type SymbolOverviewProps = {
  /** The symbols, in tab order. */
  items: readonly SymbolOverviewItem[]
  /** Selected symbol id (controlled). */
  value?: string
  /** Selected symbol id at first render when uncontrolled; the first item by default. */
  defaultValue?: string
  /** Called with the id of the newly selected symbol. */
  onValueChange?: (id: string) => void
  /** Range buttons under the chart; none are drawn when omitted. */
  ranges?: readonly SymbolOverviewRange[]
  /** Selected range id (controlled). */
  range?: string
  /** Selected range id at first render when uncontrolled; the first range by default. */
  defaultRange?: string
  /**
   * Called with the newly selected range id; the caller loads that period's values.
   * 换了区间：调用方去换这一段的数据，件不切数据。
   */
  onRangeChange?: (id: string) => void
  /**
   * Price draws only the selected symbol; percent overlays every symbol as the change from its own first value.
   * price 只画选中的那只；percent 把所有品种按相对各自起点的涨跌幅叠在一起比。
   */
  scale?: 'price' | 'percent'
  /** Area (line with a faint fill below) or plain line; area by default. */
  chartType?: 'area' | 'line'
  /** Writes a price as text (tabs, axis and readout in price scale). Two decimals by default. */
  formatPrice?: FormatPrice
  /** Writes a timestamp for the readout title and the time axis. */
  formatTime: (time: number) => string
  /** Height of the plot in pixels, 200 by default. */
  chartHeight?: number
  /** Texts for screen readers and the empty state, written by the caller (required). */
  labels: SymbolOverviewLabels
  /** Extra class name on the root. */
  className?: string
}

const PAD = { top: 10, bottom: 10 }
/** 横轴刻度个数：TradingView 的小组件横轴大约四五个日期（待核对），取 5。 */
const X_TICKS = 5

type Drawn = { item: SymbolOverviewItem; shown: number[]; color: string }

export function SymbolOverview({
  items,
  value,
  defaultValue,
  onValueChange,
  ranges,
  range,
  defaultRange,
  onRangeChange,
  scale = 'price',
  chartType = 'area',
  formatPrice = plainPrice,
  formatTime,
  chartHeight = 200,
  labels,
  className,
}: SymbolOverviewProps) {
  const [innerValue, setInnerValue] = useState(defaultValue ?? items[0]?.id ?? '')
  const [innerRange, setInnerRange] = useState(defaultRange ?? ranges?.[0]?.id ?? '')
  const selected = value ?? innerValue
  const activeRange = range ?? innerRange
  const colors = assignSeries(items.map((item) => item.id))
  const percent = scale === 'percent'

  const select = (id: string) => {
    if (value === undefined) setInnerValue(id)
    onValueChange?.(id)
  }
  const pickRange = (id: string) => {
    if (range === undefined) setInnerRange(id)
    onRangeChange?.(id)
  }

  return (
    <Tabs
      bare
      className={cn('k-symov', className)}
      data-slot="symbol-overview"
      data-scale={scale}
      value={selected}
      onValueChange={select}
    >
      <TabsList variant="bare" className="k-symov-tabs" aria-label={labels.tabs}>
        {items.map((item) => (
          <TabsTrigger key={item.id} value={item.id} bare className="k-symov-tab" data-slot="symbol-overview-tab">
            <span className="k-symov-tab-head">
              {percent && <i className="k-symov-swatch" style={{ background: colors[item.id] }} aria-hidden="true" />}
              <span className="k-symov-tab-symbol">{item.symbol}</span>
            </span>
            {item.name && <span className="k-symov-tab-name">{item.name}</span>}
            <span className="k-symov-tab-quote">
              <span className="k-symov-tab-last">{formatPrice(item.last)}</span>
              <ChangeText value={item.changePct} className="k-symov-tab-pct" />
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.id} value={item.id} className="k-symov-panel">
          <OverviewPlot
            drawn={(percent ? items : [item]).map((entry) => ({
              item: entry,
              shown: percent ? percentSeries(entry.values) : [...entry.values],
              color: colors[entry.id]!,
            }))}
            selectedId={item.id}
            percent={percent}
            area={chartType === 'area' && !percent}
            formatPrice={formatPrice}
            formatTime={formatTime}
            height={chartHeight}
            labels={labels}
          />
        </TabsContent>
      ))}
      {ranges && ranges.length > 0 && (
        <ToggleGroup
          size="sm"
          className="k-symov-ranges"
          aria-label={labels.ranges}
          value={activeRange}
          onValueChange={pickRange}
          data-slot="symbol-overview-ranges"
        >
          {ranges.map((entry) => (
            <ToggleGroupItem key={entry.id} value={entry.id}>
              {entry.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
    </Tabs>
  )
}

function OverviewPlot({
  drawn,
  selectedId,
  percent,
  area,
  formatPrice,
  formatTime,
  height,
  labels,
}: {
  drawn: readonly Drawn[]
  selectedId: string
  percent: boolean
  area: boolean
  formatPrice: FormatPrice
  formatTime: (time: number) => string
  height: number
  labels: SymbolOverviewLabels
}) {
  const [hover, setHover] = useState<number | null>(null)
  const gradientId = `k-symov-fill-${useId().replace(/:/g, '')}`
  const main = drawn.find((entry) => entry.item.id === selectedId) ?? drawn[0]
  const span = timeSpan(drawn.map((entry) => entry.item.times))
  const valid = main ? main.shown.filter(Number.isFinite).length : 0
  if (!main || !span || valid < 2) {
    return (
      <div className="k-symov-empty" style={{ height }} data-slot="symbol-overview-empty">
        {labels.empty}
      </div>
    )
  }
  const [start, end] = span
  const base = makePlot(0, extent(drawn.flatMap((entry) => entry.shown)), {
    height,
    padTop: PAD.top,
    padBottom: PAD.bottom,
  })
  const plotOf = (times: readonly number[]): Plot => ({ ...base, xAt: (index) => timeX(times[index]!, start, end) })
  const mainPlot = plotOf(main.item.times)
  const count = main.item.times.length
  const active = hover !== null && hover < count ? hover : null
  const lastIndex = count - 1
  const at = active ?? lastIndex
  const atTime = main.item.times[at]!
  const atShown = main.shown[at] ?? Number.NaN
  const valueText = (shown: number) => (percent ? formatPercentChange(shown) : formatPrice(shown))
  const axisText = (tick: number) => (percent ? `${tick > 0 ? '+' : ''}${tick}%` : formatPrice(tick))
  const readRows = drawn.flatMap((entry) => {
    const index = nearestIndex(entry.item.times, atTime)
    const shown = index === null ? Number.NaN : entry.shown[index]!
    return Number.isFinite(shown)
      ? [{ key: entry.item.id, label: entry.item.symbol, value: valueText(shown), swatch: entry.color }]
      : []
  })
  const ticks = Array.from({ length: X_TICKS }, (_, i) => start + ((end - start) * i) / (X_TICKS - 1))

  const move = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    if (!(box.width > 0)) return
    const time = start + ((event.clientX - box.left) / box.width) * (end - start)
    const next = nearestIndex(main.item.times, time)
    if (next !== null && next !== hover) setHover(next)
  }

  return (
    <div className="k-symov-plotwrap">
      <div
        className="k-symov-plot"
        style={{ height }}
        role="slider"
        tabIndex={0}
        aria-label={labels.chart}
        aria-valuemin={0}
        aria-valuemax={lastIndex}
        aria-valuenow={at}
        aria-valuetext={`${formatTime(atTime)}  ${readRows.map((row) => `${row.label} ${row.value}`).join('  ')}`}
        data-slot="symbol-overview-plot"
        onPointerMove={move}
        onPointerLeave={() => setHover(null)}
        onBlur={() => setHover(null)}
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey) return
          const next = scrubKey(active, count, event.key, event.shiftKey)
          if (next === undefined) return
          event.preventDefault()
          setHover(next)
        }}
      >
        <svg viewBox={`0 0 ${PLOT_W} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          {area && (
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={main.color} stopOpacity={0.22} />
                <stop offset="100%" stopColor={main.color} stopOpacity={0} />
              </linearGradient>
            </defs>
          )}
          {base.ticks.map((tick) => (
            <line key={tick.value} className="k-ck-grid" x1={0} x2={PLOT_W} y1={tick.y} y2={tick.y} />
          ))}
          {percent && base.domain[0] < 0 && base.domain[1] > 0 && (
            <line className="k-plot-zero" x1={0} x2={PLOT_W} y1={base.yAt(0)} y2={base.yAt(0)} />
          )}
          {area && (
            <path
              className="k-symov-area"
              d={areaPath(main.shown, mainPlot, base.domain[0])}
              fill={`url(#${gradientId})`}
            />
          )}
          {drawn
            .filter((entry) => entry !== main)
            .map((entry) => (
              <path
                key={entry.item.id}
                className="k-symov-line"
                data-slot="symbol-overview-line"
                d={linePath(entry.shown, plotOf(entry.item.times))}
                style={{ stroke: entry.color }}
              />
            ))}
          <path
            className="k-symov-line is-selected"
            data-slot="symbol-overview-line"
            d={linePath(main.shown, mainPlot)}
            style={{ stroke: main.color }}
          />
        </svg>
        {base.ticks.map((tick) => (
          <span key={tick.value} className="k-symov-ytick" style={{ top: Math.round(tick.y) }} aria-hidden="true">
            {axisText(tick.value)}
          </span>
        ))}
        {Number.isFinite(atShown) && (
          <span
            className="k-symov-dot"
            data-slot="symbol-overview-dot"
            style={{ left: pct(mainPlot.xAt(at)), top: Math.round(base.yAt(atShown)) }}
            aria-hidden="true"
          >
            <i style={{ background: main.color }} />
          </span>
        )}
        {active !== null && (
          <>
            <span className="k-plot-cross" style={{ left: pct(mainPlot.xAt(active)) }} />
            <LcdTooltip
              style={{ left: pct(mainPlot.xAt(active)), top: 0 }}
              side={mainPlot.xAt(active) > PLOT_W / 2 ? 'left' : 'right'}
              title={formatTime(atTime)}
              rows={readRows}
            />
          </>
        )}
      </div>
      <div className="k-plot-xaxis k-symov-xaxis" aria-hidden="true">
        {ticks.map((time, index) => (
          <span
            key={time}
            style={{ left: pct(timeX(time, start, end)) }}
            data-align={index === 0 ? 'start' : index === ticks.length - 1 ? 'end' : 'mid'}
          >
            {formatTime(time)}
          </span>
        ))}
      </div>
    </div>
  )
}

// SPDX-License-Identifier: MIT
// 序列探索积木：一排 KPI 瓦片（SparkTile），点一张展开成下面的图面板；面板顶上是指标页签 + 区间切换，图是该指标的序列。
// 交互参照 Arc 的 Metric explorer（uiarc.dev/components/blocks/metric-explorer，2026-11-14 读，只学交互不抄代码）与 Revenue explorer；样子与内容照设计稿
// IntradayPnL、PnLLedger、EquityCurve 三张卡（design/katana-console/project/components）与 dataviz.md：线 2px 不填面、不用涨跌色，柱用 series / ink（费税 ink-100），
// 限额线 signal-red 虚线，休市竖带 bg-100（时间轴不压缩），末点强调色，LCD tooltip，右上三件（表格视图、导出、全屏），顶行对账（期初 → 期末、差额、灯 + 词），页脚来源行。
// 交互：点瓦片展开 / 再点收起；←→ 在页签上切指标；图上有 role="slider" 的扫读，读出带日期的值，←→ 逐点走、Shift 三点、Home / End 到头尾；
//   Esc 先清扫读点、再收起面板；切指标或区间时线平滑变形（Chromium 上用 CSS 的 d 过渡，别的浏览器直接换），页签高亮滑过去。关闭面板的反向过渡没做（直接收起）。
// 决定（Arc 的页面没写，照同类产品定）：默认展开第一个指标、默认区间是 ranges 里最后一个；拖刷选条改窗口后区间按钮不再亮，再点回到它；
//   「对比上一期」画紧挨在窗口前面、一样长的那一段的同一序列，按下标对齐，灰色虚线（基准永远灰）；前面不够长就不画、开关禁用；
//   KPI 变化 = (这期 − 上期) / |上期|，上期没有或为 0 写破折号。数值语法照 precision-instrument.md §2.2（等宽、右对齐、来源行）。
import { DownloadIcon, ExpandIcon, TableIcon } from 'lucide-react'
import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'
import { useScrubber } from '../../lib/use-scrubber'
import { Led } from '../../katana/led'
import { Switch } from '../../primitives/switch'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group'
import { Toolbar, ToolbarGroup, ToolButton } from '../toolbar/toolbar'
import { BrushStrip, type BrushLabels } from '../../quant/brush-chart'
import { clampWindow, type BrushWindow } from '../../quant/brush-model'
import type { ChartActionsLabels } from '../../quant/chart-kit/chart-actions'
import { EndMarker } from '../../quant/chart-kit/end-marker'
import { LcdTooltip } from '../../quant/chart-kit/lcd-tooltip'
import { PlotGrid, PlotYAxis } from '../../quant/chart-kit/plot-axes'
import { linePath, makePlot, pct, PLOT_W } from '../../quant/series-geometry'
import { SparkTile } from '../../quant/spark-tile'
import {
  changeRatio,
  chartExtent,
  pointValue,
  previousWindow,
  rangeWindow,
  reconcileWindow,
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
  /** 给了就按正负着涨跌色（盈亏列）；不给中性色。费税列别给：成本不是亏损。 */
  tone?: (point: SeriesPoint) => number | null
}

export type SeriesExplorerLabels = {
  /** 图的读屏名。 */
  chart: string
  /** 区间按钮那一组的读屏名。 */
  ranges: string
  /** 指标页签那一组的读屏名。 */
  metrics: string
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
  /** 迷你线的读屏名（整句，拿到指标名）。 */
  spark: (metric: string) => string
  /** 限额线的名字（悬停框里与读屏）。 */
  limit: string
  /** 页脚来源行（例「来源 / 账户服务日结 · 09-30 收盘」）；不给不画。 */
  source?: string
  /** 图右上三件。 */
  actions: ChartActionsLabels
  brush: BrushLabels
  /** 对账顶行的字；不给 reconcile 时用不到。 */
  reconcile?: { open: string; close: string; diff: string; ok: string; warn: string; unit?: string }
}

export type SeriesExplorerProps = {
  points: readonly SeriesPoint[]
  series: readonly SeriesDef[]
  ranges: readonly RangeDef[]
  /** 不给取 ranges 的最后一个。 */
  defaultRange?: string
  /** 指标：每个是一张瓦片、一个页签。 */
  kpis: readonly KpiDef[]
  columns: readonly SeriesExplorerColumn[]
  labels: SeriesExplorerLabels
  /** 时间戳写成什么：横轴、悬停框、明细表第一列都用它（ISO 次序）；时区与语言由调用方定。 */
  formatAt: (at: number) => string
  /** 图上的数写成什么：纵轴刻度与悬停框。 */
  formatValue: (value: number) => string
  /** 相对上一期的变化（比例，0.12 是涨 12%）写成什么。 */
  formatChange: (ratio: number) => string
  /** 对账：权益序列、净盈亏序列（可选出入金序列）的键，与区间前的期初权益。期末 − 期初 = Σ净盈亏 + 出入金，对不上就亮 warn 灯并写差额。 */
  reconcile?: {
    net: string
    equity: string
    cashflow?: string
    openingEquity: number
    format: (value: number) => string
  }
  /** 标题下一行的元信息（等宽大写小字，例「RUN 2C91 · 2025-01 → 2026-12 · CNY」）；不给不画。 */
  meta?: string
  /** 图上的事件点：按时间落在序列的点上，画编号引线（01、02……按给的次序编号）。 */
  events?: readonly { at: number; label: string }[]
  /** 导出与全屏回调不给就不画那个按钮。 */
  onExport?: () => void
  onFullscreen?: () => void
  /** 初始展开哪个指标；null 是收起。不给展开第一个。 */
  defaultMetric?: string | null
  /** 图高（px）。 */
  chartHeight?: number
  className?: string
}

const X_TICKS = 5
/** 柱宽占一格的比例（待定：没有出处，看过几组数据再调）。 */
const BAR_SHARE = 0.6
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
  reconcile,
  meta,
  events,
  onExport,
  onFullscreen,
  defaultMetric,
  chartHeight = 220,
  className,
}: SeriesExplorerProps) {
  const [rangeKey, setRangeKey] = useState(defaultRange ?? ranges[ranges.length - 1]?.key ?? '')
  const [metric, setMetric] = useState<string | null>(
    defaultMetric === undefined ? (kpis[0]?.key ?? null) : defaultMetric,
  )
  const [compare, setCompare] = useState(false)
  const [table, setTable] = useState(false)
  // 拖刷选条得到的窗口，记着是在哪个区间下拖的：换区间就作废（渲染时推导，不走 effect）。
  const [dragged, setDragged] = useState<{ range: string; window: BrushWindow } | null>(null)
  const count = points.length
  const range = ranges.find((item) => item.key === rangeKey)
  const base = rangeWindow(points, range?.months ?? null)
  const window = dragged !== null && dragged.range === rangeKey ? clampWindow(dragged.window, count) : base
  const length = window[1] - window[0]
  const previous = previousWindow(window)
  const shown = points.slice(window[0], window[1])

  const kpi = kpis.find((item) => item.key === metric) ?? null
  const def = kpi === null ? null : (series.find((item) => item.key === kpi.series) ?? null)
  const comparing = compare && previous !== null && kpi !== null
  const ghost =
    comparing && kpi
      ? points.slice(previous[0], previous[1]).map((point) => pointValue(point, kpi.series) ?? Number.NaN)
      : []
  const scrub = useScrubber({ count: length, mode: 'band' })
  const active = scrub.index
  const plot = makePlot(
    length,
    chartExtent(points, window, def?.kind === 'bar' ? [def.key] : [], def?.kind === 'line' ? [def.key] : [], [
      ...ghost,
      ...(kpi?.limit === undefined ? [] : [kpi.limit]),
    ]),
    { height: chartHeight, band: true },
  )
  const barWidth = plot.step * BAR_SHARE
  const overview = points.map((point) => (kpi ? (pointValue(point, kpi.series) ?? Number.NaN) : Number.NaN))
  const xTicks = Math.min(X_TICKS, length)
  const activePoint = active === null ? null : shown[active]!
  const lastValue = kpi && shown.length > 0 ? pointValue(shown[shown.length - 1]!, kpi.series) : null
  const markAt = active ?? length - 1
  const markValue = kpi && shown[markAt] ? pointValue(shown[markAt]!, kpi.series) : null
  // 线（净盈亏）用中性墨色：它是一条读数线，不是类别，也不用涨跌色（IntradayPnL 卡）；柱按序列配色，成本柱灰。
  const color =
    def === null
      ? 'var(--ink-100)'
      : def.kind === 'line'
        ? (def.color ?? 'var(--ink-100)')
        : def.cost
          ? 'var(--ink-300)'
          : (def.color ?? 'var(--ink-200)')
  const recon = reconcile ? reconcileWindow(points, window, reconcile, reconcile.openingEquity) : null
  // 明细表最新的在最上面。
  const rows = shown.map((point, i) => ({ point, i })).reverse()
  const metricIndex = Math.max(
    0,
    kpis.findIndex((item) => item.key === metric),
  )

  if (count === 0)
    return (
      <div className={cn('k-sx', className)} data-slot="series-explorer" data-empty="true">
        <p className="k-sx-empty">{labels.empty}</p>
      </div>
    )

  // ← → Home End 在指标之间换（分段按钮本身不接方向键）。
  const tabKey = (event: KeyboardEvent<HTMLElement>) => {
    const dir = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
    const last = kpis.length - 1
    const to =
      dir !== 0
        ? Math.min(last, Math.max(0, metricIndex + dir))
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? last
            : null
    if (to === null) return
    event.preventDefault()
    setMetric(kpis[to]!.key)
    event.currentTarget.querySelectorAll<HTMLElement>('button')[to]?.focus()
  }
  const panelKey = (event: KeyboardEvent<HTMLElement>) => {
    // 扫读点有就由扫读先清（它拦了 Esc）；没有才收起面板。
    if (event.key === 'Escape' && !event.defaultPrevented) setMetric(null)
  }
  const pathStyle = (d: string) => ({ d: `path("${d}")` }) as CSSProperties

  return (
    <div className={cn('k-sx', className)} data-slot="series-explorer" data-range={rangeKey}>
      <div className="k-sx-head" data-slot="series-head">
        <Toolbar label={labels.actions.group}>
          <ToolbarGroup side="left">
            <h4 className="k-sx-title" data-slot="series-title">
              {labels.chart}
            </h4>
            <span className="k-sx-span" data-slot="series-span">
              {formatAt(shown[0]!.at)} – {formatAt(shown[length - 1]!.at)}
            </span>
          </ToolbarGroup>
          <ToolbarGroup side="right">
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
            <ToolButton label={labels.actions.table} pressed={table} onClick={() => setTable(!table)}>
              <TableIcon size={16} aria-hidden="true" />
            </ToolButton>
            {onExport === undefined ? null : (
              <ToolButton label={labels.actions.exportCsv} onClick={onExport}>
                <DownloadIcon size={16} aria-hidden="true" />
              </ToolButton>
            )}
            {onFullscreen === undefined ? null : (
              <ToolButton label={labels.actions.fullscreen} onClick={onFullscreen}>
                <ExpandIcon size={16} aria-hidden="true" />
              </ToolButton>
            )}
          </ToolbarGroup>
        </Toolbar>
      </div>
      {meta && (
        <p className="k-sx-meta" data-slot="series-meta">
          {meta}
        </p>
      )}

      <div className="k-sx-kpis" data-slot="series-kpis">
        {kpis.map((item, itemIndex) => {
          const current = reduceWindow(points, window, item.series, item.reduce)
          const before = previous === null ? null : reduceWindow(points, previous, item.series, item.reduce)
          const ratio = changeRatio(current, before)
          const itemDef = series.find((entry) => entry.key === item.series)
          const spark = shown.map((point) => pointValue(point, item.series)).filter((v): v is number => v !== null)
          return (
            <SparkTile
              key={item.key}
              label={item.label}
              text={current === null ? null : item.format(current)}
              value={current}
              series={spark}
              threshold={item.limit}
              trendTone="neutral"
              delta={ratio === null ? undefined : formatChange(ratio)}
              deltaTone={itemDef?.cost || ratio === null || ratio === 0 ? 'muted' : ratio > 0 ? 'up' : 'down'}
              seriesLabel={labels.spark(item.label)}
              expanded={metric === item.key}
              onOpen={() => setMetric(metric === item.key ? null : item.key)}
              dataKey={item.key}
              index={String(itemIndex + 1).padStart(2, '0')}
            />
          )
        })}
      </div>

      {recon && labels.reconcile && reconcile && (
        <div className="k-sx-recon" data-slot="series-reconcile" data-state={recon.diff === 0 ? 'ok' : 'warn'}>
          <span className="k-sx-recon-line" data-slot="series-reconcile-lcd">
            <span className="k-sx-kv">
              <small>{labels.reconcile.open}</small>
              <b>{reconcile.format(recon.open)}</b>
              {labels.reconcile.unit ? <i>{labels.reconcile.unit}</i> : null}
            </span>
            <em aria-hidden="true">→</em>
            <span className="k-sx-kv">
              <small>{labels.reconcile.close}</small>
              <b>{reconcile.format(recon.close)}</b>
              {labels.reconcile.unit ? <i>{labels.reconcile.unit}</i> : null}
            </span>
            <span className="k-sx-kv k-sx-recon-diff" data-slot="series-reconcile-diff">
              <small>{labels.reconcile.diff}</small>
              <b>{reconcile.format(recon.diff)}</b>
              {labels.reconcile.unit ? <i>{labels.reconcile.unit}</i> : null}
            </span>
          </span>
          <span className="k-sx-recon-state">
            <Led
              state={recon.diff === 0 ? 'ok' : 'warn'}
              label={recon.diff === 0 ? labels.reconcile.ok : labels.reconcile.warn}
            />
            {recon.diff === 0 ? labels.reconcile.ok : labels.reconcile.warn}
          </span>
        </div>
      )}

      {kpi !== null && (
        <div className="k-sx-panel" data-slot="series-panel" data-metric={kpi.key} onKeyDown={panelKey}>
          <div className="k-sx-bar">
            <ToggleGroup
              variant="sm"
              aria-label={labels.metrics}
              value={metric}
              onValueChange={(next) => setMetric(next)}
              onKeyDown={tabKey}
            >
              {kpis.map((item) => (
                <ToggleGroupItem key={item.key} value={item.key} data-slot="series-tab" data-key={item.key}>
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <label className="k-sx-compare">
              <Switch
                checked={comparing}
                disabled={previous === null}
                onCheckedChange={setCompare}
                aria-label={labels.compare}
              />
              <span>{labels.compare}</span>
            </label>
          </div>

          {table ? (
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
          ) : (
            <>
              <div
                className="k-sx-chart"
                style={{ height: chartHeight }}
                role="slider"
                aria-label={labels.chart}
                aria-valuemin={0}
                aria-valuemax={Math.max(0, length - 1)}
                aria-valuenow={markAt}
                aria-valuetext={`${formatAt(shown[markAt]!.at)}  ${markValue === null ? '—' : formatValue(markValue)}`}
                data-slot="series-chart"
                {...scrub.props}
              >
                <svg viewBox={`0 0 ${PLOT_W} ${chartHeight}`} preserveAspectRatio="none" aria-hidden="true">
                  {shown.map((point, i) =>
                    point.closed ? (
                      <rect
                        key={point.at}
                        className="k-sx-closed"
                        data-slot="series-closed"
                        x={plot.xAt(i) - plot.step / 2}
                        y={0}
                        width={plot.step}
                        height={chartHeight}
                      />
                    ) : null,
                  )}
                  <PlotGrid plot={plot} />
                  {plot.domain[0] <= 0 && plot.domain[1] >= 0 && (
                    <line className="k-plot-zero" x1={0} x2={PLOT_W} y1={plot.yAt(0)} y2={plot.yAt(0)} />
                  )}
                  {kpi.limit !== undefined && (
                    <line
                      className="k-sx-limit"
                      data-slot="series-limit"
                      x1={0}
                      x2={PLOT_W}
                      y1={plot.yAt(kpi.limit)}
                      y2={plot.yAt(kpi.limit)}
                    />
                  )}
                  {def?.kind === 'bar' &&
                    shown.map((point, i) =>
                      stackPoint(point, [def.key]).map((segment) => {
                        const top = Math.min(plot.yAt(segment.from), plot.yAt(segment.to))
                        const bottom = Math.max(plot.yAt(segment.from), plot.yAt(segment.to))
                        return (
                          <rect
                            key={`${point.at}-${segment.key}`}
                            className="k-sx-bar-rect"
                            data-slot="series-bar"
                            data-series={segment.key}
                            data-index={i}
                            data-active={active === i ? 'true' : undefined}
                            style={{ fill: color }}
                            x={plot.xAt(i) - barWidth / 2}
                            y={top}
                            width={barWidth}
                            height={Math.max(0.5, bottom - top)}
                          />
                        )
                      }),
                    )}
                  {comparing && (
                    <path
                      className="k-sx-ghost"
                      data-slot="series-compare"
                      d={linePath(ghost, plot)}
                      style={pathStyle(linePath(ghost, plot))}
                    />
                  )}
                  {def?.kind === 'line' && (
                    <path
                      className="k-sx-line"
                      data-slot="series-line"
                      data-series={def.key}
                      style={{
                        stroke: color,
                        ...pathStyle(
                          linePath(
                            shown.map((point) => pointValue(point, def.key) ?? Number.NaN),
                            plot,
                          ),
                        ),
                      }}
                      d={linePath(
                        shown.map((point) => pointValue(point, def.key) ?? Number.NaN),
                        plot,
                      )}
                    />
                  )}
                </svg>
                <PlotYAxis plot={plot} format={formatValue} />
                {kpi.limit !== undefined && plot.domain[0] <= 0 && plot.domain[1] >= 0 && (
                  <span
                    className="k-sx-dim"
                    data-slot="series-dimension"
                    style={{
                      left: pct(PLOT_W * 0.96),
                      top: Math.min(plot.yAt(0), plot.yAt(kpi.limit)),
                      height: Math.abs(plot.yAt(0) - plot.yAt(kpi.limit)),
                    }}
                  >
                    <span className="k-sx-dim-label">{formatValue(kpi.limit)}</span>
                  </span>
                )}
                {def !== null &&
                  (events ?? []).map((event, n) => {
                    const i = shown.findIndex((point) => point.at === event.at)
                    const value = i < 0 ? null : pointValue(shown[i]!, def.key)
                    if (i < 0 || value === null) return null
                    const x = plot.xAt(i)
                    const y = plot.yAt(value)
                    const up = y > 40
                    const side = x > PLOT_W * 0.7 ? 'left' : 'right'
                    return (
                      <span
                        key={event.at}
                        className="k-sx-evt"
                        data-slot="series-event"
                        data-side={side}
                        data-up={up ? 'true' : undefined}
                        style={{ left: pct(x), top: y }}
                      >
                        <i className="k-sx-evt-dot" />
                        <b className="k-sx-evt-lead" />
                        <span className="k-sx-evt-text">
                          <em>{String(n + 1).padStart(2, '0')}</em> {event.label}
                        </span>
                      </span>
                    )
                  })}
                {def?.kind === 'line' && markValue !== null && lastValue !== null && (
                  <EndMarker
                    x={plot.xAt(markAt)}
                    y={plot.yAt(markValue)}
                    value={active === null ? formatValue(lastValue) : undefined}
                  />
                )}
                {active !== null && activePoint !== null && (
                  <>
                    <span className="k-plot-cross" data-slot="series-cross" style={{ left: pct(plot.xAt(active)) }} />
                    <LcdTooltip
                      className="k-sx-tip"
                      style={{ left: pct(plot.xAt(active)), top: 0 }}
                      side={active > length / 2 ? 'left' : 'right'}
                      title={formatAt(activePoint.at)}
                      rows={[
                        {
                          key: kpi.key,
                          label: kpi.label,
                          swatch: color,
                          value: markValue === null ? '—' : formatValue(markValue),
                        },
                        ...(comparing
                          ? [
                              {
                                key: 'prev',
                                label: labels.previous,
                                value: Number.isFinite(ghost[active]) ? formatValue(ghost[active]!) : '—',
                              },
                            ]
                          : []),
                        ...(kpi.limit === undefined
                          ? []
                          : [{ key: 'limit', label: labels.limit, value: formatValue(kpi.limit) }]),
                      ]}
                    />
                  </>
                )}
              </div>
              <div className="k-plot-xaxis k-sx-xaxis" aria-hidden="true">
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
            </>
          )}

          <BrushStrip
            values={overview}
            window={window}
            onWindowChange={(next) => setDragged({ range: rangeKey, window: next })}
            formatX={(index) => formatAt(points[index]!.at)}
            labels={labels.brush}
            height={44}
          />
        </div>
      )}
      {labels.source && (
        <p className="k-sx-source" data-slot="series-source">
          {labels.source}
        </p>
      )}
    </div>
  )
}

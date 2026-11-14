// SPDX-License-Identifier: MIT
// 因子分层累计收益（卡 QuantileLayers，2026-11-14 读）：Q1…Q5 是序数，线色取 seq-200..600（暗到亮，最高层最亮），不用类别色也不用涨跌色。
// 每层一条 2px 线，多空差（最高层 − 最低层）是点阵纹理面垫在下面加一条 ink-100 细线，不单独上色；0 线 line-200；线尾直接标最高层与最低层的名字，最高层末点橙。
// 悬停一层其余变 40%，点击锁定（下面一排按钮也能键盘操作）；图上扫读出 LCD 提示列各层的值；底部一行结论：单调性（灯加词）、各项统计、来源。
// 图右上三件（表格视图必有）。分层多于 10 不画线，只给表格（卡写改热力图，热力图待做）。文字全由 props 传。
import { useState, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { useScrubber } from '../lib/use-scrubber'
import { ChartActions, type ChartActionsLabels } from './chart-kit/chart-actions'
import { DotFill, useDotId } from './chart-kit/dot-fill'
import { EndMarker } from './chart-kit/end-marker'
import { LcdTooltip } from './chart-kit/lcd-tooltip'
import { PlotGrid, PlotYAxis } from './chart-kit/plot-axes'
import { seqColor } from './chart-kit/series-colors'
import {
  isMonotonic,
  layerLevel,
  lastFinite,
  MAX_LINE_LAYERS,
  quantileRange,
  sortLayers,
  type QuantileLayer,
} from './quantile-model'
import { areaPath, linePath, makePlot, pct, PLOT_W } from './series-geometry'

export type QuantileStat = { key: string; label: string; value: string }

export type QuantileLayersLabels = {
  /** 整张图的读屏名。 */
  chart: string
  actions: ChartActionsLabels
  /** 表格第一列（横轴）的表头。 */
  x: string
  /** 层按钮那一排的读屏名。 */
  layers: string
  /** 表格视图的读屏名。 */
  table: string
  /** 单调性结论：通过与不通过各一个词（状态永不单靠颜色）。 */
  monotonicPass: string
  monotonicFail: string
  /** 「单调性」这个项目的名字。 */
  monotonic: string
  /** 分层太多不画线时写什么。 */
  tooMany: string
}

export type QuantileLayersProps = {
  layers: readonly QuantileLayer[]
  /** 多空差序列（最高层减最低层的累计收益）。 */
  longShort: readonly number[]
  longShortLabel: string
  labels: QuantileLayersLabels
  /** 数值怎么写（纵轴、提示、表格）。 */
  formatValue: (value: number) => string
  /** 第几格写成什么（提示标题、表格行头）。 */
  formatX: (index: number) => string
  /** 不给就按期末累计收益是否随层号严格递增算。 */
  monotonic?: boolean
  /** 结论行的统计：多空年化、换手、样本……文字与数字都由调用方按口径写好。 */
  stats: readonly QuantileStat[]
  /** 来源一行（precision-instrument §2.2：每个数字能回答从哪来、什么时候）。 */
  source?: ReactNode
  /** 图标题（卡：因子名 · 分层数 · 口径）。 */
  title?: ReactNode
  height?: number
  onExport?: () => void
  onFullscreen?: () => void
  className?: string
}

export function QuantileLayers({
  layers,
  longShort,
  longShortLabel,
  labels,
  formatValue,
  formatX,
  monotonic,
  stats,
  source,
  title,
  height = 240,
  onExport,
  onFullscreen,
  className,
}: QuantileLayersProps) {
  const sorted = sortLayers(layers)
  const count = Math.max(longShort.length, ...sorted.map((layer) => layer.points.length))
  const [tableView, setTableView] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const [locked, setLocked] = useState<number | null>(null)
  const scrub = useScrubber({ count })
  const fillId = useDotId('ql-fill')
  const drawn = sorted.length <= MAX_LINE_LAYERS
  const plot = makePlot(count, quantileRange(sorted, longShort), { height, padTop: 12, padBottom: 12 })
  const focus = hover ?? locked
  const pass = monotonic ?? isMonotonic(sorted)
  const top = sorted.length - 1
  const at = scrub.index
  const zeroY = plot.yAt(0)

  return (
    <figure className={cn('k-ql', className)} data-slot="quantile-layers" data-monotonic={pass ? 'true' : 'false'}>
      <div className="k-ql-head">
        {title === undefined ? null : <span className="k-ql-title">{title}</span>}
        {drawn && (
          <div className="k-ql-legend" role="group" aria-label={labels.layers}>
            {sorted.map((layer, index) => {
              return (
                <button
                  key={layer.rank}
                  type="button"
                  className="k-ql-layer"
                  data-rank={layer.rank}
                  aria-pressed={locked === layer.rank}
                  onPointerEnter={() => setHover(layer.rank)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(layer.rank)}
                  onBlur={() => setHover(null)}
                  onClick={() => setLocked(locked === layer.rank ? null : layer.rank)}
                >
                  <i className="k-ql-swatch" style={{ background: seqColor(layerLevel(index, sorted.length)) }} />
                  {layer.label}
                </button>
              )
            })}
          </div>
        )}
        <ChartActions
          labels={labels.actions}
          tableView={tableView}
          onTableView={setTableView}
          onExport={onExport}
          onFullscreen={onFullscreen}
        />
      </div>
      {!drawn && <p className="k-ql-note">{labels.tooMany}</p>}
      {drawn && !tableView && (
        <div className="k-ql-plot" style={{ height }} role="group" aria-label={labels.chart} {...scrub.props}>
          <svg viewBox={`0 0 ${PLOT_W} ${height}`} preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <DotFill id={fillId} color="var(--ink-400)" />
            </defs>
            <PlotGrid plot={plot} />
            <path className="k-ql-fill" d={areaPath(longShort, plot, 0)} style={{ fill: `url(#${fillId})` }} />
            <line className="k-ql-zero" x1={0} x2={PLOT_W} y1={zeroY} y2={zeroY} />
            <path className="k-ql-ls" data-slot="quantile-long-short" d={linePath(longShort, plot)} />
            {sorted.map((layer, index) => (
              <path
                key={layer.rank}
                className="k-ql-line"
                data-slot="quantile-line"
                data-rank={layer.rank}
                data-dim={focus !== null && focus !== layer.rank ? 'true' : 'false'}
                d={linePath(layer.points, plot)}
                style={{ stroke: seqColor(layerLevel(index, sorted.length)) }}
              />
            ))}
            {at !== null && <line className="k-ql-cursor" x1={plot.xAt(at)} x2={plot.xAt(at)} y1={0} y2={height} />}
          </svg>
          <PlotYAxis plot={plot} format={formatValue} />
          {/* 线尾直接标「名字 数值」：最低层、最高层、多空差各一个；最高层的末点是强调色圆点（数值写在尾标里，不再另标一个）。 */}
          {[
            ...(sorted.length > 1 ? [sorted[0]!] : []),
            ...(sorted.length > 0 ? [sorted[top]!] : []),
            { rank: -1, label: longShortLabel, points: longShort },
          ].map((layer) => {
            const end = lastFinite(layer.points)
            if (!Number.isFinite(end)) return null
            return (
              <span
                key={layer.rank}
                className="k-ql-tail"
                data-slot="quantile-tail"
                style={{ left: '100%', top: plot.yAt(end) }}
              >
                {layer.label} <span className="k-ql-tail-value">{formatValue(end)}</span>
              </span>
            )
          })}
          {sorted[top] && Number.isFinite(lastFinite(sorted[top].points)) && (
            <EndMarker x={plot.xAt(sorted[top].points.length - 1)} y={plot.yAt(lastFinite(sorted[top].points))} />
          )}
          {at !== null && (
            <LcdTooltip
              title={formatX(at)}
              side={at > count * 0.6 ? 'left' : 'right'}
              style={{ left: pct(plot.xAt(at)), top: 8 }}
              rows={[
                ...[...sorted].reverse().map((layer) => ({
                  key: String(layer.rank),
                  label: layer.label,
                  value: Number.isFinite(layer.points[at]) ? formatValue(layer.points[at]!) : '—',
                  swatch: seqColor(layerLevel(sorted.indexOf(layer), sorted.length)),
                })),
                {
                  key: 'ls',
                  label: longShortLabel,
                  value: Number.isFinite(longShort[at]) ? formatValue(longShort[at]!) : '—',
                },
              ]}
            />
          )}
          <div className="k-ql-xaxis" aria-hidden="true">
            <span>{formatX(0)}</span>
            <span>{formatX(count - 1)}</span>
          </div>
        </div>
      )}
      {(tableView || !drawn) && (
        <div
          className="k-sx-table k-ql-table"
          tabIndex={0}
          role="region"
          aria-label={labels.table}
          data-slot="quantile-table"
        >
          <table>
            <thead>
              <tr>
                <th scope="col">{labels.x}</th>
                {sorted.map((layer) => (
                  <th key={layer.rank} scope="col">
                    {layer.label}
                  </th>
                ))}
                <th scope="col">{longShortLabel}</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: count }, (_, i) => (
                <tr key={i}>
                  <th scope="row">{formatX(i)}</th>
                  {sorted.map((layer) => (
                    <td key={layer.rank}>{Number.isFinite(layer.points[i]) ? formatValue(layer.points[i]!) : '—'}</td>
                  ))}
                  <td>{Number.isFinite(longShort[i]) ? formatValue(longShort[i]!) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="k-ql-summary" data-slot="quantile-summary">
        <span className="k-ql-verdict" data-ok={pass ? 'true' : 'false'}>
          <i className="k-ql-lamp" aria-hidden="true" />
          {labels.monotonic} {pass ? labels.monotonicPass : labels.monotonicFail}
        </span>
        {stats.map((stat) => (
          <span key={stat.key} className="k-ql-stat">
            <span className="k-ql-stat-label">{stat.label}</span> <span className="k-ql-stat-value">{stat.value}</span>
          </span>
        ))}
      </p>
      {source === undefined ? null : <p className="k-ql-source">{source}</p>}
    </figure>
  )
}

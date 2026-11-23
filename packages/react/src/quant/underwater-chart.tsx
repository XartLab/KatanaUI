// SPDX-License-Identifier: MIT
// 水下回撤图（#120，对照 MultiCharts 的 Strategy Performance Report 的 Drawdown 页）：权益距历史最高的回撤百分比随时间的面积图，
// 标出最大回撤段（前高到恢复的一段底色）、谷底读数与恢复时长。横轴是时间，定义域与刻度写法同 EquityCurve（xDomain / xTicks / formatTime），
// 两张图叠着放时左侧留白一致（--k-plot-gutter 56px），同一时刻落在同一列。面是点阵纹理（chart-kit 的 DotFill），不用实色。
// 数据由调用方给（drawdown 是小数，≤ 0）；包里不带语言，文字与数值格式都由调用方传。纯逻辑在 underwater-model.ts。
import { useState, type PointerEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { useScrubber } from '../lib/use-scrubber.ts'
import { ChartActions } from '../lib/chart/chart-kit/chart-actions.tsx'
import { ChartTable, type ChartViewProps } from '../lib/chart/chart-kit/chart-table.tsx'
import { DotFill, useDotId } from '../lib/chart/chart-kit/dot-fill.tsx'
import { LcdTooltip } from '../lib/chart/chart-kit/lcd-tooltip.tsx'
import { PlotGrid, PlotYAxis } from '../lib/chart/chart-kit/plot-axes.tsx'
import { niceTicks, pct, PLOT_W, type Plot } from '../lib/chart/series-geometry.ts'
import { defaultTimeTicks, timeX } from './equity-curve-model.ts'
import { maxDrawdownSegment, type UnderwaterPoint } from './underwater-model.ts'

export type UnderwaterChartLabels = {
  /** 回撤的名字（图例、提示窗）。 */
  drawdown: string
  /** 「最大回撤」。 */
  maxDrawdown: string
  /** 「前高到谷底」。 */
  fall: string
  /** 「恢复」（谷底回到前高用了多久）。 */
  recovery: string
  /** 到末点还没回到前高时恢复一栏写什么，如「尚未恢复」。 */
  notRecovered: string
  /** 整段都没有回撤时写什么，如「没有回撤」。 */
  noDrawdown: string
}

export type UnderwaterChartProps = ChartViewProps & {
  points: readonly UnderwaterPoint[]
  /** 标题：一行只写名字。 */
  title: string
  /** 整张图的读屏名。 */
  label: string
  /** 横轴定义域 [起, 止]（毫秒）；与 EquityCurve 画同一段时间时两边用同一对值（或同一组点的首末时刻）。不给就取 points 的首末点。 */
  xDomain?: readonly [number, number]
  /** 横轴刻度：写法同 EquityCurve；不给就在定义域里均分 5 个，用 formatTime 写。 */
  xTicks?: (start: number, end: number) => readonly { time: number; label: string }[]
  formatTime: (time: number) => string
  /** 回撤的写法：参数是小数（-0.12），如「-12.0%」。纵轴刻度、读数、提示窗都用它。 */
  formatPercent: (value: number) => string
  /** 时长的写法：参数是毫秒，如「12 天」。 */
  formatDuration: (ms: number) => string
  labels: UnderwaterChartLabels
  className?: string
}

const HEIGHT = 120
const PAD = { top: 8, bottom: 8 }

export function UnderwaterChart({
  points,
  title,
  label,
  xDomain,
  xTicks,
  formatTime,
  formatPercent,
  formatDuration,
  labels,
  actionLabels,
  tableLabel,
  tableHead,
  source,
  onExport,
  onFullscreen,
  onCopyImage,
  className,
}: UnderwaterChartProps) {
  const [table, setTable] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const dotId = useDotId('uw')
  const start = xDomain?.[0] ?? points[0]?.time ?? 0
  const end = xDomain?.[1] ?? points[points.length - 1]?.time ?? 0
  // 定义域比点窄时（和只画一段的权益曲线对齐）只画落在里面的点；最大回撤也只在这一段里找。
  const shown = xDomain === undefined ? points : points.filter((p) => p.time >= start && p.time <= end)
  const count = shown.length
  const scrub = useScrubber({ count, index: hover, onIndexChange: setHover })
  if (count === 0) return null

  const segment = maxDrawdownSegment(shown)
  const deepest = Math.min(0, ...shown.map((p) => p.drawdown))
  const nice = niceTicks(deepest, 0, 4)
  const low = Math.min(nice.domain[0], deepest)
  const top = PAD.top
  const bottom = HEIGHT - PAD.bottom
  // 0 在最上，往下越深；全是 0 时区间退化，画一条平线。
  const yAt = (value: number) => (low === 0 ? top : top + (value / low) * (bottom - top))
  const xAt = (index: number) => timeX(shown[index]!.time, start, end)
  const plot: Plot = {
    count,
    domain: [low, 0],
    xAt,
    yAt,
    step: PLOT_W,
    ticks: nice.ticks.filter((tick) => tick <= 0 && tick >= low).map((value) => ({ value, y: yAt(value) })),
  }
  const line = shown.map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(2)},${yAt(p.drawdown).toFixed(2)}`).join('')
  const area = deepest === 0 ? '' : `${line}L${xAt(count - 1).toFixed(2)},${top}L${xAt(0).toFixed(2)},${top}Z`
  const ticks = (xTicks ?? ((a, b) => defaultTimeTicks(a, b, 5, formatTime)))(start, end)
  const active = scrub.index
  const marked = shown[active ?? count - 1]!

  // 悬停取横向最近的点（点不等距，不能按格数换算）。
  const move = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    if (!(box.width > 0)) return
    const at = ((event.clientX - box.left) / box.width) * PLOT_W
    let nearest = 0
    for (let index = 1; index < count; index++)
      if (Math.abs(xAt(index) - at) <= Math.abs(xAt(nearest) - at)) nearest = index
    setHover(nearest)
  }
  const segLeft = segment ? xAt(segment.peakIndex) : 0
  const segRight = segment ? xAt(segment.endIndex) : 0

  return (
    <figure className={cn('k-uw', className)} data-slot="underwater-chart">
      <div className="k-uw-head">
        <h4 className="k-uw-title">{title}</h4>
        <span className="k-uw-key" aria-hidden="true">
          <i className="k-uw-key-dd" />
          {labels.drawdown}
        </span>
        <output className="k-uw-facts" data-slot="underwater-facts">
          {segment ? (
            <>
              <span data-fact="depth">
                {labels.maxDrawdown} {formatPercent(segment.depth)}
              </span>
              <span data-fact="fall">
                {labels.fall} {formatDuration(segment.fallMs)}
              </span>
              <span data-fact="recovery" data-open={segment.recoveryMs === null ? '' : undefined}>
                {labels.recovery}{' '}
                {segment.recoveryMs === null ? labels.notRecovered : formatDuration(segment.recoveryMs)}
              </span>
            </>
          ) : (
            labels.noDrawdown
          )}
        </output>
        <ChartActions
          labels={actionLabels}
          tableView={table}
          onTableView={setTable}
          onExport={onExport}
          onFullscreen={onFullscreen}
          onCopyImage={onCopyImage}
        />
      </div>
      {table ? (
        <ChartTable
          slot="underwater-table"
          numeric={[1]}
          label={tableLabel}
          head={tableHead}
          rows={shown.map((p, i) => ({
            key: `${p.time}-${i}`,
            cells: [formatTime(p.time), formatPercent(p.drawdown)],
          }))}
        />
      ) : (
        <div className="k-uw-body">
          <div
            className="k-uw-main"
            style={{ height: HEIGHT }}
            role="slider"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={count - 1}
            aria-valuenow={active ?? count - 1}
            aria-valuetext={`${formatTime(marked.time)}  ${formatPercent(marked.drawdown)}`}
            data-slot="underwater-main"
            tabIndex={0}
            onPointerMove={move}
            onPointerLeave={scrub.pointer.onPointerLeave}
            onKeyDown={scrub.keys.onKeyDown}
            onBlur={scrub.keys.onBlur}
          >
            <svg viewBox={`0 0 ${PLOT_W} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <DotFill id={dotId} color="color-mix(in srgb, var(--pnl-down) 60%, transparent)" />
              </defs>
              <PlotGrid plot={plot} />
              {segment && (
                <rect
                  className="k-uw-seg"
                  data-slot="underwater-segment"
                  data-open={segment.recoveryIndex === null ? '' : undefined}
                  x={segLeft}
                  y={0}
                  width={Math.max(1, segRight - segLeft)}
                  height={HEIGHT}
                />
              )}
              <line className="k-ck-grid k-uw-zero" x1={0} x2={PLOT_W} y1={top} y2={top} />
              {area && <path className="k-uw-area" data-slot="underwater-area" d={area} fill={`url(#${dotId})`} />}
              {area && <path className="k-uw-line" d={line} />}
            </svg>
            <PlotYAxis plot={plot} format={formatPercent} />
            {segment && (
              <span
                className="k-uw-trough"
                data-slot="underwater-trough"
                style={{ left: pct(xAt(segment.troughIndex)), top: Math.round(yAt(segment.depth)) }}
              >
                <i />
                <b>{formatPercent(segment.depth)}</b>
              </span>
            )}
            {active !== null && (
              <>
                <span className="k-plot-cross" data-slot="underwater-cross" style={{ left: pct(xAt(active)) }} />
                <LcdTooltip
                  style={{ left: pct(xAt(active)), top: 0 }}
                  side={active > count / 2 ? 'left' : 'right'}
                  title={formatTime(marked.time)}
                  rows={[{ key: 'dd', label: labels.drawdown, value: formatPercent(marked.drawdown) }]}
                />
              </>
            )}
          </div>
          <div className="k-plot-xaxis k-uw-xaxis" aria-hidden="true">
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
      {source !== undefined && (
        <figcaption className="k-dist-source" data-slot="underwater-source">
          {source}
        </figcaption>
      )}
    </figure>
  )
}

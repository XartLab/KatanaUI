// SPDX-License-Identifier: MIT
// 瀑布图（盈亏桥）：期初权益 → 已实现 → 手续费 → 资金费 → 期末，一根根浮动的柱，涨跌色跟涨跌配色走，总计柱用中性色，相邻柱之间连一条水平线。
// 功能参照 Arc 的 MRR waterfall（uiarc.dev/components/charts，2026-11-14 读，只取功能），实现原创。扫读用 useScrubber（band 模式）。
import { cn } from '../lib/cn'
import { useScrubber } from '../lib/use-scrubber'
import { makePlot, pct, PLOT_W } from './series-geometry'
import { waterfallBars, waterfallExtent, type WaterfallBar, type WaterfallStep } from './waterfall-model'

/** 柱宽占一格的比例：0.6 是取个不挤不稀的值（待定：没有出处，看过几组数据再调）。 */
const BAR_SHARE = 0.6

/** 纵轴刻度是一个数，不是哪一步：当成总计柱交给 formatValue。 */
const tickBar = (value: number): WaterfallBar => ({
  key: '',
  label: '',
  kind: 'total',
  from: 0,
  to: value,
  end: value,
  gap: 0,
  direction: 'total',
})

export type WaterfallChartProps = {
  steps: readonly WaterfallStep[]
  /** 整张图的读屏名。 */
  label: string
  /** 一根柱写成什么字：增减柱传这一步的值，总计柱传累计；由调用方定正负号与单位。 */
  formatValue: (value: number, bar: WaterfallBar) => string
  /** 总计柱与前面累计对不上时，读数里补的那句（拿到差额）；不给就不提。 */
  formatGap?: (gap: number) => string
  /** 纵轴从 0 起、总计柱从 0 画（默认 false：纵轴取数据范围加余量，总计柱是从轴底起的截断柱，增减看得清）。 */
  zeroBaseline?: boolean
  height?: number
  className?: string
}

export function WaterfallChart({
  steps,
  label,
  formatValue,
  formatGap,
  zeroBaseline = false,
  height = 200,
  className,
}: WaterfallChartProps) {
  const bars = waterfallBars(steps)
  const scrub = useScrubber({ count: bars.length, mode: 'band' })
  const plot = makePlot(bars.length, waterfallExtent(bars, zeroBaseline), { height, band: true, padTop: 16 })
  const barWidth = plot.step * BAR_SHARE
  const [floor] = plot.domain
  const hasZero = plot.domain[0] <= 0 && plot.domain[1] >= 0
  const active = scrub.index === null ? null : bars[scrub.index]!
  const text = (bar: WaterfallBar) => formatValue(bar.kind === 'total' ? bar.end : bar.gap, bar)
  const readout = (bar: WaterfallBar) =>
    `${bar.label}  ${text(bar)}${bar.kind === 'total' && bar.gap !== 0 && formatGap ? `  ${formatGap(bar.gap)}` : ''}`

  return (
    <figure className={cn('k-wf', className)} data-slot="waterfall-chart" aria-label={label}>
      <div className="k-wf-plot" style={{ height }} role="group" aria-label={label} {...scrub.props}>
        <svg viewBox={`0 0 ${PLOT_W} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          {plot.ticks.map((tick) => (
            <line key={tick.value} className="k-plot-grid" x1={0} x2={PLOT_W} y1={tick.y} y2={tick.y} />
          ))}
          {hasZero ? <line className="k-wf-zero" x1={0} x2={PLOT_W} y1={plot.yAt(0)} y2={plot.yAt(0)} /> : null}
          {bars.slice(1).map((bar, i) => {
            const prev = bars[i]!
            const y = plot.yAt(prev.end)
            return (
              <line
                key={bar.key}
                className="k-wf-link"
                x1={plot.xAt(i) + barWidth / 2}
                x2={plot.xAt(i + 1) - barWidth / 2}
                y1={y}
                y2={y}
              />
            )
          })}
          {bars.map((bar, i) => {
            const from = bar.kind === 'total' && !zeroBaseline ? floor : bar.from
            const top = Math.min(plot.yAt(from), plot.yAt(bar.to))
            const bottom = Math.max(plot.yAt(from), plot.yAt(bar.to))
            return (
              <rect
                key={bar.key}
                className="k-wf-bar"
                data-slot="waterfall-bar"
                data-key={bar.key}
                data-direction={bar.direction}
                data-truncated={bar.kind === 'total' && !zeroBaseline ? 'true' : undefined}
                data-gap={bar.kind === 'total' && bar.gap !== 0 ? 'true' : undefined}
                data-active={scrub.index === i ? 'true' : undefined}
                x={plot.xAt(i) - barWidth / 2}
                y={top}
                width={barWidth}
                height={Math.max(1, bottom - top)}
              />
            )
          })}
        </svg>
        {plot.ticks.map((tick) => (
          <span key={tick.value} className="k-plot-ytick k-wf-ytick" style={{ top: tick.y }}>
            {formatValue(tick.value, tickBar(tick.value))}
          </span>
        ))}
        {bars.map((bar, i) => (
          <span
            key={bar.key}
            className="k-wf-value"
            data-direction={bar.direction}
            style={{
              left: pct(plot.xAt(i)),
              top: Math.min(plot.yAt(bar.kind === 'total' && !zeroBaseline ? floor : bar.from), plot.yAt(bar.to)),
            }}
          >
            {text(bar)}
          </span>
        ))}
      </div>
      <div className="k-wf-labels" aria-hidden="true">
        {bars.map((bar) => (
          <span key={bar.key}>{bar.label}</span>
        ))}
      </div>
      <div className="k-plot-readout" data-slot="waterfall-readout" aria-live="polite">
        {active ? readout(active) : null}
      </div>
      <ul className="sr-only">
        {bars.map((bar) => (
          <li key={bar.key}>{readout(bar)}</li>
        ))}
      </ul>
    </figure>
  )
}

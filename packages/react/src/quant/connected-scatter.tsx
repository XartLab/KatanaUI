// SPDX-License-Identifier: MIT
// 连线散点图：每个点是一个时刻的 (x, y)，按时间顺序连成轨迹，看一个对象在两个量之间怎么走（如策略的波动 vs 收益按月的路径，风格漂移）。
// 时间方向三路表达，不靠颜色：起点是空心圈、终点是实心圈加箭头，点越靠后越不透明。多条轨迹各取 series 色板里的一个色，悬停或聚焦一个点其余轨迹变暗。
// 功能参照 Arc Connected scatter（uiarc.dev，2026-11-14 读，范例是 CAC vs LTV 随时间的路径），实现原创。文字全由 props 传。
import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { seqColor } from './chart-kit/series-colors'
import { moveScatter, scatterLayout, type ScatterFrame, type ScatterSeries } from './scatter-model'

const FRAME: ScatterFrame = { width: 640, height: 360, left: 52, top: 14, right: 18, bottom: 40 }
/** series 色板七个 token，多于七条轨迹时循环。 */
const PALETTE = ['--series-1', '--series-2', '--series-3', '--series-4', '--series-5', '--series-6', '--series-7']
const colorOf = (index: number): CSSProperties =>
  ({ '--k-scatter-color': `var(${PALETTE[index % PALETTE.length]})` }) as CSSProperties

export type ConnectedScatterProps = {
  series: readonly ScatterSeries[]
  /** 整张图的读屏名。 */
  label: string
  /** 两根轴的名字（画在轴旁）。 */
  axes: { x: string; y: string }
  formatX?: (value: number) => string
  formatY?: (value: number) => string
  /** 轴范围；不给取全体数据放宽 5%。 */
  xDomain?: readonly [number, number]
  yDomain?: readonly [number, number]
  /** 没有悬停也没有聚焦时读数行写什么。 */
  idle?: ReactNode
  className?: string
}

export function ConnectedScatter({
  series,
  label,
  axes,
  formatX = String,
  formatY = String,
  xDomain,
  yDomain,
  idle,
  className,
}: ConnectedScatterProps) {
  const layout = scatterLayout(series, FRAME, { xDomain, yDomain })
  const counts = series.map((item) => item.points.length)
  const [hover, setHover] = useState<[number, number] | null>(null)
  const [focus, setFocus] = useState<[number, number] | null>(null)
  const [tab, setTab] = useState<[number, number]>([0, Math.max(0, (counts[0] ?? 1) - 1)])
  const refs = useRef(new Map<string, SVGCircleElement>())
  const stop: [number, number] = counts[tab[0]] !== undefined && tab[1] < counts[tab[0]]! ? tab : [0, 0]
  const active = hover ?? focus
  const onKey = (event: KeyboardEvent) => {
    const next = moveScatter(stop, event.key, counts)
    if (next === null) return
    event.preventDefault()
    setTab(next)
    refs.current.get(`${next[0]}:${next[1]}`)?.focus()
  }
  const bottom = FRAME.height - FRAME.bottom

  return (
    <figure className={`k-scatter${className ? ` ${className}` : ''}`} data-slot="connected-scatter">
      <svg
        className="k-scatter-svg"
        viewBox={`0 0 ${FRAME.width} ${FRAME.height}`}
        role="group"
        aria-label={label}
        onKeyDown={onKey}
        onMouseLeave={() => setHover(null)}
      >
        {layout.yTicks.map((tick) => (
          <g key={`y${tick.value}`} className="k-scatter-tick" data-axis="y">
            <line x1={FRAME.left} x2={FRAME.width - FRAME.right} y1={tick.at} y2={tick.at} />
            <text x={FRAME.left - 8} y={tick.at} dy="0.35em" textAnchor="end">
              {formatY(tick.value)}
            </text>
          </g>
        ))}
        {layout.xTicks.map((tick) => (
          <g key={`x${tick.value}`} className="k-scatter-tick" data-axis="x">
            <line x1={tick.at} x2={tick.at} y1={FRAME.top} y2={bottom} />
            <text x={tick.at} y={bottom + 16} textAnchor="middle">
              {formatX(tick.value)}
            </text>
          </g>
        ))}
        <text
          className="k-scatter-axis"
          x={(FRAME.left + FRAME.width - FRAME.right) / 2}
          y={FRAME.height - 4}
          textAnchor="middle"
        >
          {axes.x}
        </text>
        <text className="k-scatter-axis" x={FRAME.left} y={FRAME.top - 2} textAnchor="start">
          {axes.y}
        </text>
        {series.map((item, s) => {
          const mapped = layout.series[s]!
          const n = item.points.length
          return (
            <g
              key={item.id}
              className="k-scatter-series"
              data-id={item.id}
              data-dim={active !== null && active[0] !== s ? 'true' : 'false'}
              style={colorOf(s)}
              role="group"
              aria-label={item.label}
            >
              <polyline
                className="k-scatter-path"
                points={mapped.points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}
              />
              {mapped.arrow && (
                <polygon
                  className="k-scatter-arrow"
                  points={mapped.arrow.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')}
                />
              )}
              {item.points.map((point, i) => (
                <circle
                  // 轨迹的点按时间排，下标就是它的身份。
                  key={i}
                  ref={(node) => {
                    if (node) refs.current.set(`${s}:${i}`, node)
                    else refs.current.delete(`${s}:${i}`)
                  }}
                  className="k-scatter-dot"
                  data-kind={i === 0 ? 'start' : i === n - 1 ? 'end' : 'mid'}
                  cx={mapped.points[i]!.x}
                  cy={mapped.points[i]!.y}
                  r={i === 0 || i === n - 1 ? 5 : 3.5}
                  style={{ ['--k-dot' as string]: seqColor(n > 1 ? (4 * i) / (n - 1) : 4) }}
                  role="img"
                  aria-label={point.label}
                  tabIndex={stop[0] === s && stop[1] === i ? 0 : -1}
                  onMouseEnter={() => setHover([s, i])}
                  onFocus={() => {
                    setFocus([s, i])
                    setTab([s, i])
                  }}
                  onBlur={() => setFocus(null)}
                />
              ))}
            </g>
          )
        })}
      </svg>
      <ul className="k-scatter-legend">
        {series.map((item, s) => (
          <li key={item.id} style={colorOf(s)}>
            {item.label}
          </li>
        ))}
      </ul>
      <output className="k-scatter-readout">
        {active === null ? idle : series[active[0]]?.points[active[1]]?.label}
      </output>
    </figure>
  )
}

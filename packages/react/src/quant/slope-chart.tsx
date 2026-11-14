// SPDX-License-Identifier: MIT
// 斜率图：每项一条线连「前」「后」两列，看再平衡前后的权重、因子排名的变化。线按变化涂涨跌色（颜色跟 data-updown 走），
// 两侧写名字与数，标签互相不重叠；rank 模式不看数值、只看名次的升降。悬停或聚焦一条，其余变暗，读数行写整句；上下键在条间走，Enter 选中。
// 功能参照 Arc Slope chart（uiarc.dev，2026-11-14 读，页面只写了这个名字），实现原创；用在 RebalanceDesk 的差额。文字全由 props 传。
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { slopeLayout, type SlopeItem, type SlopeMode } from './slope-model'

const W = 560
const PAD = 16
const TOP = 28
const LABEL = 150
/** 标签行距（viewBox 单位）：一行字 11px 的行高 16，留 2 的空隙。 */
const GAP = 18

export type SlopeChartProps = {
  items: readonly SlopeItem[]
  /** 整张图的读屏名。 */
  label: string
  /** 两列的列头，如「调整前」「调整后」。 */
  columns: { before: string; after: string }
  /** 一条的整句（读屏名与读数行）。 */
  describe: (item: SlopeItem, change: number) => string
  /** value：纵轴是数值；rank：纵轴是名次（第 1 名在上），线的涨跌看名次升降。 */
  mode?: SlopeMode
  /** 数值怎么写（两侧标签）；rank 模式写名次，传「第 n 名」这类。 */
  formatValue?: (value: number) => string
  /** 图高（viewBox 单位）；默认按条数每条 GAP 高、至少 160。 */
  height?: number
  onSelect?: (item: SlopeItem) => void
  idle?: ReactNode
  className?: string
}

export function SlopeChart({
  items,
  label,
  columns,
  describe,
  mode = 'value',
  formatValue = String,
  height,
  onSelect,
  idle,
  className,
}: SlopeChartProps) {
  const H = height ?? Math.max(160, TOP + items.length * GAP + PAD)
  const rows = slopeLayout(items, { mode, top: TOP, bottom: H - PAD, labelGap: GAP })
  const order = rows
    .map((row, index) => ({ index, y: row.y0 }))
    .sort((a, b) => a.y - b.y || a.index - b.index)
    .map((entry) => entry.index)
  const [hover, setHover] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  const [tab, setTab] = useState(order[0] ?? 0)
  const refs = useRef<(SVGGElement | null)[]>([])
  const x0 = PAD + LABEL
  const x1 = W - PAD - LABEL
  const active = hover ?? focus
  const stop = rows[tab] ? tab : (order[0] ?? 0)
  const onKey = (event: KeyboardEvent) => {
    const at = order.indexOf(stop)
    const next =
      event.key === 'ArrowDown'
        ? order[Math.min(order.length - 1, at + 1)]
        : event.key === 'ArrowUp'
          ? order[Math.max(0, at - 1)]
          : event.key === 'Home'
            ? order[0]
            : event.key === 'End'
              ? order.at(-1)
              : undefined
    if (next === undefined) return
    event.preventDefault()
    setTab(next)
    refs.current[next]?.focus()
  }
  const marks = (i: number) => {
    const row = rows[i]!
    const item = items[i]!
    return (
      <>
        <line className="k-slope-line" x1={x0} y1={row.y0} x2={x1} y2={row.y1} />
        <circle className="k-slope-dot" cx={x0} cy={row.y0} r={3.5} />
        <circle className="k-slope-dot" cx={x1} cy={row.y1} r={3.5} />
        <text className="k-slope-text" x={x0 - 10} y={row.label0} dy="0.35em" textAnchor="end">
          {item.label} {formatValue(item.before)}
        </text>
        <text className="k-slope-text" x={x1 + 10} y={row.label1} dy="0.35em" textAnchor="start">
          {formatValue(item.after)} {item.label}
        </text>
      </>
    )
  }

  return (
    <figure className={`k-slope${className ? ` ${className}` : ''}`} data-slot="slope-chart">
      <svg
        className="k-slope-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="group"
        aria-label={label}
        onKeyDown={onKey}
        onMouseLeave={() => setHover(null)}
      >
        <text className="k-slope-head" x={x0} y={14} textAnchor="middle">
          {columns.before}
        </text>
        <text className="k-slope-head" x={x1} y={14} textAnchor="middle">
          {columns.after}
        </text>
        {rows.map((row, i) => {
          const item = items[i]!
          return (
            <g
              key={item.id}
              ref={(node) => {
                refs.current[i] = node
              }}
              className={`k-slope-item${onSelect ? ' is-link' : ''}`}
              data-id={item.id}
              data-tone={row.tone}
              data-dim={active !== null && active !== i ? 'true' : 'false'}
              role="img"
              aria-label={describe(item, row.change)}
              tabIndex={i === stop ? 0 : -1}
              onMouseEnter={() => setHover(i)}
              onFocus={() => {
                setFocus(i)
                setTab(i)
              }}
              onBlur={() => setFocus(null)}
              onClick={onSelect ? () => onSelect(item) : undefined}
              onKeyDown={
                onSelect
                  ? (event) => {
                      if (event.key === 'Enter') onSelect(item)
                    }
                  : undefined
              }
            >
              <line className="k-slope-hit" x1={x0} y1={row.y0} x2={x1} y2={row.y1} />
              {marks(i)}
            </g>
          )
        })}
        {/* 当前这条再画一遍在最上面（SVG 没有 z-index，挪动原节点会丢焦点与悬停），不收指针也不进读屏。 */}
        {active !== null && (
          <g className="k-slope-item k-slope-over" data-tone={rows[active]!.tone} aria-hidden="true">
            {marks(active)}
          </g>
        )}
      </svg>
      <output className="k-slope-readout">
        {active === null ? idle : describe(items[active]!, rows[active]!.change)}
      </output>
    </figure>
  )
}

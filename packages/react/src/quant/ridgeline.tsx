// SPDX-License-Identifier: MIT
// 山脊图：每组一条核密度曲线，上下叠着排，一眼比各组分布的位置、宽窄与形状（分位层、因子分组的收益分布）。
// 每条画密度曲线与中位数的竖标；给了 baseline（如 0）就画一条贯穿的虚线。分层是序数：线与点阵面的颜色取 seq-200..600（暗到亮，按条的次序），
// 不用涨跌色，涨跌色也不上面积（dataviz §2、卡 QuantileLayers）；面的纹理与强调色都读 chart-kit 的变量。
// 悬停或聚焦一条，其余变暗，读数行写这一条的整句；上下键在条间走。带宽默认 Silverman 经验规则（见 ridgeline-model.ts）。
// 功能参照 Arc Ridgeline（uiarc.dev，2026-11-14 读，页面只写了这个名字），实现原创。文字全由 props 传。
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { linearScale, niceTicks } from './chart-scale'
import { ChartActions } from './chart-kit/chart-actions'
import { ChartTable, type ChartViewProps } from './chart-kit/chart-table'
import { DotFill, useDotId } from './chart-kit/dot-fill'
import { seqColor } from './chart-kit/series-colors'
import { layerLevel } from './quantile-model'
import { gaussianKde, ridgelines, type RidgeGroup, type RidgeStats } from './ridgeline-model'

const W = 640
const LEFT = 104
const RIGHT = 12
const AXIS = 28

export type RidgelineProps = ChartViewProps & {
  groups: readonly RidgeGroup[]
  /** 整张图的读屏名。 */
  label: string
  /** 一条的整句（读屏名与读数行）：由调用方按界面语言写。 */
  describe: (group: RidgeGroup, stats: RidgeStats) => string
  /** 数值怎么写（横轴刻度）。 */
  formatValue?: (value: number) => string
  /** 参照线的位置（如 0）；给了就画一条贯穿的虚线。 */
  baseline?: number
  /** 横轴范围；不给取全体数据加两头各 3 个带宽。 */
  domain?: readonly [number, number]
  /** 核密度的带宽；不给每组用 Silverman 规则。 */
  bandwidth?: number
  /** 一行的高（viewBox 单位）。 */
  rowHeight?: number
  /** 最高的山峰是一行高的几倍：大于 1 山脊会叠进上一行（经典的 joyplot 形）。视觉取值，待定。 */
  overlap?: number
  /** 没有悬停也没有聚焦时读数行写什么。 */
  idle?: ReactNode
  className?: string
}

export function Ridgeline({
  groups,
  label,
  describe,
  formatValue = String,
  baseline,
  domain,
  bandwidth,
  rowHeight = 40,
  overlap = 2,
  idle,
  className,
  actionLabels,
  tableLabel,
  tableHead,
  onExport,
  onFullscreen,
  source,
}: RidgelineProps) {
  const [tableView, setTableView] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  const [tab, setTab] = useState(0)
  const refs = useRef<(SVGGElement | null)[]>([])
  const fillBase = useDotId('ridge-fill')
  const { domain: range, ridges, peak } = ridgelines(groups, { domain, bandwidth })
  const x = linearScale(range, [LEFT, W - RIGHT])
  const head = overlap * rowHeight
  const height = head + Math.max(0, groups.length - 1) * rowHeight + AXIS
  const axisY = head + Math.max(0, groups.length - 1) * rowHeight
  const stop = Math.min(Math.max(tab, 0), Math.max(0, groups.length - 1))
  const active = hover ?? focus
  const onKey = (event: KeyboardEvent) => {
    const last = groups.length - 1
    const next =
      event.key === 'ArrowDown'
        ? Math.min(last, stop + 1)
        : event.key === 'ArrowUp'
          ? Math.max(0, stop - 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (next === null) return
    event.preventDefault()
    setTab(next)
    refs.current[next]?.focus()
  }

  return (
    <figure className={`k-ridge${className ? ` ${className}` : ''}`} data-slot="ridgeline">
      <div className="k-dist-bar">
        <ChartActions
          labels={actionLabels}
          tableView={tableView}
          onTableView={setTableView}
          onExport={onExport}
          onFullscreen={onFullscreen}
        />
      </div>
      {tableView && (
        <ChartTable
          slot="ridgeline-table"
          label={tableLabel}
          head={tableHead}
          rows={groups.map((group, i) => ({ key: group.id, cells: [group.label, describe(group, ridges[i]!.stats)] }))}
        />
      )}
      <svg
        style={tableView ? { display: 'none' } : undefined}
        className="k-ridge-svg"
        viewBox={`0 0 ${W} ${height}`}
        role="group"
        aria-label={label}
        onKeyDown={onKey}
        onMouseLeave={() => setHover(null)}
      >
        {niceTicks(range[0], range[1], 6).map((tick) => (
          <g key={tick} className="k-ridge-tick">
            <line x1={x(tick)} x2={x(tick)} y1={0} y2={axisY} />
            <text x={x(tick)} y={axisY + 16} textAnchor="middle">
              {formatValue(tick)}
            </text>
          </g>
        ))}
        {baseline !== undefined && baseline >= range[0] && baseline <= range[1] && (
          <line className="k-ridge-baseline" x1={x(baseline)} x2={x(baseline)} y1={0} y2={axisY} />
        )}
        {ridges.map((ridge, index) => {
          const group = groups[index]!
          const base = head + index * rowHeight
          const y = (density: number) => base - (peak > 0 ? density / peak : 0) * head
          const top = ridge.xs.map((value, i) => `${x(value).toFixed(2)},${y(ridge.density[i]!).toFixed(2)}`).join(' L')
          const color = seqColor(layerLevel(index, groups.length))
          const fillId = `${fillBase}-${index}`
          const median = ridge.stats.median
          const medianTop = Number.isFinite(median) ? y(gaussianKde(group.values, [median], ridge.bandwidth)[0]!) : base
          const text = describe(group, ridge.stats)
          return (
            <g
              key={group.id}
              ref={(node) => {
                refs.current[index] = node
              }}
              className="k-ridge-row"
              data-id={group.id}
              data-dim={active !== null && active !== index ? 'true' : 'false'}
              role="img"
              aria-label={text}
              tabIndex={index === stop ? 0 : -1}
              onMouseEnter={() => setHover(index)}
              onFocus={() => {
                setFocus(index)
                setTab(index)
              }}
              onBlur={() => setFocus(null)}
            >
              <defs>
                <DotFill id={fillId} color={color} />
              </defs>
              <text className="k-ridge-name" x={LEFT - 8} y={base - 4} textAnchor="end">
                {group.label}
              </text>
              <line className="k-ridge-base" x1={LEFT} x2={W - RIGHT} y1={base} y2={base} />
              <path
                className="k-ridge-fill"
                style={{ fill: `url(#${fillId})` }}
                d={`M${x(ridge.xs[0]!).toFixed(2)},${base} L${top} L${x(ridge.xs.at(-1)!).toFixed(2)},${base} Z`}
              />
              <path className="k-ridge-line" d={`M${top}`} style={{ stroke: color }} />
              <line className="k-ridge-median" x1={x(median)} x2={x(median)} y1={base} y2={medianTop} />
            </g>
          )
        })}
      </svg>
      <output className="k-ridge-readout" hidden={tableView}>
        {active === null ? idle : describe(groups[active]!, ridges[active]!.stats)}
      </output>
      {source === undefined ? null : <p className="k-dist-source">{source}</p>}
    </figure>
  )
}

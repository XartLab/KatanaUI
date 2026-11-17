// SPDX-License-Identifier: MIT
import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { ChartActions } from '../lib/chart/chart-kit/chart-actions.tsx'
import { ChartTable, type ChartViewProps } from '../lib/chart/chart-kit/chart-table.tsx'
import {
  bestIndex,
  moveParam,
  paramLayout,
  rampColor,
  rampGradient,
  rampPosition,
  resolveRamp,
  valueRange,
  type ParamPoint,
  type ParamRamp,
} from './param-scatter-model.ts'
import type { ScatterFrame } from '../lib/chart/scatter-model.ts'

// 参数优化散点图（#35）：两个参数为横纵轴，每个点是一组参数，颜色是目标值（夏普、净利润……），点选看这组参数的读数，最优点加环标出。
// TradingView 没有这张图，照通用的参数扫描做法（热力散点）；颜色用单色灰阶或涨跌发散阶，不用橙与蓝（橙留给数据线）。纯逻辑在 param-scatter-model.ts。
// 点是一个 role=button 的圆，键盘：Tab 进图，方向键在点间走，Enter / 空格选中，Esc 取消；文字全由 props 传。

const FRAME: ScatterFrame = { width: 640, height: 360, left: 52, top: 14, right: 18, bottom: 40 }

export type ParamScatterProps = ChartViewProps & {
  points: readonly ParamPoint[]
  /** 整张图的读屏名。 */
  label: string
  /** 两根参数轴的名字。 */
  axes: { x: string; y: string }
  /** 目标值叫什么（色条标题、读数）。 */
  valueName: string
  formatX?: (value: number) => string
  formatY?: (value: number) => string
  formatValue?: (value: number) => string
  /** 目标值越大越好还是越小越好，默认 max。 */
  goal?: 'max' | 'min'
  ramp?: ParamRamp
  /** 「最优」的字，读屏名与读数里用。 */
  bestLabel: string
  /** 「跳到最优」按钮的字。 */
  jumpLabel: string
  /** 没有结果的点（value 为 null）在读数里写什么。 */
  noValue: string
  /** 没选点时读数区写什么。 */
  idle: ReactNode
  /** 受控的选中点 id；不给用内部状态。 */
  selected?: string | null
  onSelect?: (id: string | null) => void
  /** 选中点的读数多加什么（该组参数的其他指标）。 */
  extra?: (point: ParamPoint) => ReactNode
  className?: string
}

export function ParamScatter({
  points,
  label,
  axes,
  valueName,
  formatX = String,
  formatY = String,
  formatValue = String,
  goal = 'max',
  ramp = 'auto',
  bestLabel,
  jumpLabel,
  noValue,
  idle,
  selected,
  onSelect,
  extra,
  className,
  actionLabels,
  tableLabel,
  tableHead,
  onExport,
  onFullscreen,
  source,
}: ParamScatterProps) {
  const [tableView, setTableView] = useState(false)
  const [inner, setInner] = useState<string | null>(null)
  const [tab, setTab] = useState(0)
  const refs = useRef(new Map<number, SVGCircleElement>())
  const chosen = selected === undefined ? inner : selected
  const choose = (id: string | null) => {
    setInner(id)
    onSelect?.(id)
  }
  const layout = paramLayout(points, FRAME)
  const range = valueRange(points)
  const mode = resolveRamp(ramp, range)
  const best = bestIndex(points, goal)
  const chosenIndex = points.findIndex((p) => p.id === chosen)
  const stop = tab < points.length ? tab : 0
  const bottom = FRAME.height - FRAME.bottom
  const radius = points.length > 400 ? 3 : 4.5
  const point = chosenIndex < 0 ? null : points[chosenIndex]!

  const move = (event: KeyboardEvent) => {
    if (event.key === 'Escape') return choose(null)
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const p = points[stop]
      if (p) choose(p.id)
      return
    }
    const next = moveParam(layout.xy, stop, event.key)
    if (next === null) return
    event.preventDefault()
    setTab(next)
    refs.current.get(next)?.focus()
  }
  const describe = (p: ParamPoint, index: number) =>
    `${axes.x} ${formatX(p.x)}, ${axes.y} ${formatY(p.y)}, ${valueName} ${
      p.value === null ? noValue : formatValue(p.value)
    }${index === best ? `, ${bestLabel}` : ''}`

  return (
    <figure className={`k-pscatter${className ? ` ${className}` : ''}`} data-slot="param-scatter" data-ramp={mode}>
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
          slot="param-scatter-table"
          numeric={[1, 2, 3]}
          label={tableLabel}
          head={tableHead}
          rows={points.map((p, i) => ({
            key: p.id,
            cells: [
              i === best ? `${p.id} · ${bestLabel}` : p.id,
              formatX(p.x),
              formatY(p.y),
              p.value === null ? noValue : formatValue(p.value),
            ],
          }))}
        />
      )}
      <svg
        style={tableView ? { display: 'none' } : undefined}
        className="k-pscatter-svg"
        viewBox={`0 0 ${FRAME.width} ${FRAME.height}`}
        role="group"
        aria-label={label}
        onKeyDown={move}
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
        {points.map((p, i) => {
          const at = layout.xy[i]!
          const color =
            p.value === null || range === null ? undefined : rampColor(rampPosition(p.value, range, mode), mode)
          return (
            <circle
              key={p.id}
              ref={(node) => {
                if (node) refs.current.set(i, node)
                else refs.current.delete(i)
              }}
              className="k-pscatter-dot"
              data-id={p.id}
              data-empty={p.value === null ? '' : undefined}
              data-best={i === best ? '' : undefined}
              data-selected={i === chosenIndex ? '' : undefined}
              cx={at.x}
              cy={at.y}
              r={i === chosenIndex || i === best ? radius + 1.5 : radius}
              style={color === undefined ? undefined : ({ '--k-dot': color } as CSSProperties)}
              role="button"
              aria-pressed={i === chosenIndex}
              aria-label={describe(p, i)}
              tabIndex={stop === i ? 0 : -1}
              onClick={() => choose(p.id)}
              onFocus={() => setTab(i)}
            />
          )
        })}
      </svg>
      {range !== null && (
        <div className="k-pscatter-bar" data-slot="param-scatter-legend" hidden={tableView}>
          <span>{valueName}</span>
          <span className="k-pscatter-min">{formatValue(range.min)}</span>
          <i className="k-pscatter-ramp" style={{ backgroundImage: rampGradient(mode) }} aria-hidden="true" />
          <span className="k-pscatter-max">{formatValue(range.max)}</span>
        </div>
      )}
      <output className="k-pscatter-readout" data-slot="param-scatter-readout" hidden={tableView}>
        {point === null ? (
          idle
        ) : (
          <>
            <dl>
              <div>
                <dt>{axes.x}</dt>
                <dd>{formatX(point.x)}</dd>
              </div>
              <div>
                <dt>{axes.y}</dt>
                <dd>{formatY(point.y)}</dd>
              </div>
              <div>
                <dt>{valueName}</dt>
                <dd>{point.value === null ? noValue : formatValue(point.value)}</dd>
              </div>
            </dl>
            {chosenIndex === best ? <span className="k-pscatter-best">{bestLabel}</span> : null}
            {extra?.(point)}
          </>
        )}
      </output>
      {best >= 0 && best !== chosenIndex && (
        <button type="button" className="k-pscatter-jump" onClick={() => choose(points[best]!.id)} hidden={tableView}>
          {jumpLabel}
        </button>
      )}
      {source === undefined ? null : <p className="k-dist-source">{source}</p>}
    </figure>
  )
}

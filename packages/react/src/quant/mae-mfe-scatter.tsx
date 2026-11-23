// SPDX-License-Identifier: MIT
// MAE / MFE 散点（#120，对照 MultiCharts 的 Strategy Performance Report）：每笔交易一个点，横轴是持仓期间的最大浮亏（MAE）或最大浮盈（MFE），
// 纵轴是这笔最终盈亏，赢亏两色并且两种形状（赢是圆、亏是方，不只靠颜色）。看 MAE：赢单从来没亏过多深、亏单一路亏穿，止损就能收紧；
// 看 MFE：亏单曾经浮盈很多，说明止盈或移动止损放得太远。横轴与金额 / 百分比两个开关都在件里切，数据（每笔的 MAE、MFE 两套单位）由调用方给，件不算。
// 键盘：Tab 进图，←→ 沿横轴走点，Home / End 到两端，Esc 取消；指针悬停取最近的点。包里不带语言。纯逻辑在 mae-mfe-model.ts。
import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { ChartActions } from '../lib/chart/chart-kit/chart-actions.tsx'
import { ChartTable, type ChartViewProps } from '../lib/chart/chart-kit/chart-table.tsx'
import { extent } from '../lib/num.ts'
import { linearScale, niceTicks } from '../lib/chart/chart-scale.ts'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import {
  excursionPoints,
  nearestPoint,
  outwardDomain,
  stepPoint,
  summarizeExcursions,
  type ExcursionAxis,
  type ExcursionTrade,
  type ExcursionUnit,
} from './mae-mfe-model.ts'

export type MaeMfeScatterLabels = {
  axisGroup: string
  mae: string
  mfe: string
  unitGroup: string
  amount: string
  percent: string
  /** 纵轴名：最终盈亏。 */
  pnl: string
  win: string
  loss: string
  /** 汇总行：赢单 / 亏单的平均偏移，如「赢单平均」「亏单平均」。 */
  meanWin: string
  meanLoss: string
  /** 没选点时读数区写什么。 */
  idle: string
}

export type MaeMfeScatterProps = ChartViewProps & {
  trades: readonly ExcursionTrade[]
  /** 整张图的读屏名。 */
  label: string
  /** 横轴看 MAE 还是 MFE；不给用内部状态（默认 mae）。 */
  axis?: ExcursionAxis
  onAxisChange?: (axis: ExcursionAxis) => void
  /** 金额还是百分比；不给用内部状态（默认 percent）。 */
  unit?: ExcursionUnit
  onUnitChange?: (unit: ExcursionUnit) => void
  /** 金额与百分比的写法（带币种、带正负号由调用方定）。参数是带符号的值；横轴传的是绝对值。 */
  formatAmount: (value: number) => string
  formatPercent: (value: number) => string
  labels: MaeMfeScatterLabels
  className?: string
}

const FRAME = { width: 640, height: 340, left: 56, top: 30, right: 18, bottom: 40 }
const RADIUS = 4
const PICK_RADIUS = 16

export function MaeMfeScatter({
  trades,
  label,
  axis: axisProp,
  onAxisChange,
  unit: unitProp,
  onUnitChange,
  formatAmount,
  formatPercent,
  labels,
  actionLabels,
  tableLabel,
  tableHead,
  source,
  onExport,
  onFullscreen,
  onCopyImage,
  className,
}: MaeMfeScatterProps) {
  const [axisState, setAxisState] = useState<ExcursionAxis>('mae')
  const [unitState, setUnitState] = useState<ExcursionUnit>('percent')
  const [tableView, setTableView] = useState(false)
  const [chosen, setChosen] = useState<number | null>(null)
  const axis = axisProp ?? axisState
  const unit = unitProp ?? unitState
  const format = unit === 'amount' ? formatAmount : formatPercent

  const points = excursionPoints(trades, axis, unit)
  const summary = summarizeExcursions(points)
  // 横轴从 0 起（偏移的大小），纵轴把 0 与全部盈亏都包进去，0 线画实线。
  const [, maxX] = extent(
    points.map((p) => p.x),
    true,
  )
  const [minY, maxY] = extent(
    points.map((p) => p.y),
    true,
  )
  const xTicks = niceTicks(0, maxX * 1.05, 5)
  const xDomain: [number, number] = [0, Math.max(maxX * 1.05, xTicks.at(-1) ?? 0) || 1]
  // 纵轴向外取整，最高与最低的点都落在绘图区里，不压到轴标题。
  const { domain: yDomain, ticks: yTicks } = outwardDomain(minY, maxY)
  const bottom = FRAME.height - FRAME.bottom
  const sx = linearScale(xDomain, [FRAME.left, FRAME.width - FRAME.right])
  const sy = linearScale(yDomain, [bottom, FRAME.top])
  const xy = points.map((p) => ({ x: sx(p.x), y: sy(p.y) }))
  // 键盘顺序：横轴从小到大，同横坐标按纵轴。
  const order = points.map((_, i) => i).sort((a, b) => points[a]!.x - points[b]!.x || points[a]!.y - points[b]!.y)
  const active = chosen !== null && chosen < points.length ? chosen : null
  const trade = active === null ? null : trades[points[active]!.index]!
  const axisName = axis === 'mae' ? labels.mae : labels.mfe

  const locate = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    if (!(box.width > 0)) return
    const scale = FRAME.width / box.width
    const found = nearestPoint(
      xy,
      { x: (event.clientX - box.left) * scale, y: (event.clientY - box.top) * scale },
      PICK_RADIUS,
    )
    setChosen(found < 0 ? null : found)
  }
  const keys = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === 'Escape') return setChosen(null)
    const next = stepPoint(order, active ?? -1, event.key)
    if (next === null) return
    event.preventDefault()
    setChosen(next)
  }

  return (
    <figure className={cn('k-mm', className)} data-slot="mae-mfe-scatter" data-axis={axis} data-unit={unit}>
      <div className="k-mm-head">
        <ToggleGroup
          size="sm"
          aria-label={labels.axisGroup}
          value={axis}
          onValueChange={(next) => {
            if (next !== 'mae' && next !== 'mfe') return
            setAxisState(next)
            setChosen(null)
            onAxisChange?.(next)
          }}
        >
          <ToggleGroupItem value="mae">{labels.mae}</ToggleGroupItem>
          <ToggleGroupItem value="mfe">{labels.mfe}</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          size="sm"
          aria-label={labels.unitGroup}
          value={unit}
          onValueChange={(next) => {
            if (next !== 'amount' && next !== 'percent') return
            setUnitState(next)
            onUnitChange?.(next)
          }}
        >
          <ToggleGroupItem value="percent">{labels.percent}</ToggleGroupItem>
          <ToggleGroupItem value="amount">{labels.amount}</ToggleGroupItem>
        </ToggleGroup>
        <span className="k-mm-key" aria-hidden="true">
          <i className="k-mm-mark" data-kind="win" />
          {labels.win} {summary.wins}
        </span>
        <span className="k-mm-key" aria-hidden="true">
          <i className="k-mm-mark" data-kind="loss" />
          {labels.loss} {summary.losses}
        </span>
        <span className="k-mm-actions">
          <ChartActions
            labels={actionLabels}
            tableView={tableView}
            onTableView={setTableView}
            onExport={onExport}
            onFullscreen={onFullscreen}
            onCopyImage={onCopyImage}
          />
        </span>
      </div>
      {tableView && (
        <ChartTable
          slot="mae-mfe-table"
          numeric={[1, 2, 3]}
          label={tableLabel}
          head={tableHead}
          rows={points.map((p) => ({
            key: p.id,
            cells: [
              p.id,
              format(p.x),
              format(p.y),
              p.kind === 'win' ? labels.win : p.kind === 'loss' ? labels.loss : '–',
            ],
          }))}
        />
      )}
      <svg
        className="k-mm-svg"
        style={tableView ? { display: 'none' } : undefined}
        viewBox={`0 0 ${FRAME.width} ${FRAME.height}`}
        role="group"
        aria-label={label}
        tabIndex={0}
        onPointerMove={locate}
        onPointerLeave={() => setChosen(null)}
        onKeyDown={keys}
        onBlur={() => setChosen(null)}
      >
        {yTicks.map((tick) => (
          <g key={`y${tick}`} className="k-scatter-tick" data-axis="y">
            <line x1={FRAME.left} x2={FRAME.width - FRAME.right} y1={sy(tick)} y2={sy(tick)} />
            <text x={FRAME.left - 8} y={sy(tick)} dy="0.35em" textAnchor="end">
              {format(tick)}
            </text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <g key={`x${tick}`} className="k-scatter-tick" data-axis="x">
            <line x1={sx(tick)} x2={sx(tick)} y1={FRAME.top} y2={bottom} />
            <text x={sx(tick)} y={bottom + 16} textAnchor="middle">
              {format(tick)}
            </text>
          </g>
        ))}
        <line className="k-mm-zero" x1={FRAME.left} x2={FRAME.width - FRAME.right} y1={sy(0)} y2={sy(0)} />
        <text
          className="k-scatter-axis"
          x={(FRAME.left + FRAME.width - FRAME.right) / 2}
          y={FRAME.height - 4}
          textAnchor="middle"
        >
          {axisName}
        </text>
        <text className="k-scatter-axis" x={FRAME.left} y={FRAME.top - 18} textAnchor="start">
          {labels.pnl}
        </text>
        {points.map((p, i) =>
          p.kind === 'loss' ? (
            <rect
              key={p.id}
              className="k-mm-dot"
              data-slot="mae-mfe-dot"
              data-kind="loss"
              data-active={i === active ? '' : undefined}
              x={xy[i]!.x - RADIUS}
              y={xy[i]!.y - RADIUS}
              width={RADIUS * 2}
              height={RADIUS * 2}
            />
          ) : (
            <circle
              key={p.id}
              className="k-mm-dot"
              data-slot="mae-mfe-dot"
              data-kind={p.kind}
              data-active={i === active ? '' : undefined}
              cx={xy[i]!.x}
              cy={xy[i]!.y}
              r={RADIUS}
            />
          ),
        )}
      </svg>
      <div className="k-mm-foot" hidden={tableView}>
        <output className="k-mm-readout" data-slot="mae-mfe-readout">
          {trade === null ? (
            labels.idle
          ) : (
            <>
              <b>{trade.id}</b>
              <span>
                {labels.pnl} {formatAmount(trade.pnl)} / {formatPercent(trade.pnlPct)}
              </span>
              <span>
                {labels.mae} {formatAmount(trade.mae)} / {formatPercent(trade.maePct)}
              </span>
              <span>
                {labels.mfe} {formatAmount(trade.mfe)} / {formatPercent(trade.mfePct)}
              </span>
            </>
          )}
        </output>
        <p className="k-mm-means" data-slot="mae-mfe-means">
          {summary.meanWinX !== null && (
            <span data-kind="win">
              {labels.meanWin} {format(summary.meanWinX)}
            </span>
          )}
          {summary.meanLossX !== null && (
            <span data-kind="loss">
              {labels.meanLoss} {format(summary.meanLossX)}
            </span>
          )}
        </p>
      </div>
      {source !== undefined && <p className="k-dist-source">{source}</p>}
    </figure>
  )
}

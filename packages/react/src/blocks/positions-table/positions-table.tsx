// SPDX-License-Identifier: MIT
/**
 * Positions table: a DataGrid of open positions with liquidation distance (percent and bar, warning color and icon near the caller's threshold),
 * unrealized PnL, margin and leverage, inline close and take-profit / stop-loss buttons, and a totals footer.
 * 持仓表（#104 账户四件之一，#103 持仓监控的表）：DataGrid 一行一个持仓：品种、方向、数量、开仓均价、标记价、强平价、
 * 强平距离（% 加进度条，近于调用方给的阈值时换警示色并带图标）、未实现盈亏（金额与 %）、保证金与杠杆；行内「平仓」「止盈止损」只发回调，
 * 全部平还是部分平、改哪一笔条件单都由调用方处理；表尾合计。件不认识交易所，也不下单：数据与动作只走 props 与回调。
 * 方向不只靠颜色：多 / 空是文字，盈亏带正负号，强平警示带图标与文字名。
 */
import { TriangleAlertIcon } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/cn.ts'
import { formatPercentChange, formatPrice } from '../../lib/chart/format/index.ts'
import { Button } from '../../primitives/button.tsx'
import { PnlText } from '../../quotes/pnl-text.tsx'
import type { GridColumn } from '../data-grid/columns.ts'
import { DataGrid } from '../data-grid/data-grid.tsx'
import type { GridColumnLayout } from '../data-grid/data-grid-props.ts'
import type { SortSpec } from '../data-grid/model.ts'
import {
  liquidationDistance,
  liquidationFill,
  liquidationRisk,
  positionTotals,
  unrealizedPercent,
  type LiquidationRisk,
  type Position,
} from './positions-model.ts'

export type { LiquidationRisk, Position, PositionSide, PositionTotals } from './positions-model.ts'

/** Texts of PositionsTable (the package ships no text). */
export type PositionsTableLabels = {
  /** Accessible name of the table. 表的读屏名。 */
  list: string
  /** Column headers. 列头。 */
  columns: {
    symbol: string
    side: string
    quantity: string
    entry: string
    mark: string
    liquidation: string
    distance: string
    pnl: string
    margin: string
    actions: string
  }
  /** Side words. 多 / 空。 */
  side: { long: string; short: string }
  /** Text of the close button. 平仓按钮的字。 */
  close: string
  /** Text of the take-profit / stop-loss button. 止盈止损按钮的字。 */
  tpsl: string
  /** Accessible name of the close button of one row (「平仓 BTCUSDT 多」). 一行平仓按钮的读屏名。 */
  closeFor: (position: Position) => string
  /** Accessible name of the TP/SL button of one row. 一行止盈止损按钮的读屏名。 */
  tpslFor: (position: Position) => string
  /** Names of the warning icon in the distance cell. 强平距离警示图标的名字。 */
  risk: { warn: string; danger: string }
  /** Footer texts. 表尾。 */
  totals: {
    label: string
    count: (count: number) => string
    pnl: string
    margin: string
    atRisk: (count: number) => string
  }
  /** Text when there are no positions. 没有持仓时的字。 */
  empty: string
}

export type PositionsTableProps = {
  /** Open positions. */
  positions: readonly Position[]
  /** Texts. */
  labels: PositionsTableLabels
  /** Distance in percent at or below which a row shows the warning color and icon; defaults to 10. */
  liquidationWarnPct?: number
  /** Distance in percent at or below which the warning turns to danger; defaults to half of the warn distance. */
  liquidationDangerPct?: number
  /** Distance in percent that fills the whole bar; defaults to three times the warn distance. */
  liquidationScalePct?: number
  /** Called when the close button of a row is pressed; the caller decides full or partial and confirms with the user. */
  onClose?: (position: Position) => void
  /** Called when the take-profit / stop-loss button of a row is pressed. */
  onSetTpsl?: (position: Position) => void
  /** How a price is written; defaults to the position's pricePrecision. */
  formatPrice?: (value: number, position: Position) => string
  /** How a quantity is written; defaults to up to 8 decimals without trailing zeros. */
  formatQuantity?: (value: number, position: Position) => string
  /** How a money amount (PnL, margin) is written; defaults to two decimals with grouping. */
  formatAmount?: (value: number) => string
  /** Hide the footer totals. */
  hideTotals?: boolean
  /** Extra class name on the root. */
  className?: string
}

/** 一行，连同调用方的写法与阈值（列定义是模块级常量，字与回调都从行上读）。 */
type Line = {
  position: Position
  ctx: Context
  distance: number | null
  risk: LiquidationRisk
  percent: number | null
}

type Context = {
  labels: PositionsTableLabels
  scale: number
  price: (value: number, position: Position) => string
  quantity: (value: number, position: Position) => string
  amount: (value: number) => string
  onClose?: (position: Position) => void
  onSetTpsl?: (position: Position) => void
}

const DASH = '—'

const defaultAmount = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const defaultQuantity = (value: number) => String(Number(value.toFixed(8)))
const signedAmount = (ctx: Context, value: number) => `${value > 0 ? '+' : ''}${ctx.amount(value)}`
const distanceText = (distance: number) => formatPercentChange(distance).replace(/^\+/, '')

const COLUMNS: readonly GridColumn<Line>[] = [
  {
    id: 'symbol',
    priority: 1,
    type: 'custom',
    rowHeader: true,
    text: (line) => line.position.symbol,
    sort: (line) => line.position.symbol,
    cell: (line) => <span className="k-pos-symbol">{line.position.symbol}</span>,
  },
  {
    id: 'side',
    priority: 5,
    type: 'custom',
    text: (line) => line.ctx.labels.side[line.position.side],
    sort: (line) => line.position.side,
    cell: (line) => (
      <span className="k-pos-side" data-slot="position-side" data-side={line.position.side}>
        {line.ctx.labels.side[line.position.side]}
      </span>
    ),
  },
  {
    id: 'quantity',
    priority: 7,
    type: 'custom',
    text: (line) => line.ctx.quantity(line.position.quantity, line.position),
    sort: (line) => line.position.quantity,
    cell: (line) => line.ctx.quantity(line.position.quantity, line.position),
  },
  {
    id: 'entry',
    priority: 9,
    type: 'custom',
    text: (line) => line.ctx.price(line.position.entryPrice, line.position),
    sort: (line) => line.position.entryPrice,
    cell: (line) => line.ctx.price(line.position.entryPrice, line.position),
  },
  {
    id: 'mark',
    priority: 6,
    type: 'custom',
    text: (line) => line.ctx.price(line.position.markPrice, line.position),
    sort: (line) => line.position.markPrice,
    cell: (line) => line.ctx.price(line.position.markPrice, line.position),
  },
  {
    id: 'liquidation',
    priority: 8,
    type: 'custom',
    text: (line) =>
      line.position.liquidationPrice === null ? DASH : line.ctx.price(line.position.liquidationPrice, line.position),
    sort: (line) => line.position.liquidationPrice ?? undefined,
    cell: (line) =>
      line.position.liquidationPrice === null ? DASH : line.ctx.price(line.position.liquidationPrice, line.position),
  },
  {
    id: 'distance',
    priority: 4,
    type: 'custom',
    text: (line) => (line.distance === null ? DASH : distanceText(line.distance)),
    // 越近越危险：升序排就是最危险的在前。
    sort: (line) => line.distance ?? undefined,
    cell: (line) =>
      line.distance === null ? (
        DASH
      ) : (
        <span className="k-pos-distance" data-slot="position-distance" data-risk={line.risk}>
          {line.risk === 'warn' || line.risk === 'danger' ? (
            <TriangleAlertIcon
              className="k-pos-alert"
              size={13}
              role="img"
              aria-label={line.ctx.labels.risk[line.risk]}
            />
          ) : null}
          <span className="k-pos-distance-text">{distanceText(line.distance)}</span>
          <span className="k-pos-bar" aria-hidden="true">
            <i style={{ width: `${liquidationFill(line.distance, line.ctx.scale) * 100}%` }} />
          </span>
        </span>
      ),
  },
  {
    id: 'pnl',
    priority: 3,
    type: 'custom',
    text: (line) =>
      signedAmount(line.ctx, line.position.unrealizedPnl) +
      (line.percent === null ? '' : ` ${formatPercentChange(line.percent)}`),
    sort: (line) => line.position.unrealizedPnl,
    cell: (line) => (
      <PnlText className="k-pos-pnl" value={line.position.unrealizedPnl}>
        {signedAmount(line.ctx, line.position.unrealizedPnl)}
        {line.percent === null ? null : <span className="k-pos-pct">{formatPercentChange(line.percent)}</span>}
      </PnlText>
    ),
  },
  {
    id: 'margin',
    priority: 10,
    type: 'custom',
    text: (line) =>
      line.position.margin === null
        ? DASH
        : line.ctx.amount(line.position.margin) +
          (line.position.leverage === null ? '' : ` ${line.position.leverage}x`),
    sort: (line) => line.position.margin ?? undefined,
    cell: (line) =>
      line.position.margin === null ? (
        DASH
      ) : (
        <span className="k-pos-margin">
          {line.ctx.amount(line.position.margin)}
          {line.position.leverage === null ? null : <span className="k-pos-lev">{line.position.leverage}x</span>}
        </span>
      ),
  },
  {
    id: 'actions',
    priority: 2,
    type: 'custom',
    text: () => '',
    cell: (line) => (
      <span className="k-pos-actions" data-slot="position-actions">
        {line.ctx.onClose ? (
          <Button
            size="sm"
            data-action="close"
            aria-label={line.ctx.labels.closeFor(line.position)}
            onClick={() => line.ctx.onClose?.(line.position)}
          >
            {line.ctx.labels.close}
          </Button>
        ) : null}
        {line.ctx.onSetTpsl ? (
          <Button
            size="sm"
            data-action="tpsl"
            aria-label={line.ctx.labels.tpslFor(line.position)}
            onClick={() => line.ctx.onSetTpsl?.(line.position)}
          >
            {line.ctx.labels.tpsl}
          </Button>
        ) : null}
      </span>
    ),
  },
]

export function PositionsTable({
  positions,
  labels,
  liquidationWarnPct = 10,
  liquidationDangerPct,
  liquidationScalePct,
  onClose,
  onSetTpsl,
  formatPrice: price,
  formatQuantity: quantity,
  formatAmount: amount = defaultAmount,
  hideTotals,
  className,
}: PositionsTableProps) {
  const [sort, setSort] = useState<SortSpec | null>(null)
  const danger = liquidationDangerPct ?? liquidationWarnPct / 2
  const ctx: Context = {
    labels,
    scale: liquidationScalePct ?? liquidationWarnPct * 3,
    price:
      price ??
      ((value, position) =>
        formatPrice(value, { precision: position.pricePrecision ?? null, fallback: { maxFraction: 8 } })),
    quantity: quantity ?? ((value) => defaultQuantity(value)),
    amount,
    onClose,
    onSetTpsl,
  }
  const lines: Line[] = positions.map((position) => {
    const distance = liquidationDistance(position.side, position.markPrice, position.liquidationPrice)
    return {
      position,
      ctx,
      distance,
      risk: liquidationRisk(distance, liquidationWarnPct, danger),
      percent: unrealizedPercent(position),
    }
  })
  const hasActions = Boolean(onClose || onSetTpsl)
  const layout: GridColumnLayout[] = [
    { id: 'symbol', label: labels.columns.symbol, width: 112, visible: true },
    { id: 'side', label: labels.columns.side, width: 52, visible: true },
    { id: 'quantity', label: labels.columns.quantity, width: 84, visible: true, align: 'end' },
    { id: 'entry', label: labels.columns.entry, width: 92, visible: true, align: 'end' },
    { id: 'mark', label: labels.columns.mark, width: 92, visible: true, align: 'end' },
    { id: 'liquidation', label: labels.columns.liquidation, width: 92, visible: true, align: 'end' },
    { id: 'distance', label: labels.columns.distance, width: 148, visible: true, align: 'end' },
    { id: 'pnl', label: labels.columns.pnl, width: 168, visible: true, align: 'end' },
    { id: 'margin', label: labels.columns.margin, width: 104, visible: true, align: 'end' },
    { id: 'actions', label: labels.columns.actions, width: onClose && onSetTpsl ? 168 : 92, visible: hasActions },
  ]
  if (lines.length === 0)
    return (
      <div className={cn('k-pos', className)} data-slot="positions-table">
        <p className="k-pos-empty" role="status">
          {labels.empty}
        </p>
      </div>
    )
  const totals = positionTotals(positions, liquidationWarnPct, danger)
  return (
    <div className={cn('k-pos', className)} data-slot="positions-table">
      <DataGrid
        classNames={{ root: 'k-pos-grid' }}
        columns={COLUMNS}
        layout={layout}
        rows={lines}
        rowId={(line) => line.position.id}
        label={labels.list}
        sort={sort}
        onSortChange={setSort}
        rowProps={(line) => ({
          'data-position': line.position.id,
          'data-risk': line.risk,
          'data-side': line.position.side,
        })}
        density="relaxed"
        selectable={false}
        stretch
        fit
        maxHeight={520}
        foot={
          hideTotals ? undefined : (
            <div className="k-pos-foot" data-slot="positions-totals">
              <span className="k-pos-foot-label">{labels.totals.label}</span>
              <span>{labels.totals.count(totals.count)}</span>
              <span>
                {labels.totals.pnl}{' '}
                <PnlText value={totals.unrealizedPnl} data-slot="positions-total-pnl">
                  {signedAmount(ctx, totals.unrealizedPnl)}
                  {totals.percent === null ? null : (
                    <span className="k-pos-pct">{formatPercentChange(totals.percent)}</span>
                  )}
                </PnlText>
              </span>
              <span>
                {labels.totals.margin} <span data-slot="positions-total-margin">{amount(totals.margin)}</span>
              </span>
              {totals.atRisk > 0 ? (
                <span className="k-pos-foot-risk" data-slot="positions-at-risk">
                  <TriangleAlertIcon size={12} aria-hidden="true" />
                  {labels.totals.atRisk(totals.atRisk)}
                </span>
              ) : null}
            </div>
          )
        }
      />
    </div>
  )
}

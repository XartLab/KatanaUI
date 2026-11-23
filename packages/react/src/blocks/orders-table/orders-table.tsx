// SPDX-License-Identifier: MIT
/**
 * Orders table: a DataGrid of working orders with a fill progress bar, status tag, inline cancel and inline price amend (Enter submits, Esc cancels),
 * and a cancel-all button above the table.
 * 委托表（#104 账户四件之一，#103 持仓监控的表）：DataGrid 一行一张在途委托：品种、方向、类型（限价 / 市价 / 条件）、价格、数量、
 * 已成交（文字加进度条）、状态、时间；行内「撤单」，「改价」在行内编辑价格：回车提交 onAmend(order, price)，Esc 或离开输入框取消；
 * 表上方「全部撤单」。件不下单、不连交易所：撤单与改价只发回调，是否确认、成功与否由调用方处理（撤单发出后调用方把状态改成 canceling）。
 */
import { PencilIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn.ts'
import { Tag } from '../../katana/tag.tsx'
import { Button } from '../../primitives/button.tsx'
import { Input } from '../../primitives/input.tsx'
import type { GridColumn } from '../data-grid/columns.ts'
import { DataGrid } from '../data-grid/data-grid.tsx'
import type { GridColumnLayout } from '../data-grid/data-grid-props.ts'
import type { SortSpec } from '../data-grid/model.ts'
import {
  amendDecision,
  canAmend,
  canCancel,
  cancellable,
  fillRatio,
  isCanceling,
  type Order,
  type OrderStatus,
} from './orders-model.ts'

export type { Order, OrderSide, OrderStatus, OrderType } from './orders-model.ts'

/** Texts of OrdersTable (the package ships no text). */
export type OrdersTableLabels = {
  /** Accessible name of the table. 表的读屏名。 */
  list: string
  /** Column headers. 列头。 */
  columns: {
    symbol: string
    side: string
    type: string
    price: string
    quantity: string
    filled: string
    status: string
    time: string
    actions: string
  }
  side: { buy: string; sell: string }
  type: { limit: string; market: string; conditional: string }
  status: Record<OrderStatus, string>
  /** Text of the cancel button. 撤单按钮的字。 */
  cancel: string
  /** Accessible name of the cancel button of one row. 一行撤单按钮的读屏名。 */
  cancelFor: (order: Order) => string
  /** Accessible name of the pencil button that starts an amend (「改价 BTCUSDT」). 铅笔按钮的读屏名。 */
  amendFor: (order: Order) => string
  /** Accessible name of the price box while amending. 改价输入框的读屏名。 */
  amendInput: (order: Order) => string
  /** Text under the price box when the typed price is invalid. 输入非法时的提示。 */
  amendInvalid: string
  /** Text of the cancel-all button. 「全部撤单」。 */
  cancelAll: string
  /** The line above the table (「3 张委托」). 表上方的统计。 */
  summary: (count: number) => string
  /** Text when there are no orders. 没有委托时的字。 */
  empty: string
}

export type OrdersTableProps = {
  /** Working orders. */
  orders: readonly Order[]
  /** Texts. */
  labels: OrdersTableLabels
  /** Called when the cancel button of a row is pressed. */
  onCancel?: (order: Order) => void
  /** Called with every order that can still be cancelled when "cancel all" is pressed; the caller confirms with the user. */
  onCancelAll?: (orders: Order[]) => void
  /** Called when Enter is pressed on a changed, valid price; the caller sends the amend and updates the order. */
  onAmend?: (order: Order, price: number) => void
  /** How a price is written; defaults to the order's pricePrecision. */
  formatPrice?: (value: number, order: Order) => string
  /** How a quantity is written; defaults to up to 8 decimals without trailing zeros. */
  formatQuantity?: (value: number, order: Order) => string
  /** How the created time is written; defaults to HH:MM:SS in UTC. */
  formatTime?: (time: number) => string
  /** Hide the bar above the table (summary and cancel all). */
  hideBar?: boolean
  /** Extra class name on the root. */
  className?: string
}

type Context = {
  labels: OrdersTableLabels
  price: (value: number, order: Order) => string
  quantity: (value: number, order: Order) => string
  time: (time: number) => string
  editing: string | null
  startAmend?: (order: Order) => void
  stopAmend: () => void
  submitAmend?: (order: Order, price: number) => void
  onCancel?: (order: Order) => void
}

type Line = { order: Order; ctx: Context }

const DASH = '—'

const defaultQuantity = (value: number) => String(Number(value.toFixed(8)))
const defaultTime = (time: number) => new Date(time).toISOString().slice(11, 19)
const defaultPrice = (value: number, order: Order) =>
  order.pricePrecision === undefined ? String(Number(value.toFixed(10))) : value.toFixed(order.pricePrecision)

const STATUS_TONE: Record<OrderStatus, 'neutral' | 'ok' | 'warn'> = {
  open: 'neutral',
  partial: 'ok',
  pending: 'neutral',
  canceling: 'warn',
}

/** 行内改价框：打开时全选，回车提交、Esc 与失焦取消；价格没变只关框，非法留在框里标红。输入法组字中的 Enter / Esc 不算（#208）。 */
function AmendField({ order, ctx }: { order: Order; ctx: Context }) {
  const [draft, setDraft] = useState(() => (order.price === null ? '' : ctx.price(order.price, order)))
  const [invalid, setInvalid] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    input.current?.focus()
    input.current?.select()
  }, [])
  return (
    <span className="k-ord-amend" data-slot="order-amend">
      <Input
        ref={input}
        size="sm"
        inputMode="decimal"
        className="k-ord-amend-input"
        value={draft}
        aria-label={ctx.labels.amendInput(order)}
        aria-invalid={invalid || undefined}
        onChange={(event) => {
          setDraft(event.target.value)
          setInvalid(false)
        }}
        onBlur={() => ctx.stopAmend()}
        onKeyDown={(event) => {
          // 输入法组字时的 Enter 是选字、Esc 是取消候选词，都不是改单的提交与取消；Safari 上屏那一下 isComposing 已是 false、keyCode 仍是 229，两个都要判。
          if (event.nativeEvent.isComposing || event.keyCode === 229) {
            // 组字时的 Esc 也不外传（与白板便签一致）：别让外层的「Esc 关浮层」把候选词与整张表一起收了。
            if (event.key === 'Escape') event.stopPropagation()
            return
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            ctx.stopAmend()
          } else if (event.key === 'Enter') {
            event.preventDefault()
            const decision = amendDecision(order, draft)
            if (decision.kind === 'invalid') setInvalid(true)
            else {
              ctx.stopAmend()
              if (decision.kind === 'submit') ctx.submitAmend?.(order, decision.price)
            }
          }
        }}
      />
      {invalid ? (
        <span className="k-ord-amend-error" role="alert">
          {ctx.labels.amendInvalid}
        </span>
      ) : null}
    </span>
  )
}

const priceText = (line: Line) => (line.order.price === null ? DASH : line.ctx.price(line.order.price, line.order))

const COLUMNS: readonly GridColumn<Line>[] = [
  {
    id: 'symbol',
    priority: 1,
    type: 'custom',
    rowHeader: true,
    text: (line) => line.order.symbol,
    sort: (line) => line.order.symbol,
    cell: (line) => <span className="k-ord-symbol">{line.order.symbol}</span>,
  },
  {
    id: 'side',
    priority: 6,
    type: 'custom',
    text: (line) => line.ctx.labels.side[line.order.side],
    sort: (line) => line.order.side,
    cell: (line) => (
      <span className="k-ord-side" data-slot="order-side" data-side={line.order.side}>
        {line.ctx.labels.side[line.order.side]}
      </span>
    ),
  },
  {
    id: 'type',
    priority: 8,
    type: 'custom',
    text: (line) => line.ctx.labels.type[line.order.type],
    sort: (line) => line.order.type,
    cell: (line) => line.ctx.labels.type[line.order.type],
  },
  {
    id: 'price',
    priority: 3,
    type: 'custom',
    text: priceText,
    sort: (line) => line.order.price ?? undefined,
    cell: (line) =>
      line.ctx.editing === line.order.id ? (
        <AmendField order={line.order} ctx={line.ctx} />
      ) : (
        <span className="k-ord-price">
          <span data-slot="order-price">{priceText(line)}</span>
          {line.order.type === 'conditional' && line.order.triggerPrice != null ? (
            <span className="k-ord-trigger">@{line.ctx.price(line.order.triggerPrice, line.order)}</span>
          ) : null}
          {line.ctx.startAmend && canAmend(line.order) ? (
            <button
              type="button"
              className="k-ord-edit"
              data-action="amend"
              aria-label={line.ctx.labels.amendFor(line.order)}
              onClick={() => line.ctx.startAmend?.(line.order)}
            >
              <PencilIcon size={12} aria-hidden="true" />
            </button>
          ) : null}
        </span>
      ),
  },
  {
    id: 'quantity',
    priority: 7,
    type: 'custom',
    text: (line) => line.ctx.quantity(line.order.quantity, line.order),
    sort: (line) => line.order.quantity,
    cell: (line) => line.ctx.quantity(line.order.quantity, line.order),
  },
  {
    id: 'filled',
    priority: 4,
    type: 'custom',
    text: (line) => line.ctx.quantity(line.order.filled, line.order),
    sort: (line) => fillRatio(line.order),
    cell: (line) => (
      <span className="k-ord-fill" data-slot="order-fill">
        <span className="k-ord-fill-text">{line.ctx.quantity(line.order.filled, line.order)}</span>
        <span className="k-ord-bar" aria-hidden="true">
          <i style={{ width: `${fillRatio(line.order) * 100}%` }} />
        </span>
      </span>
    ),
  },
  {
    id: 'status',
    priority: 5,
    type: 'custom',
    text: (line) => line.ctx.labels.status[line.order.status],
    sort: (line) => line.order.status,
    cell: (line) => (
      <Tag tone={STATUS_TONE[line.order.status]} size="sm" outlined data-slot="order-status">
        {line.ctx.labels.status[line.order.status]}
      </Tag>
    ),
  },
  {
    id: 'time',
    priority: 9,
    type: 'custom',
    text: (line) => line.ctx.time(line.order.time),
    sort: (line) => line.order.time,
    cell: (line) => line.ctx.time(line.order.time),
  },
  {
    id: 'actions',
    priority: 2,
    type: 'custom',
    text: () => '',
    cell: (line) =>
      line.ctx.onCancel ? (
        <Button
          size="sm"
          data-action="cancel"
          disabled={!canCancel(line.order)}
          aria-label={line.ctx.labels.cancelFor(line.order)}
          onClick={() => line.ctx.onCancel?.(line.order)}
        >
          {line.ctx.labels.cancel}
        </Button>
      ) : null,
  },
]

export function OrdersTable({
  orders,
  labels,
  onCancel,
  onCancelAll,
  onAmend,
  formatPrice: price = defaultPrice,
  formatQuantity: quantity = (value) => defaultQuantity(value),
  formatTime: time = defaultTime,
  hideBar,
  className,
}: OrdersTableProps) {
  const [sort, setSort] = useState<SortSpec | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const ctx: Context = {
    labels,
    price,
    quantity,
    time,
    editing,
    startAmend: onAmend ? (order) => setEditing(order.id) : undefined,
    stopAmend: () => setEditing(null),
    submitAmend: onAmend,
    onCancel,
  }
  const lines: Line[] = orders.map((order) => ({ order, ctx }))
  const layout: GridColumnLayout[] = [
    { id: 'symbol', label: labels.columns.symbol, width: 112, visible: true },
    { id: 'side', label: labels.columns.side, width: 52, visible: true },
    { id: 'type', label: labels.columns.type, width: 64, visible: true },
    { id: 'price', label: labels.columns.price, width: 148, visible: true, align: 'end' },
    { id: 'quantity', label: labels.columns.quantity, width: 84, visible: true, align: 'end' },
    { id: 'filled', label: labels.columns.filled, width: 128, visible: true, align: 'end' },
    { id: 'status', label: labels.columns.status, width: 92, visible: true },
    { id: 'time', label: labels.columns.time, width: 80, visible: true, align: 'end' },
    { id: 'actions', label: labels.columns.actions, width: 72, visible: Boolean(onCancel) },
  ]
  const pending = cancellable(orders)
  return (
    <div className={cn('k-ord', className)} data-slot="orders-table">
      {hideBar ? null : (
        <div className="k-ord-top" data-slot="orders-bar">
          <span className="k-ord-summary" role="status">
            {labels.summary(orders.length)}
          </span>
          {onCancelAll ? (
            <Button
              size="sm"
              variant="danger"
              data-action="cancel-all"
              disabled={pending.length === 0}
              onClick={() => onCancelAll(pending)}
            >
              {labels.cancelAll}
            </Button>
          ) : null}
        </div>
      )}
      {lines.length === 0 ? (
        <p className="k-ord-empty" role="status">
          {labels.empty}
        </p>
      ) : (
        <DataGrid
          classNames={{ root: 'k-ord-grid' }}
          columns={COLUMNS}
          layout={layout}
          rows={lines}
          rowId={(line) => line.order.id}
          label={labels.list}
          sort={sort}
          onSortChange={setSort}
          rowProps={(line) => ({
            'data-order': line.order.id,
            'data-status': line.order.status,
            'data-side': line.order.side,
            ...(isCanceling(line.order) ? { 'aria-busy': true } : {}),
          })}
          density="relaxed"
          selectable={false}
          stretch
          fit
          maxHeight={520}
        />
      )}
    </div>
  )
}

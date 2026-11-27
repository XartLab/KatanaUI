// SPDX-License-Identifier: MIT
/**
 * Dragon-tiger list net buy bars: one row per stock with a centered net bar, and the top buy and sell seats when a row is opened.
 * 龙虎榜净买居中条（#11，开盘啦「实时 / 深度龙虎榜」对照）：一行一只票：徽标与代码、涨跌幅、零轴居中的净买条（净买往右、净卖往左）、净买额、买入 / 卖出合计。
 * 点开一行在下面摊开席位对照：左列买入前几、右列卖出前几，每席一根横条（按这只票的席位最大额）与金额，机构席位带「机构」标签。
 * 零轴条与对称刻度照 AttributionBars 的模型（attributionBar / attributionScale），不另造；颜色：净买与买入席位走 --k-tone-up，净卖与卖出走 --k-tone-down，
 * 根上 data-updown="cn" 时就是 A 股的买红卖绿，件里不写死。金额写法、文字都由调用方传。版式取 TradingView 列表的紧凑行与 tabular-nums。
 */
import { useId, useState } from 'react'
import { cn } from '../../lib/cn.ts'
import { spanVar } from '../../lib/fill.ts'
import { formatVolume } from '../../lib/chart/format/index.ts'
import { ChangeText } from '../../quotes/change-text.tsx'
import { SymbolMark } from '../../quotes/symbol-mark.tsx'
import { Tag } from '../../katana/tag.tsx'
import { netBar, netScale, seatShare, type DragonSeat, type DragonTigerItem } from './net-buy-model.ts'

export type { DragonSeat, DragonTigerItem } from './net-buy-model.ts'

/** Texts of NetBuyBar (the package ships no text). */
export type NetBuyBarLabels = {
  /** Accessible name of the list. 列表的读屏名。 */
  list: string
  /** Column headers. 列头。 */
  columns: { name: string; change: string; net: string; buy: string; sell: string }
  /** Seat column titles (「买入前五」「卖出前五」). 席位两列的标题。 */
  seats: { buy: string; sell: string }
  /** Tag on an institutional seat (「机构」). 机构席位的标签。 */
  institution: string
  /** Scale note under the head, gets the symmetric max (「刻度 ±5 亿」). 刻度说明。 */
  scale?: (max: number) => string
  /** Text when the list is empty. 没有上榜时的字。 */
  empty: string
}

export type NetBuyBarProps = {
  /** Stocks in the caller's order (usually by net buy). 上榜个股，按调用方的次序。 */
  items: readonly DragonTigerItem[]
  /** Texts. */
  labels: NetBuyBarLabels
  /** How an amount is written (sign included for net); defaults to the short volume form. 金额写法。 */
  formatAmount?: (value: number) => string
  /** Code of the opened row (controlled); null for none. 展开的那只（受控）。 */
  expanded?: string | null
  /** Uncontrolled: the row open at first. 不受控时一开始展开的那只。 */
  defaultExpanded?: string | null
  /** Called when a row is opened or closed. */
  onExpandedChange?: (code: string | null) => void
  /** Extra class name on the root. */
  className?: string
}

const DASH = '—'
const signed = (value: number, write: (v: number) => string) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${write(Math.abs(value))}`

function SeatList({
  title,
  side,
  seats,
  all,
  labels,
  write,
}: {
  title: string
  side: 'buy' | 'sell'
  seats: readonly DragonSeat[]
  all: { buy: readonly DragonSeat[]; sell: readonly DragonSeat[] }
  labels: NetBuyBarLabels
  write: (v: number) => string
}) {
  return (
    <div className="k-netbuy-seats" data-side={side}>
      <div className="k-netbuy-seats-title">{title}</div>
      <ol>
        {seats.map((seat, index) => (
          <li key={`${seat.name}-${index}`} data-slot="netbuy-seat" data-institution={seat.institution || undefined}>
            <span className="k-netbuy-seat-name">
              <span>{seat.name}</span>
              {seat.institution ? (
                <Tag size="sm" outlined>
                  {labels.institution}
                </Tag>
              ) : null}
            </span>
            <span className="k-netbuy-seat-track" aria-hidden="true">
              <i style={{ width: `${seatShare(seat.amount, all) * 100}%` }} />
            </span>
            <span className="k-netbuy-seat-amount">{write(seat.amount)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function NetBuyBar({
  items,
  labels,
  formatAmount = formatVolume,
  expanded: controlled,
  defaultExpanded = null,
  onExpandedChange,
  className,
}: NetBuyBarProps) {
  const uid = useId()
  const [own, setOwn] = useState<string | null>(defaultExpanded)
  const open = controlled === undefined ? own : controlled
  const scale = netScale(items)
  const toggle = (code: string) => {
    const next = open === code ? null : code
    if (controlled === undefined) setOwn(next)
    onExpandedChange?.(next)
  }
  if (items.length === 0)
    return (
      <div className={cn('k-netbuy', className)} data-slot="net-buy-bar">
        <p className="k-netbuy-empty" role="status">
          {labels.empty}
        </p>
      </div>
    )
  return (
    <div className={cn('k-netbuy', className)} data-slot="net-buy-bar">
      <div className="k-netbuy-columns" aria-hidden="true">
        <span>{labels.columns.name}</span>
        <span className="is-num">{labels.columns.change}</span>
        <span className="k-netbuy-scale">{labels.scale?.(scale)}</span>
        <span className="is-num">{labels.columns.net}</span>
        <span className="is-num">{labels.columns.buy}</span>
        <span className="is-num">{labels.columns.sell}</span>
      </div>
      <ul className="k-netbuy-list" aria-label={labels.list}>
        {items.map((item) => {
          const bar = netBar(item.net, scale)
          const tone = item.net > 0 ? 'up' : item.net < 0 ? 'down' : 'flat'
          const isOpen = open === item.code
          const detailId = `${uid}-${item.code}`
          const hasSeats = Boolean(item.seats && (item.seats.buy.length || item.seats.sell.length))
          return (
            <li key={item.code} className="k-netbuy-item" data-code={item.code} data-open={isOpen || undefined}>
              <button
                type="button"
                className="k-netbuy-row"
                data-slot="netbuy-row"
                aria-expanded={hasSeats ? isOpen : undefined}
                aria-controls={hasSeats && isOpen ? detailId : undefined}
                onClick={() => hasSeats && toggle(item.code)}
              >
                <span className="k-netbuy-name">
                  <SymbolMark symbol={item.code} name={item.name} src={item.logo} size="sm" />
                  <span className="k-netbuy-code">{item.code}</span>
                  <span className="k-netbuy-sub">{item.name}</span>
                </span>
                <span className="k-netbuy-num">
                  {item.change === undefined ? DASH : <ChangeText value={item.change} />}
                </span>
                <span className="k-netbuy-track" aria-hidden="true">
                  <i data-slot="netbuy-bar" data-tone={tone} style={spanVar(bar.left, bar.width)} />
                </span>
                <span className="k-netbuy-num k-netbuy-net" data-slot="netbuy-net" data-tone={tone}>
                  {signed(item.net, formatAmount)}
                </span>
                <span className="k-netbuy-num">{item.buy === undefined ? DASH : formatAmount(item.buy)}</span>
                <span className="k-netbuy-num">{item.sell === undefined ? DASH : formatAmount(item.sell)}</span>
              </button>
              {item.reason ? <span className="k-netbuy-reason">{item.reason}</span> : null}
              {hasSeats && isOpen && item.seats ? (
                <div className="k-netbuy-detail" id={detailId} data-slot="netbuy-detail">
                  <SeatList
                    title={labels.seats.buy}
                    side="buy"
                    seats={item.seats.buy}
                    all={item.seats}
                    labels={labels}
                    write={formatAmount}
                  />
                  <SeatList
                    title={labels.seats.sell}
                    side="sell"
                    seats={item.seats.sell}
                    all={item.seats}
                    labels={labels}
                    write={formatAmount}
                  />
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

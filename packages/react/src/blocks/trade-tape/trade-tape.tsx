// SPDX-License-Identifier: MIT
/**
 * Trade tape: recent trades newest on top, price colored by the aggressor side, large trades highlighted, optional merging of consecutive same-price same-side trades.
 * 成交明细：时间、价格（按主动方向着涨跌色）、数量；新成交从顶上进（蓝线高亮一阵，共用层 lib/live.ts）；
 * 量不小于 largeSize 的行高亮（阈值由调用方传）；aggregate 把紧挨着的同价同方向成交并成一行（右边写 ×n）。
 * 只吃 props：调用方把增量并进列表、按从新到旧传整份进来；聚合与大单判定在 trade-tape-model.ts 里按整数算。
 * 为什么不虚拟滚动：明细只留最近 maxRows 行（默认 50），一屏就是全部，更早的由调用方走历史查询。
 */
import { cn } from '../../lib/cn.ts'
import { useEnterMarks } from '../../lib/live.ts'
import { formatDecimal } from '../../lib/scaled-decimal.ts'
import { clockText, tapeRows, type Trade, type TradeSide } from './trade-tape-model.ts'

export type { Trade, TradeSide } from './trade-tape-model.ts'

/** Texts of TradeTape (the package ships no text). */
export type TradeTapeLabels = {
  /** Accessible name of the list. 列表的读屏名。 */
  list: string
  /** Column headers. 列头。 */
  columns: { time: string; price: string; size: string }
  /** Names of the two aggressor sides, read out with each row (「主动买」「主动卖」). 两种主动方向的名字。 */
  sides: Record<TradeSide, string>
  /** Text of the merged-count badge, gets the number of trades in the row (「×3」). 聚合行的笔数徽标。 */
  count: (n: number) => string
  /** Text for a large trade, read out with the row. 大单的读屏文字。 */
  large: string
  /** Text when there are no trades. 没有成交时的字。 */
  empty: string
}

export type TradeTapeProps = {
  /** Trades newest first; ids must be stable so new ones can be told apart. 成交，从新到旧；id 要稳定，新成交靠它认出来。 */
  trades: readonly Trade[]
  /** Decimal places of a price. 价格小数位。 */
  priceDecimals: number
  /** Decimal places of a size. 数量小数位。 */
  sizeDecimals: number
  /** Texts. */
  labels: TradeTapeLabels
  /** Highlight rows whose size is at least this; none when omitted. 大单阈值：量不小于它的行高亮。 */
  largeSize?: number
  /** Merge consecutive trades at the same price and side into one row. 把紧挨着的同价同方向成交并成一行。 */
  aggregate?: boolean
  /** Rows to keep, counted after merging; default 50. 最多留几行（聚合后算）。 */
  maxRows?: number
  /** How a timestamp is written; defaults to UTC HH:MM:SS. 时间写法；默认 UTC 的时分秒。 */
  formatTime?: (time: number) => string
  /** How a price is written; defaults to fixed priceDecimals places. 价格写法。 */
  formatPrice?: (price: number) => string
  /** How a size is written; defaults to fixed sizeDecimals places. 数量写法。 */
  formatSize?: (size: number) => string
  /** Extra class name on the root. */
  className?: string
}

const DEFAULT_MAX_ROWS = 50

export function TradeTape({
  trades,
  priceDecimals,
  sizeDecimals,
  labels,
  largeSize,
  aggregate = false,
  maxRows = DEFAULT_MAX_ROWS,
  formatTime = clockText,
  formatPrice,
  formatSize,
  className,
}: TradeTapeProps) {
  const fmtPrice = formatPrice ?? ((price: number) => formatDecimal(price, priceDecimals))
  const fmtSize = formatSize ?? ((size: number) => formatDecimal(size, sizeDecimals))
  const rows = tapeRows(trades, { sizeDecimals, aggregate, largeSize, maxRows })
  // 首次渲染的行算旧的不高亮；之后新出现的 key 高亮一阵（聚合行的 key 是最老那笔的 id，并进新成交不会再进场一次）。
  const entering = useEnterMarks(rows.map((row) => row.key))

  return (
    <div className={cn('k-tape', className)} data-slot="trade-tape" data-aggregate={aggregate || undefined}>
      <div className="k-tape-cols" aria-hidden="true">
        <span>{labels.columns.time}</span>
        <span>{labels.columns.price}</span>
        <span>{labels.columns.size}</span>
      </div>
      {rows.length === 0 ? (
        <p className="k-tape-empty" role="status">
          {labels.empty}
        </p>
      ) : (
        <div className="k-tape-list" role="list" aria-label={labels.list}>
          {rows.map((row) => (
            <div
              key={row.key}
              role="listitem"
              className={cn(
                'k-tape-row',
                entering.has(row.key) && 'k-live-enter k-tape-enter',
                row.large && 'is-large',
              )}
              data-slot="tape-row"
              data-side={row.side}
              data-large={row.large || undefined}
              data-price={row.price}
              data-count={row.count}
            >
              <span className="k-tape-time">{formatTime(row.time)}</span>
              <span className="k-tape-price">
                <span className="k-tape-sr">{labels.sides[row.side]} </span>
                {fmtPrice(row.price)}
              </span>
              <span className="k-tape-size">
                {row.count > 1 ? <span className="k-tape-count">{labels.count(row.count)}</span> : null}
                {fmtSize(row.size)}
                {row.large ? <span className="k-tape-sr"> {labels.large}</span> : null}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

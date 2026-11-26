// SPDX-License-Identifier: MIT
/**
 * Order book: bid and ask ladders with merge ticks, cumulative depth bars, a buy/sell share bar and click-to-pick prices.
 * 订单簿：买卖并列（卖在上买在下，中间是最新价与价差）、只看买、只看卖三种模式；档位合并、每行累计量深度条、买卖占比条；
 * 点一行把价与方向交给调用方（下单面板拿去回填价格，件不认下单面板）。更新时变了量的档位闪涨跌色（共用层 lib/live.ts）。
 * 只吃 props：调用方把快照与增量合并好整份传进来；合并档位、累计量、占比都在 order-book-model.ts 里按整数算（十进制精确）。
 * 为什么不用 DataGrid：这里每侧只有十几行，要的是深度条、整行点选与逐格闪，DataGrid 的排序、列设置、虚拟滚动都用不上，拿来反而要绕开它。
 * 样子参照 KATANAview 的盘口梯子卡（买卖色、深度条、价差行），只取外观，实现重写。
 */
import { useState } from 'react'
import { fillVar } from '../../lib/fill.ts'
import { cn } from '../../lib/cn.ts'
import { useValueFlash } from '../../lib/live.ts'
import { decimalsOf, formatDecimal } from '../../lib/scaled-decimal.ts'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group.tsx'
import { FlashPrice } from '../../quotes/flash-price.tsx'
import { buildOrderBook, depthRatio, type BookLevel, type BookRow, type BookSide } from './order-book-model.ts'

export type { BookLevel, BookRow, BookSide } from './order-book-model.ts'

export type OrderBookMode = 'both' | 'bids' | 'asks'

/** Texts of OrderBook (the package ships no text). */
export type OrderBookLabels = {
  /** Accessible name of the whole book. 整个订单簿的读屏名。 */
  list: string
  /** The mode switch: group name and the three options. 模式切换。 */
  modes: { group: string; both: string; bids: string; asks: string }
  /** Accessible name of the merge tick switch. 合并档位切换的读屏名。 */
  tick: string
  /** Column headers. 列头。 */
  columns: { price: string; size: string; total: string }
  /** Short name of the bid side (「买」), used on the share bar. 买方的短名。 */
  bid: string
  /** Short name of the ask side (「卖」), used on the share bar. 卖方的短名。 */
  ask: string
  /** Name of the spread readout (「价差」). 价差读数的名字。 */
  spread: string
  /** Accessible text of the share bar, gets the two percentage texts. 占比条的读屏文字。 */
  share: (bid: string, ask: string) => string
  /** Text when there is nothing to show. 没有档位时的字。 */
  empty: string
}

export type OrderBookProps = {
  /** Bid levels in any order; a level with size 0 is treated as gone. 买盘档位，次序不限，量为 0 的档当作已撤光。 */
  bids: readonly BookLevel[]
  /** Ask levels in any order. 卖盘档位，次序不限。 */
  asks: readonly BookLevel[]
  /** Decimal places of a price, from the instrument's tick size; all price math is done on integers at this scale. 价格小数位。 */
  priceDecimals: number
  /** Decimal places of a size, from the instrument's lot size. 数量小数位。 */
  sizeDecimals: number
  /** Texts. */
  labels: OrderBookLabels
  /** Merge ticks to offer (0.1, 0.5, 1, 10); no switch is drawn when empty. 可选的合并档位；不给就不画切换。 */
  tickOptions?: readonly number[]
  /** Selected merge tick (controlled); defaults to the first option, or the smallest price step. 当前合并档位（受控）。 */
  tick?: number
  /** Uncontrolled: the merge tick at first. 不受控时一开始的合并档位。 */
  defaultTick?: number
  /** Called when the merge tick is switched. 切换合并档位。 */
  onTickChange?: (tick: number) => void
  /** Selected mode (controlled): both sides, bids only or asks only. 当前模式（受控）。 */
  mode?: OrderBookMode
  /** Uncontrolled: the mode at first; defaults to both. 不受控时一开始的模式。 */
  defaultMode?: OrderBookMode
  /** Called when the mode is switched. 切换模式。 */
  onModeChange?: (mode: OrderBookMode) => void
  /** Rows per side in both mode (a single-side mode shows twice as many); default 10. 买卖并列时每侧几行，单侧模式翻倍。 */
  depth?: number
  /** Last traded price, drawn between the ladders; its changed trailing digits flash. 最新成交价。 */
  last?: number
  /** Direction of the last move, colors the last price. 最新价的涨跌方向，决定它的颜色。 */
  lastTone?: 'up' | 'down'
  /** Called with the merged price and the side of the clicked row (the caller decides what order that means); rows are not clickable without it. 点一行：给合并后的价与这一行在簿的哪侧。 */
  onPriceSelect?: (price: number, side: BookSide) => void
  /** How a price is written; defaults to fixed priceDecimals places. 价格写法。 */
  formatPrice?: (price: number) => string
  /** How a size or cumulative size is written; defaults to fixed sizeDecimals places. 数量写法。 */
  formatSize?: (size: number) => string
  /** Extra class name on the root. */
  className?: string
}

const DEFAULT_DEPTH = 10

function BookRowView({
  row,
  side,
  ratio,
  fmtPrice,
  fmtSize,
  onSelect,
}: {
  row: BookRow
  side: BookSide
  ratio: number
  fmtPrice: (price: number) => string
  fmtSize: (size: number) => string
  onSelect?: (price: number, side: BookSide) => void
}) {
  // 量变了闪一下：变大涨色、变小跌色。新出现的档（合并档位切换、价位移动）是新挂载的行，首次渲染不闪。
  const flash = useValueFlash(row.size)
  const cells = (
    <>
      <span className="k-book-bar" style={fillVar(ratio)} aria-hidden="true" />
      <span className="k-book-price">{fmtPrice(row.price)}</span>
      <span
        key={flash.key}
        className="k-book-size k-live-flash"
        data-slot="book-size"
        data-flash={flash.flash ?? undefined}
      >
        {fmtSize(row.size)}
      </span>
      <span className="k-book-total">{fmtSize(row.total)}</span>
    </>
  )
  const common = { 'data-slot': 'book-row', 'data-side': side, 'data-price': row.price }
  return (
    <div role="listitem" className="k-book-item">
      {onSelect ? (
        <button type="button" className="k-book-row" {...common} onClick={() => onSelect(row.price, side)}>
          {cells}
        </button>
      ) : (
        <div className="k-book-row" {...common}>
          {cells}
        </div>
      )}
    </div>
  )
}

export function OrderBook({
  bids,
  asks,
  priceDecimals,
  sizeDecimals,
  labels,
  tickOptions = [],
  tick: tickProp,
  defaultTick,
  onTickChange,
  mode: modeProp,
  defaultMode = 'both',
  onModeChange,
  depth = DEFAULT_DEPTH,
  last,
  lastTone,
  onPriceSelect,
  formatPrice,
  formatSize,
  className,
}: OrderBookProps) {
  const [innerMode, setInnerMode] = useState<OrderBookMode>(defaultMode)
  const [innerTick, setInnerTick] = useState<number | undefined>(defaultTick)
  const mode = modeProp ?? innerMode
  const tick = tickProp ?? innerTick ?? tickOptions[0] ?? 10 ** -priceDecimals

  const fmtPrice = formatPrice ?? ((price: number) => formatDecimal(price, priceDecimals))
  const fmtSize = formatSize ?? ((size: number) => formatDecimal(size, sizeDecimals))

  // 单侧模式把行数翻倍，占比仍只数「并列模式能看到的」前 depth 行：条上的数不随模式跳。
  const rows = mode === 'both' ? depth : depth * 2
  const model = buildOrderBook(bids, asks, { tick, rows, shareRows: depth, priceDecimals, sizeDecimals })
  const shownAsks = mode === 'bids' ? [] : model.asks
  const shownBids = mode === 'asks' ? [] : model.bids
  const maxTotal = Math.max(shownAsks.at(-1)?.total ?? 0, shownBids.at(-1)?.total ?? 0)
  // 卖盘最优价贴着中间那一行：显示时最远的在上。
  const askRows = shownAsks.toReversed()

  const setMode = (next: string) => {
    setInnerMode(next as OrderBookMode)
    onModeChange?.(next as OrderBookMode)
  }
  const setTick = (next: string) => {
    const value = Number(next)
    setInnerTick(value)
    onTickChange?.(value)
  }

  const renderRows = (list: readonly BookRow[], side: BookSide) =>
    list.map((row) => (
      <BookRowView
        key={row.price}
        row={row}
        side={side}
        ratio={depthRatio(row.total, maxTotal)}
        fmtPrice={fmtPrice}
        fmtSize={fmtSize}
        onSelect={onPriceSelect}
      />
    ))

  const empty = model.bids.length === 0 && model.asks.length === 0
  const bidText = model.bidPct === null ? null : `${model.bidPct.toFixed(1)}%`
  const askText = model.askPct === null ? null : `${model.askPct.toFixed(1)}%`

  const middle = (
    <div className="k-book-mid" data-slot="book-mid">
      {last === undefined ? null : (
        <span className="k-book-lastwrap" data-tone={lastTone}>
          <FlashPrice value={last} text={fmtPrice(last)} className="k-book-last" />
        </span>
      )}
      {model.spread === null ? null : (
        <span className="k-book-spread" data-slot="book-spread">
          <span className="k-book-spread-name">{labels.spread}</span>
          <span data-slot="book-spread-value">{fmtPrice(model.spread)}</span>
          {model.spreadPct === null ? null : <span>{model.spreadPct.toFixed(2)}%</span>}
        </span>
      )}
    </div>
  )

  return (
    <div
      className={cn('k-book', className)}
      data-slot="order-book"
      data-mode={mode}
      role="group"
      aria-label={labels.list}
    >
      <div className="k-book-head">
        <ToggleGroup size="sm" aria-label={labels.modes.group} value={mode} onValueChange={setMode}>
          <ToggleGroupItem value="both">{labels.modes.both}</ToggleGroupItem>
          <ToggleGroupItem value="bids">{labels.modes.bids}</ToggleGroupItem>
          <ToggleGroupItem value="asks">{labels.modes.asks}</ToggleGroupItem>
        </ToggleGroup>
        {tickOptions.length > 0 ? (
          <ToggleGroup size="sm" aria-label={labels.tick} value={String(tick)} onValueChange={setTick}>
            {tickOptions.map((option) => (
              <ToggleGroupItem key={option} value={String(option)}>
                {formatDecimal(option, decimalsOf(option), false)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}
      </div>
      <div className="k-book-cols" aria-hidden="true">
        <span>{labels.columns.price}</span>
        <span>{labels.columns.size}</span>
        <span>{labels.columns.total}</span>
      </div>
      {empty ? (
        <p className="k-book-empty" role="status">
          {labels.empty}
        </p>
      ) : (
        <>
          {mode === 'bids' ? middle : null}
          {askRows.length > 0 ? (
            <div className="k-book-side" role="list" data-side="ask" aria-label={labels.ask}>
              {renderRows(askRows, 'ask')}
            </div>
          ) : null}
          {mode !== 'bids' ? middle : null}
          {shownBids.length > 0 ? (
            <div className="k-book-side" role="list" data-side="bid" aria-label={labels.bid}>
              {renderRows(shownBids, 'bid')}
            </div>
          ) : null}
        </>
      )}
      {bidText === null || askText === null ? null : (
        <div className="k-book-share" data-slot="book-share" role="img" aria-label={labels.share(bidText, askText)}>
          <span
            className="k-book-share-bid"
            data-slot="book-share-bid"
            data-pct={model.bidPct}
            style={fillVar((model.bidPct ?? 0) / 100)}
          >
            <i className="k-book-share-fill" aria-hidden="true" />
            {labels.bid} {bidText}
          </span>
          <span
            className="k-book-share-ask"
            data-slot="book-share-ask"
            data-pct={model.askPct}
            style={fillVar((model.askPct ?? 0) / 100)}
          >
            <i className="k-book-share-fill" aria-hidden="true" />
            {askText} {labels.ask}
          </span>
        </div>
      )}
    </div>
  )
}

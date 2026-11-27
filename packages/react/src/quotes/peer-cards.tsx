// SPDX-License-Identifier: MIT
// 同业卡：一条横向的卡片带，两侧翻页箭头；每张卡有徽标、代码、名称（过长截断）、右上「+」、价格（带单位小字）与涨跌幅；
// 右上角整组一个「选择对比」按钮。布局参照 TradingView 品种页的 Peers（主会话 2026-11-15 在真实浏览器里实测 /symbols/NASDAQ-AAPL/，只取布局与交互，不抄代码）。
// 卡就是统一行情行（QuoteRow 的 id / symbol / name / last / changePct，2026-11-18）：价格是数，由 formatPrice 写；单位、文字由调用方传；涨跌幅按涨跌语义色上色。
// 徽标用包里的 SymbolMark（字母圆，不放真实公司标志）。旧的 key / code / price 字符串 / change（当涨跌幅）照旧认一个版本。
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../lib/cn.ts'
import { ChangeText } from './change-text.tsx'
import { plainPrice, type FormatPrice, type QuoteRow } from './quote-row.ts'
import { SymbolMark } from './symbol-mark.tsx'

/** One peer card: the shared QuoteRow fields it shows, plus a unit and a logo. */
export type PeerItem = Pick<QuoteRow, 'id' | 'symbol' | 'last' | 'changePct'> & {
  /** Company or instrument name (truncated when long). */
  name: string
  /** Small text after the price (USD). */
  unit?: string
  /** Logo image of the symbol mark; letters are drawn when omitted. */
  logoSrc?: string
}

/** @deprecated The old card shape (key / code / price text / change as a percentage); use PeerItem. */
export type LegacyPeerItem = Omit<PeerItem, 'id' | 'symbol' | 'last' | 'changePct'> & {
  /** Deprecated: use id. @deprecated Use id. */
  key: string
  /** Deprecated: use symbol. @deprecated Use symbol. */
  code: string
  /** Deprecated: use last with formatPrice. @deprecated Use last with formatPrice. */
  price: string
  /** Deprecated: use changePct (this was the percentage). @deprecated Use changePct (this was the percentage). */
  change: number
}

type Card = PeerItem & { priceText: string }

function cardOf(item: PeerItem | LegacyPeerItem, format: FormatPrice): Card {
  if ('code' in item && !('symbol' in item)) {
    const legacy = item as LegacyPeerItem
    return {
      ...legacy,
      id: legacy.key,
      symbol: legacy.code,
      last: Number.NaN,
      changePct: legacy.change,
      priceText: legacy.price,
    }
  }
  const row = item as PeerItem
  return { ...row, priceText: format(row.last) }
}

export type PeerCardsLabels = {
  /** 整条的读屏名。 */
  list: string
  prev: string
  next: string
  /** 右上角整组按钮的字（Select to compare）。 */
  compare: string
  /** 每张卡「+」的读屏名。 */
  add: (item: PeerItem) => string
}

export type PeerCardsProps = {
  /** The cards, in order. */
  items: readonly (PeerItem | LegacyPeerItem)[]
  /** Accessible names and the compare button text. */
  labels: PeerCardsLabels
  /** Writes the price; two decimals when omitted. */
  formatPrice?: FormatPrice
  onSelect?: (item: PeerItem) => void
  onAdd?: (item: PeerItem) => void
  onCompare?: () => void
  className?: string
}

export function PeerCards({
  items,
  labels,
  formatPrice = plainPrice,
  onSelect,
  onAdd,
  onCompare,
  className,
}: PeerCardsProps) {
  const cards = items.map((item) => cardOf(item, formatPrice))
  const rail = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })
  const measure = useCallback(() => {
    const el = rail.current
    if (!el) return
    const start = el.scrollLeft <= 1
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
  }, [])
  useEffect(() => {
    const el = rail.current
    if (!el) return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure, items.length])
  const page = (dir: -1 | 1) =>
    rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: 'smooth' })

  return (
    <div className={cn('k-peers', className)} data-slot="peer-cards">
      <div className="k-peers-bar">
        <button type="button" className="k-peers-compare" data-slot="peer-compare" onClick={onCompare}>
          {labels.compare}
        </button>
        <button
          type="button"
          className="k-peers-arrow"
          data-slot="peer-prev"
          aria-label={labels.prev}
          disabled={edges.start}
          onClick={() => page(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className="k-peers-arrow"
          data-slot="peer-next"
          aria-label={labels.next}
          disabled={edges.end}
          onClick={() => page(1)}
        >
          ›
        </button>
      </div>
      <div ref={rail} className="k-peers-rail" role="list" aria-label={labels.list} onScroll={measure}>
        {cards.map((item) => (
          <div key={item.id} className="k-peers-card" role="listitem" data-slot="peer-card" data-key={item.id}>
            <button type="button" className="k-peers-main" onClick={() => onSelect?.(item)}>
              <SymbolMark symbol={item.symbol} name={item.name} src={item.logoSrc} size="md" />
              <span className="k-peers-code">{item.symbol}</span>
              <span className="k-peers-name" title={item.name}>
                {item.name}
              </span>
              <span className="k-peers-price">
                {item.priceText}
                {item.unit ? <small>{item.unit}</small> : null}
              </span>
              <ChangeText value={item.changePct} className="k-peers-change" />
            </button>
            <button type="button" className="k-peers-add" aria-label={labels.add(item)} onClick={() => onAdd?.(item)}>
              +
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// SPDX-License-Identifier: MIT
// 同业卡：一条横向的卡片带，两侧翻页箭头；每张卡有徽标、代码、名称（过长截断）、右上「+」、价格（带单位小字）与涨跌幅；
// 右上角整组一个「选择对比」按钮。布局参照 TradingView 品种页的 Peers（主会话 2026-11-15 在真实浏览器里实测 /symbols/NASDAQ-AAPL/，只取布局与交互，不抄代码）。
// 价格、单位、文字都由调用方写好传来；涨跌幅是数，按涨跌语义色上色。徽标用包里的 SymbolMark（字母圆，不放真实公司标志）。
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../lib/cn.ts'
import { SymbolMark } from '../katana/symbol-mark.tsx'
import { ChangeText } from './change-text.tsx'

export type PeerItem = {
  key: string
  code: string
  name: string
  /** 已格式化的价格。 */
  price: string
  /** 价格后的小字（USD）。 */
  unit?: string
  /** 涨跌幅，百分数。 */
  change: number
  logoSrc?: string
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
  items: readonly PeerItem[]
  labels: PeerCardsLabels
  onSelect?: (item: PeerItem) => void
  onAdd?: (item: PeerItem) => void
  onCompare?: () => void
  className?: string
}

export function PeerCards({ items, labels, onSelect, onAdd, onCompare, className }: PeerCardsProps) {
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
        {items.map((item) => (
          <div key={item.key} className="k-peers-card" role="listitem" data-slot="peer-card" data-key={item.key}>
            <button type="button" className="k-peers-main" onClick={() => onSelect?.(item)}>
              <SymbolMark code={item.code} name={item.name} src={item.logoSrc} size={28} />
              <span className="k-peers-code">{item.code}</span>
              <span className="k-peers-name" title={item.name}>
                {item.name}
              </span>
              <span className="k-peers-price">
                {item.price}
                {item.unit ? <small>{item.unit}</small> : null}
              </span>
              <ChangeText value={item.change} className="k-peers-change" />
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

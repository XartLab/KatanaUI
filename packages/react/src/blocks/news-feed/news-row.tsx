// SPDX-License-Identifier: MIT
/**
 * One NewsFeed entry: meta line, title, summary, quick actions and related symbols.
 * NewsFeed 的一条（体检 §7 从 news-feed.tsx 拆出）：虚拟化与否共用；虚拟化时多带 aria-setsize / aria-posinset 与绝对定位的 top、height。
 */
import type { CSSProperties } from 'react'
import { cn } from '../../lib/cn.ts'
import { SymbolMark } from '../../katana/symbol-mark.tsx'
import { RowActions, type RowAction } from '../../patterns/row-actions.tsx'
import type { NewsItem, NewsSymbol } from './news-feed-model.ts'

/** 一条要的文案（NewsFeedLabels 的子集）。 */
export type NewsRowLabels = {
  ago: (seconds: number) => string
  absolute: (time: number) => string
  important: string
  read?: (minutes: number) => string
}

export type NewsRowPosition = { 'aria-setsize': number; 'aria-posinset': number; style: CSSProperties }

type NewsRowProps = {
  item: NewsItem
  position?: NewsRowPosition
  /** 刚放进来：挂共用层 live.ts 的入场高亮类。 */
  entering: boolean
  selected: boolean
  source: string
  now: number
  labels: NewsRowLabels
  layout: 'list' | 'card'
  symbolStyle: 'stack' | 'chips'
  actions?: readonly RowAction[]
  actionsLabel: string
  onSelect?: (item: NewsItem) => void
  onSymbolSelect?: (symbol: NewsSymbol, item: NewsItem) => void
}

export function NewsRow({
  item,
  position,
  entering,
  selected,
  source,
  now,
  labels,
  layout,
  symbolStyle,
  actions,
  actionsLabel,
  onSelect,
  onSymbolSelect,
}: NewsRowProps) {
  return (
    <li
      {...position}
      className={cn('k-news-item', entering && 'k-live-enter')}
      data-important={item.important ? '' : undefined}
      data-news-id={item.id}
      data-selected={selected ? '' : undefined}
      data-actions={actions ? '' : undefined}
    >
      <div className="k-news-meta">
        <span className="k-news-source">{source}</span>
        <time className="k-news-time" dateTime={new Date(item.time).toISOString()} title={labels.absolute(item.time)}>
          {labels.ago(Math.max(0, Math.floor((now - item.time) / 1000)))}
        </time>
        {labels.read && item.readMinutes !== undefined ? (
          <span className="k-news-read">{labels.read(item.readMinutes)}</span>
        ) : null}
        {item.important && (
          <span className="k-news-flag" role="img" aria-label={labels.important} title={labels.important} />
        )}
      </div>
      <div className="k-news-body">
        <NewsTitle item={item} onSelect={onSelect} />
        {item.summary && layout === 'card' && <p className="k-news-summary">{item.summary}</p>}
      </div>
      {actions && <RowActions items={actions} label={actionsLabel} />}
      {item.symbols && item.symbols.length > 0 && (
        <div className="k-news-symbols" data-style={symbolStyle}>
          {item.symbols.map((symbol) => (
            <button
              key={symbol.code}
              type="button"
              className="k-news-symbol"
              aria-label={symbolStyle === 'stack' ? symbol.code : undefined}
              title={symbolStyle === 'stack' ? `${symbol.code} ${symbol.name ?? ''}`.trim() : undefined}
              onClick={() => onSymbolSelect?.(symbol, item)}
            >
              <SymbolMark code={symbol.code} name={symbol.name} size={symbolStyle === 'stack' ? 18 : 14} />
              {symbolStyle === 'chips' ? <span>{symbol.code}</span> : null}
            </button>
          ))}
        </div>
      )}
    </li>
  )
}

/** 标题：给了 onSelect 是按钮；没给且条目有 href 是链接；都没有是字。 */
function NewsTitle({ item, onSelect }: { item: NewsItem; onSelect?: (item: NewsItem) => void }) {
  if (onSelect)
    return (
      <button type="button" className="k-news-title" onClick={() => onSelect(item)}>
        {item.title}
      </button>
    )
  if (item.href)
    return (
      <a className="k-news-title" href={item.href} target="_blank" rel="noreferrer">
        {item.title}
      </a>
    )
  return <span className="k-news-title">{item.title}</span>
}

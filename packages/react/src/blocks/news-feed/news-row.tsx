// SPDX-License-Identifier: MIT
/**
 * One NewsFeed entry: meta line, title, summary, quick actions and related symbols.
 * NewsFeed 的一条（体检 §7 从 news-feed.tsx 拆出）：虚拟化与否共用；虚拟化时多带 aria-setsize / aria-posinset 与绝对定位的 top、height。
 */
import type { CSSProperties } from 'react'
import { cn } from '../../lib/cn.ts'
import { SymbolMark } from '../../quotes/symbol-mark.tsx'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../primitives/tooltip.tsx'
import { RowActions, type RowAction } from '../../quotes/row-actions.tsx'
import type { NewsItem, NewsSymbol } from './news-feed-model.ts'

/** 一条要的文案（NewsFeedLabels 的子集）。 */
export type NewsRowLabels = {
  ago: (seconds: number) => string
  absolute: (time: number) => string
  important: string
  read?: (minutes: number) => string
}

/** 一条的来源数与悬停说明已经按文案排好的文字（NewsFeed 按 labels 算好传进来）。 */
export type NewsRowSources = { text: string; also?: string }

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
  /** 分量 compact（#115）：只留「时间 标题」，不画来源、阅读时长、快捷操作与品种。 */
  compact?: boolean
  /** 来源数（sourcesCount 大于 1 才有）。 */
  sources?: NewsRowSources
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
  compact = false,
  sources,
  onSelect,
  onSymbolSelect,
}: NewsRowProps) {
  const tags = compact ? undefined : item.tags
  const hasExtras = !compact && ((tags && tags.length > 0) || sources !== undefined)
  return (
    <li
      {...position}
      className={cn('k-news-item', entering && 'k-live-enter')}
      data-important={item.important ? '' : undefined}
      data-news-id={item.id}
      data-selected={selected ? '' : undefined}
      data-actions={actions && !compact ? '' : undefined}
    >
      <div className="k-news-meta">
        {!compact && <span className="k-news-source">{source}</span>}
        <time className="k-news-time" dateTime={new Date(item.time).toISOString()} title={labels.absolute(item.time)}>
          {labels.ago(Math.max(0, Math.floor((now - item.time) / 1000)))}
        </time>
        {!compact && labels.read && item.readMinutes !== undefined ? (
          <span className="k-news-read">{labels.read(item.readMinutes)}</span>
        ) : null}
        {item.important && (
          <span className="k-news-flag" role="img" aria-label={labels.important} title={labels.important} />
        )}
      </div>
      <div className="k-news-body" data-extras={hasExtras ? '' : undefined}>
        <NewsTitle item={item} onSelect={onSelect} />
        {hasExtras && (
          <div className="k-news-extras">
            {tags?.map((tag, index) => (
              // 同一条里标签文字可以重复（两枚都叫「公告」不合理，但调用方给什么就画什么），所以键带位置。
              <span key={`${index}:${tag.label}`} className="k-news-tag" data-tone={tag.tone ?? 'neutral'}>
                {tag.label}
              </span>
            ))}
            {sources && <NewsSources {...sources} />}
          </div>
        )}
        {item.summary && layout === 'card' && <p className="k-news-summary">{item.summary}</p>}
      </div>
      {!compact && actions && <RowActions items={actions} label={actionsLabel} />}
      {!compact && item.symbols && item.symbols.length > 0 && (
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
              <SymbolMark symbol={symbol.code} name={symbol.name} size={symbolStyle === 'stack' ? 18 : 14} />
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

/** 来源数：有「另外几家」就是可聚焦的字，悬停或聚焦时用提示（Tooltip）列出名字；没有就是一段字。 */
function NewsSources({ text, also }: NewsRowSources) {
  if (!also) return <span className="k-news-sources">{text}</span>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="k-news-sources" tabIndex={0} data-also="">
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent>{also}</TooltipContent>
    </Tooltip>
  )
}

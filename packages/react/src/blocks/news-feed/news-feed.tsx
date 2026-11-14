// SPDX-License-Identifier: MIT
import { LayoutGrid, List, Pause, Play, Search } from 'lucide-react'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { SymbolMark } from '../../katana/symbol-mark.tsx'
import { ChipGroup, type ChipItem } from '../../patterns/chip-group.tsx'
import { Button } from '../../primitives/button.tsx'
import { Input } from '../../primitives/input.tsx'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group.tsx'
import { filterNews, sortNews, type NewsItem, type NewsSymbol } from './news-feed-model.ts'

// 新闻流（#29）：列表（时间、来源、标题、相关品种胶囊、重要标记）与卡片网格（来源 + 时间、标题、两行摘要、品种胶囊）两种排法；
// 顶上是频道分段、来源多选芯片、关键词搜索、暂停。功能照 TradingView 帮助文档「新闻流」的做法（频道、来源筛选、搜索）与
// uiarc.dev 的新闻卡结构（来源 + 时间、标题、两行摘要、品种胶囊），只取功能与结构，实现原创；出处读取日期 2026-11-15，细节待核对。
// 新到的条目不打断阅读：没暂停且列表在顶部时直接淡入插入，其余情况在顶上出「n 条新消息」，点了才插入。
// 数据与字全由调用方传（频道、来源、文案、当前时间 now），件不认识任何应用；筛选状态在件内，用 on*Change 通知。

export type NewsFeedLabels = {
  all: string
  /** 整个件、频道分段、来源芯片组、搜索框、排法分段的读屏名。 */
  feed: string
  channels: string
  sources: string
  clearSources: string
  search: string
  layout: string
  layoutList: string
  layoutCard: string
  pause: string
  resume: string
  /** 「3 条新消息」。 */
  newItems: (n: number) => string
  /** 相对时间：传入已过去的秒数，如「3 分钟前」。 */
  ago: (seconds: number) => string
  /** 悬停时出的绝对时间。 */
  absolute: (time: number) => string
  important: string
  empty: ReactNode
}

export type NewsFeedProps = {
  items: readonly NewsItem[]
  channels: readonly { value: string; label: string }[]
  sources: readonly { value: string; label: string }[]
  /** 当前时间（毫秒）：相对时间按它算；调用方定时更新它。 */
  now: number
  labels: NewsFeedLabels
  defaultLayout?: 'list' | 'card'
  onSymbolPick?: (symbol: NewsSymbol, item: NewsItem) => void
  /** 给了，标题是按钮，点击回调；没给且条目有 href 时标题是链接。 */
  onOpen?: (item: NewsItem) => void
  onChannelChange?: (channel: string) => void
  onSourcesChange?: (sources: string[]) => void
  onPausedChange?: (paused: boolean) => void
  className?: string
}

/** 离顶部多少像素以内算「在顶部」：留一点余量给触控板的回弹。 */
const TOP_SLACK = 4

export function NewsFeed({
  items,
  channels,
  sources,
  now,
  labels,
  defaultLayout = 'list',
  onSymbolPick,
  onOpen,
  onChannelChange,
  onSourcesChange,
  onPausedChange,
  className,
}: NewsFeedProps) {
  const [channel, setChannel] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [layout, setLayout] = useState(defaultLayout)
  const [paused, setPaused] = useState(false)
  const [atTop, setAtTop] = useState(true)
  // shown：已放进列表的条目 id；其余（来自 items）就是「新消息」。fresh：刚插入的，用来播淡入。
  const [shown, setShown] = useState<ReadonlySet<string>>(() => new Set(items.map((i) => i.id)))
  const [fresh, setFresh] = useState<ReadonlySet<string>>(() => new Set())
  const [prevItems, setPrevItems] = useState(items)
  const scroller = useRef<HTMLDivElement | null>(null)

  const release = () => {
    const added = items.filter((i) => !shown.has(i.id)).map((i) => i.id)
    if (added.length === 0) return
    setShown(new Set([...shown, ...added]))
    setFresh(new Set(added))
  }
  // 条目变了：没暂停且在顶部就直接放进来（渲染时调整状态，不用 effect）。
  if (items !== prevItems) {
    setPrevItems(items)
    if (!paused && atTop) release()
  }

  const filter = { channel, sources: picked, query }
  const visible = useMemo(
    () => filterNews(sortNews(items.filter((i) => shown.has(i.id))), filter),
    // oxlint-disable-next-line react/exhaustive-deps -- filter 是三个值拼出来的新对象，依赖写成三个值
    [items, shown, channel, picked, query],
  )
  const pending = filterNews(
    items.filter((i) => !shown.has(i.id)),
    filter,
  ).length

  const sourceName = (value: string) => sources.find((s) => s.value === value)?.label ?? value
  const chips: ChipItem[] = sources.map((s) => ({ value: s.value, label: s.label }))

  return (
    <section className={cn('k-news', className)} aria-label={labels.feed} data-layout={layout}>
      <div className="k-news-top">
        <ToggleGroup
          variant="sm"
          aria-label={labels.channels}
          value={channel === '' ? 'all' : channel}
          onValueChange={(v) => {
            const next = v === 'all' ? '' : v
            setChannel(next)
            onChannelChange?.(next)
          }}
        >
          <ToggleGroupItem value="all">{labels.all}</ToggleGroupItem>
          {channels.map((c) => (
            <ToggleGroupItem key={c.value} value={c.value}>
              {c.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <label className="k-news-search">
          <Search size={13} aria-hidden />
          <Input
            size="sm"
            type="search"
            aria-label={labels.search}
            placeholder={labels.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <ToggleGroup
          variant="sm"
          aria-label={labels.layout}
          value={layout}
          onValueChange={(v) => setLayout(v as 'list' | 'card')}
        >
          <ToggleGroupItem value="list" aria-label={labels.layoutList} title={labels.layoutList}>
            <List size={14} aria-hidden />
          </ToggleGroupItem>
          <ToggleGroupItem value="card" aria-label={labels.layoutCard} title={labels.layoutCard}>
            <LayoutGrid size={14} aria-hidden />
          </ToggleGroupItem>
        </ToggleGroup>
        <Button
          variant="icon"
          aria-label={paused ? labels.resume : labels.pause}
          title={paused ? labels.resume : labels.pause}
          aria-pressed={paused}
          onClick={() => {
            setPaused(!paused)
            onPausedChange?.(!paused)
          }}
        >
          {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
        </Button>
      </div>
      {sources.length > 0 && (
        <ChipGroup
          items={chips}
          value={picked}
          onValueChange={(next) => {
            setPicked(next)
            onSourcesChange?.(next)
          }}
          label={labels.sources}
          clearLabel={labels.clearSources}
        />
      )}
      {pending > 0 && (
        <button
          type="button"
          className="k-news-new"
          data-testid="news-new"
          onClick={() => {
            release()
            scroller.current?.scrollTo({ top: 0 })
          }}
        >
          {labels.newItems(pending)}
        </button>
      )}
      <div ref={scroller} className="k-news-scroll" onScroll={(e) => setAtTop(e.currentTarget.scrollTop <= TOP_SLACK)}>
        {visible.length === 0 ? (
          <div className="k-news-empty">{labels.empty}</div>
        ) : (
          <ol className="k-news-items" aria-label={labels.feed}>
            {visible.map((item) => (
              <li
                key={item.id}
                className={cn('k-news-item', fresh.has(item.id) && 'is-fresh')}
                data-important={item.important ? '' : undefined}
              >
                <div className="k-news-meta">
                  <span className="k-news-source">{sourceName(item.source)}</span>
                  <time
                    className="k-news-time"
                    dateTime={new Date(item.time).toISOString()}
                    title={labels.absolute(item.time)}
                  >
                    {labels.ago(Math.max(0, Math.floor((now - item.time) / 1000)))}
                  </time>
                  {item.important && (
                    <span className="k-news-flag" role="img" aria-label={labels.important} title={labels.important} />
                  )}
                </div>
                <div className="k-news-body">
                  <Title item={item} onOpen={onOpen} />
                  {item.summary && layout === 'card' && <p className="k-news-summary">{item.summary}</p>}
                </div>
                {item.symbols && item.symbols.length > 0 && (
                  <div className="k-news-symbols">
                    {item.symbols.map((s) => (
                      <button
                        key={s.code}
                        type="button"
                        className="k-news-symbol"
                        onClick={() => onSymbolPick?.(s, item)}
                      >
                        <SymbolMark code={s.code} name={s.name} size={14} />
                        <span>{s.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}

function Title({ item, onOpen }: { item: NewsItem; onOpen?: (item: NewsItem) => void }) {
  if (onOpen)
    return (
      <button type="button" className="k-news-title" onClick={() => onOpen(item)}>
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

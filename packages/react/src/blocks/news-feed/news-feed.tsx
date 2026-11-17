// SPDX-License-Identifier: MIT
import {
  ChevronDownIcon,
  ChevronUpIcon,
  LayoutGrid,
  List,
  Pause,
  Play,
  PlusIcon,
  Search,
  Trash2Icon,
} from 'lucide-react'
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { onTextMeasureReset } from '../../lib/text-measure.ts'
import { cn } from '../../lib/cn.ts'
import { SymbolMark } from '../../katana/symbol-mark.tsx'
import { ChipGroup, type ChipItem } from '../../patterns/chip-group.tsx'
import { RowActions, RowContextMenu, type RowAction } from '../../patterns/row-actions.tsx'
import { ViewSwitcher, type ViewOption } from '../../patterns/view-switcher.tsx'
import { Button } from '../../primitives/button.tsx'
import { Input } from '../../primitives/input.tsx'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group.tsx'
import { Checkbox } from '../../primitives/checkbox.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../../primitives/popover.tsx'
import { listRowHeight, readRowFonts, VIRTUAL_THRESHOLD, type RowFonts } from './news-feed-rows.ts'
import { filterNews, sortNews, type NewsFacet, type NewsItem, type NewsSymbol } from './news-feed-model.ts'

// 新闻流（#29）：列表（时间、来源、标题、相关品种胶囊、重要标记）与卡片网格（来源 + 时间、标题、两行摘要、品种胶囊）两种排法；
// 顶上是频道分段、来源多选芯片、关键词搜索、暂停。功能照 TradingView 帮助文档「新闻流」的做法（频道、来源筛选、搜索）与
// uiarc.dev 的新闻卡结构（来源 + 时间、标题、两行摘要、品种胶囊），只取功能与结构，实现原创；uiarc 的部分待核对。
// TradingView News Flow 帮助页（https://www.tradingview.com/support/solutions/43000728828-news-flow-your-daily-hub-for-financial-news/ ，
// 2026-11-15 主会话读到：News Flow 像一种筛选器，新闻集中在一处，可设多种过滤并保存为一个 flow；快讯、要闻、头条）；其余细节没读到，待核对。
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
  /** 组合过滤（传了 facets 才用）：「+ 添加过滤」、浮层里的重置与移除、读屏名。 */
  facets?: { group: string; add: string; reset: string; remove: string; none: string }
  /** 「3 分钟阅读」；传了且条目有 readMinutes 才写（TradingView 的「2 min read」）。 */
  read?: (minutes: number) => string
  /** 标题行的已保存过滤视图下拉（传了 views 才用）：读屏名与「另存为」。 */
  views?: { trigger: string; save?: string }
  /** 折叠 / 展开过滤区的按钮读屏名；传了就有这个按钮。 */
  collapse?: string
  expand?: string
}

export type NewsFeedProps = {
  items: readonly NewsItem[]
  channels: readonly { value: string; label: string }[]
  sources: readonly { value: string; label: string }[]
  /**
   * 组合过滤（照 TradingView News Flow：多个可增删、可重置的多选过滤，条目用 NewsItem.facets 带取值；主会话 2026-11-15 实测）。
   * 类别与取值由调用方传；没传就没有这一排。过滤条上哪些分面在是件里的状态（NewsFacet.shown 给初值）。
   */
  facets?: readonly NewsFacet[]
  onFacetsChange?: (picked: Record<string, string[]>) => void
  /** 选中的那条（阅读窗开着的那条）：行底色加深。给了 reader 时件自己管这一条，不用传。 */
  selected?: string | null
  /**
   * 阅读窗：给了就是左列表右阅读窗的并排排法（照 TradingView News Flow，主会话 2026-11-15 实测）；点标题打开这一条，返回的节点（一般是 NewsReader）画在右边，
   * 件的宽度不到 900px 时改成盖在列表上的浮层。close 关掉阅读窗。
   */
  reader?: (item: NewsItem, ctx: { close: () => void }) => ReactNode
  /** 标题行的已保存过滤视图（Full feed 这样的下拉）；切换、另存都由调用方处理（件里的过滤状态由调用方用 key 重置）。 */
  views?: readonly ViewOption[]
  view?: string
  onViewChange?: (key: string) => void
  onSaveView?: () => void
  /** 相关品种的画法：stack = 重叠的一排徽标（默认，TradingView 新闻列表），chips = 带代码的胶囊。 */
  symbolStyle?: 'stack' | 'chips'
  /** 当前时间（毫秒）：相对时间按它算；调用方定时更新它。 */
  now: number
  labels: NewsFeedLabels
  defaultLayout?: 'list' | 'card'
  onSymbolPick?: (symbol: NewsSymbol, item: NewsItem) => void
  /** 每条的快捷操作：悬停出前几颗图标按钮，右键出同一份菜单（RowActions / RowContextMenu）；返回空数组就没有。 */
  itemActions?: (item: NewsItem) => readonly RowAction[]
  /** 快捷操作的读屏名与右键菜单名。 */
  itemActionsLabel?: string
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
  facets = [],
  onFacetsChange,
  selected = null,
  reader,
  views,
  view,
  onViewChange,
  onSaveView,
  symbolStyle = 'stack',
  now,
  labels,
  defaultLayout = 'list',
  onSymbolPick,
  itemActions,
  itemActionsLabel = '',
  onOpen,
  onChannelChange,
  onSourcesChange,
  onPausedChange,
  className,
}: NewsFeedProps) {
  const [channel, setChannel] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [facetShown, setFacetShown] = useState<string[]>(() => facets.filter((f) => f.shown).map((f) => f.key))
  const [facetPicked, setFacetPicked] = useState<Record<string, string[]>>({})
  const setPicked2 = (next: Record<string, string[]>) => {
    setFacetPicked(next)
    onFacetsChange?.(next)
  }
  const [layout, setLayout] = useState(defaultLayout)
  const [collapsed, setCollapsed] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
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

  const filter = { channel, sources: picked, query, facets: facetPicked }
  const visible = useMemo(
    () => filterNews(sortNews(items.filter((i) => shown.has(i.id))), filter),
    // oxlint-disable-next-line react/exhaustive-deps -- filter 是三个值拼出来的新对象，依赖写成三个值
    [items, shown, channel, picked, query, facetPicked],
  )
  const pending = filterNews(
    items.filter((i) => !shown.has(i.id)),
    filter,
  ).length

  const sourceName = (value: string) => sources.find((s) => s.value === value)?.label ?? value

  const opened = reader && openId !== null ? items.find((i) => i.id === openId) : undefined
  const selectedId = reader ? (opened?.id ?? null) : selected

  // 虚拟化只管「列表」排法且条目多于阈值；少了完全走老写法（卡片是自适应网格，行高本来就不是一行一高，不虚拟化）。
  const virtual = layout === 'list' && visible.length > VIRTUAL_THRESHOLD
  // 滚动区宽度与字体（字号、行高、具名字体）：行高只依赖它们；宽度变了只重算高度，prepare 在 text-measure 里按「字体+文本」缓存。
  const [width, setWidth] = useState(0)
  const [fonts, setFonts] = useState<RowFonts | null>(null)
  const [epoch, setEpoch] = useState(0)
  // 字体缓存被清（Web 字体加载完、换渲染字体、DPR 变）后行高要重算。
  useEffect(() => onTextMeasureReset(() => setEpoch((n) => n + 1)), [])
  useLayoutEffect(() => {
    const el = scroller.current
    if (!virtual || !el) return
    setFonts(readRowFonts(el))
    setWidth(el.clientWidth)
    // 用 clientWidth（不含滚动条）而不是 contentRect：行宽就是它。
    const observer = new ResizeObserver(() => setWidth(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [virtual, epoch])

  const sizes = useMemo(() => {
    if (!virtual || !fonts) return []
    return visible.map((item) =>
      listRowHeight(
        {
          title: item.title,
          source: sourceName(item.source),
          time: labels.ago(Math.max(0, Math.floor((now - item.time) / 1000))),
          read: labels.read && item.readMinutes !== undefined ? labels.read(item.readMinutes) : undefined,
          important: !!item.important,
          symbolCodes: item.symbols?.map((symbol) => symbol.code) ?? [],
          symbolStyle,
          hasActions: !!itemActions,
        },
        fonts,
        width,
      ),
    )
    // oxlint-disable-next-line react/exhaustive-deps -- sourceName 由 sources 决定，依赖写 sources
  }, [virtual, fonts, width, visible, now, labels, sources, symbolStyle, itemActions, epoch])

  const selectedIndex = virtual && selectedId !== null ? visible.findIndex((i) => i.id === selectedId) : -1
  // 返回的函数不能被 React Compiler 记忆化，只在这个组件里用。
  const virtualizer = useVirtualizer({
    count: virtual ? visible.length : 0,
    getScrollElement: () => scroller.current,
    estimateSize: (index) => sizes[index] ?? 32,
    overscan: 8,
    initialRect: { width: 0, height: 600 },
    getItemKey: (index) => visible[index]?.id ?? index,
    // 阅读窗开着的那条即使滚出去也留着：键盘焦点在它的标题按钮上，卸掉焦点就丢了。
    rangeExtractor: (range) => {
      const indexes = defaultRangeExtractor(range)
      return selectedIndex >= 0 && !indexes.includes(selectedIndex)
        ? [...indexes, selectedIndex].sort((a, b) => a - b)
        : indexes
    },
  })
  // estimateSize 不是 virtualizer 缓存的依赖，高度变了要显式 measure()；内容没变就不动，免得 labels 每次新对象造成循环。
  const lastSizes = useRef<number[]>([])
  useLayoutEffect(() => {
    const last = lastSizes.current
    if (last.length === sizes.length && last.every((size, i) => size === sizes[i])) return
    lastSizes.current = sizes
    virtualizer.measure()
  }, [sizes, virtualizer])
  const chips: ChipItem[] = sources.map((s) => ({ value: s.value, label: s.label }))

  const open = (item: NewsItem) => {
    if (reader) setOpenId(item.id)
    onOpen?.(item)
  }
  // 一条的 DOM：虚拟化与否共用；虚拟化时多带 aria-setsize / aria-posinset（读屏要知道总条数）与绝对定位的 top、height。
  const renderRow = (
    item: NewsItem,
    position?: { 'aria-setsize': number; 'aria-posinset': number; style: CSSProperties },
  ) => (
    <li
      {...position}
      key={item.id}
      className={cn('k-news-item', fresh.has(item.id) && 'is-fresh')}
      data-important={item.important ? '' : undefined}
      data-news-id={item.id}
      data-selected={item.id === selectedId ? '' : undefined}
      data-actions={itemActions ? '' : undefined}
    >
      <div className="k-news-meta">
        <span className="k-news-source">{sourceName(item.source)}</span>
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
        <Title item={item} onOpen={reader || onOpen ? open : undefined} />
        {item.summary && layout === 'card' && <p className="k-news-summary">{item.summary}</p>}
      </div>
      {itemActions && <RowActions items={itemActions(item)} label={itemActionsLabel} />}
      {item.symbols && item.symbols.length > 0 && (
        <div className="k-news-symbols" data-style={symbolStyle}>
          {item.symbols.map((symbol) => (
            <button
              key={symbol.code}
              type="button"
              className="k-news-symbol"
              aria-label={symbolStyle === 'stack' ? symbol.code : undefined}
              title={symbolStyle === 'stack' ? `${symbol.code} ${symbol.name ?? ''}`.trim() : undefined}
              onClick={() => onSymbolPick?.(symbol, item)}
            >
              <SymbolMark code={symbol.code} name={symbol.name} size={symbolStyle === 'stack' ? 18 : 14} />
              {symbolStyle === 'chips' ? <span>{symbol.code}</span> : null}
            </button>
          ))}
        </div>
      )}
    </li>
  )

  const headed = (views && views.length > 0 && labels.views) || labels.collapse

  return (
    <section
      className={cn('k-news', className)}
      aria-label={labels.feed}
      data-layout={layout}
      data-reader={opened ? '' : undefined}
    >
      {headed ? (
        <div className="k-news-head" data-slot="news-head">
          {views && views.length > 0 && labels.views ? (
            <ViewSwitcher
              views={views}
              value={view ?? views[0]!.key}
              onValueChange={(key) => onViewChange?.(key)}
              onSave={onSaveView}
              labels={labels.views}
            />
          ) : (
            <span />
          )}
          {labels.collapse ? (
            <Button
              size="icon"
              variant="ghost"
              aria-label={collapsed ? (labels.expand ?? labels.collapse) : labels.collapse}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronDownIcon aria-hidden="true" /> : <ChevronUpIcon aria-hidden="true" />}
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="k-news-split">
        <div className="k-news-main">
          <div className="k-news-top" data-collapsed={collapsed ? '' : undefined}>
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
          {facets.length > 0 && labels.facets && !collapsed && (
            <div className="k-news-facets" role="group" aria-label={labels.facets.group} data-slot="news-facets">
              {facetShown.flatMap((key) => {
                const facet = facets.find((f) => f.key === key)
                if (!facet) return []
                const chosen = facetPicked[key] ?? []
                return [
                  <Popover key={key}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="k-news-facet"
                        data-facet={key}
                        data-active={chosen.length > 0 ? '' : undefined}
                      >
                        <span>{facet.label}</span>
                        {chosen.length > 0 && (
                          <b>
                            {chosen.length === 1
                              ? (facet.options.find((o) => o.value === chosen[0])?.label ?? chosen[0])
                              : chosen.length}
                          </b>
                        )}
                        <ChevronDownIcon size={12} aria-hidden="true" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="k-news-facet-pop" aria-label={facet.label}>
                      <div className="k-news-facet-head">
                        <b>{facet.label}</b>
                        <span>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={chosen.length === 0}
                            onClick={() => setPicked2({ ...facetPicked, [key]: [] })}
                          >
                            {labels.facets!.reset}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`${labels.facets!.remove} ${facet.label}`}
                            onClick={() => {
                              setFacetShown((prev) => prev.filter((k) => k !== key))
                              setPicked2({ ...facetPicked, [key]: [] })
                            }}
                          >
                            <Trash2Icon aria-hidden="true" />
                          </Button>
                        </span>
                      </div>
                      <ul>
                        {facet.options.map((o) => (
                          <li key={o.value}>
                            <label>
                              <Checkbox
                                checked={chosen.includes(o.value)}
                                onCheckedChange={(on) =>
                                  setPicked2({
                                    ...facetPicked,
                                    [key]:
                                      on === true
                                        ? facet.single
                                          ? [o.value]
                                          : [...chosen, o.value]
                                        : chosen.filter((v) => v !== o.value),
                                  })
                                }
                              />
                              {o.label}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </PopoverContent>
                  </Popover>,
                ]
              })}
              {facets.some((f) => !facetShown.includes(f.key)) ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="k-news-facet k-news-facet-add" data-slot="news-facet-add">
                      <PlusIcon size={12} aria-hidden="true" />
                      <span>{labels.facets.add}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="k-news-facet-pop" aria-label={labels.facets.add}>
                    <ul>
                      {facets
                        .filter((f) => !facetShown.includes(f.key))
                        .map((f) => (
                          <li key={f.key}>
                            <button
                              type="button"
                              data-facet-option={f.key}
                              onClick={() => setFacetShown((prev) => [...prev, f.key])}
                            >
                              {f.label}
                            </button>
                          </li>
                        ))}
                    </ul>
                  </PopoverContent>
                </Popover>
              ) : null}
            </div>
          )}
          {sources.length > 0 && !collapsed && (
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
          <div
            ref={scroller}
            className="k-news-scroll"
            onScroll={(e) => setAtTop(e.currentTarget.scrollTop <= TOP_SLACK)}
          >
            {visible.length === 0 ? (
              <div className="k-news-empty">{labels.empty}</div>
            ) : (
              <RowContextMenu
                actionsFor={itemActions && ((id) => itemActions(items.find((i) => i.id === id)!))}
                label={itemActionsLabel}
                keyAttribute="data-news-id"
              >
                <ol
                  className="k-news-items"
                  aria-label={labels.feed}
                  data-virtual={virtual ? '' : undefined}
                  style={virtual ? { height: virtualizer.getTotalSize() } : undefined}
                >
                  {virtual
                    ? virtualizer.getVirtualItems().map((row) =>
                        renderRow(visible[row.index]!, {
                          'aria-setsize': visible.length,
                          'aria-posinset': row.index + 1,
                          style: { top: row.start, height: sizes[row.index] },
                        }),
                      )
                    : visible.map((item) => renderRow(item))}
                </ol>
              </RowContextMenu>
            )}
          </div>
        </div>
        {opened && reader ? (
          <aside className="k-news-pane" data-slot="news-reader-pane">
            {reader(opened, { close: () => setOpenId(null) })}
          </aside>
        ) : null}
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

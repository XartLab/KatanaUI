// SPDX-License-Identifier: MIT
/**
 * News stream with list and card layouts, filters, a reader pane and live arrival handling.
 * 新闻流；一条在 news-row.tsx，组合过滤条 news-facets.tsx，列表虚拟化与滚动锚定 use-news-virtual.ts（体检 §7 拆分）。
 */
import { ChevronDownIcon, ChevronUpIcon, LayoutGrid, List, Pause, Play, Search } from 'lucide-react'
import { Fragment, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useEnterMarks } from '../../lib/live.ts'
import { cn } from '../../lib/cn.ts'
import { useEmphasis } from '../../layout/emphasis.tsx'
import { MeasuredSkeleton } from '../../katana/measured-skeleton.tsx'
import { Skeleton } from '../../katana/skeleton.tsx'
import { ChipGroup, type ChipItem } from '../../patterns/chip-group.tsx'
import { RowContextMenu, type RowAction } from '../../quotes/row-actions.tsx'
import { ViewSwitcher, type ViewOption } from '../../patterns/view-switcher.tsx'
import { Button } from '../../primitives/button.tsx'
import { Input } from '../../primitives/input.tsx'
import { EnsureTooltipProvider } from '../../primitives/tooltip.tsx'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group.tsx'
import { VIRTUAL_THRESHOLD } from './news-feed-rows.ts'
import {
  buildEntries,
  filterNews,
  sortNews,
  type NewsEntry,
  type NewsFacet,
  type NewsFilter,
  type NewsGroup,
  type NewsItem,
  type NewsSymbol,
} from './news-feed-model.ts'
import { NewsEnd, useEndReached, type NewsEndLabels, type NewsEndState } from './news-end.tsx'
import { NewsFacets, type NewsFacetsLabels } from './news-facets.tsx'
import { NewsRow, type NewsRowPosition } from './news-row.tsx'
import { useNewsVirtual } from './use-news-virtual.ts'

// 新闻流（#29）：列表（时间、来源、标题、相关品种胶囊、重要标记）与卡片网格（来源 + 时间、标题、两行摘要、品种胶囊）两种排法；
// 顶上是频道分段、来源多选芯片、关键词搜索、暂停。功能照 TradingView 帮助文档「新闻流」的做法（频道、来源筛选、搜索）与
// uiarc.dev 的新闻卡结构（来源 + 时间、标题、两行摘要、品种胶囊），只取功能与结构，实现原创；uiarc 的部分待核对。
// TradingView News Flow 帮助页（https://www.tradingview.com/support/solutions/43000728828-news-flow-your-daily-hub-for-financial-news/ ，
// 2026-11-15 主会话读到：News Flow 像一种筛选器，新闻集中在一处，可设多种过滤并保存为一个 flow；快讯、要闻、头条）；其余细节没读到，待核对。
// 新到的条目不打断阅读：没暂停且列表在顶部时直接插入并高亮（共用层 live.ts 的 useEnterMarks，1.2 秒），其余情况在顶上出「n 条新消息」，点了才插入并回到顶部；
// 到达时读屏播一次计数（polite，不逐条读）；虚拟列表里行是绝对定位，浏览器的滚动锚定管不到，插在上面时件自己补偿 scrollTop。
// 数据与字全由调用方传（频道、来源、文案、当前时间 now），件不认识任何应用；筛选状态在件内，用 on*Change 通知。
// 认分量（#115，layout/emphasis.tsx）：compact 一行一条——只留「时间 标题」，不画标题行、频道、搜索、过滤、来源、品种与快捷操作，卡片排法也退回列表；
// hero 标题字上一档（样子在 news-feed.css）；standard 就是上面写的完整版。
// 给服务端分页的数据用（#270，KATANAview #2189）：filtering='external' 时件不筛，过滤条受控（filter + onFilterChange），条目由调用方按条件取；
// 条目可带标签（tags）、来源数（sourcesCount + alsoFrom）；onEndReached + endState 管滚到底加载与底部那一行；groupBy 加组小标题；chrome='bare' 去掉标题行与过滤区（侧栏用）。
// 分页时比已显示的最新一条还旧的条目是翻页来的，直接接在底部，不算「新消息」。

export type NewsFeedLabels = {
  all: string
  /** 整个件、频道分段、来源芯片组、搜索框、排法分段的读屏名。 */
  feed: string
  channels: string
  sources: string
  clearSources: string
  /** 类别芯片组的读屏名；传了且 categories 不空才有这一行。 */
  categories?: string
  /** 类别芯片组的清除钮读屏名。 */
  clearCategories?: string
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
  facets?: NewsFacetsLabels
  /** 「3 分钟阅读」；传了且条目有 readMinutes 才写（TradingView 的「2 min read」）。 */
  read?: (minutes: number) => string
  /** 标题行的已保存过滤视图下拉（传了 views 才用）：读屏名与「另存为」。 */
  views?: { trigger: string; save?: string }
  /** 折叠 / 展开过滤区的按钮读屏名；传了就有这个按钮。 */
  collapse?: string
  expand?: string
  /** 加载中读屏读的话；不给就读 feed。 */
  loading?: string
  /** 每条快捷操作的读屏名与右键菜单名（itemActions 给了才用）。 */
  itemActions?: string
  /** 「2 sources」：条目的 sourcesCount 大于 1 时写在标题后；不传写英文 `${n} sources`。 */
  sourceCount?: (n: number) => string
  /** 来源数的悬停说明，传入 alsoFrom 的名字：「Also from A, B」；不传写英文。 */
  alsoFrom?: (names: readonly string[]) => string
  /** 底部那一行的文字（endState 用）：加载中、到底了、重试；不传写英文。 */
  end?: NewsEndLabels
}

export type NewsFeedProps = {
  items: readonly NewsItem[]
  /**
   * 在加载：给了（含 false）列表区就走骨架，false 时骨架退场、真条目淡入；不传和以前一样。
   * 卡片排法用 sample 量出来的骨架（每张卡的标题行数、摘要、品种胶囊都按真卡量），列表排法画按行高的条。
   */
  loading?: boolean
  /** 加载时拿来量卡片骨架的示例条目（标题、摘要长度跟真的差不多；3 到 6 条够用）；不给画几行条。 */
  sample?: readonly NewsItem[]
  channels: readonly { value: string; label: string }[]
  sources: readonly { value: string; label: string }[]
  /**
   * 组合过滤（照 TradingView News Flow：多个可增删、可重置的多选过滤，条目用 NewsItem.facets 带取值；主会话 2026-11-15 实测）。
   * 类别与取值由调用方传；没传就没有这一排。过滤条上哪些分面在是件里的状态（NewsFacet.shown 给初值）。
   */
  facets?: readonly NewsFacet[]
  /**
   * Category chips (multi-select, ChipGroup) under the sources row; items carry `category`. Without categories (or without labels.categories) there is no such row.
   * 类别芯片（多选，复用 ChipGroup）：条目带 category 取值（公告类别、增减持）；不传就没有这一行。
   */
  categories?: readonly { value: string; label: string }[]
  onCategoriesChange?: (categories: string[]) => void
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
  /** 点了一条的相关品种。 */
  onSymbolSelect?: (symbol: NewsSymbol, item: NewsItem) => void
  /** @deprecated Use `onSymbolSelect`; kept for one version. */
  onSymbolPick?: (symbol: NewsSymbol, item: NewsItem) => void
  /** 每条的快捷操作：悬停出前几颗图标按钮，右键出同一份菜单（RowActions / RowContextMenu）；返回空数组就没有。 */
  itemActions?: (item: NewsItem) => readonly RowAction[]
  /** @deprecated Use `labels.itemActions`; kept for one version. */
  itemActionsLabel?: string
  /** 选中一条（点标题）：给了，标题是按钮；没给且条目有 href 时标题是链接。 */
  onSelect?: (item: NewsItem) => void
  /** @deprecated Use `onSelect`; kept for one version. */
  onOpen?: (item: NewsItem) => void
  onChannelChange?: (channel: string) => void
  onSourcesChange?: (sources: string[]) => void
  onPausedChange?: (paused: boolean) => void
  /**
   * Who filters. 'internal' (default): the feed filters `items` with its own filter bar. 'external': the feed draws `items` as given
   * and the filter bar only reports what the user picked (`onFilterChange`); the caller fetches the rows that match.
   * 谁来筛：internal（默认）件自己筛 items；external 件只画传进来的 items，过滤条只把选择报出去，调用方按条件取数。
   */
  filtering?: 'internal' | 'external'
  /**
   * Filter bar value. When given the bar is controlled (in either mode): the user's picks only change what `filter` says. Without it the feed keeps its own state.
   * In external mode every keystroke in the search box calls `onFilterChange`; debounce on the caller's side.
   * 过滤条的值：给了就是受控（两种 filtering 都一样），用户的选择只改变你传回来的值；不给件自己存。external 时搜索框每敲一个字都调 onFilterChange，防抖由调用方做。
   */
  filter?: NewsFilter
  /** The filter bar changed: always the whole filter, every field filled in. 过滤条变了：总是整份，字段都给全。 */
  onFilterChange?: (filter: NewsFilter) => void
  /**
   * The bottom of the list came into view while `endState` is 'more' (or not given): load the next page and set `endState` to 'loading' until it has arrived.
   * 列表底部进了视野（endState 是 'more' 或没给）：取下一页，取的时候把 endState 设成 'loading'。
   */
  onEndReached?: () => void
  /**
   * The row under the list: 'more' (a sentinel, nothing visible), 'loading', 'end' (no more) or `{ error, retry }`. Without `onEndReached` and `endState` there is no such row.
   * 列表下面那一行：more（看不见的哨兵）、loading、end（到底了）、{ error, retry }（写原因与重试）；onEndReached 与 endState 都不给就没有这一行。
   */
  endState?: NewsEndState
  /**
   * Group headings: the heading of each run of consecutive items with the same `key`. The caller orders the groups; with groupBy the feed keeps the order of `items` instead of sorting by time.
   * 分组小标题：连续的同组条目前面出一个小标题。组序由调用方排好；给了 groupBy 件不再按时间排序，保持 items 的顺序。
   */
  groupBy?: (item: NewsItem) => NewsGroup
  /** 'bare' draws only the list (no heading row, channels, search, layout, filters), for a sidebar. 'full' (default) is the whole feed. bare 只画列表，不画标题行、频道、搜索、排法与过滤区（侧栏用）。 */
  chrome?: 'full' | 'bare'
  className?: string
}

/** 离顶部多少像素以内算「在顶部」：留一点余量给触控板的回弹。 */
const TOP_SLACK = 4
/** 一次放进来超过这么多条就当作整批换数据（换数据集、首次加载），不是「新消息」，不高亮。 */
const BULK_ARRIVALS = 20

/** 过滤条的值在件里的写法：数组都是可写的（ChipGroup、NewsFacets 要）。 */
type FilterState = {
  channel: string
  sources: string[]
  categories: string[]
  query: string
  facets: Record<string, string[]>
}
const EMPTY_FILTER: FilterState = { channel: '', sources: [], categories: [], query: '', facets: {} }

/** 受控的 filter 补全成件里的写法（NewsFilter 的 categories、facets 可以不给）。 */
const stateOf = (filter: NewsFilter): FilterState => ({
  channel: filter.channel,
  sources: [...filter.sources],
  categories: [...(filter.categories ?? [])],
  query: filter.query,
  facets: Object.fromEntries(Object.entries(filter.facets ?? {}).map(([key, values]) => [key, [...values]])),
})

export function NewsFeed({
  items,
  loading,
  sample,
  channels,
  sources,
  facets = [],
  categories = [],
  onCategoriesChange,
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
  onSymbolSelect: onSymbolSelectProp,
  onSymbolPick,
  itemActions,
  itemActionsLabel,
  onSelect: onSelectProp,
  onOpen,
  onChannelChange,
  onSourcesChange,
  onPausedChange,
  filtering = 'internal',
  filter: filterProp,
  onFilterChange,
  onEndReached,
  endState: endStateProp,
  groupBy,
  chrome = 'full',
  className,
}: NewsFeedProps) {
  const onSelect = onSelectProp ?? onOpen
  const onSymbolSelect = onSymbolSelectProp ?? onSymbolPick
  const actionsLabel = labels.itemActions ?? itemActionsLabel ?? ''
  const emphasis = useEmphasis()
  const compact = emphasis === 'compact'
  const bare = chrome === 'bare'
  // 标题行、频道、搜索、排法、过滤区：compact（一行一条）与 bare（侧栏）都不画；行本身只有 compact 才缩成「时间 标题」。
  const plain = compact || bare
  const external = filtering === 'external'
  const [innerFilter, setInnerFilter] = useState(EMPTY_FILTER)
  const controlled = useMemo(() => (filterProp ? stateOf(filterProp) : undefined), [filterProp])
  const filterState = controlled ?? innerFilter
  const { channel, query } = filterState
  const picked = filterState.sources
  const pickedCategories = filterState.categories
  const facetPicked = filterState.facets
  const patchFilter = (patch: Partial<FilterState>) => {
    const next = { ...filterState, ...patch }
    setInnerFilter(next)
    onFilterChange?.(next)
  }
  const [facetShown, setFacetShown] = useState<string[]>(() => facets.filter((f) => f.shown).map((f) => f.key))
  const setFacets = (next: Record<string, string[]>) => {
    patchFilter({ facets: next })
    onFacetsChange?.(next)
  }
  const [chosenLayout, setLayout] = useState(defaultLayout)
  const layout = compact ? 'list' : chosenLayout
  const [collapsed, setCollapsed] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [atTop, setAtTop] = useState(true)
  // shown：已放进列表的条目 id；其余（来自 items）就是「新消息」。quiet：整批放进来的，不当新消息高亮。
  const [shown, setShown] = useState<ReadonlySet<string>>(() => new Set(items.map((i) => i.id)))
  const [quiet, setQuiet] = useState<ReadonlySet<string>>(() => new Set())
  // 读屏播报的话：放进来或在等的新消息数；只写计数，不逐条读。
  const [arrived, setArrived] = useState(0)
  const [prevItems, setPrevItems] = useState(items)
  const scroller = useRef<HTMLDivElement | null>(null)
  const sentinel = useRef<HTMLDivElement | null>(null)

  // 分页（给了 onEndReached 或 endState）：比已显示的最新一条还旧的条目是翻页取来的，接在底部，不算「新消息」（不进「n 条新消息」、不高亮、不动滚动位置）。
  const paginated = onEndReached !== undefined || endStateProp !== undefined
  const newestShown = useMemo(
    () =>
      paginated ? items.reduce((max, i) => (shown.has(i.id) && i.time > max ? i.time : max), -Infinity) : -Infinity,
    [paginated, items, shown],
  )
  const isShown = (item: NewsItem) => shown.has(item.id) || (paginated && item.time <= newestShown)
  // external：过滤条一变，调用方会换一批条目——那是「换了结果」，不是新消息：下一次 items 变了就整批放进来并回到顶部。
  const filterKey = external ? JSON.stringify([channel, picked, pickedCategories, query, facetPicked]) : ''
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  const [resync, setResync] = useState(false)
  const [resyncCount, setResyncCount] = useState(0)
  const resyncNow = resync || filterKey !== prevFilterKey
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setResync(true)
  }

  const release = () => {
    const added = items.filter((i) => !shown.has(i.id)).map((i) => i.id)
    if (added.length === 0) return
    setShown(new Set([...shown, ...added]))
    if (added.length > BULK_ARRIVALS) setQuiet(new Set([...quiet, ...added]))
    else setArrived(added.length)
  }
  // 条目变了：没暂停且在顶部就直接放进来（渲染时调整状态，不用 effect）。
  if (items !== prevItems) {
    setPrevItems(items)
    if (resyncNow) {
      const all = items.map((i) => i.id)
      setShown(new Set(all))
      setQuiet(new Set(all))
      setResync(false)
      setResyncCount(resyncCount + 1)
    } else if (!paused && atTop) release()
  }
  useLayoutEffect(() => {
    if (resyncCount > 0) scroller.current?.scrollTo({ top: 0 })
  }, [resyncCount])

  const filter: NewsFilter = filterState
  // external 不筛：只画调用方给的；分组时也不按时间排（组序由调用方定）。
  const shownItems = useMemo(
    () => items.filter(isShown),
    // oxlint-disable-next-line react/exhaustive-deps -- isShown 读的是 shown、paginated、newestShown，已在依赖里
    [items, shown, paginated, newestShown],
  )
  const visible = useMemo(() => {
    const matched = external ? shownItems : filterNews(shownItems, filter)
    return groupBy ? matched : sortNews(matched)
    // oxlint-disable-next-line react/exhaustive-deps -- filter 是几个值拼出来的对象，依赖写成各个值；groupBy 只用有没有（有就保持调用方的顺序）
  }, [shownItems, external, !groupBy, channel, picked, pickedCategories, query, facetPicked])
  // groupBy 常常是内联函数，每次渲染都重建这份行（便宜，条目的行高另有缓存，见 use-news-virtual.ts）；换了分组方式也照样跟着变。
  const entries = useMemo(() => buildEntries(visible, groupBy), [visible, groupBy])
  // 下面几份都是对全部条目扫一遍：只在条目、已放进的集合、过滤条变了才重算，滚动时每一帧都会重新渲染，不能每次都扫（一万条时每扫一遍约 1ms）。
  const waiting = useMemo(
    () => items.filter((i) => !isShown(i)),
    // oxlint-disable-next-line react/exhaustive-deps -- isShown 读的是 shown、paginated、newestShown，已在依赖里
    [items, shown, paginated, newestShown],
  )
  const pending = useMemo(
    () => (external ? waiting : filterNews(waiting, filter)).length,
    // oxlint-disable-next-line react/exhaustive-deps -- filter 是几个值拼出来的对象，依赖写成各个值
    [waiting, external, channel, picked, pickedCategories, query, facetPicked],
  )
  const enteringIds = useMemo(
    () => items.filter((i) => shown.has(i.id) && !quiet.has(i.id)).map((i) => i.id),
    [items, shown, quiet],
  )
  const entering = useEnterMarks(enteringIds)

  const sourceName = (value: string) => sources.find((s) => s.value === value)?.label ?? value
  const sourceCount = (n: number) => labels.sourceCount?.(n) ?? `${n} sources`
  const alsoFrom = (names: readonly string[]) => labels.alsoFrom?.(names) ?? `Also from ${names.join(', ')}`
  const sourcesOf = (item: NewsItem) =>
    item.sourcesCount !== undefined && item.sourcesCount > 1
      ? { text: sourceCount(item.sourcesCount), also: item.alsoFrom?.length ? alsoFrom(item.alsoFrom) : undefined }
      : undefined

  const opened = reader && openId !== null ? items.find((i) => i.id === openId) : undefined
  const selectedId = reader ? (opened?.id ?? null) : selected

  // 虚拟化只管「列表」排法且条目多于阈值；少了完全走老写法（卡片是自适应网格，行高本来就不是一行一高，不虚拟化）。
  const virtual = layout === 'list' && visible.length > VIRTUAL_THRESHOLD
  const ago = (time: number) => labels.ago(Math.max(0, Math.floor((now - time) / 1000)))
  const { virtualizer, sizes } = useNewsVirtual({
    scroller,
    virtual,
    visible,
    entries,
    shown,
    selectedId,
    rowOf: (item) => ({
      title: item.title,
      source: sourceName(item.source),
      time: ago(item.time),
      read: labels.read && item.readMinutes !== undefined ? labels.read(item.readMinutes) : undefined,
      important: !!item.important,
      symbolCodes: item.symbols?.map((symbol) => symbol.code) ?? [],
      symbolStyle,
      hasActions: !!itemActions,
      tags: item.tags?.map((tag) => tag.label),
      sourcesText: sourcesOf(item)?.text,
    }),
    deps: [now, labels, sources, symbolStyle, itemActions],
  })
  const chips: ChipItem[] = sources.map((s) => ({ value: s.value, label: s.label }))

  // 底部那一行：给了 onEndReached 没给 endState 就当 'more'。
  const endState = endStateProp ?? (onEndReached ? 'more' : undefined)
  useEndReached(sentinel, scroller, endState === 'more' && !loading, () => onEndReached?.(), visible.length)

  const open = (item: NewsItem) => {
    if (reader) setOpenId(item.id)
    onSelect?.(item)
  }
  const renderRow = (item: NewsItem, position?: NewsRowPosition) => (
    <NewsRow
      key={item.id}
      item={item}
      position={position}
      entering={entering.has(item.id)}
      selected={item.id === selectedId}
      source={sourceName(item.source)}
      now={now}
      labels={labels}
      layout={layout}
      symbolStyle={symbolStyle}
      actions={itemActions?.(item)}
      actionsLabel={actionsLabel}
      compact={compact}
      sources={sourcesOf(item)}
      onSelect={reader || onSelect ? open : undefined}
      onSymbolSelect={onSymbolSelect}
    />
  )
  const renderGroup = (entry: Extract<NewsEntry, { kind: 'group' }>, style?: NewsRowPosition['style']) => (
    <li key={entry.id} className="k-news-group" data-group={entry.group.key} role="presentation" style={style}>
      <span className="k-news-group-label" role="heading" aria-level={3}>
        {entry.group.label}
      </span>
      {entry.group.count !== undefined && <span className="k-news-group-count">{entry.group.count}</span>}
    </li>
  )

  // 列表区的真内容；加载态的骨架包在它外面（量出来的骨架要在同一个位置把它换出来）。
  const list =
    visible.length === 0 ? (
      <div className="k-news-empty">{labels.empty}</div>
    ) : (
      <RowContextMenu
        actionsFor={itemActions && ((id) => itemActions(items.find((i) => i.id === id)!))}
        label={actionsLabel}
        keyAttribute="data-news-id"
      >
        <ol
          className="k-news-items"
          aria-label={labels.feed}
          data-virtual={virtual ? '' : undefined}
          style={virtual ? { height: virtualizer.getTotalSize() } : undefined}
        >
          {virtual
            ? virtualizer.getVirtualItems().map((row) => {
                const entry = entries[row.index]!
                const style = { top: row.start, height: sizes[row.index] }
                return entry.kind === 'group'
                  ? renderGroup(entry, style)
                  : renderRow(entry.item, {
                      'aria-setsize': visible.length,
                      'aria-posinset': entry.index + 1,
                      style,
                    })
              })
            : entries.map((entry) => (entry.kind === 'group' ? renderGroup(entry) : renderRow(entry.item)))}
        </ol>
      </RowContextMenu>
    )
  const loadingLabel = loading === undefined ? undefined : (labels.loading ?? labels.feed)
  // 只有卡片排法且给了示例条目才量；列表排法是一行一条，按行高画条就够。
  const measured = layout === 'card' && sample !== undefined && sample.length > 0

  const headed = !plain && ((views && views.length > 0 && labels.views) || labels.collapse)

  return (
    <EnsureTooltipProvider>
      <section
        className={cn('k-news', className)}
        aria-label={labels.feed}
        data-layout={layout}
        data-emphasis={emphasis}
        data-chrome={bare ? 'bare' : undefined}
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
            {!plain && (
              <div className="k-news-top" data-collapsed={collapsed ? '' : undefined}>
                <ToggleGroup
                  size="sm"
                  aria-label={labels.channels}
                  value={channel === '' ? 'all' : channel}
                  onValueChange={(v) => {
                    const next = v === 'all' ? '' : v
                    patchFilter({ channel: next })
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
                    onChange={(e) => patchFilter({ query: e.target.value })}
                  />
                </label>
                <ToggleGroup
                  size="sm"
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
            )}
            {facets.length > 0 && labels.facets && !collapsed && !plain && (
              <NewsFacets
                facets={facets}
                shown={facetShown}
                onShownChange={setFacetShown}
                picked={facetPicked}
                onPickedChange={setFacets}
                labels={labels.facets}
              />
            )}
            {sources.length > 0 && !collapsed && !plain && (
              <ChipGroup
                items={chips}
                value={picked}
                onValueChange={(next) => {
                  patchFilter({ sources: next })
                  onSourcesChange?.(next)
                }}
                label={labels.sources}
                labels={{ clear: labels.clearSources }}
              />
            )}
            {categories.length > 0 && labels.categories && !collapsed && !plain && (
              <ChipGroup
                className="k-news-categories"
                items={categories.map((c) => ({ value: c.value, label: c.label }))}
                value={pickedCategories}
                onValueChange={(next) => {
                  patchFilter({ categories: next })
                  onCategoriesChange?.(next)
                }}
                label={labels.categories}
                labels={{ clear: labels.clearCategories }}
              />
            )}
            {/* 新消息到达的播报：一直在，文字变了读屏才读；只读条数。 */}
            <span className="k-news-live" role="status" aria-live="polite">
              {pending > 0 ? labels.newItems(pending) : arrived > 0 ? labels.newItems(arrived) : ''}
            </span>
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
              // 是否在顶部决定新消息插入还是只计数；挂在 DOM 上便于调试与测试等它落定。
              data-at-top={atTop ? '' : undefined}
              onScroll={(e) => setAtTop(e.currentTarget.scrollTop <= TOP_SLACK)}
            >
              {loadingLabel !== undefined && measured ? (
                <MeasuredSkeleton loading={loading === true} label={loadingLabel}>
                  {loading ? (
                    <ol className="k-news-items" aria-label={labels.feed}>
                      {sample!.map((item) => renderRow(item))}
                    </ol>
                  ) : (
                    list
                  )}
                </MeasuredSkeleton>
              ) : loading ? (
                <Skeleton label={loadingLabel!} lines={layout === 'card' ? 6 : 8} rows={layout === 'list'} />
              ) : (
                list
              )}
              {endState !== undefined && !loading && !(endState === 'end' && visible.length === 0) && (
                <NewsEnd state={endState} labels={labels.end ?? {}} sentinel={sentinel} />
              )}
            </div>
          </div>
          {opened && reader ? (
            <aside className="k-news-pane" data-slot="news-reader-pane">
              {/* 换一条重新挂载：阅读窗里的「已更新」只说同一条被改了，不是切到了别的条。 */}
              <Fragment key={opened.id}>{reader(opened, { close: () => setOpenId(null) })}</Fragment>
            </aside>
          ) : null}
        </div>
      </section>
    </EnsureTooltipProvider>
  )
}

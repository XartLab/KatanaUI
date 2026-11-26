// SPDX-License-Identifier: MIT
// 市场浏览器：搜索框、一排分类页签（自选 / 全部 / 主流币……由调用方给），下面是当前分类的品种列表：星标、徽标、代码与全称、最新价、24h 涨跌。
// 功能参照 OKX 永续交易页的「市场」组件（2026-11-26 在用户的 Chrome 里打开看的：搜索、分类页签、星标、徽标、最新价、24h 涨跌；「切换至业务线模式」不做）。实现原创。
// 不重写表：列表的版式、列头排序与三角、行的悬停都沿用自选列表 Watchlist 的那份（theme/watchlist.css 的 k-watch），
// 价格格是 FlashPrice、涨跌格是 ChangeText、品种前是 SymbolMark、代码是 cell-type 的芯片；排序与点列头的循环用 watchlist-model 的 nextSort / sortRows。
// 与 QuoteTable 的分工：QuoteTable 是只读的分组概览；MarketBrowser 是「找品种」的入口：能搜、能排、能星标、点行选品种。
// 数据全由调用方给：每个分类带着自己的行（「自选」页签就是调用方把 favorite 为真的行放进去），包里没有数据源，也没有文案。
// 搜索只在当前分类里找；排序与搜索词在分类间保留；只对当前分类做筛选与排序，别的分类的行不算。行点击 onSelect；星标 onToggleFavorite（不触发 onSelect）。
// 焦点：在「自选」这类页签里取消星标，那一行会从列表里消失，焦点就移到相邻行（下一行，没有就上一行）的星标，列表空了移到当前页签，不掉回页面顶部。
// 新行高亮：只对分类自己的行算「新」（调用方新给的行）；搜索把行筛掉又筛回来不算新行，不闪。
import type { AssetClass } from '@katana-ui/logos'
import { Star } from 'lucide-react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRingInset } from '../lib/focus.ts'
import { useEnterMarks, useFlipList } from '../lib/live.ts'
import { Input } from '../primitives/input.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs.tsx'
import { CodeChip, CodeName } from './cell-type.tsx'
import { ChangeText } from './change-text.tsx'
import { FlashPrice } from './flash-price.tsx'
import { filterMarketRows, neighborId } from './market-browser-model.ts'
import { plainPrice, rowTone, type FormatPrice, type QuoteRow } from './quote-row.ts'
import { SymbolMark } from './symbol-mark.tsx'
import { nextSort, sortRows, type WatchlistSort } from './watchlist-model.ts'

/** One symbol in the market list: the shared QuoteRow plus the star and the logo. */
export type MarketRow = QuoteRow & {
  /** Whether the star is on. */
  favorite?: boolean
  /** Logo image of the symbol mark; the surrounding LogoProvider is asked, then letters are drawn, when omitted. */
  logoSrc?: string
  /** Venue (BINANCE, XNAS), passed to the symbol mark. */
  venue?: string
  /** Asset class, passed to the symbol mark. */
  assetClass?: AssetClass
  /** Extra words the search matches (aliases, the other language's name). */
  keywords?: readonly string[]
}

/** One category tab and the rows under it. */
export type MarketCategory = {
  /** Category id (the tab value). */
  id: string
  /** Tab text. */
  label: string
  /** The rows of this category. */
  rows: readonly MarketRow[]
}

/** The columns the list can be sorted by. */
export type MarketSort = WatchlistSort & { key: 'last' | 'chgPct' }

export type MarketBrowserLabels = {
  /** Placeholder and accessible name of the search box. */
  search: string
  /** Accessible name of the category tab strip. */
  categories: string
  /** Accessible name of the list. */
  list: string
  /** Header text of the price and the 24-hour change columns (the symbol column has no sort and uses `symbol`). */
  columns: { symbol: string; last: string; change: string }
  /** Written when a category has no rows (the favorites tab before anything is starred, say). */
  empty: string
  /** Written when the search word matches nothing in the category. */
  noResults: string
  /** Accessible name of a row's star button. */
  favorite: (row: MarketRow) => string
}

export type MarketBrowserProps = {
  /** The category tabs, each with its rows. Put the favorites first when there is one. */
  categories: readonly MarketCategory[]
  /** Visible text and accessible names. */
  labels: MarketBrowserLabels
  /** Writes the last price; two decimals when omitted. */
  formatPrice?: FormatPrice
  /** The selected category id when controlled. */
  value?: string
  /** The initially selected category id when uncontrolled; the first category when omitted. */
  defaultValue?: string
  /** Called with the category id when the tab changes. */
  onValueChange?: (id: string) => void
  /** Called with the search word on every keystroke. */
  onQueryChange?: (query: string) => void
  /** Sort (controlled); null is the caller's order. */
  sort?: MarketSort | null
  /** Called with the next sort when the price or change header is clicked. */
  onSortChange?: (sort: MarketSort | null) => void
  /** Called with the row when it is clicked or Enter is pressed on it; rows become links when given. */
  onSelect?: (row: MarketRow) => void
  /** Called when a row's star is toggled, with the state it should become. */
  onToggleFavorite?: (row: MarketRow, favorite: boolean) => void
  /** Extra class name on the root. */
  className?: string
}

const SORT_KEYS = ['last', 'chgPct'] as const

/** 某一行的星标按钮的选择器（id 里可能有引号、冒号，要转义）。 */
const rowStar = (id: string) => `[data-slot="market-row"][data-key="${CSS.escape(id)}"] [data-slot="market-star"]`

type RowsProps = Pick<MarketBrowserProps, 'formatPrice' | 'onSelect'> & {
  /** 筛选排序后要画的行。 */
  rows: readonly MarketRow[]
  /** 分类自己的全部行的 id（没筛过）：新行高亮只看它，搜索筛进筛出不算新。 */
  allIds: readonly string[]
  /** 星标被点：neighbor 是这一行消失后焦点该去的那一行。 */
  onStar: (row: MarketRow, favorite: boolean, neighbor: string | null, focused: boolean) => void
  labels: MarketBrowserLabels
  sort: MarketSort | null
  onSort: (key: (typeof SORT_KEYS)[number]) => void
}

/** 一个分类的表：FLIP 换位与新行高亮要 hooks，所以每个分类一个组件。 */
function MarketRows({ rows, allIds, labels, formatPrice = plainPrice, sort, onSort, onSelect, onStar }: RowsProps) {
  const table = useRef<HTMLTableElement>(null)
  const ids = rows.map((row) => row.id)
  const entering = useEnterMarks(allIds)
  useFlipList(table, ids)
  const aria = (key: (typeof SORT_KEYS)[number]) =>
    sort?.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined
  return (
    <table ref={table} className="k-watch k-market-list" data-slot="market-list" aria-label={labels.list}>
      <thead>
        <tr>
          <th scope="col">{labels.columns.symbol}</th>
          {SORT_KEYS.map((key) => (
            <th key={key} scope="col" className="is-num" aria-sort={aria(key)}>
              <button type="button" data-slot="market-sort" data-key={key} onClick={() => onSort(key)}>
                {key === 'last' ? labels.columns.last : labels.columns.change}
                <span className="k-watch-caret" aria-hidden="true">
                  {sort?.key === key ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </span>
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.id}
            data-slot="market-row"
            data-key={row.id}
            data-live-id={row.id}
            data-tone={rowTone(row)}
            className={cn(onSelect && 'is-link', entering.has(row.id) && 'k-live-enter')}
            tabIndex={onSelect ? 0 : undefined}
            onClick={onSelect ? () => onSelect(row) : undefined}
            onKeyDown={
              onSelect
                ? (event) => {
                    // 星标按钮上的 Enter 是切星标，不是选品种。
                    if (event.key === 'Enter' && event.target === event.currentTarget) onSelect(row)
                  }
                : undefined
            }
          >
            <th scope="row">
              <span className="k-watch-sym">
                <button
                  type="button"
                  className={cn('k-market-star', focusRingInset)}
                  data-slot="market-star"
                  aria-label={labels.favorite(row)}
                  aria-pressed={!!row.favorite}
                  onClick={(event) => {
                    event.stopPropagation()
                    onStar(row, !row.favorite, neighborId(ids, row.id), document.activeElement === event.currentTarget)
                  }}
                >
                  <Star aria-hidden="true" />
                </button>
                <SymbolMark
                  symbol={row.symbol}
                  name={row.name}
                  src={row.logoSrc}
                  venue={row.venue}
                  assetClass={row.assetClass}
                  size="sm"
                />
                <CodeChip className="k-watch-code">{row.symbol}</CodeChip>
                {row.name ? <CodeName>{row.name}</CodeName> : null}
              </span>
            </th>
            <td className="is-num">
              <FlashPrice value={row.last} text={formatPrice(row.last)} />
            </td>
            <td className="is-num">
              <ChangeText value={row.changePct} flash />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Market browser: search box and category tabs over a sortable list of symbols with stars, logos, last price and 24h change. */
export function MarketBrowser({
  categories,
  labels,
  formatPrice,
  value,
  defaultValue,
  onValueChange,
  onQueryChange,
  sort,
  onSortChange,
  onSelect,
  onToggleFavorite,
  className,
}: MarketBrowserProps) {
  const [query, setQuery] = useState('')
  const [innerSort, setInnerSort] = useState<MarketSort | null>(null)
  const [innerTab, setInnerTab] = useState(defaultValue ?? categories[0]?.id)
  const tab = value ?? innerTab
  const root = useRef<HTMLDivElement>(null)
  // 只算当前分类：筛选、排序都只对它做，别的分类的行不碰。
  const current = categories.find((category) => category.id === tab)
  const found = useMemo(
    () => sortRows(filterMarketRows(current?.rows ?? [], query), sort === undefined ? innerSort : sort),
    [current?.rows, query, sort, innerSort],
  )
  // 取消星标后行会消失：焦点本来在那颗星标上，行没了焦点就掉回 body。等调用方把行拿走（提交后）再把焦点送到相邻行的星标，没有相邻行送到当前页签。
  const refocus = useRef<{ id: string; neighbor: string | null } | null>(null)
  useLayoutEffect(() => {
    const pending = refocus.current
    if (!pending || !root.current) return
    if (found.some((row) => row.id === pending.id)) {
      // 行还在：调用方还没处理完（异步）就接着等；焦点已经去了别处就不管了。
      const star = root.current.querySelector(rowStar(pending.id))
      if (!star || document.activeElement !== star) refocus.current = null
      return
    }
    refocus.current = null
    if (document.activeElement && document.activeElement !== document.body) return
    const target =
      (pending.neighbor ? root.current.querySelector<HTMLElement>(rowStar(pending.neighbor)) : null) ??
      root.current.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
    target?.focus()
  }, [found])
  const active = sort === undefined ? innerSort : sort
  const click = (key: (typeof SORT_KEYS)[number]) => {
    const next = nextSort(active, key) as MarketSort | null
    if (sort === undefined) setInnerSort(next)
    onSortChange?.(next)
  }
  return (
    <div ref={root} className={cn('k-market', className)} data-slot="market-browser">
      <Input
        type="search"
        aria-label={labels.search}
        placeholder={labels.search}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          onQueryChange?.(event.target.value)
        }}
      />
      <Tabs
        value={tab}
        onValueChange={(id) => {
          setInnerTab(id)
          onValueChange?.(id)
        }}
        className="min-h-0 gap-1"
      >
        <TabsList variant="line" aria-label={labels.categories} className="k-market-tabs">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {categories.map((category) => {
          // 别的分类不画（Radix 不挂载没选中的页签内容），也就不用算它的行。
          if (category.id !== tab) {
            return <TabsContent key={category.id} value={category.id} className="k-market-body" />
          }
          return (
            <TabsContent key={category.id} value={category.id} className="k-market-body">
              {found.length === 0 ? (
                <p className="k-watch-empty" role="status" data-slot="market-empty">
                  {category.rows.length === 0 ? labels.empty : labels.noResults}
                </p>
              ) : (
                <MarketRows
                  rows={found}
                  allIds={category.rows.map((row) => row.id)}
                  labels={labels}
                  formatPrice={formatPrice}
                  sort={active}
                  onSort={click}
                  onSelect={onSelect}
                  onStar={(row, favorite, neighbor, focused) => {
                    // 只有焦点真在这颗星标上才管焦点（有的浏览器点按钮不聚焦）。
                    refocus.current = focused ? { id: row.id, neighbor } : null
                    onToggleFavorite?.(row, favorite)
                  }}
                />
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

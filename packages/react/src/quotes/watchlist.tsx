// SPDX-License-Identifier: MIT
// 自选列表：列 Symbol / Last / Chg / Chg%，行首小旗标与圆徽标；最新价变动时只有变了的尾数闪涨跌色底（FlashPrice，--dur-flash 内落回）；列头可点排序。
// 排序或数据变化让行的顺序变了，行用 FLIP 平滑换位；新加的行高亮一阵（都走共用层 lib/live.ts）。
// 布局与交互参照 TradingView 右侧自选栏（主会话 2026-11-15 在真实浏览器里实测，只取布局与行为，不抄代码）：升序 → 降序 → 原顺序循环、
// 价格尾数闪色。颜色走涨跌语义色。数、列名与读屏名都由调用方传；价格怎么写（位数）由 formatPrice 定，不给就两位小数。
// 行是统一的行情行 QuoteRow（quote-row.ts，2026-11-18）：{ id, symbol, name, last, change, changePct }；旧的 key / code 照旧认一个版本。
import { useRef, useState } from 'react'
import { cn } from '../lib/cn.ts'
import { useEnterMarks, useFlipList } from '../lib/live.ts'
import { signed } from '../lib/num.ts'
import { ChangeText } from './change-text.tsx'
import { FlashPrice } from './flash-price.tsx'
import { plainPrice, rowTone, type FormatPrice, type QuoteRow } from './quote-row.ts'
import { SymbolMark } from './symbol-mark.tsx'
import { nextSort, sortRows, type WatchlistSort, type WatchlistSortKey } from './watchlist-model.ts'

/** One watchlist row: the shared QuoteRow plus a flag and an optional logo. */
export type WatchlistRow = QuoteRow & {
  /** Whether the row's flag is on. */
  flagged?: boolean
  /** Logo image of the symbol mark; letters are drawn when omitted. */
  logoSrc?: string
}

/**
 * @deprecated The old row shape (key / code); use WatchlistRow with id / symbol. Still accepted for one version.
 */
export type LegacyWatchlistRow = Omit<WatchlistRow, 'id' | 'symbol'> & {
  /** Deprecated: use id. @deprecated Use id. */
  key: string
  /** Deprecated: use symbol. @deprecated Use symbol. */
  code: string
}

/** Legacy rows mapped to the shared model (the old fields stay on the object for callers that still read them). */
export function toWatchlistRow(row: WatchlistRow | LegacyWatchlistRow): WatchlistRow {
  return 'id' in row && 'symbol' in row
    ? row
    : { ...row, id: (row as LegacyWatchlistRow).key, symbol: (row as LegacyWatchlistRow).code }
}

export type WatchlistLabels = {
  /** Header text of the four columns. */
  columns: Record<WatchlistSortKey, string>
  /** Accessible name of the whole table. */
  list: string
  /** Text shown when there are no rows. */
  empty: string
  /** Accessible name of a row's flag button. */
  flag: (row: WatchlistRow) => string
}

export type WatchlistProps = {
  /** The rows, in their original order. */
  rows: readonly (WatchlistRow | LegacyWatchlistRow)[]
  /** Column names and accessible names. */
  labels: WatchlistLabels
  /** Writes a price or change amount; two decimals when omitted. */
  formatPrice?: FormatPrice
  /** Sort (controlled); null is the original order. */
  sort?: WatchlistSort | null
  /** Called with the next sort when a column header is clicked. */
  onSortChange?: (sort: WatchlistSort | null) => void
  /** Called with the row when it is clicked; rows become links when given. */
  onSelect?: (row: WatchlistRow) => void
  /** Deprecated: use onSelect. @deprecated Use onSelect. */
  onRow?: (row: WatchlistRow) => void
  /** Called when a row's flag is toggled. */
  onFlag?: (row: WatchlistRow, flagged: boolean) => void
  /** Extra class name on the table. */
  className?: string
}

const KEYS: WatchlistSortKey[] = ['symbol', 'last', 'chg', 'chgPct']

export function Watchlist({
  rows,
  labels,
  formatPrice = plainPrice,
  sort,
  onSortChange,
  onSelect,
  onRow,
  onFlag,
  className,
}: WatchlistProps) {
  const select = onSelect ?? onRow
  const [innerSort, setInnerSort] = useState<WatchlistSort | null>(null)
  const active = sort === undefined ? innerSort : sort
  const shown = sortRows(rows.map(toWatchlistRow), active)
  const table = useRef<HTMLTableElement>(null)
  const ids = shown.map((row) => row.id)
  const entering = useEnterMarks(ids)
  useFlipList(table, ids)
  const click = (key: WatchlistSortKey) => {
    const next = nextSort(active, key)
    if (sort === undefined) setInnerSort(next)
    onSortChange?.(next)
  }
  if (rows.length === 0)
    return (
      <p className={cn('k-watch-empty', className)} role="status">
        {labels.empty}
      </p>
    )
  return (
    <table ref={table} className={cn('k-watch', className)} data-slot="watchlist" aria-label={labels.list}>
      <thead>
        <tr>
          {KEYS.map((key) => (
            <th
              key={key}
              scope="col"
              className={key === 'symbol' ? undefined : 'is-num'}
              aria-sort={active?.key === key ? (active.dir === 'asc' ? 'ascending' : 'descending') : undefined}
            >
              <button type="button" data-slot="watch-sort" data-key={key} onClick={() => click(key)}>
                {labels.columns[key]}
                <span className="k-watch-caret" aria-hidden="true">
                  {active?.key === key ? (active.dir === 'asc' ? '▲' : '▼') : ''}
                </span>
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {shown.map((row) => {
          const tone = rowTone(row)
          return (
            <tr
              key={row.id}
              data-slot="watch-row"
              data-key={row.id}
              data-live-id={row.id}
              data-tone={tone}
              className={cn(select && 'is-link', entering.has(row.id) && 'k-live-enter')}
              onClick={select ? () => select(row) : undefined}
            >
              <th scope="row">
                <span className="k-watch-sym">
                  <button
                    type="button"
                    className="k-watch-flag"
                    data-slot="watch-flag"
                    aria-label={labels.flag(row)}
                    aria-pressed={!!row.flagged}
                    onClick={(e) => {
                      e.stopPropagation()
                      onFlag?.(row, !row.flagged)
                    }}
                  >
                    <svg viewBox="0 0 12 12" aria-hidden="true">
                      <path d="M3 1.5v9M3 2h6.5L8 4.5 9.5 7H3" />
                    </svg>
                  </button>
                  <SymbolMark symbol={row.symbol} name={row.name} src={row.logoSrc} size="sm" />
                  <span className="k-watch-code">{row.symbol}</span>
                </span>
              </th>
              <td className="is-num">
                <FlashPrice value={row.last} text={formatPrice(row.last)} />
              </td>
              <td className="is-num" data-tone={tone}>
                {signed(row.change, formatPrice)}
              </td>
              <td className="is-num">
                <ChangeText value={row.changePct} flash />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

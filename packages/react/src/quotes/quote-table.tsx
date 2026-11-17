// SPDX-License-Identifier: MIT
// 分组页签行情表：上面一排页签（指数、自选、热门……），下面是当前这一组的行情表：名字与代码、迷你图、最新价、涨跌幅。
// 功能参照 TradingView 小组件 Market Overview / Market Quotes（tradingview.com/widget-docs/widgets/watchlists，2026-11-14 读：
// 「适合首页的市场总览」，分组页签加报价行；页面没写列与交互，我们自己定：页签用包里的 Tabs，行可点，表头与行对齐、数字等宽）。不嵌、不抄其代码与样式。
// 行就是自选列表的行（WatchlistRow，即统一行情行 { id, symbol, name, last, change, changePct } 加迷你图，2026-11-18）：值是数，价格文字由 formatPrice 写，
// 最新价变了只闪变了的尾数（与 Watchlist 共用 FlashPrice），涨跌幅变了整格闪涨跌色，行的顺序变了平滑换位，新加的行高亮一阵（共用层 lib/live.ts）。
// 由 Tabs 与 Sparkline 组出来，文字全由调用方传，包里没有文案。旧的字符串行（price / percent / tone）照旧认一个版本。
import { useRef } from 'react'
import { cn } from '../lib/cn.ts'
import { useEnterMarks, useFlipList, useValueFlash } from '../lib/live.ts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs.tsx'
import { formatPercentChange } from '../lib/chart/format/index.ts'
import { FlashPrice } from './flash-price.tsx'
import { plainPrice, readNumber, rowTone, type FormatPrice } from './quote-row.ts'
import { TONE_GLYPH, type QuoteTone } from './quote-tone.ts'
import { Sparkline } from './sparkline.tsx'
import type { WatchlistRow } from './watchlist.tsx'

/** One row of the quote table: a watchlist row plus an optional mini chart. */
export type QuoteTableRow = Omit<WatchlistRow, 'flagged'> & {
  /** Values of the mini chart, oldest to newest. */
  spark?: readonly number[]
  /** Accessible name of the mini chart. */
  sparkLabel?: string
}

/**
 * @deprecated The old string row; use QuoteTableRow (numbers plus formatPrice). Still accepted for one version.
 */
export type LegacyQuoteRow = {
  id: string
  name: string
  symbol?: string
  /** Deprecated: use last with formatPrice. @deprecated Use last with formatPrice. */
  price: string
  /** Deprecated: use last. @deprecated Use last. */
  value?: number
  /** Deprecated: use changePct. @deprecated Use changePct. */
  percent?: string
  /** Deprecated: derived from change. @deprecated Derived from change. */
  tone?: QuoteTone
  spark?: readonly number[]
  sparkLabel?: string
}

export type QuoteGroup = {
  /** Group id (the tab value). */
  id: string
  /** Tab text. */
  label: string
  /** The rows of this group. */
  rows: readonly (QuoteTableRow | LegacyQuoteRow)[]
}

export type QuoteTableLabels = {
  /** Text of the four header columns (name, trend, price, change). */
  columns: { name: string; trend: string; price: string; change: string }
  /** Text written when a group has no rows. */
  empty: string
  /** Accessible name of the tab strip. */
  list: string
}

export type QuoteTableProps = {
  /** The groups, one tab each. */
  groups: readonly QuoteGroup[]
  /** Header, empty and accessible texts. */
  labels?: QuoteTableLabels
  /** Deprecated: use labels.columns. @deprecated Use labels.columns. */
  columns?: QuoteTableLabels['columns']
  /** Deprecated: use labels.empty. @deprecated Use labels.empty. */
  empty?: string
  /** Deprecated: use labels.list. @deprecated Use labels.list. */
  label?: string
  /** Writes the last price; two decimals when omitted. */
  formatPrice?: FormatPrice
  /** The selected group id when controlled. */
  value?: string
  /** The initially selected group id when uncontrolled. */
  defaultValue?: string
  /** Called with the group id when the tab changes. */
  onValueChange?: (id: string) => void
  /** When given, rows are clickable and focusable and trigger on Enter. */
  onSelect?: (row: QuoteTableRow | LegacyQuoteRow) => void
  /** Deprecated: use onSelect. @deprecated Use onSelect. */
  onRow?: (row: QuoteTableRow | LegacyQuoteRow) => void
  /** Extra class name on the root. */
  className?: string
}

/** 一行要画的东西：新行由数写字，旧行原样用调用方写好的字。 */
type Line = {
  row: QuoteTableRow | LegacyQuoteRow
  name: string
  symbol?: string
  last: number | null
  lastText: string
  pct: number | null
  pctText?: string
  tone: QuoteTone
}

const isLegacy = (row: QuoteTableRow | LegacyQuoteRow): row is LegacyQuoteRow => 'price' in row && !('last' in row)

function lineOf(row: QuoteTableRow | LegacyQuoteRow, format: FormatPrice): Line {
  if (isLegacy(row))
    return {
      row,
      name: row.name,
      symbol: row.symbol,
      last: row.value ?? readNumber(row.price),
      lastText: row.price,
      pct: readNumber(row.percent),
      pctText: row.percent,
      tone: row.tone ?? 'flat',
    }
  return {
    row,
    name: row.name ?? row.symbol,
    symbol: row.name ? row.symbol : undefined,
    last: row.last,
    lastText: format(row.last),
    pct: row.changePct,
    pctText: Number.isFinite(row.changePct) ? formatPercentChange(row.changePct) : undefined,
    tone: rowTone(row),
  }
}

/** 一组的行：<tr> 上要用 FLIP 换位与新行高亮，所以每一组一个组件放 hooks。 */
function QuoteRows({
  rows,
  labels,
  format,
  onSelect,
}: {
  rows: QuoteGroup['rows']
  labels: QuoteTableLabels
  format: FormatPrice
  onSelect?: QuoteTableProps['onSelect']
}) {
  const table = useRef<HTMLTableElement>(null)
  const ids = rows.map((row) => row.id)
  const entering = useEnterMarks(ids)
  useFlipList(table, ids)
  return (
    <table ref={table} className="k-quote-rows">
      <thead>
        <tr>
          <th scope="col">{labels.columns.name}</th>
          <th scope="col">{labels.columns.trend}</th>
          <th scope="col" className="is-num">
            {labels.columns.price}
          </th>
          <th scope="col" className="is-num">
            {labels.columns.change}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <QuoteLine key={row.id} line={lineOf(row, format)} onSelect={onSelect} entering={entering.has(row.id)} />
        ))}
      </tbody>
    </table>
  )
}

function QuoteLine({
  line,
  onSelect,
  entering,
}: {
  line: Line
  onSelect?: QuoteTableProps['onSelect']
  entering: boolean
}) {
  const { row, tone } = line
  const percent = useValueFlash(line.pct)
  return (
    <tr
      data-live-id={row.id}
      className={cn(`is-${tone}`, onSelect && 'is-link', entering && 'k-live-enter')}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect ? () => onSelect(row) : undefined}
      onKeyDown={
        onSelect
          ? (event) => {
              if (event.key === 'Enter') onSelect(row)
            }
          : undefined
      }
    >
      <th scope="row" className="k-quote-rows-name">
        <span>{line.name}</span>
        {line.symbol && <small>{line.symbol}</small>}
      </th>
      <td className="k-quote-rows-trend">
        {/* 行高只有 22px：不画末端点（价格格自己会闪，再脉动一个点只会吵）。 */}
        {row.spark && <Sparkline values={row.spark} label={row.sparkLabel ?? ''} tone={tone} showLast={false} />}
      </td>
      <td className="is-num">
        {line.last === null ? line.lastText : <FlashPrice value={line.last} text={line.lastText} />}
      </td>
      <td
        key={`change-${percent.key}`}
        className="is-num k-quote-rows-change k-live-flash"
        data-flash={percent.flash ?? undefined}
      >
        {line.pctText && (
          <>
            <span className="k-price-tag-glyph" aria-hidden="true">
              {TONE_GLYPH[tone]}
            </span>
            {line.pctText}
          </>
        )}
      </td>
    </tr>
  )
}

export function QuoteTable({
  groups,
  labels: given,
  columns,
  empty,
  label,
  formatPrice = plainPrice,
  value,
  defaultValue,
  onValueChange,
  onSelect,
  onRow,
  className,
}: QuoteTableProps) {
  const labels: QuoteTableLabels = given ?? {
    columns: columns ?? { name: '', trend: '', price: '', change: '' },
    empty: empty ?? '',
    list: label ?? '',
  }
  const select = onSelect ?? onRow
  return (
    <Tabs
      className={`k-quote-table${className ? ` ${className}` : ''}`}
      value={value}
      defaultValue={value === undefined ? (defaultValue ?? groups[0]?.id) : undefined}
      onValueChange={onValueChange}
    >
      <TabsList aria-label={labels.list}>
        {groups.map((group) => (
          <TabsTrigger key={group.id} value={group.id}>
            {group.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {groups.map((group) => (
        <TabsContent key={group.id} value={group.id}>
          {group.rows.length === 0 ? (
            <p className="k-quote-table-empty">{labels.empty}</p>
          ) : (
            <QuoteRows rows={group.rows} labels={labels} format={formatPrice} onSelect={select} />
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}

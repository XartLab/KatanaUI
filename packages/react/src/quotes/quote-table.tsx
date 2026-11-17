// SPDX-License-Identifier: MIT
// 分组页签行情表：上面一排页签（指数、自选、热门……），下面是当前这一组的行情表：名字与代码、迷你图、最新价、涨跌幅。
// 功能参照 TradingView 小组件 Market Overview / Market Quotes（tradingview.com/widget-docs/widgets/watchlists，2026-11-14 读：
// 「适合首页的市场总览」，分组页签加报价行；页面没写列与交互，我们自己定：页签用包里的 Tabs，行可点，表头与行对齐、数字等宽）。不嵌、不抄其代码与样式。
// 由 Tabs 与 Sparkline 组出来，文字全由调用方传，包里没有文案。
// 刷新动效走共用层 lib/live.ts：最新价、涨跌幅变了闪涨跌色，行的顺序变了平滑换位，新加的行高亮一阵。
import { useRef } from 'react'
import { cn } from '../lib/cn.ts'
import { useEnterMarks, useFlipList, useValueFlash } from '../lib/live.ts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs.tsx'
import { Sparkline } from './sparkline.tsx'
import { TONE_GLYPH, type QuoteTone } from './quote-tone.ts'

export type QuoteRow = {
  id: string
  name: string
  symbol?: string
  /** 已经格式化好的价与涨跌幅。 */
  price: string
  /** Numeric value of price, used to decide the direction of a flash; read from the price text when omitted. */
  value?: number
  percent?: string
  tone?: QuoteTone
  spark?: readonly number[]
  sparkLabel?: string
}

export type QuoteGroup = { id: string; label: string; rows: readonly QuoteRow[] }

export type QuoteTableProps = {
  /** The groups, one tab each; a QuoteRow is { id, name, symbol?, price, percent?, tone?, spark?, sparkLabel? }. */
  groups: readonly QuoteGroup[]
  /**
   * Text of the four header columns (name, trend, price, change).
   * 表头四列的字（名称、走势、最新价、涨跌幅）与没有行时的字。
   */
  columns: { name: string; trend: string; price: string; change: string }
  /** Text written when a group has no rows. */
  empty: string
  /**
   * Accessible name of the tab strip.
   * 读屏名。
   */
  label: string
  /** The selected group id when controlled. */
  value?: string
  /** The initially selected group id when uncontrolled. */
  defaultValue?: string
  /** Called with the group id when the tab changes. */
  onValueChange?: (id: string) => void
  /** When given, rows are clickable and focusable and trigger on Enter. */
  onRow?: (row: QuoteRow) => void
  /** Extra class name on the root. */
  className?: string
}

/** 从写好的文字里读出数：去掉千分位逗号，取第一段带符号的数；读不出是 null（不闪）。 */
const readNumber = (text: string | undefined): number | null => {
  const found = text?.replace(/,/g, '').match(/[-+−]?\d+(?:\.\d+)?/)?.[0]
  const value = found === undefined ? Number.NaN : Number(found.replace('−', '-'))
  return Number.isFinite(value) ? value : null
}

/** 一组的行：<tr> 上要用 FLIP 换位与新行高亮，所以每一组一个组件放 hooks。 */
function QuoteRows({
  rows,
  columns,
  onRow,
}: {
  rows: readonly QuoteRow[]
  columns: QuoteTableProps['columns']
  onRow?: (row: QuoteRow) => void
}) {
  const table = useRef<HTMLTableElement>(null)
  const ids = rows.map((row) => row.id)
  const entering = useEnterMarks(ids)
  useFlipList(table, ids)
  return (
    <table ref={table} className="k-quote-rows">
      <thead>
        <tr>
          <th scope="col">{columns.name}</th>
          <th scope="col">{columns.trend}</th>
          <th scope="col" className="is-num">
            {columns.price}
          </th>
          <th scope="col" className="is-num">
            {columns.change}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <QuoteLine key={row.id} row={row} onRow={onRow} entering={entering.has(row.id)} />
        ))}
      </tbody>
    </table>
  )
}

function QuoteLine({ row, onRow, entering }: { row: QuoteRow; onRow?: (row: QuoteRow) => void; entering: boolean }) {
  const tone = row.tone ?? 'flat'
  const price = useValueFlash(row.value ?? readNumber(row.price))
  const percent = useValueFlash(readNumber(row.percent))
  return (
    <tr
      data-live-id={row.id}
      className={cn(`is-${tone}`, onRow && 'is-link', entering && 'k-live-enter')}
      tabIndex={onRow ? 0 : undefined}
      onClick={onRow ? () => onRow(row) : undefined}
      onKeyDown={
        onRow
          ? (event) => {
              if (event.key === 'Enter') onRow(row)
            }
          : undefined
      }
    >
      <th scope="row" className="k-quote-rows-name">
        <span>{row.name}</span>
        {row.symbol && <small>{row.symbol}</small>}
      </th>
      <td className="k-quote-rows-trend">
        {/* 行高只有 22px：不画末端点（价格格自己会闪，再脉动一个点只会吵）。 */}
        {row.spark && <Sparkline values={row.spark} label={row.sparkLabel ?? ''} tone={tone} showLast={false} />}
      </td>
      <td key={`price-${price.key}`} className="is-num k-live-flash" data-flash={price.flash ?? undefined}>
        {row.price}
      </td>
      <td
        key={`change-${percent.key}`}
        className="is-num k-quote-rows-change k-live-flash"
        data-flash={percent.flash ?? undefined}
      >
        {row.percent && (
          <>
            <span className="k-price-tag-glyph" aria-hidden="true">
              {TONE_GLYPH[tone]}
            </span>
            {row.percent}
          </>
        )}
      </td>
    </tr>
  )
}

export function QuoteTable({
  groups,
  columns,
  empty,
  label,
  value,
  defaultValue,
  onValueChange,
  onRow,
  className,
}: QuoteTableProps) {
  return (
    <Tabs
      className={`k-quote-table${className ? ` ${className}` : ''}`}
      value={value}
      defaultValue={value === undefined ? (defaultValue ?? groups[0]?.id) : undefined}
      onValueChange={onValueChange}
    >
      <TabsList aria-label={label}>
        {groups.map((group) => (
          <TabsTrigger key={group.id} value={group.id}>
            {group.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {groups.map((group) => (
        <TabsContent key={group.id} value={group.id}>
          {group.rows.length === 0 ? (
            <p className="k-quote-table-empty">{empty}</p>
          ) : (
            <QuoteRows rows={group.rows} columns={columns} onRow={onRow} />
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}

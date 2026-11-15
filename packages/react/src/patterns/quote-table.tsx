// SPDX-License-Identifier: MIT
// 分组页签行情表：上面一排页签（指数、自选、热门……），下面是当前这一组的行情表：名字与代码、迷你图、最新价、涨跌幅。
// 功能参照 TradingView 小组件 Market Overview / Market Quotes（tradingview.com/widget-docs/widgets/watchlists，2026-11-14 读：
// 「适合首页的市场总览」，分组页签加报价行；页面没写列与交互，我们自己定：页签用包里的 Tabs，行可点，表头与行对齐、数字等宽）。不嵌、不抄其代码与样式。
// 由 Tabs 与 Sparkline 组出来，文字全由调用方传，包里没有文案。
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../primitives/tabs.tsx'
import { Sparkline } from '../katana/sparkline.tsx'
import { TONE_GLYPH, type QuoteTone } from '../katana/quote-tone.ts'

export type QuoteRow = {
  id: string
  name: string
  symbol?: string
  /** 已经格式化好的价与涨跌幅。 */
  price: string
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
            <table className="k-quote-rows">
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
                {group.rows.map((row) => {
                  const tone = row.tone ?? 'flat'
                  return (
                    <tr
                      key={row.id}
                      className={`is-${tone}${onRow ? ' is-link' : ''}`}
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
                        {row.spark && <Sparkline values={row.spark} label={row.sparkLabel ?? ''} tone={tone} />}
                      </td>
                      <td className="is-num">{row.price}</td>
                      <td className="is-num k-quote-rows-change">
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
                })}
              </tbody>
            </table>
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}

// SPDX-License-Identifier: MIT
// 自选列表：列 Symbol / Last / Chg / Chg%，行首小旗标与圆徽标；最新价变动时只有变了的尾数闪涨跌色底（共用层 lib/live.ts，--dur-flash 内落回）；列头可点排序。
// 排序或数据变化让行的顺序变了，行用 FLIP 平滑换位；新加的行高亮一阵（都走共用层 lib/live.ts）。
// 布局与交互参照 TradingView 右侧自选栏（主会话 2026-11-15 在真实浏览器里实测，只取布局与行为，不抄代码）：升序 → 降序 → 原顺序循环、
// 价格尾数闪色。颜色走涨跌语义色。数、列名与读屏名都由调用方传；价格怎么写（位数）由 formatPrice 定，不给就两位小数。
import { useRef, useState } from 'react'
import { cn } from '../lib/cn.ts'
import { useEnterMarks, useFlipList, useValueFlash } from '../lib/live.ts'
import { signed } from '../lib/num.ts'
import { SymbolMark } from '../katana/symbol-mark.tsx'
import { ChangeText } from './change-text.tsx'
import { toneOf } from './format/index.ts'
import { changedTail, nextSort, sortRows, type WatchlistSort, type WatchlistSortKey } from './watchlist-model.ts'

export type WatchlistRow = {
  key: string
  code: string
  name?: string
  /** 最新价。 */
  last: number
  /** 涨跌额。 */
  change: number
  /** 涨跌幅，百分数。 */
  changePct: number
  flagged?: boolean
  logoSrc?: string
}

export type WatchlistLabels = {
  columns: Record<WatchlistSortKey, string>
  /** 整张表的读屏名。 */
  list: string
  empty: string
  /** 旗标按钮的读屏名。 */
  flag: (row: WatchlistRow) => string
}

export type WatchlistProps = {
  rows: readonly WatchlistRow[]
  labels: WatchlistLabels
  formatPrice?: (value: number) => string
  /** 排序（受控）；null 是原顺序。 */
  sort?: WatchlistSort | null
  onSortChange?: (sort: WatchlistSort | null) => void
  onRow?: (row: WatchlistRow) => void
  onFlag?: (row: WatchlistRow, flagged: boolean) => void
  className?: string
}

const plain = (n: number) => n.toFixed(2)

/**
 * 最新价：数变了，从第一位不同的数字起到末尾闪一下涨跌色底（共用层 useValueFlash：方向、1 秒节流、key 都由它给）；渲染时比较新旧值，不用 effect。
 * 这里只多管一件事：尾数是哪几位（拿变化前的文字跟现在的比），被节流掉的变化不闪也不换尾数。
 */
function FlashPrice({ value, format }: { value: number; format: (v: number) => string }) {
  const { flash, key } = useValueFlash(value)
  const text = format(value)
  // hist.prev 是变化前的文字：useValueFlash 与这里的 setState 在同一轮渲染里生效，第二遍渲染读到新 key 时，旧文字只能从 prev 拿。
  const [hist, setHist] = useState({ value, text, prev: text })
  const [mark, setMark] = useState({ key, tail: '' })
  if (value !== hist.value) setHist({ value, text, prev: hist.text })
  if (key !== mark.key) setMark({ key, tail: changedTail(hist.prev, text).tail })
  const tail = flash && mark.key === key && mark.tail && text.endsWith(mark.tail) ? mark.tail : null
  const head = tail ? text.slice(0, text.length - tail.length) : text
  return (
    <span className="k-watch-last" data-slot="watch-last">
      {head}
      {tail ? (
        <span key={key} className="k-watch-flash k-live-flash" data-slot="watch-flash" data-flash={flash ?? undefined}>
          {tail}
        </span>
      ) : null}
    </span>
  )
}

const KEYS: WatchlistSortKey[] = ['symbol', 'last', 'chg', 'chgPct']

export function Watchlist({
  rows,
  labels,
  formatPrice = plain,
  sort,
  onSortChange,
  onRow,
  onFlag,
  className,
}: WatchlistProps) {
  const [innerSort, setInnerSort] = useState<WatchlistSort | null>(null)
  const active = sort === undefined ? innerSort : sort
  const shown = sortRows(rows, active)
  const table = useRef<HTMLTableElement>(null)
  const keys = shown.map((row) => row.key)
  const entering = useEnterMarks(keys)
  useFlipList(table, keys)
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
          const tone = toneOf(row.change)
          return (
            <tr
              key={row.key}
              data-slot="watch-row"
              data-key={row.key}
              data-live-id={row.key}
              data-tone={tone}
              className={cn(onRow && 'is-link', entering.has(row.key) && 'k-live-enter')}
              onClick={onRow ? () => onRow(row) : undefined}
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
                  <SymbolMark code={row.code} name={row.name} src={row.logoSrc} size={18} />
                  <span className="k-watch-code">{row.code}</span>
                </span>
              </th>
              <td className="is-num">
                <FlashPrice value={row.last} format={formatPrice} />
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

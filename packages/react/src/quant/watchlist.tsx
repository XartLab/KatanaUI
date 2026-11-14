// SPDX-License-Identifier: MIT
// 自选列表：列 Symbol / Last / Chg / Chg%，行首小旗标与圆徽标；最新价变动时只有变了的尾数闪涨跌色、约 1 秒落回；列头可点排序。
// 布局与交互参照 TradingView 右侧自选栏（主会话 2026-11-15 在真实浏览器里实测，只取布局与行为，不抄代码）：升序 → 降序 → 原顺序循环、
// 价格尾数闪色。颜色走涨跌语义色。数、列名与读屏名都由调用方传；价格怎么写（位数）由 formatPrice 定，不给就两位小数。
import { useState } from 'react'
import { cn } from '../lib/cn.ts'
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
const signed = (n: number, fmt: (v: number) => string) => (n > 0 ? '+' : n < 0 ? '-' : '') + fmt(Math.abs(n))

/** 最新价：数变了，从第一位不同的数字起到末尾闪一下涨跌色；key 换掉让动画重放。渲染时比较新旧值，不用 effect。 */
function FlashPrice({ value, format }: { value: number; format: (v: number) => string }) {
  const [seen, setSeen] = useState(value)
  const [flash, setFlash] = useState<{ id: number; tone: 'up' | 'down'; tail: string } | null>(null)
  const text = format(value)
  if (value !== seen) {
    const { tail } = changedTail(format(seen), text)
    setSeen(value)
    setFlash(tail ? { id: (flash?.id ?? 0) + 1, tone: value > seen ? 'up' : 'down', tail } : flash)
  }
  const tail = flash && text.endsWith(flash.tail) ? flash : null
  const head = tail ? text.slice(0, text.length - tail.tail.length) : text
  return (
    <span className="k-watch-last" data-slot="watch-last">
      {head}
      {tail ? (
        <span key={tail.id} className="k-watch-flash" data-slot="watch-flash" data-flash={tail.tone}>
          {tail.tail}
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
    <table className={cn('k-watch', className)} data-slot="watchlist" aria-label={labels.list}>
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
              data-tone={tone}
              className={onRow ? 'is-link' : undefined}
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
                <ChangeText value={row.changePct} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

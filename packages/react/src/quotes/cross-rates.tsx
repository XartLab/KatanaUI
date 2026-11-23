// SPDX-License-Identifier: MIT
// 交叉汇率矩阵（CrossRates）：行是基准货币、列是计价货币，每格一对的汇率与涨跌幅；热力模式按涨跌幅七档上色，一眼看哪种货币强、哪种弱。
// 功能参照 TradingView 小组件 Forex Cross Rates 与 Forex Heatmap（tradingview.com/widget-docs/widgets/heatmaps/forex-table/?preset=cross-rates，2026-11-23 读：
// 页面写「所选货币对其他主要货币的实时报价」，可在 cross-rates 与 heatmap 两种预设间切换看强弱；格子里写什么、怎么上色、悬停与点击怎么样，页面没写，待核对）。
// 只取功能，不嵌、不抄代码与样式值。我们的做法：对角线（同一种货币）不画数；悬停或聚焦一格时它所在的行头与列头加亮（十字）；
// 方向键在格子间走（照 APG 的 grid：←→↑↓、Home / End、Ctrl+Home / Ctrl+End），Enter 或点击回调这一对。
// 热力的七档与 Treemap 同一套（colorStep，涨跌色跟 --pnl-up / --pnl-down 走，根上 data-updown 会互换红绿）；格子上的字按底色明暗选黑或白，同 Treemap。
// 文字（读屏名、空态）与汇率写法都由调用方传。
import { useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { formatPercentChange } from '../lib/chart/format/index.ts'
import { ChangeText } from './change-text.tsx'
import {
  crossRateMatrix,
  moveCell,
  plainRate,
  type CrossRateCell,
  type CrossRateQuote,
  type GridPos,
} from './cross-rates-model.ts'
import { colorStep } from './treemap-model.ts'

export type CrossRatesLabels = {
  /** Accessible name of the grid. */
  table: string
  /** Text in the empty state when no currencies are given. */
  empty: string
  /** Accessible name of one cell, for example "EUR/USD"; base/quote by default. */
  pair?: (base: string, quote: string) => string
}

export type CrossRatesProps = {
  /** Currency codes in row and column order (USD, EUR, JPY …). */
  currencies: readonly string[]
  /** One quote per pair; pairs without a quote draw an em dash. */
  quotes: readonly CrossRateQuote[]
  /**
   * Rates writes the rate with the change under it; heatmap colors each cell by the change and writes the change.
   * rates：写汇率、下面小字涨跌幅；heatmap：按涨跌幅七档上色、只写涨跌幅。
   */
  mode?: 'rates' | 'heatmap'
  /** Writes a rate as text; two decimals from 100 up, else four. */
  formatRate?: (rate: number, base: string, quote: string) => string
  /**
   * Change in percent where the heatmap color scale ends; changes are cut at plus or minus this into seven steps. 1 (that is ±1%) by default.
   * 热力色阶的端点（百分数）：涨跌幅按 ±limit 切成七档；默认 1（即 ±1%），外汇日内涨跌通常在这个量级，按品种调。
   */
  limit?: number
  /** Full names of the currencies, shown as the header tooltip. */
  names?: Readonly<Record<string, string>>
  /** Called when a cell is clicked or Enter is pressed on it; never for the diagonal. */
  onSelect?: (quote: CrossRateQuote) => void
  /** Texts for screen readers and the empty state, written by the caller (required). */
  labels: CrossRatesLabels
  /** Extra class name on the root. */
  className?: string
}

const pairOf = (cell: CrossRateCell) => `${cell.base}/${cell.quote}`

export function CrossRates({
  currencies,
  quotes,
  mode = 'rates',
  formatRate = plainRate,
  limit = 1,
  names,
  onSelect,
  labels,
  className,
}: CrossRatesProps) {
  const rows = crossRateMatrix(currencies, quotes)
  const size = currencies.length
  const [focus, setFocus] = useState<GridPos>({ row: 0, col: size > 1 ? 1 : 0 })
  const [hot, setHot] = useState<GridPos | null>(null)
  const cells = useRef(new Map<string, HTMLTableCellElement>())
  if (size === 0) {
    return (
      <div className={cn('k-xrates is-empty', className)} data-slot="cross-rates">
        {labels.empty}
      </div>
    )
  }
  // 货币变少时焦点格可能越界：渲染时就夹回来，不等 effect。
  const at = { row: Math.min(focus.row, size - 1), col: Math.min(focus.col, size - 1) }
  const pairName = labels.pair ?? ((base: string, quote: string) => `${base}/${quote}`)

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    if (event.key === 'Enter') {
      const data = rows[at.row]?.[at.col]?.data
      if (data && onSelect) {
        event.preventDefault()
        onSelect(data)
      }
      return
    }
    const next = moveCell(at, size, event.key, event.ctrlKey || event.metaKey)
    if (!next) return
    event.preventDefault()
    setFocus(next)
    setHot(next)
    cells.current.get(`${next.row}:${next.col}`)?.focus()
  }

  return (
    <div className={cn('k-xrates', className)} data-slot="cross-rates" data-mode={mode}>
      <table role="grid" aria-label={labels.table} onKeyDown={onKeyDown} onPointerLeave={() => setHot(null)}>
        <thead>
          <tr>
            <td className="k-xrates-corner" />
            {currencies.map((code, col) => (
              <th
                key={code}
                scope="col"
                className={cn('k-xrates-head', hot?.col === col && 'is-hot')}
                title={names?.[code]}
              >
                {code}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={currencies[rowIndex]}>
              <th
                scope="row"
                className={cn('k-xrates-head', hot?.row === rowIndex && 'is-hot')}
                title={names?.[currencies[rowIndex]!]}
              >
                {currencies[rowIndex]}
              </th>
              {row.map((cell, col) => {
                const step = mode === 'heatmap' && cell.data ? colorStep(cell.data.changePct, limit) : null
                const focused = at.row === rowIndex && at.col === col
                return (
                  <td
                    key={cell.quote}
                    ref={(node) => {
                      const key = `${rowIndex}:${col}`
                      if (node) cells.current.set(key, node)
                      else cells.current.delete(key)
                    }}
                    role="gridcell"
                    tabIndex={focused ? 0 : -1}
                    aria-label={cell.diagonal ? undefined : pairName(cell.base, cell.quote)}
                    className={cn(
                      'k-xrates-cell',
                      cell.diagonal && 'is-diagonal',
                      mode === 'heatmap' && `is-step${step === null ? 'na' : step}`,
                      onSelect && cell.data && 'is-link',
                      hot?.row === rowIndex && hot.col === col && 'is-hot',
                    )}
                    data-slot="cross-rate"
                    data-pair={pairOf(cell)}
                    onPointerEnter={() => setHot({ row: rowIndex, col })}
                    onFocus={() => {
                      setFocus({ row: rowIndex, col })
                      setHot({ row: rowIndex, col })
                    }}
                    onClick={() => {
                      if (cell.data && onSelect) onSelect(cell.data)
                    }}
                  >
                    {cell.diagonal ? null : cell.data === null ? (
                      '—'
                    ) : mode === 'heatmap' ? (
                      <span className="k-xrates-pct">{formatPercentChange(cell.data.changePct)}</span>
                    ) : (
                      <>
                        <span className="k-xrates-rate">{formatRate(cell.data.rate, cell.base, cell.quote)}</span>
                        <ChangeText value={cell.data.changePct} className="k-xrates-change" />
                      </>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

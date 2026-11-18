// SPDX-License-Identifier: MIT
/**
 * Theme heat matrix: themes by trading days, each cell the limit-up count and rank, shaded on the sequential scale.
 * 题材热度矩阵（#11，开盘啦「题材库 / 板块强度」对照）：行是题材，列是近 5 到 10 个交易日，格内大字写涨停只数、右上小字写当日名次，
 * 底色按只数落在 seq 五档（色阶与 CalendarHeatmap 的换手视图同一套：大小用 seq，不用涨跌色上面积）；最右一列是最近一天。
 * 题材的次序、只数、名次都由调用方给，件不排序、不算热度；日期文字、读屏句子也由调用方写。
 * 表格手感取 TradingView 的列表（无衬线 + tabular-nums、紧凑行、极淡分隔），格子取工作台的方格热力图；选中格画 1px 主色描边。
 * 键盘照 APG Grid：方向键走格、Home / End 到行首行尾、Enter / Space 选中，Tab 只停一个格子（roving tabindex）。
 */
import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { heatKey, heatLevel, heatMax, type ThemeHeatPos, type ThemeHeatRow } from './theme-heat-model.ts'

export type { ThemeHeatCell, ThemeHeatPos, ThemeHeatRow } from './theme-heat-model.ts'

/** Texts of ThemeHeatMatrix (the package ships no text). */
export type ThemeHeatMatrixLabels = {
  /** Accessible name of the grid. 整张表的读屏名。 */
  grid: string
  /** Header of the theme column (「题材」). 题材列的列头。 */
  theme: string
  /** Rank text in a cell corner (「#3」). 格子右上角的名次写法。 */
  rank: (rank: number) => string
  /** Accessible text of one cell (「机器人 11-18：涨停 6 只，第 1」). 一格的读屏句子。 */
  cell: (row: ThemeHeatRow, date: string, count: number | null, rank: number | null) => string
  /** Legend ends (「少」「多」). 图例两端的字。 */
  legend: { low: string; high: string }
  /** Text when there are no rows. 没有题材时的字。 */
  empty: string
}

export type ThemeHeatMatrixProps = {
  /** Column headers, oldest first, already formatted (「11-12」). 列头日期，从旧到新，调用方写好。 */
  dates: readonly string[]
  /** Theme rows in the caller's order. 题材行，按调用方的次序。 */
  rows: readonly ThemeHeatRow[]
  /** Texts. */
  labels: ThemeHeatMatrixLabels
  /** Selected cell (controlled); null for none. 选中的格子（受控）。 */
  selected?: ThemeHeatPos | null
  /** Pick a cell with click, Enter or Space: gets the row and the day index (link the board list to it). 点格子或按 Enter / Space。 */
  onSelect?: (row: ThemeHeatRow, col: number) => void
  /** Extra class name on the root. */
  className?: string
}

const LEVELS = [0, 1, 2, 3, 4] as const

export function ThemeHeatMatrix({ dates, rows, labels, selected = null, onSelect, className }: ThemeHeatMatrixProps) {
  const max = heatMax(rows)
  const root = useRef<HTMLDivElement>(null)
  // 键盘所在的格子：没有就落在选中格，再没有就第一行最新一天。
  const [cursor, setCursor] = useState<ThemeHeatPos | null>(null)
  const cols = dates.length
  const at = cursor ?? selected ?? { row: 0, col: Math.max(0, cols - 1) }

  if (rows.length === 0 || cols === 0) {
    return (
      <div className={cn('k-theme-heat', className)} data-slot="theme-heat-matrix">
        <p className="k-theme-heat-empty" role="status">
          {labels.empty}
        </p>
      </div>
    )
  }

  const focusCell = (pos: ThemeHeatPos) =>
    root.current?.querySelector<HTMLElement>(`[data-row-index="${pos.row}"][data-col-index="${pos.col}"]`)?.focus()

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === 'Enter' || event.key === ' ') {
      const row = rows[at.row]
      if (row) {
        event.preventDefault()
        onSelect?.(row, at.col)
      }
      return
    }
    const next = heatKey(at, event.key, rows.length, cols)
    if (!next) return
    event.preventDefault()
    setCursor(next)
    focusCell(next)
  }

  return (
    <div ref={root} className={cn('k-theme-heat', className)} data-slot="theme-heat-matrix">
      <div
        className="k-theme-heat-grid"
        role="grid"
        aria-label={labels.grid}
        aria-rowcount={rows.length + 1}
        aria-colcount={cols + 1}
        style={{ '--heat-cols': `minmax(88px, 1.4fr) repeat(${cols}, minmax(40px, 1fr))` } as CSSProperties}
        onKeyDown={onKeyDown}
      >
        <div role="row" className="k-theme-heat-row is-head">
          <span role="columnheader" className="k-theme-heat-name">
            {labels.theme}
          </span>
          {dates.map((date, col) => (
            <span
              key={date}
              role="columnheader"
              className="k-theme-heat-date"
              data-latest={col === cols - 1 || undefined}
            >
              {date}
            </span>
          ))}
        </div>
        {rows.map((row, r) => (
          <div key={row.id} role="row" className="k-theme-heat-row" data-theme={row.id}>
            <span role="rowheader" className="k-theme-heat-name">
              {row.name}
            </span>
            {dates.map((date, c) => {
              const cell = row.cells[c] ?? null
              const count = cell ? cell.count : null
              const rank = cell?.rank ?? null
              const level = heatLevel(cell?.count, max)
              const isSelected = selected?.row === r && selected.col === c
              return (
                <span
                  key={date}
                  role="gridcell"
                  tabIndex={at.row === r && at.col === c ? 0 : -1}
                  aria-selected={isSelected}
                  aria-label={labels.cell(row, date, count, rank)}
                  className={cn('k-theme-heat-cell', isSelected && 'is-selected')}
                  data-slot="theme-heat-cell"
                  data-row-index={r}
                  data-col-index={c}
                  data-seq={level ?? undefined}
                  data-empty={count === null || undefined}
                  onClick={() => {
                    setCursor({ row: r, col: c })
                    onSelect?.(row, c)
                  }}
                >
                  <span className="k-theme-heat-count" aria-hidden="true">
                    {count === null ? '' : count}
                  </span>
                  {rank !== null && (
                    <span className="k-theme-heat-rank" aria-hidden="true">
                      {labels.rank(rank)}
                    </span>
                  )}
                </span>
              )
            })}
          </div>
        ))}
      </div>
      <div className="k-theme-heat-legend" aria-hidden="true">
        <span>{labels.legend.low}</span>
        {LEVELS.map((level) => (
          <i key={level} data-seq={level} />
        ))}
        <span>{labels.legend.high}</span>
      </div>
    </div>
  )
}

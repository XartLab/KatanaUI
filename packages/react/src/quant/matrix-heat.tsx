// SPDX-License-Identifier: MIT
/**
 * MatrixHeat: a rows-by-columns grid whose cells are shaded by value, with the number written in the cell, a hover window with the value and the reason,
 * rows and columns sortable from their headers, and empty cells written as a dash and left unshaded.
 * 矩阵热力（#260，KATANAview#2164 的「矩阵热力」原型件：连板区间对比、题材连榜；板位 × 交易日、题材 × 交易日）：行 × 列的格子按值着色、格内写数、
 * 悬停出值与原因；点列头把行按这一列排，点行头把列按这一行排（降 → 升 → 取消）；空格写「—」不着色。
 * 比 ThemeHeatMatrix（题材 × 日期、固定写涨停只数与名次）一般：值、文字、原因都由调用方给，色阶可选顺序（计数）或发散（涨跌、净额）。
 * 颜色：顺序色阶是中性前景色的五档浓度（同 ThemeHeatMatrix，不用品牌橙），发散色阶读 --pnl-up / --pnl-down（根上 data-updown 互换，应用侧决定红涨还是绿涨）；
 * 档位不只靠颜色：格内写着数，悬停窗写值与原因。键盘照 APG Grid：方向键走格、Home / End 到行首行尾、Enter / Space 选中，Tab 只停一个格子。
 * 包里不带文字（labels 的默认是英文）、不带数据。
 */
import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { LcdTooltip, type LcdTooltipRow } from '../lib/chart/chart-kit/lcd-tooltip.tsx'
import { cn } from '../lib/cn.ts'
import {
  cellValue,
  matrixExtent,
  matrixShade,
  nextMatrixSort,
  sequentialDomain,
  sortColumnsByRow,
  sortRowsByColumn,
  type MatrixHeatColumn,
  type MatrixHeatRow,
  type MatrixHeatScale,
  type MatrixHeatSort,
} from './matrix-heat-model.ts'
import { heatKey, type ThemeHeatPos } from './theme-heat-model.ts'

export type {
  MatrixHeatCell,
  MatrixHeatColumn,
  MatrixHeatRow,
  MatrixHeatScale,
  MatrixHeatSort,
} from './matrix-heat-model.ts'

/** Texts of MatrixHeat (the package ships no text; the defaults are English). */
export type MatrixHeatLabels = {
  /** Accessible name of the grid. */
  grid: string
  /** Text written in an empty cell. */
  empty: string
  /** Header of the row-name column (the corner). */
  corner: string
  /** Names of the lines in the hover window. */
  value: string
  reason: string
  /** Accessible name of a column header button ("Sort rows by 11-26"). */
  sortRows: (column: string) => string
  /** Accessible name of a row header button ("Sort columns by Board 3"). */
  sortColumns: (row: string) => string
  /** Accessible text of one cell. */
  cell: (row: string, column: string, text: string, reason: string | undefined) => string
  /** Ends of the legend. */
  legend: { low: string; high: string }
  /** Shown instead of the grid when there is no row or no column. */
  none: string
}

export const defaultMatrixLabels: MatrixHeatLabels = {
  grid: 'Heat matrix',
  empty: '—',
  corner: '',
  value: 'Value',
  reason: 'Reason',
  sortRows: (column) => `Sort rows by ${column}`,
  sortColumns: (row) => `Sort columns by ${row}`,
  cell: (row, column, text, reason) => `${row}, ${column}: ${text}${reason ? `, ${reason}` : ''}`,
  legend: { low: 'Low', high: 'High' },
  none: 'No data',
}

export type MatrixHeatProps = {
  /** Column headers (the second dimension, e.g. trading days), in display order. */
  columns: readonly MatrixHeatColumn[]
  /** Rows (e.g. board levels, themes); each has one cell per column. */
  rows: readonly MatrixHeatRow[]
  /** sequential (default): a neutral ramp from low to high. diverging: up and down tones around 0. */
  scale?: MatrixHeatScale
  /**
   * Value range of the shading. Sequential: [lower, upper], default [0, largest value]; diverging: reaches max(|lower|, |upper|) either way, default the data range.
   * 着色的值域；顺序色阶默认 [0, 最大值]，发散色阶按两端绝对值较大的一边对称取，默认取数据范围。
   */
  domain?: readonly [number, number]
  /** How a value is written in the cell (default String); cell.text wins. */
  formatValue?: (value: number) => string
  /** Current sort (controlled); null for the given order. */
  sort?: MatrixHeatSort | null
  /** Initial sort when uncontrolled. */
  defaultSort?: MatrixHeatSort | null
  /** Called when a header is clicked: gets the next sort (null cancels). Without sort and this, headers still sort on their own. */
  onSortChange?: (next: MatrixHeatSort | null) => void
  /** Turn the header sorting off (headers become plain text). Default true. */
  sortable?: boolean
  /** Selected cell (controlled); null for none. */
  selected?: ThemeHeatPos | null
  /** A cell was picked with a click, Enter or Space: the row id, the column id and the cell's value (null if empty). */
  onSelect?: (rowId: string, columnId: string, value: number | null) => void
  /** Texts; English defaults. */
  labels?: Partial<MatrixHeatLabels>
  /** Extra class name on the root. */
  className?: string
}

const LEVELS = [0, 1, 2, 3, 4] as const

export function MatrixHeat({
  columns,
  rows,
  scale = 'sequential',
  domain: domainProp,
  formatValue = String,
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  sortable = true,
  selected = null,
  onSelect,
  labels: labelsProp,
  className,
}: MatrixHeatProps) {
  const labels = { ...defaultMatrixLabels, ...labelsProp }
  const root = useRef<HTMLDivElement>(null)
  const [ownSort, setOwnSort] = useState<MatrixHeatSort | null>(defaultSort)
  const sort = sortProp !== undefined ? sortProp : ownSort
  const [cursor, setCursor] = useState<ThemeHeatPos | null>(null)
  const [tip, setTip] = useState<{ row: number; col: number; left: number; top: number; flip: boolean } | null>(null)

  const columnIndex = new Map(columns.map((column, index) => [column.id, index]))
  // 排序：按列头排行；按行头排列（列的次序是原列序号的排列）。
  const rowSort = sort?.axis === 'rows' ? columnIndex.get(sort.key) : undefined
  const shownRows = sort && rowSort !== undefined ? sortRowsByColumn(rows, rowSort, sort.desc) : rows
  const sortedBy = sort?.axis === 'cols' ? rows.find((row) => row.id === sort.key) : undefined
  const colOrder =
    sort && sortedBy ? sortColumnsByRow(sortedBy, columns.length, sort.desc) : columns.map((_, index) => index)
  const domain =
    domainProp ?? (scale === 'sequential' ? sequentialDomain(rows) : (matrixExtent(rows) as [number, number] | null))

  if (rows.length === 0 || columns.length === 0) {
    return (
      <div className={cn('k-mh', className)} data-slot="matrix-heat" data-empty="true">
        <p className="k-mh-empty" role="status">
          {labels.none}
        </p>
      </div>
    )
  }

  const change = (next: MatrixHeatSort | null) => {
    if (sortProp === undefined) setOwnSort(next)
    onSortChange?.(next)
  }
  const at = cursor ?? selected ?? { row: 0, col: 0 }
  const focusCell = (pos: ThemeHeatPos) =>
    root.current?.querySelector<HTMLElement>(`[data-row-index="${pos.row}"][data-col-index="${pos.col}"]`)?.focus()
  const pick = (pos: ThemeHeatPos) => {
    const row = shownRows[pos.row]
    const column = columns[colOrder[pos.col]!]
    if (row && column) onSelect?.(row.id, column.id, cellValue(row.cells[colOrder[pos.col]!]))
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    if (event.target instanceof HTMLElement && event.target.closest('button')) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      pick(at)
      return
    }
    const next = heatKey(at, event.key, shownRows.length, columns.length)
    if (!next) return
    event.preventDefault()
    setCursor(next)
    focusCell(next)
  }
  const showTip = (element: HTMLElement, row: number, col: number) => {
    const box = root.current?.getBoundingClientRect()
    if (!box) return
    const cell = element.getBoundingClientRect()
    const center = cell.left - box.left + cell.width / 2
    setTip({ row, col, left: center, top: cell.top - box.top, flip: center > box.width / 2 })
  }
  const ariaSort = (active: MatrixHeatSort | null) => (active ? (active.desc ? 'descending' : 'ascending') : undefined)
  const tipCell = tip ? shownRows[tip.row]?.cells[colOrder[tip.col]!] : undefined
  const tipRow = tip ? shownRows[tip.row] : undefined
  const tipColumn = tip ? columns[colOrder[tip.col]!] : undefined
  const tipRows: LcdTooltipRow[] = []
  if (tipCell) {
    const value = cellValue(tipCell)
    if (value !== null) tipRows.push({ key: 'value', label: labels.value, value: tipCell.text ?? formatValue(value) })
    if (tipCell.reason) tipRows.push({ key: 'reason', label: labels.reason, value: tipCell.reason })
  }

  return (
    <div ref={root} className={cn('k-mh', className)} data-slot="matrix-heat" data-scale={scale}>
      <div
        className="k-mh-grid"
        role="grid"
        aria-label={labels.grid}
        aria-rowcount={shownRows.length + 1}
        aria-colcount={columns.length + 1}
        style={{ '--k-mh-cols': `minmax(72px, 1.3fr) repeat(${columns.length}, minmax(44px, 1fr))` } as CSSProperties}
        onKeyDown={onKeyDown}
        onMouseLeave={() => setTip(null)}
      >
        <div role="row" className="k-mh-row is-head">
          <span role="columnheader" className="k-mh-name">
            {labels.corner}
          </span>
          {colOrder.map((original) => {
            const column = columns[original]!
            const active = sort?.axis === 'rows' && sort.key === column.id ? sort : null
            return (
              <span
                key={column.id}
                role="columnheader"
                className="k-mh-colhead"
                data-slot="matrix-colhead"
                data-col={column.id}
                aria-sort={ariaSort(active)}
              >
                {sortable ? (
                  <button
                    type="button"
                    className="k-mh-sort"
                    aria-label={labels.sortRows(column.label)}
                    onClick={() => change(nextMatrixSort(sort, 'rows', column.id))}
                  >
                    {column.label}
                    <i
                      className="k-mh-arrow"
                      data-dir={active ? (active.desc ? 'desc' : 'asc') : undefined}
                      aria-hidden="true"
                    />
                  </button>
                ) : (
                  column.label
                )}
              </span>
            )
          })}
        </div>
        {shownRows.map((row, r) => {
          const active = sort?.axis === 'cols' && sort.key === row.id ? sort : null
          return (
            <div key={row.id} role="row" className="k-mh-row" data-slot="matrix-row" data-row={row.id}>
              <span role="rowheader" className="k-mh-name" aria-sort={ariaSort(active)}>
                {sortable ? (
                  <button
                    type="button"
                    className="k-mh-sort k-mh-rowsort"
                    aria-label={labels.sortColumns(row.label)}
                    onClick={() => change(nextMatrixSort(sort, 'cols', row.id))}
                  >
                    <span className="k-mh-rowlabel">{row.label}</span>
                    <i
                      className="k-mh-arrow"
                      data-dir={active ? (active.desc ? 'desc' : 'asc') : undefined}
                      aria-hidden="true"
                    />
                  </button>
                ) : (
                  row.label
                )}
              </span>
              {colOrder.map((original, c) => {
                const cell = row.cells[original] ?? null
                const value = cellValue(cell)
                const shade = matrixShade(value, scale, domain)
                const text = value === null ? labels.empty : (cell?.text ?? formatValue(value))
                const isSelected = selected?.row === r && selected.col === c
                const column = columns[original]!
                return (
                  <span
                    key={column.id}
                    role="gridcell"
                    tabIndex={at.row === r && at.col === c ? 0 : -1}
                    aria-selected={isSelected}
                    aria-label={labels.cell(row.label, column.label, text, cell?.reason)}
                    className={cn('k-mh-cell', isSelected && 'is-selected')}
                    data-slot="matrix-cell"
                    data-row-index={r}
                    data-col-index={c}
                    data-seq={shade?.level}
                    data-tone={shade && shade.tone !== 'seq' ? shade.tone : undefined}
                    data-empty={value === null || undefined}
                    onClick={() => {
                      setCursor({ row: r, col: c })
                      pick({ row: r, col: c })
                    }}
                    onMouseEnter={(event) => showTip(event.currentTarget, r, c)}
                    onFocus={(event) => showTip(event.currentTarget, r, c)}
                    onBlur={() => setTip(null)}
                  >
                    <span aria-hidden="true">{text}</span>
                  </span>
                )
              })}
            </div>
          )
        })}
      </div>
      {tip && tipRows.length > 0 && tipRow && tipColumn && (
        <LcdTooltip
          className="k-mh-tip"
          style={{ left: tip.left, top: tip.top, translate: '0 calc(-100% - 6px)' }}
          side={tip.flip ? 'left' : 'right'}
          title={`${tipRow.label} · ${tipColumn.label}`}
          rows={tipRows}
        />
      )}
      <div className="k-mh-legend" aria-hidden="true">
        <span>{labels.legend.low}</span>
        {(scale === 'diverging' ? [...LEVELS].reverse() : LEVELS).map((level) => (
          <i key={level} data-seq={level} data-tone={scale === 'diverging' ? 'down' : undefined} />
        ))}
        {scale === 'diverging' && <i data-empty="true" />}
        {scale === 'diverging' && LEVELS.map((level) => <i key={`up${level}`} data-seq={level} data-tone="up" />)}
        <span>{labels.legend.high}</span>
      </div>
    </div>
  )
}

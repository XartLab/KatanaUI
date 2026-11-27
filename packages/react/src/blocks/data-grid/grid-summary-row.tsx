// SPDX-License-Identifier: MIT
/**
 * Summary rows at the foot of DataGrid (totals, averages): per-column aggregates over all rows, laid out on the grid's own column template.
 * 表尾合计 / 均值行（#77 第 5 条，#22「分组汇总行」）：按列配聚合函数，对全部行（不只看得见的那几十行）算；跟表用同一份列模板与固定列，横向滚动时粘在底边。
 * 照 TradingView 自选「高级视图」的汇总：最小、最大、均值、中位数（自选页，2026-11-15 读；它按分组汇总：这里是整表的，按分节汇总是 DataGrid 的 sectionAggregates，写在分节标题行里，#87）。表尾只算数据行，不算分节标题行。
 * 格子的字照列类型写（价格按精度、数量按单位、盈亏带符号与涨跌色），所以合计行跟上面的行对得齐；count 一律是整数。
 */
import type { CSSProperties } from 'react'
import { cn } from '../../lib/cn.ts'
import { ToneText } from '../../quotes/tone-text.tsx'
import { resolveCell, type CellEnv, type ColumnType, type GridColumn, type ResolvedCell } from './columns.ts'

/** 聚合：内置五种加计数；也可以给函数（拿到这一列的有效数值与全部行，返回数或 null）。 */
export type SummaryAggregate<Row> =
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'median'
  | 'count'
  | ((values: readonly number[], rows: readonly Row[]) => number | null)

/** 一列怎么汇总：聚合函数，可选自己写字（盖掉列类型的写法）。 */
export type SummaryColumn<Row> =
  | SummaryAggregate<Row>
  | { aggregate: SummaryAggregate<Row>; text?: (value: number) => string }

/** 一行汇总：id、行首的字（「合计」「均值」，调用方按界面语言给）、各列的聚合（没写的列空着）。 */
export type GridSummary<Row> = {
  /** Stable id of this summary row. */
  id: string
  /** Row name (Total, Average), in the UI language. 行名，调用方按界面语言给。 */
  label: string
  /** Aggregate per column id; columns left out stay empty. */
  columns: Readonly<Partial<Record<string, SummaryColumn<Row>>>>
}

/** 一组数的聚合；没有数时 count 是 0，别的是 null。 */
export function aggregateValues<Row>(
  aggregate: SummaryAggregate<Row>,
  values: readonly number[],
  rows: readonly Row[] = [],
): number | null {
  if (typeof aggregate === 'function') return aggregate(values, rows)
  if (aggregate === 'count') return values.length
  if (values.length === 0) return null
  switch (aggregate) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0)
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length
    case 'min':
      return Math.min(...values)
    case 'max':
      return Math.max(...values)
    case 'median': {
      const sorted = values.toSorted((a, b) => a - b)
      const mid = sorted.length >> 1
      return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
    }
  }
}

/** 一格的数值：列的排序值（数字或十进制字符串）转成数；不是数的跳过。 */
const numberOf = <Row,>(column: GridColumn<Row>, row: Row, env: CellEnv): number | null => {
  const sort = resolveCell(column, row, env).sort
  const value = typeof sort === 'number' ? sort : typeof sort === 'string' && sort.trim() !== '' ? Number(sort) : NaN
  return Number.isFinite(value) ? value : null
}

/** 汇总值用哪种类型写字：数值类照原类型；别的类型（文字、品种……）与计数按 number 写。 */
const NUMERIC: ReadonlySet<ColumnType> = new Set(['number', 'price', 'quantity', 'pnl', 'change', 'cnAmount'])

/** 一行汇总里各列的格子（纯函数，单测直接调）：没配聚合的列是 null。 */
export function summaryCells<Row>(
  columns: readonly GridColumn<Row>[],
  rows: readonly Row[],
  summary: GridSummary<Row>,
  env: CellEnv = {},
): Map<string, { value: number | null; cell: ResolvedCell }> {
  const out = new Map<string, { value: number | null; cell: ResolvedCell }>()
  for (const column of columns) {
    const config = summary.columns[column.id]
    if (config === undefined) continue
    const { aggregate, text } = typeof config === 'object' ? config : { aggregate: config, text: undefined }
    const values = rows.flatMap((row) => {
      const value = numberOf(column, row, env)
      return value === null ? [] : [value]
    })
    const value = aggregateValues(aggregate, values, rows)
    const counting = aggregate === 'count'
    const type: ColumnType = !counting && column.type !== undefined && NUMERIC.has(column.type) ? column.type : 'number'
    // 精度随行变的列（format 是函数）取第一行的；计数一律整数。
    const format = counting
      ? { digits: 0 }
      : typeof column.format === 'function'
        ? rows[0] === undefined
          ? {}
          : column.format(rows[0])
        : column.format
    const cell = resolveCell<null>({ id: column.id, type, value: () => value, format }, null, env)
    out.set(column.id, { value, cell: text && value !== null ? { ...cell, text: text(value) } : cell })
  }
  return out
}

export type GridSummaryRowProps<Row> = {
  /** The summary row to draw. */
  summary: GridSummary<Row>
  /** The grid's visible columns, in display order. */
  columns: readonly GridColumn<Row>[]
  /** All rows (not only the rendered ones). */
  rows: readonly Row[]
  /** Cell environment (time zone). */
  env: CellEnv
  /** The grid's column template (same as the body rows). */
  template: string
  /** Row height in pixels. */
  height: number
  /** gridcell in an interactive grid, cell otherwise. */
  cellRole: string
  /** aria-rowindex of this row. */
  ariaRowIndex: number
  /** Alignment of a column. */
  alignOf: (columnId: string) => 'start' | 'end'
  /** Class names of a pinned column cell. */
  stickClass: (columnId: string) => string
  /** Inline style (left offset) of a pinned column cell. */
  stickStyle: (columnId: string) => CSSProperties | undefined
  /** Extra class name on the row. */
  className?: string
}

/** 一行汇总：第一个没配聚合的列写 label（都配了就挂在行的读屏名上）；格子跟表体同一份模板与固定列。 */
export function GridSummaryRow<Row>({
  summary,
  columns,
  rows,
  env,
  template,
  height,
  cellRole,
  ariaRowIndex,
  alignOf,
  stickClass,
  stickStyle,
  className,
}: GridSummaryRowProps<Row>) {
  const cells = summaryCells(columns, rows, summary, env)
  const labelAt = columns.find((column) => !cells.has(column.id))?.id
  return (
    <div
      role="row"
      aria-rowindex={ariaRowIndex}
      aria-label={labelAt === undefined ? summary.label : undefined}
      data-summary={summary.id}
      className={cn('k-grid-summary-row', className)}
      style={{ gridTemplateColumns: template, height, lineHeight: `${height}px` }}
    >
      {columns.map((column) => {
        const entry = cells.get(column.id)
        const isLabel = column.id === labelAt
        return (
          <div
            key={column.id}
            role={isLabel ? 'rowheader' : cellRole}
            data-col={column.id}
            className={cn(
              'k-grid-cell',
              !isLabel && alignOf(column.id) === 'end' && 'is-end',
              isLabel && 'k-grid-summary-label',
              stickClass(column.id),
            )}
            style={stickStyle(column.id)}
          >
            {isLabel ? (
              summary.label
            ) : entry === undefined ? null : entry.cell.direction !== undefined ? (
              <ToneText tone={entry.cell.direction}>{entry.cell.text}</ToneText>
            ) : (
              entry.cell.text
            )}
          </div>
        )
      })}
    </div>
  )
}

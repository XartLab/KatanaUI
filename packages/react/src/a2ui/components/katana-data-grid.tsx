// SPDX-License-Identifier: MIT
// KatanaDataGrid：数据表。列由智能体按 schema 给（类型决定格式、对齐与涨跌色），行是数据模型里的一列对象；
// 不暴露 cell / render 函数。点行与行快捷动作只发 Action，并带行 id；真正的操作由宿主决定。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import {
  DataGrid,
  DataGridHostProvider,
  type ColumnType,
  type GridColumn,
  type GridColumnLayout,
} from '../../blocks/index.ts'
import type { RowAction } from '../../index.ts'
import { text, withExtension } from '../blocks-support.ts'
import { Cell, actionSchema, fill, isoToMs, weightSchema } from '../support.tsx'

/** 行数上限：再多的行由智能体分页，别一次塞进数据模型。 */
const MAX_ROWS = 2000

const COLUMN_TYPES = ['text', 'number', 'price', 'quantity', 'pnl', 'change', 'side', 'time', 'symbol'] as const

const columnSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the column. Row objects carry the value under this key.'),
    title: text('The header text of the column.'),
    type: z
      .enum(COLUMN_TYPES)
      .describe(
        "How the raw value is read and written: 'text' string; 'number' number or decimal string; 'price' number (fixed digits via precision); 'quantity' number; 'pnl' signed number, colored by direction; 'change' percent already (1.5 is +1.50%), colored; 'side' 'buy' or 'sell'; 'time' ISO 8601 string or epoch milliseconds; 'symbol' a code string or {code, venue, name}.",
      ),
    align: z
      .enum(['start', 'end'])
      .describe('Text alignment. Numeric types default to end, the rest to start.')
      .optional(),
    width: z.number().min(24).max(800).describe('Column width in px. Defaults to 100.').optional(),
    sub: z.string().describe('A small second header line, for example a basis such as "TTM".').optional(),
    digits: z.number().int().min(0).max(8).describe("Decimal places for 'number', 'pnl' and 'change'.").optional(),
    precision: z.number().int().min(0).max(12).describe("Decimal places for 'price'.").optional(),
    suffix: z.string().describe("Unit written after a 'pnl' value, for example USDT.").optional(),
    timeStyle: z.enum(['datetime', 'time', 'date']).describe("How much of a 'time' value is written.").optional(),
    sideLabels: z
      .object({ buy: text('Text for a buy.'), sell: text('Text for a sell.') })
      .strict()
      .describe("The two words of a 'side' column. Required for a 'side' column.")
      .optional(),
  })
  .strict()

const rowSchema = z
  .object({ id: z.string().min(1).describe('Stable id of the row. The host gets it back with every action.') })
  .catchall(z.unknown())

type Column = z.infer<typeof columnSchema>
type Row = z.infer<typeof rowSchema>

export const KatanaDataGridApi = {
  name: 'KatanaDataGrid',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('Accessible name of the table, read by screen readers.'),
      columns: z.array(columnSchema).min(1).max(40).describe('The columns, left to right.'),
      rows: z
        .union([z.array(rowSchema).max(MAX_ROWS), CommonSchemas.DataBinding])
        .describe(
          `The rows: an array of objects, each with an "id" and one value per column id. Either literal or {"@path": "/rows"} bound to a data-model array, so updateDataModel can refresh it. At most ${MAX_ROWS} rows are shown.`,
        ),
      density: z.enum(['compact', 'default', 'relaxed']).default('default').describe('Row height.').optional(),
      maxHeight: z
        .number()
        .min(80)
        .max(1600)
        .describe('Largest height in px; the table grows with its rows up to this and then scrolls. Defaults to 360.')
        .optional(),
      selectable: z
        .boolean()
        .default(false)
        .describe('When true rows can be clicked, selected and moved with the keyboard. Requires selectLabels.')
        .optional(),
      selectLabels: z
        .object({
          rowActions: text('Accessible name of the row quick-action bar.'),
          selectedRows: text(
            'Announcement when several rows are selected; {count} is the number, e.g. "{count} rows selected".',
          ),
        })
        .strict()
        .describe('Texts for a selectable table. Required when selectable is true.')
        .optional(),
      rowActions: z
        .array(
          z
            .object({
              key: z.string().min(1).describe('Stable key of the action. The host gets it back.'),
              label: text('The action name, shown on hover and in the context menu.'),
              action: actionSchema(
                'Dispatched when the user picks this action on a row. metadata.extensions.katanaRow carries {rowId, key}.',
              ),
            })
            .strict(),
        )
        .max(6)
        .describe('Quick actions for a row, shown on hover and in the context menu. Only for a selectable table.')
        .optional(),
      onRowClick: actionSchema(
        'Dispatched when the user clicks a row of a selectable table. metadata.extensions.katanaRow carries {rowId}.',
      ).optional(),
      weight: weightSchema,
    })
    .strict()
    .superRefine((value, ctx) => {
      if (value.selectable && !value.selectLabels) {
        ctx.addIssue({
          code: 'custom',
          path: ['selectLabels'],
          message: 'selectLabels is required when selectable is true.',
        })
      }
      value.columns.forEach((column, index) => {
        if (column.type === 'side' && !column.sideLabels) {
          ctx.addIssue({
            code: 'custom',
            path: ['columns', index, 'sideLabels'],
            message: 'A side column needs sideLabels.',
          })
        }
      })
    }),
} satisfies ComponentApi

const columnsOf = (columns: readonly Column[]): GridColumn<Row>[] =>
  columns.map((column) => ({
    id: column.id,
    type: column.type as ColumnType,
    value: (row) => {
      const raw = row[column.id]
      if (column.type !== 'time') return raw
      if (typeof raw === 'number') return raw
      return typeof raw === 'string' ? isoToMs(raw) : undefined
    },
    format: {
      ...(column.digits === undefined ? {} : { digits: column.digits }),
      ...(column.precision === undefined ? {} : { precision: column.precision }),
      ...(column.suffix === undefined ? {} : { suffix: column.suffix }),
      ...(column.timeStyle === undefined ? {} : { timeStyle: column.timeStyle }),
      ...(column.sideLabels === undefined ? {} : { labels: column.sideLabels }),
    },
  }))

const layoutOf = (columns: readonly Column[]): GridColumnLayout[] =>
  columns.map((column) => ({
    id: column.id,
    label: column.title,
    width: column.width ?? 100,
    visible: true,
    ...(column.align === undefined ? {} : { align: column.align }),
    ...(column.sub === undefined ? {} : { sub: column.sub }),
  }))

/** 绑进来的行不可信：只收有字符串 id 的对象，id 重复的后者丢掉，超过上限的截掉。 */
function rowsOf(value: unknown): Row[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const rows: Row[] = []
  for (const item of value) {
    if (rows.length >= MAX_ROWS) break
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const id = (item as { id?: unknown }).id
    if (typeof id !== 'string' || id === '' || seen.has(id)) continue
    seen.add(id)
    rows.push(item as Row)
  }
  return rows
}

type RowActionProp = { key: string; label: string; action?: (extra?: unknown) => unknown }

export const KatanaDataGrid = createComponentImplementation(KatanaDataGridApi, ({ props }) => {
  const columns = useMemo(() => columnsOf(props.columns ?? []), [props.columns])
  const layout = useMemo(() => layoutOf(props.columns ?? []), [props.columns])
  const rows = useMemo(() => rowsOf(props.rows), [props.rows])
  const interactive = props.selectable === true && props.selectLabels !== undefined
  const labels = props.selectLabels
  const host = useMemo(
    () =>
      labels
        ? {
            labels: {
              rowActions: labels.rowActions,
              selectedRows: (selected: { size: number }) => fill(labels.selectedRows, { count: selected.size }),
            },
          }
        : undefined,
    [labels],
  )
  const actions = (props.rowActions ?? []) as RowActionProp[]
  const grid = (
    <DataGrid
      columns={columns}
      layout={layout}
      rows={rows}
      rowId={(row) => row.id}
      label={props.label ?? ''}
      density={props.density}
      interactive={interactive}
      fit
      maxHeight={props.maxHeight ?? 360}
      onOpen={
        interactive && props.onRowClick
          ? (row) => void props.onRowClick?.(withExtension('katanaRow', { rowId: row.id }))
          : undefined
      }
      rowActions={
        interactive && actions.length > 0
          ? (row): readonly RowAction[] =>
              actions.map((item) => ({
                key: item.key,
                label: item.label,
                onSelect: () => void item.action?.(withExtension('katanaRow', { rowId: row.id, key: item.key })),
              }))
          : undefined
      }
    />
  )
  return (
    <Cell weight={props.weight}>{host ? <DataGridHostProvider value={host}>{grid}</DataGridHostProvider> : grid}</Cell>
  )
})

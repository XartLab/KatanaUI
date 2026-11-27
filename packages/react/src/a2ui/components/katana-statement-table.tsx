// SPDX-License-Identifier: MIT
// KatanaStatementTable：财务报表表（科目成树、期间做列、原值 / 同比 / 环比）。科目、期间、值都可以 @path 绑定；值是 { 科目 id: { 期间 id: 数 } }，
// 更正过的格写 { value, revision, note }。全部文字由智能体写；折叠钮与更正提示的模板里 {item}、{revision}、{note} 会被换掉。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import { StatementTable, type StatementValue, type StatementValues } from '../../quant/index.ts'
import { formatSchema, makeFormat, text } from '../chart-support.ts'
import { Cell, fill, parseList, weightSchema } from '../support.tsx'

const MAX_ITEMS = 300
const MAX_PERIODS = 80

const itemSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the line item; the key in values.'),
    label: text('Name of the line item.'),
    parent: z.string().describe('Id of the parent line item; omit for a top-level item.').optional(),
    kind: z
      .enum(['line', 'subtotal', 'total'])
      .describe("'subtotal' is bold, 'total' is bold with a rule above.")
      .optional(),
  })
  .strict()

const periodSchema = z
  .object({ id: z.string().min(1).describe('Key of the period in values.'), label: text('Column head of the period.') })
  .strict()

const cellSchema = z.union([
  z.number(),
  z.null(),
  z
    .object({ value: z.number().nullable(), revision: z.number().int().min(1).optional(), note: z.string().optional() })
    .strict(),
])

function parseValues(value: unknown): StatementValues {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
  const out: Record<string, Record<string, StatementValue>> = {}
  for (const [item, row] of Object.entries(value)) {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) continue
    const cells: Record<string, StatementValue> = {}
    for (const [period, cell] of Object.entries(row)) {
      const parsed = cellSchema.safeParse(cell)
      if (parsed.success) cells[period] = parsed.data
    }
    out[item] = cells
  }
  return out
}

export const KatanaStatementTableApi = {
  name: 'KatanaStatementTable',
  schema: z
    .object({
      items: z
        .union([z.array(itemSchema).max(MAX_ITEMS), CommonSchemas.DataBinding])
        .describe(
          'The line items in display order, or {"@path": "/items"}. A missing parent makes the item top-level.',
        ),
      periods: z
        .union([z.array(periodSchema).max(MAX_PERIODS), CommonSchemas.DataBinding])
        .describe('The periods from oldest to newest, or {"@path": "/periods"}.'),
      values: z
        .union([z.record(z.string(), z.record(z.string(), cellSchema)), CommonSchemas.DataBinding])
        .describe(
          'values[itemId][periodId]: a number, null, or {value, revision, note}; revision above 1 marks a restated cell.',
        ),
      periodsPerYear: z
        .number()
        .int()
        .min(1)
        .max(12)
        .describe('Columns to look back for year-over-year: 4 for quarters, 1 for years.')
        .optional(),
      valueFormat: formatSchema('How a value is written.').optional(),
      mode: z.enum(['value', 'yoy', 'qoq']).describe('Which numbers to show first.').optional(),
      labels: z
        .object({
          table: text('Accessible name of the table.'),
          item: text('Head of the line-item column.'),
          modeGroup: text('Accessible name of the value / YoY / QoQ switch.'),
          value: text('Word for raw values.'),
          yoy: text('Word for year-over-year.'),
          qoq: text('Word for quarter-over-quarter.'),
          collapse: text('Name of the collapse button; {item} is the line item.'),
          expand: text('Name of the expand button; {item} is the line item.'),
          revised: text('Hint on a restated cell; {revision} and {note} are replaced.'),
          empty: text('Text when there are no line items.'),
        })
        .strict()
        .describe('All visible words; the table carries none of its own.'),
      source: z.string().describe('Source line under the table.').optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaStatementTable = createComponentImplementation(KatanaStatementTableApi, ({ props }) => {
  const items = useMemo(() => parseList(itemSchema, props.items).slice(0, MAX_ITEMS), [props.items])
  const periods = useMemo(() => parseList(periodSchema, props.periods).slice(0, MAX_PERIODS), [props.periods])
  const values = useMemo(() => parseValues(props.values), [props.values])
  const format = useMemo(() => makeFormat(props.valueFormat ?? { style: 'compact' }), [props.valueFormat])
  const { labels } = props
  if (!labels) return null
  return (
    <Cell weight={props.weight}>
      <StatementTable
        items={items}
        periods={periods}
        values={values}
        periodsPerYear={props.periodsPerYear ?? 4}
        formatValue={(value) => format(value)}
        mode={props.mode}
        labels={{
          ...labels,
          collapse: (item) => fill(labels.collapse, { item: item.label }),
          expand: (item) => fill(labels.expand, { item: item.label }),
          revised: (revision, note) => fill(labels.revised, { revision, note: note ?? '' }),
        }}
        source={props.source}
      />
    </Cell>
  )
})

// SPDX-License-Identifier: MIT
// KatanaCompsTable：同业对比表（本公司置顶、表尾中位数与均值、按 better 方向着相对中位数的底色、指标组页签）。行可以 @path 绑定。
// 指标的写法由 format 定；没写 better 的指标只写数不着色。全部文字由智能体写。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import { CompsTable, type CompsMetric } from '../../quant/index.ts'
import { formatSchema, makeFormat, text } from '../chart-support.ts'
import { Cell, parseList, weightSchema } from '../support.tsx'

const MAX_ROWS = 200
const MAX_METRICS = 40

const rowSchema = z
  .object({
    id: z.string().min(1),
    symbol: text('Ticker or code.'),
    name: z.string().describe('Company name.').optional(),
    subject: z.boolean().describe('True for the company being analysed: pinned on top, never sorted.').optional(),
    values: z.record(z.string(), z.number().nullable()).describe('Metric id → value; null or missing is written as —.'),
  })
  .strict()

const metricSchema = z
  .object({
    id: z.string().min(1),
    label: text('Column head.'),
    sub: z.string().describe('Small second line of the head, for example TTM.').optional(),
    group: z.string().describe('Id of the group tab this column belongs to.').optional(),
    better: z
      .enum(['higher', 'lower'])
      .describe('Which direction is better; omit to show numbers without color.')
      .optional(),
    format: formatSchema('How the metric is written.').optional(),
  })
  .strict()

export const KatanaCompsTableApi = {
  name: 'KatanaCompsTable',
  schema: z
    .object({
      rows: z
        .union([z.array(rowSchema).max(MAX_ROWS), CommonSchemas.DataBinding])
        .describe('One row per company, or {"@path": "/peers"}.'),
      metrics: z.array(metricSchema).max(MAX_METRICS).describe('The metric columns in display order.'),
      groups: z
        .array(z.object({ id: z.string().min(1), label: text('Tab label.') }).strict())
        .max(8)
        .describe('Group tabs above the table; the first one is selected at start.')
        .optional(),
      labels: z
        .object({
          table: text('Accessible name of the table.'),
          symbol: text('Head of the company column.'),
          groups: text('Accessible name of the group tabs.'),
          median: text('Name of the median row.'),
          mean: text('Name of the mean row.'),
          subject: text('Mark written on the subject company row.'),
          empty: text('Text when there are no rows.'),
        })
        .strict()
        .describe('All visible words; the table carries none of its own.'),
      source: z.string().describe('Source line under the table.').optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaCompsTable = createComponentImplementation(KatanaCompsTableApi, ({ props }) => {
  const rows = useMemo(() => parseList(rowSchema, props.rows).slice(0, MAX_ROWS), [props.rows])
  const metrics = useMemo<CompsMetric[]>(
    () =>
      (props.metrics ?? []).slice(0, MAX_METRICS).map((metric) => ({
        id: metric.id,
        label: metric.label,
        sub: metric.sub,
        group: metric.group,
        better: metric.better,
        format: makeFormat(metric.format),
      })),
    [props.metrics],
  )
  const { labels } = props
  if (!labels) return null
  return (
    <Cell weight={props.weight}>
      <CompsTable rows={rows} metrics={metrics} groups={props.groups} labels={labels} source={props.source} />
    </Cell>
  )
})

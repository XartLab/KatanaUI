// SPDX-License-Identifier: MIT
// KatanaKpiChart：KPI 图（标题、大号当前值与较上期变化，下面几条线并看，扫读出提示窗）。线可以给上限内的数组；
// 单位不同的线用 scale 'normalized'。全部文字由智能体写；没有数据时写 emptyText。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { useMemo } from 'react'
import { z } from 'zod'
import { KpiChart } from '../../quant/index.ts'
import { formatSchema, makeFormat, text } from '../chart-support.ts'
import { Cell, weightSchema } from '../support.tsx'

const MAX_SERIES = 8
const MAX_VALUES = 2000

const seriesSchema = z
  .object({
    key: z.string().min(1),
    label: text('Line name in the legend and tooltip.'),
    values: z.array(z.number().nullable()).max(MAX_VALUES).describe('One value per point; null breaks the line.'),
    format: formatSchema('How this line is written in the tooltip.').optional(),
  })
  .strict()

export const KatanaKpiChartApi = {
  name: 'KatanaKpiChart',
  schema: z
    .object({
      title: text('Title of the chart.'),
      label: text('Accessible name of the chart.'),
      value: z.string().describe('The headline value, already written.').optional(),
      delta: z
        .number()
        .nullable()
        .describe('Change against the previous period as a percentage (1.5 means +1.50%).')
        .optional(),
      labels: z.array(z.string()).max(MAX_VALUES).describe('What each point is called (its date), in order.'),
      series: z.array(seriesSchema).max(MAX_SERIES).describe('The lines.'),
      scale: z
        .enum(['shared', 'normalized'])
        .describe("'shared' uses one axis; 'normalized' scales each line to the same height.")
        .optional(),
      format: formatSchema('Default way values are written.').optional(),
      emptyText: text('Text when there is no data.'),
      footer: z.string().describe('One line under the chart (source).').optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaKpiChart = createComponentImplementation(KatanaKpiChartApi, ({ props }) => {
  const series = useMemo(
    () =>
      (props.series ?? []).slice(0, MAX_SERIES).map((line) => ({
        key: line.key,
        label: line.label,
        values: line.values
          .slice(0, MAX_VALUES)
          .map((value) => (value !== null && Number.isFinite(value) ? value : null)),
        format: line.format ? makeFormat(line.format) : undefined,
      })),
    [props.series],
  )
  const format = useMemo(() => makeFormat(props.format), [props.format])
  return (
    <Cell weight={props.weight}>
      <KpiChart
        title={props.title ?? ''}
        label={props.label ?? ''}
        value={props.value}
        delta={props.delta}
        labels={props.labels ?? []}
        series={series}
        scale={props.scale}
        format={format}
        emptyText={props.emptyText ?? ''}
        footer={props.footer}
      />
    </Cell>
  )
})

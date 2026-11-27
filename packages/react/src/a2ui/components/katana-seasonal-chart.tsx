// SPDX-License-Identifier: MIT
// KatanaSeasonalChart：季节性图（每年一条线，横轴是一年里的第几天，纵轴是年初以来的涨跌幅）。年份可以给上限内的数组；
// highlight 是突出的那一年。全部文字由智能体写。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { useMemo } from 'react'
import { z } from 'zod'
import { SeasonalChart } from '../../quant/index.ts'
import { text } from '../chart-support.ts'
import { Cell, parseList, weightSchema } from '../support.tsx'

const MAX_YEARS = 20
const MAX_POINTS = 400

const yearSchema = z
  .object({
    year: z.number().int(),
    points: z
      .array(
        z
          .object({
            day: z.number().int().min(0).max(366).describe('Day of the year from 0.'),
            pct: z.number().describe('Change since the start of the year in percent.'),
          })
          .strict(),
      )
      .max(MAX_POINTS),
  })
  .strict()

export const KatanaSeasonalChartApi = {
  name: 'KatanaSeasonalChart',
  schema: z
    .object({
      years: z.array(yearSchema).max(MAX_YEARS).describe('One entry per year.'),
      highlight: z.number().int().describe('The year drawn in front.').optional(),
      digits: z.number().int().min(0).max(4).describe('Decimal places of the percentages.').optional(),
      labels: z
        .object({
          chart: text('Accessible name of the chart.'),
          legend: text('Accessible name of the year legend.'),
          months: z.array(z.string()).length(12).describe('The twelve month names, January first.'),
          empty: text('Text when there are no years.'),
        })
        .strict()
        .describe('All visible words of the chart.'),
      source: z.string().describe('Source line under the chart.').optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaSeasonalChart = createComponentImplementation(KatanaSeasonalChartApi, ({ props }) => {
  const years = useMemo(() => parseList(yearSchema, props.years).slice(0, MAX_YEARS), [props.years])
  if (!props.labels) return null
  return (
    <Cell weight={props.weight}>
      <SeasonalChart
        years={years}
        highlight={props.highlight}
        digits={props.digits}
        labels={props.labels}
        source={props.source}
      />
    </Cell>
  )
})

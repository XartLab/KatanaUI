// SPDX-License-Identifier: MIT
// KatanaCalendarHeatmap：日历热力图（月历或整年的格子，按日收益、换手或事件着色）。日数据是对象数组（可 @path 绑定）；
// 点一天发 Action，日期由 metadata.extensions.katanaChartPoint 带给宿主。星期与月份的名字、周标的写法都由智能体传。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import { CalendarHeatmap, type CalendarDay } from '../../quant/index.ts'
import { dispatch, formatSchema, listSchema, makeFormat, parseCapped, text, viewShape } from '../chart-support.ts'
import { Cell, actionSchema, fill, weightSchema } from '../support.tsx'

const MAX_DAYS = 800
const DAY = /^\d{4}-\d{2}-\d{2}$/
const MONTH = /^\d{4}-\d{2}$/

const daySchema = z
  .object({
    date: z.string().regex(DAY).describe('The day, YYYY-MM-DD.'),
    value: z
      .number()
      .nullable()
      .describe('Profit and loss or turnover of the day. Null when there is no data (different from 0).'),
    open: z.boolean().describe('False for a day the market was closed. Defaults to open.').optional(),
    events: z
      .array(
        z
          .object({
            label: text('What happens that day.'),
            tone: z
              .enum(['normal', 'holding', 'high'])
              .describe('holding is related to a position, high is high impact.')
              .optional(),
            kind: z.string().describe('Category name, already written in the language of the user.').optional(),
          })
          .strict(),
      )
      .max(10)
      .optional(),
  })
  .strict()

type Day = z.infer<typeof daySchema>

export const KatanaCalendarHeatmapApi = {
  name: 'KatanaCalendarHeatmap',
  schema: z
    .object({
      days: listSchema(daySchema, MAX_DAYS, 'The days with data.'),
      mode: z
        .enum(['month', 'year'])
        .describe("'month' is a month calendar (default); 'year' is a grid of the whole year.")
        .optional(),
      month: z
        .string()
        .regex(MONTH)
        .describe('The month to show, YYYY-MM. Defaults to the month of the latest day.')
        .optional(),
      from: z.string().regex(DAY).describe('First day of the year view. Defaults to the earliest day.').optional(),
      to: z.string().regex(DAY).describe('Last day of the year view. Defaults to the latest day.').optional(),
      view: z.enum(['pnl', 'turnover', 'events']).describe('What the cells show. Defaults to pnl.').optional(),
      today: CommonSchemas.DynamicString.describe(
        'Today, YYYY-MM-DD: outlined; later days are not colored.',
      ).optional(),
      weekStart: z
        .union([z.literal(0), z.literal(1)])
        .describe('0 starts weeks on Sunday, 1 on Monday.')
        .optional(),
      weekdayLabels: z.array(z.string().min(1)).length(7).describe('Seven weekday names starting with Sunday.'),
      monthLabels: z.array(z.string().min(1)).length(12).describe('Twelve month names starting with January.'),
      weekLabel: text('Week mark with {week} where the week number goes, for example "W{week}".'),
      closedLabel: text('Text in the cell of a closed day.'),
      valueFormat: formatSchema('How the number in a cell is written.').optional(),
      describe: text('One sentence read out for a chosen day, with {date} and {value}, for example "{date}: {value}".'),
      describeEmpty: text('The same sentence for a day without data, with {date}.'),
      label: text('Accessible name of the whole chart as a sentence.'),
      legend: z
        .object({ down: text('Text at the losing end of the color scale.'), up: text('Text at the winning end.') })
        .strict()
        .describe('The color scale caption. Omit for no scale.')
        .optional(),
      total: z
        .object({
          text: z.string().describe('The total already written, for example for the month.'),
          value: z.number().describe('Sign decides the color.'),
        })
        .strict()
        .describe('A total shown at the top right of the chart, for example the month total.')
        .optional(),
      actionLabels: viewShape.actionLabels,
      tableHeads: z
        .object({ date: text('Head of the date column.'), value: text('Head of the value column.') })
        .strict()
        .describe('Column heads of the table view.'),
      onSelect: actionSchema(
        'Dispatched when the user chooses a day. metadata.extensions.katanaChartPoint carries {date}.',
      ).optional(),
      onExport: viewShape.onExport,
      onFullscreen: viewShape.onFullscreen,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaCalendarHeatmap = createComponentImplementation(KatanaCalendarHeatmapApi, ({ props }) => {
  const days = useMemo<CalendarDay[]>(
    () =>
      parseCapped<Day>(daySchema, props.days, MAX_DAYS).map((day) => ({
        date: day.date,
        value: day.value,
        ...(day.open === undefined ? {} : { open: day.open }),
        ...(day.events === undefined
          ? {}
          : {
              events: day.events.map((event) => ({
                label: event.label,
                ...(event.tone === undefined ? {} : { tone: event.tone }),
                ...(event.kind === undefined ? {} : { kind: event.kind }),
              })),
            }),
      })),
    [props.days],
  )
  const format = useMemo(() => makeFormat(props.valueFormat), [props.valueFormat])
  const label = props.label ?? ''
  const { weekdayLabels, monthLabels, actionLabels, tableHeads } = props
  if (!weekdayLabels || !monthLabels || !actionLabels || !tableHeads) return null
  return (
    <Cell weight={props.weight}>
      <CalendarHeatmap
        days={days}
        mode={props.mode}
        month={props.month}
        from={props.from}
        to={props.to}
        view={props.view}
        today={props.today}
        weekStart={props.weekStart}
        weekdayLabels={weekdayLabels}
        monthLabels={monthLabels}
        weekLabel={(week) => fill(props.weekLabel ?? '', { week })}
        closedLabel={props.closedLabel ?? ''}
        formatValue={format}
        describe={(date, value) =>
          value === null
            ? fill(props.describeEmpty ?? '', { date })
            : fill(props.describe ?? '', { date, value: format(value) })
        }
        label={label}
        legend={props.legend}
        total={props.total}
        actionLabels={actionLabels}
        tableHeads={tableHeads}
        onSelect={props.onSelect ? (date) => dispatch(props.onSelect, 'katanaChartPoint', { date }) : undefined}
        onExport={props.onExport ? () => dispatch(props.onExport, 'katanaChart', { label }) : undefined}
        onFullscreen={props.onFullscreen ? () => dispatch(props.onFullscreen, 'katanaChart', { label }) : undefined}
      />
    </Cell>
  )
})

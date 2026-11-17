// SPDX-License-Identifier: MIT
// KatanaDateRangePicker：日期区间（两个日期框加双月日历加预设）。起止是两个独立的值，各绑一个路径；「今天」由智能体传，件里不读时钟。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { DateRangePicker, Field, FieldLabel } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "A day as 'YYYY-MM-DD'.")

export const KatanaDateRangePickerApi = {
  name: 'KatanaDateRangePicker',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The field label shown above the picker.'),
      start: CommonSchemas.DynamicString.describe(
        'First day of the range as \'YYYY-MM-DD\', inclusive; empty string when nothing is chosen. Bind it, for example {"@path": "/range/start"}, so the choice is written back.',
      ),
      end: CommonSchemas.DynamicString.describe(
        'Last day of the range as \'YYYY-MM-DD\', inclusive; empty string when nothing is chosen. Bind it, for example {"@path": "/range/end"}, so the choice is written back.',
      ),
      today: CommonSchemas.DynamicString.describe(
        "Today as 'YYYY-MM-DD' in the time zone you want shown. The presets (today, this week, this month, year to date) count up to it; the component never reads the clock. May be bound to the data model.",
      ),
      weekStart: z.enum(['mon', 'sun']).default('mon').describe('Which day the week starts on.').optional(),
      min: day.describe('Earliest selectable day.').optional(),
      max: day.describe('Latest selectable day.').optional(),
      locale: z
        .enum(['en-CA', 'zh-CN'])
        .default('en-CA')
        .describe('Locale of the segments and the calendar. Both write year-month-day.')
        .optional(),
      labels: z
        .object({
          start: z.string().describe('Accessible name of the start date box.'),
          end: z.string().describe('Accessible name of the end date box.'),
          pickRange: z.string().describe('Accessible name of the calendar button.'),
          calendar: z.string().describe('Accessible name of the calendar popup.'),
          previousMonth: z.string().describe('Accessible name of the previous-month button.'),
          nextMonth: z.string().describe('Accessible name of the next-month button.'),
          presets: z.string().describe('Accessible name of the preset group.'),
          today: z.string().describe('Text of the preset for today.'),
          week: z.string().describe('Text of the preset for this week up to today.'),
          month: z.string().describe('Text of the preset for this month up to today.'),
          ytd: z.string().describe('Text of the preset for the year up to today.'),
          custom: z.string().describe('Text shown when the range matches no preset.'),
        })
        .strict()
        .describe(
          'All the texts, all required: the component carries no wording of its own. Write them in the language of the user.',
        ),
      checks: CommonSchemas.Checkable.shape.checks,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

const DAY = /^\d{4}-\d{2}-\d{2}$/

export const KatanaDateRangePicker = createComponentImplementation(KatanaDateRangePickerApi, ({ props }) => {
  const { labels } = props
  const start = props.start ?? ''
  const end = props.end ?? ''
  return (
    <Cell weight={props.weight}>
      <Field>
        <FieldLabel>{props.label}</FieldLabel>
        <DateRangePicker
          value={DAY.test(start) && DAY.test(end) ? { start, end } : null}
          onValue={(range) => {
            props.setStart?.(range.start)
            props.setEnd?.(range.end)
          }}
          today={props.today ?? ''}
          weekStart={props.weekStart}
          min={props.min}
          max={props.max}
          locale={props.locale ?? 'en-CA'}
          labels={{
            start: labels.start,
            end: labels.end,
            pickRange: labels.pickRange,
            calendar: labels.calendar,
            previousMonth: labels.previousMonth,
            nextMonth: labels.nextMonth,
            presets: labels.presets,
            preset: { today: labels.today, week: labels.week, month: labels.month, ytd: labels.ytd },
            custom: labels.custom,
          }}
        />
      </Field>
    </Cell>
  )
})

// SPDX-License-Identifier: MIT
// KatanaDateTimeInput：日期（可带时刻）输入。值是一个 ISO 8601 字符串，适配层负责跟 DateTimeInput 的「日期、时刻」两段互转。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { DateTimeInput, Field, FieldLabel } from '../../index.ts'
import { Cell, fill, joinIso, splitIso, weightSchema } from '../support.tsx'

export const KatanaDateTimeInputApi = {
  name: 'KatanaDateTimeInput',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The field label shown above the input.'),
      value: CommonSchemas.DynamicString.describe(
        "The chosen moment as ISO 8601: 'YYYY-MM-DD', or 'YYYY-MM-DDTHH:mm' when enableTime is true. Empty string when nothing is chosen. Bind it to the data model so the user choice is written back.",
      ),
      enableTime: z.boolean().default(false).describe('When true the user also picks a time of day.').optional(),
      min: z.string().describe("Earliest selectable day as 'YYYY-MM-DD'.").optional(),
      max: z.string().describe("Latest selectable day as 'YYYY-MM-DD'.").optional(),
      locale: z
        .enum(['en-CA', 'zh-CN'])
        .default('en-CA')
        .describe('Locale of the segments and the calendar. Both write year-month-day.')
        .optional(),
      labels: z
        .object({
          date: z.string().describe('Accessible name of the date segments. May contain {label}, the field label.'),
          pickDate: z.string().describe('Accessible name of the calendar button. May contain {label}.'),
          calendar: z.string().describe('Accessible name of the calendar popup. May contain {label}.'),
          time: z.string().describe('Accessible name of the time segments. May contain {label}.'),
          previousMonth: z.string().describe('Accessible name of the previous-month button.'),
          nextMonth: z.string().describe('Accessible name of the next-month button.'),
        })
        .strict()
        .describe(
          'The accessible names, all required: the component carries no wording of its own. Write them in the language of the user.',
        ),
      checks: CommonSchemas.Checkable.shape.checks,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaDateTimeInput = createComponentImplementation(KatanaDateTimeInputApi, ({ props }) => {
  const label = props.label ?? ''
  const withTime = props.enableTime === true
  const { date, time } = splitIso(props.value)
  const text = props.labels
  return (
    <Cell weight={props.weight}>
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <DateTimeInput
          label={label}
          date={date}
          onDate={(next) => props.setValue?.(joinIso(next, withTime ? time || '00:00' : undefined))}
          time={withTime ? time : undefined}
          onTime={withTime ? (next) => props.setValue?.(joinIso(date, next)) : undefined}
          min={props.min}
          max={props.max}
          locale={props.locale ?? 'en-CA'}
          labels={{
            date: (name) => fill(text.date, { label: name }),
            pickDate: (name) => fill(text.pickDate, { label: name }),
            calendar: (name) => fill(text.calendar, { label: name }),
            time: (name) => fill(text.time, { label: name }),
            previousMonth: text.previousMonth,
            nextMonth: text.nextMonth,
          }}
        />
      </Field>
    </Cell>
  )
})

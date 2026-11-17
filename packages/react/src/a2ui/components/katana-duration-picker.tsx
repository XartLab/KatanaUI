// SPDX-License-Identifier: MIT
// KatanaDurationPicker：时长（时、分）。时与分是两个独立的数，各绑一个路径；打字立刻写回数据模型，已夹进范围。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { DurationPicker, Field, FieldLabel } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaDurationPickerApi = {
  name: 'KatanaDurationPicker',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The field label shown above the picker.'),
      hours: CommonSchemas.DynamicNumber.describe(
        'Whole hours. Bind it, for example {"@path": "/ttl/hours"}, so the input is written back.',
      ),
      minutes: CommonSchemas.DynamicNumber.describe(
        'Whole minutes. Bind it, for example {"@path": "/ttl/minutes"}, so the input is written back.',
      ),
      maxHours: z
        .number()
        .int()
        .min(0)
        .default(24)
        .describe('Upper bound of hours; larger input is clamped.')
        .optional(),
      maxMinutes: z
        .number()
        .int()
        .min(0)
        .default(59)
        .describe('Upper bound of minutes; larger input is clamped.')
        .optional(),
      labels: z
        .object({
          hours: z.string().describe('The unit text after the hours number.'),
          minutes: z.string().describe('The unit text after the minutes number.'),
          edit: z.string().describe('Accessible name of the pen button that starts editing.'),
          save: z.string().describe('Accessible name of the check button that confirms.'),
          hoursInput: z.string().describe('Accessible name of the hours box.'),
          minutesInput: z.string().describe('Accessible name of the minutes box.'),
        })
        .strict()
        .describe(
          'All the texts, all required: the component carries no wording of its own. Write them in the language of the user.',
        ),
      disabled: CommonSchemas.DynamicBoolean.describe('When true the picker cannot be edited.').optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

const whole = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0

export const KatanaDurationPicker = createComponentImplementation(KatanaDurationPickerApi, ({ props }) => (
  <Cell weight={props.weight}>
    <Field>
      <FieldLabel>{props.label}</FieldLabel>
      <DurationPicker
        value={{ hours: whole(props.hours), minutes: whole(props.minutes) }}
        onValueChange={(next) => {
          props.setHours?.(next.hours)
          props.setMinutes?.(next.minutes)
        }}
        maxHours={props.maxHours}
        maxMinutes={props.maxMinutes}
        labels={props.labels}
        disabled={props.disabled === true}
      />
    </Field>
  </Cell>
))

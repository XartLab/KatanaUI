// SPDX-License-Identifier: MIT
// KatanaSelect：下拉单选。选项由智能体给（文字与值），选中的值双向绑定回数据模型。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import {
  Field,
  FieldError,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useFieldControl,
} from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaSelectApi = {
  name: 'KatanaSelect',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The field label shown above the select.'),
      options: z
        .array(
          z
            .object({
              label: z.string().describe('The text shown for this option.'),
              value: z
                .string()
                .min(1)
                .describe('The stable value written to the data model when this option is chosen.'),
            })
            .strict(),
        )
        .min(1)
        .describe('The choices, in display order.'),
      value: CommonSchemas.DynamicString.describe(
        'The value of the chosen option. Bind it to the data model with {"@path": "/form/x"} so the choice is written back.',
      ).optional(),
      placeholder: CommonSchemas.DynamicString.describe('Text shown while nothing is chosen.').optional(),
      disabled: CommonSchemas.DynamicBoolean.describe('When true the select cannot be changed.').optional(),
      checks: CommonSchemas.Checkable.shape.checks,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

function Trigger({ placeholder, disabled }: { placeholder?: string; disabled: boolean }) {
  const field = useFieldControl()
  return (
    <SelectTrigger {...field} disabled={disabled}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
  )
}

export const KatanaSelect = createComponentImplementation(KatanaSelectApi, ({ props }) => {
  const errors = props.validationErrors ?? []
  return (
    <Cell weight={props.weight}>
      <Field invalid={errors.length > 0}>
        <FieldLabel>{props.label}</FieldLabel>
        <Select value={props.value ?? ''} onValueChange={(value) => props.setValue?.(value)}>
          <Trigger placeholder={props.placeholder} disabled={props.disabled === true} />
          <SelectContent>
            {props.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.length > 0 ? <FieldError>{errors.join(' ')}</FieldError> : null}
      </Field>
    </Cell>
  )
})

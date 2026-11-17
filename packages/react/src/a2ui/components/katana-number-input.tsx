// SPDX-License-Identifier: MIT
// KatanaNumberInput：数字框（打字、方向键、左右拖都能改）。值是数，越界会被夹进范围，双向绑定回数据模型。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { Field, FieldError, FieldLabel, NumberInput } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaNumberInputApi = {
  name: 'KatanaNumberInput',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The field label shown above the box. Also its accessible name.'),
      value: CommonSchemas.DynamicNumber.describe(
        'The current number. Bind it to the data model with {"@path": "/form/x"} so the user input is written back.',
      ),
      min: z.number().describe('Lower bound; smaller input is clamped to it.').optional(),
      max: z.number().describe('Upper bound; larger input is clamped to it.').optional(),
      step: z.number().min(0.000001).default(1).describe('Size of one arrow-key step.').optional(),
      unit: CommonSchemas.DynamicString.describe(
        'A unit suffix inside the box, read together with the value.',
      ).optional(),
      autoValue: z
        .number()
        .describe(
          'A sentinel value (for example 0 or -1) that means automatic. While the value equals it, the box shows autoText.',
        )
        .optional(),
      autoText: CommonSchemas.DynamicString.describe('Text shown in place of the sentinel value autoValue.').optional(),
      size: z.enum(['default', 'sm']).default('default').describe('Box height: 30px or 26px.').optional(),
      disabled: CommonSchemas.DynamicBoolean.describe('When true the box cannot be changed.').optional(),
      checks: CommonSchemas.Checkable.shape.checks,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaNumberInput = createComponentImplementation(KatanaNumberInputApi, ({ props }) => {
  const errors = props.validationErrors ?? []
  const value = typeof props.value === 'number' && Number.isFinite(props.value) ? props.value : (props.min ?? 0)
  return (
    <Cell weight={props.weight}>
      <Field invalid={errors.length > 0}>
        <FieldLabel>{props.label}</FieldLabel>
        <NumberInput
          label={props.label}
          value={value}
          onValueChange={(next) => props.setValue?.(next)}
          min={props.min}
          max={props.max}
          step={props.step ?? 1}
          unit={props.unit}
          autoValue={props.autoValue}
          autoText={props.autoText}
          size={props.size === 'sm' ? 'sm' : undefined}
          invalid={errors.length > 0}
          disabled={props.disabled === true}
          width={160}
        />
        {errors.length > 0 ? <FieldError>{errors.join(' ')}</FieldError> : null}
      </Field>
    </Cell>
  )
})

// SPDX-License-Identifier: MIT
// KatanaTextField：Input 加 Field 的标签与错误。值是双向绑定的，用户输入写回数据模型。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { Field, FieldError, FieldLabel, Input, useFieldControl } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaTextFieldApi = {
  name: 'KatanaTextField',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The field label shown above the input.'),
      value: CommonSchemas.DynamicString.describe(
        'The text in the field. Bind it to the data model with {"@path": "/form/x"} so the user input is written back.',
      ).optional(),
      placeholder: CommonSchemas.DynamicString.describe('Hint text shown while the field is empty.').optional(),
      inputType: z
        .enum(['text', 'number', 'search'])
        .default('text')
        .describe(
          "Kind of keyboard and validation the browser offers. The value is always a string, even for 'number'.",
        )
        .optional(),
      disabled: CommonSchemas.DynamicBoolean.describe('When true the field cannot be edited.').optional(),
      checks: CommonSchemas.Checkable.shape.checks,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

type Control = { value: string; placeholder?: string; type: 'text' | 'number' | 'search'; disabled: boolean }

function TextControl({ control, onChange }: { control: Control; onChange: (value: string) => void }) {
  const field = useFieldControl()
  return (
    <Input
      {...field}
      type={control.type}
      value={control.value}
      placeholder={control.placeholder}
      disabled={control.disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export const KatanaTextField = createComponentImplementation(KatanaTextFieldApi, ({ props }) => {
  const errors = props.validationErrors ?? []
  return (
    <Cell weight={props.weight}>
      <Field invalid={errors.length > 0}>
        <FieldLabel>{props.label}</FieldLabel>
        <TextControl
          control={{
            value: props.value ?? '',
            placeholder: props.placeholder,
            type: props.inputType ?? 'text',
            disabled: props.disabled === true,
          }}
          onChange={(value) => props.setValue?.(value)}
        />
        {errors.length > 0 ? <FieldError>{errors.join(' ')}</FieldError> : null}
      </Field>
    </Cell>
  )
})

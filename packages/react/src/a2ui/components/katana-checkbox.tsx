// SPDX-License-Identifier: MIT
// KatanaCheckbox：勾选框。状态双向绑定回数据模型；文字全由智能体传。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { Checkbox, Field, FieldLabel, useFieldControl } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaCheckboxApi = {
  name: 'KatanaCheckbox',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The text next to the checkbox.'),
      value: CommonSchemas.DynamicBoolean.describe(
        'Whether the box is checked. Bind it to the data model with {"@path": "/form/x"} so the choice is written back.',
      ),
      disabled: CommonSchemas.DynamicBoolean.describe('When true the checkbox cannot be toggled.').optional(),
      checks: CommonSchemas.Checkable.shape.checks,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

function Control({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled: boolean
  onChange: (value: boolean) => void
}) {
  const field = useFieldControl()
  return (
    <Checkbox {...field} checked={checked} disabled={disabled} onCheckedChange={(next) => onChange(next === true)} />
  )
}

export const KatanaCheckbox = createComponentImplementation(KatanaCheckboxApi, ({ props }) => (
  <Cell weight={props.weight}>
    {/* 勾选框在前、文字紧跟其后（开关才是文字在左、控件在右），所以把 justify-between 改成靠左。 */}
    <Field orientation="horizontal" className="justify-start gap-2">
      <Control
        checked={props.value === true}
        disabled={props.disabled === true}
        onChange={(value) => props.setValue?.(value)}
      />
      <FieldLabel>{props.label}</FieldLabel>
    </Field>
  </Cell>
))

// SPDX-License-Identifier: MIT
// KatanaSwitch：开关。状态双向绑定回数据模型。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { Field, FieldLabel, Switch, useFieldControl } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaSwitchApi = {
  name: 'KatanaSwitch',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The text next to the switch.'),
      value: CommonSchemas.DynamicBoolean.describe(
        'Whether the switch is on. Bind it to the data model with {"@path": "/form/x"} so the choice is written back.',
      ),
      disabled: CommonSchemas.DynamicBoolean.describe('When true the switch cannot be toggled.').optional(),
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
  return <Switch {...field} checked={checked} disabled={disabled} onCheckedChange={onChange} />
}

export const KatanaSwitch = createComponentImplementation(KatanaSwitchApi, ({ props }) => (
  <Cell weight={props.weight}>
    <Field orientation="horizontal">
      <FieldLabel>{props.label}</FieldLabel>
      <Control
        checked={props.value === true}
        disabled={props.disabled === true}
        onChange={(value) => props.setValue?.(value)}
      />
    </Field>
  </Cell>
))

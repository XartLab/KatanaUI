// SPDX-License-Identifier: MIT
// KatanaSlider：滑块。当前值双向绑定回数据模型，右上角显示数值。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { Field, FieldLabel, Slider } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaSliderApi = {
  name: 'KatanaSlider',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The slider label. Also its accessible name.'),
      min: z.number().default(0).describe('The smallest value.').optional(),
      max: z.number().describe('The largest value. Must be greater than min.'),
      step: z
        .number()
        .min(0.000001)
        .default(1)
        .describe('The size of one step; the value snaps to multiples of it.')
        .optional(),
      value: CommonSchemas.DynamicNumber.describe(
        'The current value. Bind it to the data model with {"@path": "/form/x"} so the user choice is written back.',
      ),
      disabled: CommonSchemas.DynamicBoolean.describe('When true the slider cannot be moved.').optional(),
      checks: CommonSchemas.Checkable.shape.checks,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaSlider = createComponentImplementation(KatanaSliderApi, ({ props }) => {
  const min = props.min ?? 0
  const max = props.max > min ? props.max : min + 1
  const value = Math.min(max, Math.max(min, typeof props.value === 'number' ? props.value : min))
  return (
    <Cell weight={props.weight}>
      <Field>
        <div className="flex items-baseline justify-between gap-2">
          <FieldLabel>{props.label}</FieldLabel>
          <span className="k-text-data text-ink-2 tabular-nums">{value}</span>
        </div>
        <Slider
          thumbLabels={[props.label ?? '']}
          value={[value]}
          min={min}
          max={max}
          step={props.step ?? 1}
          disabled={props.disabled === true}
          onValueChange={([next]) => next !== undefined && props.setValue?.(next)}
        />
      </Field>
    </Cell>
  )
})

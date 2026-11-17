// SPDX-License-Identifier: MIT
// KatanaDecimalField：十进制字符串框（价格、数量）。值是字符串，不经 JS 数字，按步长走一格；框里合不合法由宿主与网关判，这里只给 error / warning 的边色。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { Field, FieldError, FieldLabel } from '../../index.ts'
import { DecimalField } from '../../quant/index.ts'
import { Cell, weightSchema } from '../support.tsx'

const decimal = z.string().regex(/^\d+(\.\d+)?$/, 'A plain decimal such as "0.01".')

export const KatanaDecimalFieldApi = {
  name: 'KatanaDecimalField',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The field label shown above the box. Also its accessible name.'),
      value: CommonSchemas.DynamicString.describe(
        'The decimal as a string, for example "101.25". It never goes through a floating-point number. Bind it to the data model with {"@path": "/order/price"} so the input is written back.',
      ),
      step: decimal.describe(
        'Size of one arrow-key step, a plain decimal string such as the tick size "0.01". Shift moves ten steps. "0" counts as 1.',
      ),
      base: decimal.describe('Where an empty box starts stepping from, for example the last price.').optional(),
      unit: CommonSchemas.DynamicString.describe('A unit suffix inside the box, not clickable.').optional(),
      placeholder: CommonSchemas.DynamicString.describe('Hint text shown while the box is empty.').optional(),
      status: z
        .enum(['error', 'warning'])
        .describe("'error' marks the box invalid with a red border; 'warning' only turns the border amber.")
        .optional(),
      buttons: z
        .object({
          decrease: z.string().describe('Accessible name and tooltip of the minus button.'),
          increase: z.string().describe('Accessible name and tooltip of the plus button.'),
        })
        .strict()
        .describe('When given, the minus and plus buttons are shown, with these texts.')
        .optional(),
      disabled: CommonSchemas.DynamicBoolean.describe('When true the box cannot be changed.').optional(),
      readOnly: CommonSchemas.DynamicBoolean.describe(
        'When true the text can be selected and copied but not changed.',
      ).optional(),
      checks: CommonSchemas.Checkable.shape.checks,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaDecimalField = createComponentImplementation(KatanaDecimalFieldApi, ({ props }) => {
  const errors = props.validationErrors ?? []
  return (
    <Cell weight={props.weight}>
      <Field invalid={errors.length > 0}>
        <FieldLabel>{props.label}</FieldLabel>
        <DecimalField
          label={props.label ?? ''}
          value={props.value ?? ''}
          onValue={(next) => props.setValue?.(next)}
          step={props.step}
          base={props.base ?? null}
          unit={props.unit}
          placeholder={props.placeholder}
          status={errors.length > 0 ? 'error' : props.status}
          buttons={props.buttons}
          disabled={props.disabled === true}
          readOnly={props.readOnly === true}
        />
        {errors.length > 0 ? <FieldError>{errors.join(' ')}</FieldError> : null}
      </Field>
    </Cell>
  )
})

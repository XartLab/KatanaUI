// SPDX-License-Identifier: MIT
// KatanaMultiSelect：下拉多选。选项由智能体给，选中的值列表双向绑定回数据模型。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { Field, FieldLabel, MultiSelect } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaMultiSelectApi = {
  name: 'KatanaMultiSelect',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The field label shown above the select. Also its accessible name.'),
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
        .describe('The choices, in display order. The chosen list keeps this order.'),
      values: CommonSchemas.DynamicStringList.describe(
        'The values of the chosen options. Bind it to the data model with {"@path": "/form/x"} so the choice is written back as an array.',
      ),
      empty: CommonSchemas.DynamicString.describe('Text on the trigger while nothing is chosen.'),
      separator: z
        .string()
        .describe(
          'Text placed between the chosen option names on the trigger, for example ", " (a comma and a space).',
        ),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaMultiSelect = createComponentImplementation(KatanaMultiSelectApi, ({ props }) => {
  const values = Array.isArray(props.values) ? props.values.filter((item) => typeof item === 'string') : []
  return (
    <Cell weight={props.weight}>
      <Field>
        <FieldLabel>{props.label}</FieldLabel>
        <MultiSelect
          label={props.label}
          values={values}
          options={props.options.map((option) => [option.value, option.label] as const)}
          onValuesChange={(next) => props.setValues?.(next)}
          empty={props.empty ?? ''}
          separator={props.separator}
        />
      </Field>
    </Cell>
  )
})

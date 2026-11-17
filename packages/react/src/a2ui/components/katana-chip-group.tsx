// SPDX-License-Identifier: MIT
// KatanaChipGroup：一组可开关的小标签（筛选用）。选中的值列表双向绑定回数据模型；命中数由智能体算好传进来。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { ChipGroup } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaChipGroupApi = {
  name: 'KatanaChipGroup',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('Accessible name of the whole group. Not shown on screen.'),
      items: z
        .array(
          z
            .object({
              value: z.string().min(1).describe('The stable value written to the data model when this chip is on.'),
              label: z.string().describe('The text on the chip.'),
              count: z.number().int().min(0).describe('A count shown on the chip, already computed by you.').optional(),
              disabled: z.boolean().describe('When true this chip cannot be toggled.').optional(),
            })
            .strict(),
        )
        .min(1)
        .describe('The chips, in display order.'),
      values: CommonSchemas.DynamicStringList.describe(
        'The values of the chips that are on. Bind it to the data model with {"@path": "/filters"} so the choice is written back as an array.',
      ),
      selection: z
        .enum(['multiple', 'single'])
        .default('multiple')
        .describe(
          "'multiple' lets several chips be on; 'single' allows at most one, and pressing it again turns it off.",
        )
        .optional(),
      clearLabel: CommonSchemas.DynamicString.describe(
        'When given, a clear button appears while a chip is on, with this as its accessible name and tooltip.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaChipGroup = createComponentImplementation(KatanaChipGroupApi, ({ props }) => {
  const values = Array.isArray(props.values) ? props.values.filter((item) => typeof item === 'string') : []
  return (
    <Cell weight={props.weight}>
      <ChipGroup
        label={props.label ?? ''}
        items={props.items}
        value={values}
        onValueChange={(next) => props.setValues?.(next)}
        selection={props.selection}
        clearLabel={props.clearLabel}
      />
    </Cell>
  )
})

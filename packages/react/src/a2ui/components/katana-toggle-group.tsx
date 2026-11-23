// SPDX-License-Identifier: MIT
// KatanaToggleGroup：分段切换，单选。选项由智能体给，选中的值双向绑定回数据模型。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { ToggleGroup, ToggleGroupItem } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaToggleGroupApi = {
  name: 'KatanaToggleGroup',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('Accessible name of the whole group. Not shown on screen.'),
      options: z
        .array(
          z
            .object({
              label: z.string().describe('The text on this segment.'),
              value: z
                .string()
                .min(1)
                .describe('The stable value written to the data model when this segment is chosen.'),
            })
            .strict(),
        )
        .min(2)
        .describe('The segments, in display order.'),
      value: CommonSchemas.DynamicString.describe(
        'The value of the chosen segment; an empty string means none is chosen. Bind it to the data model with {"@path": "/form/x"} so the choice is written back.',
      ),
      size: z
        .enum(['md', 'sm'])
        .default('md')
        .describe("Size: 'md' is the 24px bordered settings style, 'sm' is the 26px toolbar style.")
        .optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaToggleGroup = createComponentImplementation(KatanaToggleGroupApi, ({ props }) => {
  const chosen = props.options.some((option) => option.value === props.value) ? (props.value ?? null) : null
  return (
    <Cell weight={props.weight}>
      <ToggleGroup
        size={props.size}
        aria-label={props.label}
        value={chosen}
        onValueChange={(next) => props.setValue?.(next)}
      >
        {props.options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Cell>
  )
})

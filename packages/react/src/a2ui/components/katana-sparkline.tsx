// SPDX-License-Identifier: MIT
// KatanaSparkline：迷你走势线。数列可以直接写，也可以绑到数据模型里的一个数组。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { Sparkline } from '../../index.ts'
import { Cell, numberList, numberListSchema, weightSchema } from '../support.tsx'

export const KatanaSparklineApi = {
  name: 'KatanaSparkline',
  schema: z
    .object({
      values: numberListSchema('The values from oldest to newest. Fewer than two numbers draws a dash.'),
      label: CommonSchemas.DynamicString.describe(
        'Accessible name of the chart as a whole sentence, including what to say when there is no data.',
      ),
      tone: z
        .enum(['up', 'down', 'flat'])
        .describe('Line color. Follows the change from the first to the last value when omitted.')
        .optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaSparkline = createComponentImplementation(KatanaSparklineApi, ({ props }) => (
  <Cell weight={props.weight}>
    <Sparkline values={numberList(props.values)} label={props.label ?? ''} tone={props.tone} />
  </Cell>
))

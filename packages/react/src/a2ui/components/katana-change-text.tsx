// SPDX-License-Identifier: MIT
// KatanaChangeText：涨跌幅。数值本身已是百分数，组件写成「+1.50%」并按涨跌着色。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { ChangeText } from '../../quant/index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaChangeTextApi = {
  name: 'KatanaChangeText',
  schema: z
    .object({
      value: CommonSchemas.DynamicNumber.describe('The change as a percentage already: 1.5 means +1.50%.'),
      digits: z.number().int().min(0).max(6).default(2).describe('Number of decimal places.').optional(),
      arrow: z
        .boolean()
        .default(false)
        .describe('Put an up or down triangle before the text so direction does not rely on color alone.')
        .optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaChangeText = createComponentImplementation(KatanaChangeTextApi, ({ props }) => (
  <Cell weight={props.weight}>
    {typeof props.value === 'number' && Number.isFinite(props.value) ? (
      <ChangeText value={props.value} digits={props.digits} arrow={props.arrow} />
    ) : (
      <span aria-hidden="true">—</span>
    )}
  </Cell>
))

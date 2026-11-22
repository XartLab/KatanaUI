// SPDX-License-Identifier: MIT
// KatanaPnlText：盈亏文字。显示的字由智能体格式化好传来，数值只用来定涨跌方向（颜色与箭头）。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { PnlText } from '../../quant/index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaPnlTextApi = {
  name: 'KatanaPnlText',
  schema: z
    .object({
      text: CommonSchemas.DynamicString.describe(
        'The text to show, already formatted: currency, decimals and sign are yours to write (for example "+1,240.50 USDT").',
      ),
      value: CommonSchemas.DynamicNumber.describe(
        'The raw profit or loss. Only its sign matters: it decides green or red and the arrow. Zero is shown neutral.',
      ),
      arrow: z
        .boolean()
        .default(false)
        .describe('Put an up or down triangle before the text so direction does not rely on color alone.')
        .optional(),
      tone: z
        .enum(['up', 'down', 'flat'])
        .describe(
          'Overrides the direction taken from the sign of value, for example a loss written as a positive number.',
        )
        .optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaPnlText = createComponentImplementation(KatanaPnlTextApi, ({ props }) => (
  <Cell weight={props.weight}>
    <PnlText value={props.value} tone={props.tone} arrow={props.arrow}>
      {props.text}
    </PnlText>
  </Cell>
))

// SPDX-License-Identifier: MIT
// KatanaPriceTag：夹在一句话里的「名字 价格 涨跌」。价与涨跌都由智能体格式化好传来，方向由 tone 定。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { PriceTag } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

const TONES = ['up', 'down', 'flat'] as const

export const KatanaPriceTagApi = {
  name: 'KatanaPriceTag',
  schema: z
    .object({
      name: CommonSchemas.DynamicString.describe(
        'Symbol name or code. Only price and change are shown when omitted.',
      ).optional(),
      price: CommonSchemas.DynamicString.describe('The price, already formatted.'),
      change: CommonSchemas.DynamicString.describe(
        'The change, already formatted and signed (for example "+1.20%").',
      ).optional(),
      tone: z
        .enum(TONES)
        .or(CommonSchemas.DataBinding)
        .describe("Direction: 'up' and 'down' set the color and a triangle, 'flat' has neither. Defaults to 'flat'.")
        .optional(),
      label: CommonSchemas.DynamicString.describe(
        'The whole sentence screen readers read, including the direction. The visible text is read when omitted.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaPriceTag = createComponentImplementation(KatanaPriceTagApi, ({ props }) => (
  <Cell weight={props.weight}>
    <PriceTag
      name={props.name}
      price={props.price ?? ''}
      change={props.change}
      tone={TONES.find((item) => item === props.tone)}
      label={props.label}
    />
  </Cell>
))

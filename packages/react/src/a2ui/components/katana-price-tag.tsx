// SPDX-License-Identifier: MIT
// KatanaPriceTag：夹在一句话里的「名字 价格 涨跌」。值是数（last、changePct，2026-11-18），位数由 digits 定，方向由涨跌幅的正负定。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { PriceTag } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaPriceTagApi = {
  name: 'KatanaPriceTag',
  schema: z
    .object({
      name: CommonSchemas.DynamicString.describe(
        'Symbol name or code. Only price and change are shown when omitted.',
      ).optional(),
      last: CommonSchemas.DynamicNumber.describe('The latest price.'),
      changePct: CommonSchemas.DynamicNumber.describe(
        'The change as a percentage already: 1.5 means +1.50%. Its sign sets the color and a triangle; omit to hide.',
      ).optional(),
      digits: z.number().int().min(0).max(8).default(2).describe('Decimal places of the price.').optional(),
      label: CommonSchemas.DynamicString.describe(
        'The whole sentence screen readers read, including the direction. The visible text is read when omitted.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaPriceTag = createComponentImplementation(KatanaPriceTagApi, ({ props }) => {
  const digits = props.digits ?? 2
  return (
    <Cell weight={props.weight}>
      <PriceTag
        name={props.name}
        last={props.last}
        changePct={props.changePct}
        formatPrice={(value) =>
          value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
        }
        label={props.label}
      />
    </Cell>
  )
})

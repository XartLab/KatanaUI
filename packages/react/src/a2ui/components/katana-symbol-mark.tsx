// SPDX-License-Identifier: MIT
// KatanaSymbolMark：品种字母圆标。不收图片地址（图片来源是外链），只画字母，由代码与名称算出来。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { SymbolMark } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaSymbolMarkApi = {
  name: 'KatanaSymbolMark',
  schema: z
    .object({
      symbol: CommonSchemas.DynamicString.describe(
        'The instrument code, for example "BTCUSDT" or "600519". The letters on the mark come from it.',
      ),
      name: CommonSchemas.DynamicString.describe(
        'The instrument name. It is the accessible name, and gives the letter when the code has no Latin letters.',
      ).optional(),
      size: z
        .union([z.enum(['sm', 'md']), z.number().int().min(12).max(64)])
        .default('sm')
        .describe("'sm' is 18px (a list row), 'md' is 28px (a card); a number is a custom diameter in px.")
        .optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaSymbolMark = createComponentImplementation(KatanaSymbolMarkApi, ({ props }) => (
  <Cell weight={props.weight}>
    <SymbolMark symbol={props.symbol ?? ''} name={props.name} size={props.size} />
  </Cell>
))

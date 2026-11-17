// SPDX-License-Identifier: MIT
// KatanaQuoteCard：一只品种一张报价卡（名字、最新价、涨跌、迷你图）。值是数（统一行情行的 last / change / changePct，2026-11-18），位数由 digits 定，方向由 change 的正负定；
// 点卡片只发 Action，不跳转。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { QuoteCard } from '../../index.ts'
import { Cell, actionSchema, numberList, numberListSchema, weightSchema } from '../support.tsx'

export const KatanaQuoteCardApi = {
  name: 'KatanaQuoteCard',
  schema: z
    .object({
      name: CommonSchemas.DynamicString.describe('Name of the symbol.'),
      symbol: CommonSchemas.DynamicString.describe('Code of the symbol, shown small beside the name.').optional(),
      last: CommonSchemas.DynamicNumber.describe('The latest price.'),
      change: CommonSchemas.DynamicNumber.describe(
        'The change amount in price units; its sign sets the color and the triangle.',
      ).optional(),
      changePct: CommonSchemas.DynamicNumber.describe(
        'The change as a percentage already: 1.5 means +1.50%.',
      ).optional(),
      digits: z.number().int().min(0).max(8).default(2).describe('Decimal places of the price and change.').optional(),
      spark: numberListSchema(
        'Recent values from oldest to newest for the mini chart. Omit to hide the chart.',
      ).optional(),
      labels: z
        .object({
          spark: z.string().describe('Accessible name of the mini chart as a whole sentence.'),
        })
        .strict()
        .describe('Screen-reader text, in the language of the user. Required when spark is given.')
        .optional(),
      size: z.enum(['md', 'sm']).describe("'sm' is a narrow horizontal card for dense rows.").optional(),
      onSelect: actionSchema(
        'Dispatched when the user presses the card. When it is omitted the card is not a button.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaQuoteCard = createComponentImplementation(KatanaQuoteCardApi, ({ props }) => {
  const spark = numberList(props.spark)
  const select = props.onSelect
  const digits = props.digits ?? 2
  const hasSpark = spark.length > 1 && props.labels !== undefined
  return (
    <Cell weight={props.weight}>
      <QuoteCard
        name={props.name ?? ''}
        symbol={props.symbol}
        last={props.last}
        change={props.change}
        changePct={props.changePct}
        formatPrice={(value) =>
          value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
        }
        spark={hasSpark ? spark : undefined}
        labels={props.labels}
        size={props.size}
        onSelect={select ? () => void select() : undefined}
      />
    </Cell>
  )
})

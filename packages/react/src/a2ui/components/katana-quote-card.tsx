// SPDX-License-Identifier: MIT
// KatanaQuoteCard：一只品种一张报价卡（名字、最新价、涨跌、迷你图）。价与涨跌由智能体格式化好传来；点卡片只发 Action，不跳转。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { QuoteCard } from '../../index.ts'
import { Cell, actionSchema, numberList, numberListSchema, weightSchema } from '../support.tsx'

const TONES = ['up', 'down', 'flat'] as const

export const KatanaQuoteCardApi = {
  name: 'KatanaQuoteCard',
  schema: z
    .object({
      name: CommonSchemas.DynamicString.describe('Name of the symbol.'),
      symbol: CommonSchemas.DynamicString.describe('Code of the symbol, shown small beside the name.').optional(),
      price: CommonSchemas.DynamicString.describe('The latest price, already formatted.'),
      change: CommonSchemas.DynamicString.describe('The change amount, already formatted and signed.').optional(),
      percent: CommonSchemas.DynamicString.describe('The change percentage, already formatted and signed.').optional(),
      tone: z
        .enum(TONES)
        .or(CommonSchemas.DataBinding)
        .describe("Direction: 'up', 'down' or 'flat'. Sets the color and the triangle. Defaults to 'flat'.")
        .optional(),
      spark: numberListSchema(
        'Recent values from oldest to newest for the mini chart. Omit to hide the chart.',
      ).optional(),
      sparkLabel: CommonSchemas.DynamicString.describe(
        'Accessible name of the mini chart as a whole sentence. Required when spark is given.',
      ).optional(),
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
  return (
    <Cell weight={props.weight}>
      <QuoteCard
        name={props.name ?? ''}
        symbol={props.symbol}
        price={props.price ?? ''}
        change={props.change}
        percent={props.percent}
        tone={TONES.find((item) => item === props.tone)}
        spark={spark.length > 1 ? spark : undefined}
        sparkLabel={props.sparkLabel}
        size={props.size}
        onSelect={select ? () => void select() : undefined}
      />
    </Cell>
  )
})

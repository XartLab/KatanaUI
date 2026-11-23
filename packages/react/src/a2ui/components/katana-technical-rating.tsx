// SPDX-License-Identifier: MIT
// KatanaTechnicalRating：技术评级仪表（按组给出卖 / 中性 / 买的计数与综合值），可选指标明细与枢轴点表。
// 数值与读数都由智能体算好传来；件不算。切换周期只发 Action。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo, useState } from 'react'
import { z } from 'zod'
import { TechnicalRating } from '../../quant/index.ts'
import { text, withExtension } from '../blocks-support.ts'
import { Cell, actionSchema, fill, weightSchema } from '../support.tsx'

const VERDICT = z.enum(['sell', 'neutral', 'buy'])

const groupSchema = z
  .object({
    key: z.string().min(1).describe('Stable key of the group.'),
    label: text('The group name, for example "Oscillators".'),
    value: z.number().min(-1).max(1).describe('The group rating from -1 (strong sell) to 1 (strong buy).'),
    counts: z
      .object({ sell: z.number().int().min(0), neutral: z.number().int().min(0), buy: z.number().int().min(0) })
      .strict()
      .describe('How many indicators say sell, neutral and buy.'),
  })
  .strict()

const rowSchema = z
  .object({
    key: z.string().min(1).describe('Stable key of the indicator.'),
    name: text('The indicator name.'),
    group: z.string().describe('The key of the group it belongs to.').optional(),
    reading: z.string().describe('The reading as text, already formatted. Use a dash when there is none.').optional(),
    verdict: VERDICT.describe('What the indicator says.'),
  })
  .strict()

export const KatanaTechnicalRatingApi = {
  name: 'KatanaTechnicalRating',
  schema: z
    .object({
      groups: z
        .array(groupSchema)
        .min(1)
        .max(5)
        .describe('The rated groups; the middle one (or `primary`) is drawn large.'),
      rows: z.array(rowSchema).max(200).describe('The indicator table. Omit to draw only the gauges.').optional(),
      primary: z
        .string()
        .describe('Key of the group drawn large in the middle. Defaults to the middle group.')
        .optional(),
      pivots: z
        .object({
          title: text('Title of the pivot table.'),
          columns: z.array(z.string()).min(1).max(8).describe('Column names, for example Classic and Fibonacci.'),
          rows: z
            .array(
              z
                .object({
                  key: z.string().min(1),
                  label: text('Row name, for example R1.'),
                  values: z.array(z.string().nullable()).describe('One text per column; null for none.'),
                })
                .strict(),
            )
            .max(12),
        })
        .strict()
        .describe('A pivot-point table under the indicators. Values are calculated by you.')
        .optional(),
      timeframes: z
        .array(z.object({ value: z.string().min(1), label: text('The period name, for example "1h".') }).strict())
        .min(2)
        .max(12)
        .describe('The periods the user can switch between. Omit for no switch.')
        .optional(),
      value: z.string().describe('The current period value. Defaults to the first one.').optional(),
      disclaimer: CommonSchemas.DynamicString.describe('A disclaimer line under the table.').optional(),
      labels: z
        .object({
          zoneStrongSell: text('Gauge zone: strong sell.'),
          zoneSell: text('Gauge zone: sell.'),
          zoneNeutral: text('Gauge zone: neutral.'),
          zoneBuy: text('Gauge zone: buy.'),
          zoneStrongBuy: text('Gauge zone: strong buy.'),
          verdictSell: text('Single verdict: sell.'),
          verdictNeutral: text('Single verdict: neutral.'),
          verdictBuy: text('Single verdict: buy.'),
          total: text('Indicator total under the gauge; {n}, for example "{n} indicators".'),
          columnName: text('Table column: indicator name.'),
          columnReading: text('Table column: reading.'),
          columnVerdict: text('Table column: verdict.'),
          timeframe: text('Accessible name of the period switch.'),
          list: text('Accessible name of the whole component.'),
          empty: text('Text when there is nothing to show.'),
        })
        .strict()
        .describe('All visible and screen-reader text, in the language of the user.'),
      onValueChange: actionSchema(
        'Dispatched when the user picks a period. metadata.extensions.katanaTimeframe carries {value}.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaTechnicalRating = createComponentImplementation(KatanaTechnicalRatingApi, ({ props }) => {
  const [picked, setPicked] = useState<string | undefined>(undefined)
  const t = props.labels
  const pivots = useMemo(
    () => (props.pivots ? { ...props.pivots, rows: props.pivots.rows } : undefined),
    [props.pivots],
  )
  if (!t) return null
  const frames = props.timeframes
  return (
    <Cell weight={props.weight}>
      <TechnicalRating
        groups={props.groups ?? []}
        rows={props.rows}
        primary={props.primary}
        pivots={pivots}
        timeframes={frames}
        value={frames ? (picked ?? props.value ?? frames[0]?.value) : undefined}
        onValueChange={(value) => {
          setPicked(value)
          void props.onValueChange?.(withExtension('katanaTimeframe', { value }))
        }}
        disclaimer={props.disclaimer}
        labels={{
          zones: [t.zoneStrongSell, t.zoneSell, t.zoneNeutral, t.zoneBuy, t.zoneStrongBuy],
          verdict: { sell: t.verdictSell, neutral: t.verdictNeutral, buy: t.verdictBuy },
          total: (n) => fill(t.total, { n }),
          columns: { name: t.columnName, reading: t.columnReading, verdict: t.columnVerdict },
          timeframe: t.timeframe,
          list: t.list,
          empty: t.empty,
        }}
      />
    </Cell>
  )
})

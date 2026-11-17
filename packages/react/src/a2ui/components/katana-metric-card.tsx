// SPDX-License-Identifier: MIT
// KatanaMetricCard：一个指标一张卡（大号当前值、几项涨跌、迷你走势线、来源）。数字与文字都由智能体传，卡片不算也不取数。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { MetricCard } from '../../quant/index.ts'
import { Cell, numberList, numberListSchema, weightSchema } from '../support.tsx'

export const KatanaMetricCardApi = {
  name: 'KatanaMetricCard',
  schema: z
    .object({
      title: CommonSchemas.DynamicString.describe('The metric name shown above the number.'),
      value: CommonSchemas.DynamicString.describe(
        'The current value, already formatted as text. Use an empty string when there is no data.',
      ),
      unit: CommonSchemas.DynamicString.describe(
        'A small unit written after the value (for example "bp" or "%").',
      ).optional(),
      changes: z
        .array(
          z
            .object({
              label: z.string().describe('What the change is measured against, for example "vs yesterday".'),
              value: z
                .number()
                .nullable()
                .describe('The change as a percentage already: 1.5 means +1.50%. Null when there is no data.'),
            })
            .strict(),
        )
        .max(4)
        .describe('Up to four changes shown under the value.')
        .optional(),
      trend: numberListSchema(
        'Recent values from oldest to newest for the small trend line. Omit to hide the line.',
      ).optional(),
      trendLabel: CommonSchemas.DynamicString.describe(
        'Accessible name of the trend line as a whole sentence. Required when trend is given.',
      ).optional(),
      trendTone: z
        .enum(['direction', 'neutral', 'inverse'])
        .default('direction')
        .describe(
          "Line color: 'direction' is green when the series rose and red when it fell, 'neutral' is grey, 'inverse' flips the colors for measures where up is bad (volatility, for example).",
        )
        .optional(),
      source: CommonSchemas.DynamicString.describe('Where the number comes from, shown on the bottom line.').optional(),
      updatedAt: CommonSchemas.DynamicString.describe(
        'When the number was last updated, as text written by you, shown on the bottom line.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaMetricCard = createComponentImplementation(KatanaMetricCardApi, ({ props }) => {
  const trend = numberList(props.trend)
  const label = props.trendLabel ?? props.title ?? ''
  return (
    <Cell weight={props.weight}>
      <MetricCard
        title={props.title ?? ''}
        value={props.value ? props.value : null}
        unit={props.unit}
        changes={(props.changes ?? []).map((change, index) => ({
          key: String(index),
          label: change.label,
          value: change.value,
        }))}
        ranges={trend.length > 1 ? [{ key: 'trend', label, values: trend }] : undefined}
        trendTone={props.trendTone}
        rangeLabel={label}
        sparkLabel={label}
        source={props.source}
        updatedAt={props.updatedAt}
      />
    </Cell>
  )
})

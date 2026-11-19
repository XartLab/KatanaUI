// SPDX-License-Identifier: MIT
// KatanaSparkTile：KPI 瓦片（小标签、数值、迷你线、变化说明），即 MetricCard variant="tile"。数值与说明由智能体写；空串表示没有数据；点瓦片只发 Action。
// 字段跟读数壳统一（2026-11-18）：changePct（原 delta）、labels.spark（原 sparkLabel）、status（原 state）。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { MetricCard } from '../../quotes/index.ts'
import { Cell, actionSchema, numberList, numberListSchema, weightSchema } from '../support.tsx'

const STATES = ['normal', 'near', 'over'] as const

export const KatanaSparkTileApi = {
  name: 'KatanaSparkTile',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The small dot-matrix label of the metric.'),
      value: CommonSchemas.DynamicString.describe(
        'The current value, already formatted. Use an empty string when there is no data.',
      ),
      unit: CommonSchemas.DynamicString.describe('A small unit written after the value.').optional(),
      series: numberListSchema(
        'Recent values from oldest to newest for the mini line. Fewer than two numbers draws a dash.',
      ),
      labels: z
        .object({
          spark: z
            .string()
            .describe(
              'Accessible name of the mini line as a whole sentence, including what to say when there is no data.',
            ),
        })
        .strict()
        .describe('Screen-reader text, in the language of the user.'),
      trendTone: z
        .enum(['series', 'neutral'])
        .describe("'series' is the normal line color, 'neutral' is grey for metrics where lower is better.")
        .optional(),
      threshold: CommonSchemas.DynamicNumber.describe(
        'A threshold in the same unit as the series, drawn as an amber dashed line.',
      ).optional(),
      status: z
        .enum(STATES)
        .or(CommonSchemas.DataBinding)
        .describe(
          "'normal', 'near' (close to the threshold) or 'over' (past it). The status must also be written in note, not only shown by color.",
        )
        .optional(),
      changePct: CommonSchemas.DynamicNumber.describe(
        'The change as a percentage already: 1.5 means +1.50%.',
      ).optional(),
      note: CommonSchemas.DynamicString.describe(
        'A small line next to the change (for example "today", "near the limit").',
      ).optional(),
      onSelect: actionSchema(
        'Dispatched when the user presses the tile. When it is omitted the tile is not a button.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaSparkTile = createComponentImplementation(KatanaSparkTileApi, ({ props }) => {
  const select = props.onSelect
  return (
    <Cell weight={props.weight}>
      <MetricCard
        variant="tile"
        label={props.label ?? ''}
        value={props.value ? props.value : null}
        unit={props.unit}
        series={numberList(props.series)}
        labels={{ spark: props.labels?.spark ?? '' }}
        trendTone={props.trendTone}
        threshold={
          typeof props.threshold === 'number' && Number.isFinite(props.threshold) ? props.threshold : undefined
        }
        status={STATES.find((item) => item === props.status)}
        changePct={
          typeof props.changePct === 'number' && Number.isFinite(props.changePct) ? props.changePct : undefined
        }
        note={props.note}
        onSelect={select ? () => void select() : undefined}
      />
    </Cell>
  )
})

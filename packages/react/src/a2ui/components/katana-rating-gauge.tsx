// SPDX-License-Identifier: MIT
// KatanaRatingGauge：半圆评级仪表，五段、一根指针。五段的名字与圆心下的补充文字由智能体写。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { RatingGauge } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaRatingGaugeApi = {
  name: 'KatanaRatingGauge',
  schema: z
    .object({
      score: CommonSchemas.DynamicNumber.describe(
        'From -1 (strong sell) to +1 (strong buy), split into five equal zones. Out of range sticks to the ends.',
      ),
      zones: z
        .array(z.string().min(1))
        .length(5)
        .describe(
          'Exactly five names from sell to buy (strong sell, sell, neutral, buy, strong buy). The word under the needle is taken from here.',
        ),
      label: CommonSchemas.DynamicString.describe('Accessible name of the gauge (for example "Technical rating").'),
      extra: CommonSchemas.DynamicString.describe(
        'Optional text under the level word, for example the counts of sell, neutral and buy signals.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaRatingGauge = createComponentImplementation(KatanaRatingGaugeApi, ({ props }) => {
  const zones = props.zones as unknown as string[]
  const five: [string, string, string, string, string] = [
    zones[0] ?? '',
    zones[1] ?? '',
    zones[2] ?? '',
    zones[3] ?? '',
    zones[4] ?? '',
  ]
  return (
    <Cell weight={props.weight}>
      <RatingGauge score={typeof props.score === 'number' ? props.score : 0} zones={five} label={props.label ?? ''}>
        {props.extra}
      </RatingGauge>
    </Cell>
  )
})

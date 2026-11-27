// SPDX-License-Identifier: MIT
// KatanaRatingText：五档评级的单元格写法（图标加文字）。档名由智能体写，件不带文案。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { RatingText } from '../../quant/index.ts'
import { Cell, weightSchema } from '../support.tsx'

const LEVELS = ['strong-sell', 'sell', 'neutral', 'buy', 'strong-buy'] as const

export const KatanaRatingTextApi = {
  name: 'KatanaRatingText',
  schema: z
    .object({
      level: z
        .enum(LEVELS)
        .or(CommonSchemas.DataBinding)
        .describe(
          "The rating: 'strong-buy' and 'buy' are green with up chevrons, 'neutral' is grey, 'sell' and 'strong-sell' are red with down chevrons. May be bound to the data model.",
        ),
      text: CommonSchemas.DynamicString.describe(
        'The name of the rating shown after the icon (for example "Strong buy").',
      ),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaRatingText = createComponentImplementation(KatanaRatingTextApi, ({ props }) => (
  <Cell weight={props.weight}>
    <RatingText level={LEVELS.find((item) => item === props.level) ?? 'neutral'}>{props.text ?? ''}</RatingText>
  </Cell>
))

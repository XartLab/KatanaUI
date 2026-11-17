// SPDX-License-Identifier: MIT
// KatanaMeter：横向仪表，三种形态（条、同步率条、刻度）。名字与数永远在；颜色只传语气，不传色值。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { Meter } from '../../quant/index.ts'
import { Cell, weightSchema } from '../support.tsx'

const TONES = ['accent', 'ok', 'warn', 'danger', 'off'] as const
const DISPLAYS = ['bar', 'sync', 'gauge'] as const

export const KatanaMeterApi = {
  name: 'KatanaMeter',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The name shown above the bar. Also its accessible name.'),
      value: CommonSchemas.DynamicNumber.describe('The current value, from 0 to max. Out of range sticks to the edge.'),
      max: z.number().min(0.000001).default(100).describe('The full-scale value. Must be greater than 0.').optional(),
      valueText: CommonSchemas.DynamicString.describe(
        'The reading shown beside the bar, already formatted by you. Omit it to show the rounded percentage of full scale.',
      ).optional(),
      tone: z
        .enum(TONES)
        .or(CommonSchemas.DataBinding)
        .describe(
          "Color meaning: 'accent' in progress, 'ok' healthy, 'warn' limited or out of bounds, 'danger' weak, 'off' disabled. State must also be clear from the text.",
        )
        .optional(),
      display: z
        .enum(DISPLAYS)
        .describe(
          "'bar' is a dotted fill (progress, load, exposure), 'sync' is a segmented bar with a large percentage, 'gauge' is a needle on a 0-100 scale.",
        )
        .optional(),
      mark: CommonSchemas.DynamicNumber.describe(
        'A marker line in the same unit as value (a limit or an evaluation point). Used by bar and sync.',
      ).optional(),
      markLabel: CommonSchemas.DynamicString.describe(
        'What the marker line is, for screen readers (for example "limit"). Required when mark is given.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaMeter = createComponentImplementation(KatanaMeterApi, ({ props }) => (
  <Cell weight={props.weight}>
    <Meter
      label={props.label ?? ''}
      value={typeof props.value === 'number' ? props.value : 0}
      max={props.max}
      valueText={props.valueText}
      tone={TONES.find((item) => item === props.tone)}
      display={props.display}
      mark={typeof props.mark === 'number' && Number.isFinite(props.mark) ? props.mark : undefined}
      markLabel={props.markLabel}
    />
  </Cell>
))

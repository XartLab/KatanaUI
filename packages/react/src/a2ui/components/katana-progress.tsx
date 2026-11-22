// SPDX-License-Identifier: MIT
// KatanaProgress：细进度条。不给 value 就是不确定态；读屏名必填；颜色之外的状态请在旁边用文字写出来。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { Progress } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

const TONES = ['neutral', 'ok', 'warn', 'danger'] as const

export const KatanaProgressApi = {
  name: 'KatanaProgress',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe(
        'Accessible name of the bar as a phrase (for example "Backtest progress").',
      ),
      value: CommonSchemas.DynamicNumber.describe(
        'Progress from 0 to max. Omit it for the indeterminate state, a bar that slides back and forth.',
      ).optional(),
      max: z.number().min(0.000001).default(100).describe('The full-scale value. Must be greater than 0.').optional(),
      tone: z
        .enum(TONES)
        .or(CommonSchemas.DataBinding)
        .describe(
          "Fill color: 'neutral' (default), 'ok' (green), 'warn' (amber) or 'danger' (red). State must also be written as text nearby.",
        )
        .optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaProgress = createComponentImplementation(KatanaProgressApi, ({ props }) => (
  <Cell weight={props.weight}>
    <Progress
      aria-label={props.label ?? ''}
      value={typeof props.value === 'number' && Number.isFinite(props.value) ? props.value : null}
      max={props.max}
      tone={TONES.find((item) => item === props.tone)}
    />
  </Cell>
))

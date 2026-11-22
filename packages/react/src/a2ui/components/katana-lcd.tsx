// SPDX-License-Identifier: MIT
// KatanaLcd：读数窗（点阵小标签、LCD 数字、一行小字）。数字由智能体格式化好传来，件不算；空串表示没有数据，显示破折号。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { Lcd } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

const TONES = ['neutral', 'ok', 'warn', 'danger', 'up', 'down', 'flat', 'accent'] as const

export const KatanaLcdApi = {
  name: 'KatanaLcd',
  schema: z
    .object({
      label: CommonSchemas.DynamicString.describe('The small dot-matrix label above the number.'),
      value: CommonSchemas.DynamicString.describe(
        'The reading, already formatted as text. Use an empty string when there is no data and a dash is shown.',
      ),
      tone: z
        .enum(TONES)
        .or(CommonSchemas.DataBinding)
        .describe(
          "Number color: 'neutral', 'ok', 'warn' or 'danger' for a status; 'up', 'down' or 'flat' for direction; 'accent' for the current focus. Direction is also stated in the text itself.",
        )
        .optional(),
      note: CommonSchemas.DynamicString.describe(
        'A small line under the number (unit, basis). Do not put a second value here.',
      ).optional(),
      inline: z.boolean().describe('Put the label and the number on one line.').optional(),
      fill: z.boolean().describe('Fill the cell it sits in instead of shrinking to its content.').optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaLcd = createComponentImplementation(KatanaLcdApi, ({ props }) => (
  <Cell weight={props.weight}>
    <Lcd
      label={props.label ?? ''}
      value={props.value ? props.value : null}
      tone={TONES.find((item) => item === props.tone)}
      note={props.note}
      inline={props.inline}
      fill={props.fill}
    />
  </Cell>
))

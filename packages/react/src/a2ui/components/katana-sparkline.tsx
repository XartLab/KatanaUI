// SPDX-License-Identifier: MIT
// KatanaSparkline：迷你走势线。数列可以直接写，也可以绑到数据模型里的一个数组。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { Sparkline } from '../../index.ts'
import { Cell, numberList, numberListSchema, weightSchema } from '../support.tsx'

export const KatanaSparklineApi = {
  name: 'KatanaSparkline',
  schema: z
    .object({
      values: numberListSchema('The values from oldest to newest. Fewer than two numbers draws a dash.'),
      label: CommonSchemas.DynamicString.describe(
        'Accessible name of the chart as a whole sentence, including what to say when there is no data.',
      ),
      tone: z
        .enum(['up', 'down', 'flat'])
        .describe(
          'Line color. Follows the last value against the baseline, or the first-to-last change without one, when omitted.',
        )
        .optional(),
      variant: z
        .enum(['area', 'line', 'baseline', 'bars', 'winloss'])
        .describe(
          'Drawing style: area (line with a gradient below, the default), line, baseline (up color above the baseline, down color below), bars, or winloss (win/loss cells).',
        )
        .optional(),
      baseline: z
        .number()
        .describe(
          'Reference value such as the previous close. Draws a dashed line and decides the color when tone is omitted.',
        )
        .optional(),
      showLast: z
        .boolean()
        .describe('Draw a dot at the latest value. On by default for area, line and baseline.')
        .optional(),
      lastLabel: z
        .string()
        .describe('Latest value text at the right end, already formatted in the UI language.')
        .optional(),
      showExtremes: z.boolean().describe('Mark the highest and the lowest value with a small dot.').optional(),
      extremeLabels: z
        .array(z.string())
        .length(2)
        .describe('Texts beside the highest and the lowest dot, in that order, already formatted in the UI language.')
        .optional(),
      curve: z
        .enum(['linear', 'monotone'])
        .describe('Curve between points: linear (default) or monotone (smooth, no overshoot).')
        .optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaSparkline = createComponentImplementation(KatanaSparklineApi, ({ props }) => (
  <Cell weight={props.weight}>
    <Sparkline
      values={numberList(props.values)}
      label={props.label ?? ''}
      tone={props.tone}
      variant={props.variant}
      baseline={props.baseline}
      showLast={props.showLast}
      lastLabel={props.lastLabel}
      showExtremes={props.showExtremes}
      extremeLabels={props.extremeLabels?.length === 2 ? [props.extremeLabels[0]!, props.extremeLabels[1]!] : undefined}
      curve={props.curve}
    />
  </Cell>
))

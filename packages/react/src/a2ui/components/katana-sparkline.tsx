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
      times: numberListSchema(
        'Millisecond timestamp of each value, one to one with values; places points by time. Ignored when the count differs from values.',
      ).optional(),
      domain: z
        .array(z.number())
        .length(2)
        .describe(
          'The whole time span of the x axis in milliseconds as [start, end], such as a trading day: the line stops at the last point and the rest stays empty. Needs times.',
        )
        .optional(),
      sessions: z
        .array(z.array(z.number()).length(2))
        .describe(
          'Trading sessions in milliseconds as [start, end] pairs; the gaps between them are squeezed out and the line breaks there. Needs times.',
        )
        .optional(),
      axisPrice: z
        .boolean()
        .describe('Show four price ticks on the right. Ignored when the chart is shorter than 60px.')
        .optional(),
      lastTag: z
        .boolean()
        .describe('Show the latest value as a filled tag on the right axis, in the up or down color.')
        .optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

/** 时间戳要与数列一一对应才用；对不上整个丢掉，退回按序号铺（坏数据不拖垮整块）。 */
function pairs(values: number[], times: unknown, domain: unknown, sessions: unknown) {
  const stamps = numberList(times)
  if (stamps.length !== values.length || !stamps.length) return {}
  const span = Array.isArray(domain) && domain.length === 2 ? (numberList(domain) as number[]) : []
  const spans = Array.isArray(sessions)
    ? sessions.map((s) => numberList(s)).filter((s): s is [number, number] => s.length === 2)
    : []
  return {
    times: stamps,
    domain: span.length === 2 ? ([span[0]!, span[1]!] as const) : undefined,
    sessions: spans.length ? spans : undefined,
  }
}

export const KatanaSparkline = createComponentImplementation(KatanaSparklineApi, ({ props }) => {
  const values = numberList(props.values)
  return (
    <Cell weight={props.weight}>
      <Sparkline
        values={values}
        {...pairs(values, props.times, props.domain, props.sessions)}
        axis={props.axisPrice ? { price: true } : undefined}
        lastTag={props.lastTag}
        label={props.label ?? ''}
        tone={props.tone}
        variant={props.variant}
        baseline={props.baseline}
        showLast={props.showLast}
        lastLabel={props.lastLabel}
        showExtremes={props.showExtremes}
        extremeLabels={
          props.extremeLabels?.length === 2 ? [props.extremeLabels[0]!, props.extremeLabels[1]!] : undefined
        }
        curve={props.curve}
      />
    </Cell>
  )
})

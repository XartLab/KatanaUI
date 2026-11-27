// SPDX-License-Identifier: MIT
// KatanaRangeBar：区间条（最低到最高，标记指现价）。读屏名与两端小标题由智能体写；数怎么写只给小数位数，不收函数。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import { RangeBar } from '../../index.ts'
import { Cell, weightSchema } from '../support.tsx'

export const KatanaRangeBarApi = {
  name: 'KatanaRangeBar',
  schema: z
    .object({
      low: CommonSchemas.DynamicNumber.describe(
        'The lowest value. No marker is drawn when high is not greater than low.',
      ),
      high: CommonSchemas.DynamicNumber.describe('The highest value.'),
      value: CommonSchemas.DynamicNumber.describe('The current value. It sticks to the edge when outside the range.'),
      label: CommonSchemas.DynamicString.describe('Accessible name of the bar (for example "Day range").'),
      title: CommonSchemas.DynamicString.describe('A visible title above the track. Omit for none.').optional(),
      lowLabel: CommonSchemas.DynamicString.describe('Small caption above the low end (for example "Low").').optional(),
      highLabel: CommonSchemas.DynamicString.describe(
        'Small caption above the high end (for example "High").',
      ).optional(),
      digits: z
        .number()
        .int()
        .min(0)
        .max(6)
        .describe('Maximum number of decimal places for the numbers at both ends. Defaults to 2.')
        .optional(),
      marker: z
        .enum(['bar', 'triangle'])
        .describe("Marker style: a vertical 'bar' (default) or a 'triangle' below the track.")
        .optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

export const KatanaRangeBar = createComponentImplementation(KatanaRangeBarApi, ({ props }) => {
  const digits = props.digits ?? 2
  const format = useMemo(() => new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format, [digits])
  return (
    <Cell weight={props.weight}>
      <RangeBar
        low={num(props.low)}
        high={num(props.high)}
        value={num(props.value)}
        format={format}
        label={props.label ?? ''}
        title={props.title}
        lowLabel={props.lowLabel}
        highLabel={props.highLabel}
        marker={props.marker}
      />
    </Cell>
  )
})

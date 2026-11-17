// SPDX-License-Identifier: MIT
// KatanaPerformanceStrip：业绩条（一排周期格，上行周期名，下行涨跌幅）。点一格选中并写回 value，同时发 Action 让宿主去切图表区间。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { PerformanceStrip } from '../../quant/index.ts'
import { Cell, actionSchema, parseList, weightSchema } from '../support.tsx'

const itemSchema = z
  .object({
    key: z.string().min(1).describe('Stable id of the period (for example "1m").'),
    label: z.string().describe('The period name shown on the top row (for example "1 month").'),
    change: z
      .number()
      .nullable()
      .describe('The change over the period as a percentage already: 12.5 means +12.50%. Null when there is no data.'),
  })
  .strict()

export const KatanaPerformanceStripApi = {
  name: 'KatanaPerformanceStrip',
  schema: z
    .object({
      items: z
        .union([z.array(itemSchema), CommonSchemas.DataBinding])
        .describe(
          'The periods. Either a literal array or {"@path": "/performance"} bound to a data-model array. Items that do not fit the shape are dropped.',
        ),
      label: CommonSchemas.DynamicString.describe(
        'Accessible name of the strip (for example "Performance by period").',
      ),
      value: CommonSchemas.DynamicString.describe(
        'The key of the selected period. Bind it to the data model with {"@path": "/range"} so the choice is written back.',
      ).optional(),
      digits: z
        .number()
        .int()
        .min(0)
        .max(6)
        .default(2)
        .describe('Number of decimal places for the changes.')
        .optional(),
      onSelect: actionSchema(
        'Dispatched when the user presses a period. metadata.extensions.katanaPeriod.key carries the period key.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaPerformanceStrip = createComponentImplementation(KatanaPerformanceStripApi, ({ props }) => {
  const { onSelect } = props
  return (
    <Cell weight={props.weight}>
      <PerformanceStrip
        items={parseList(itemSchema, props.items)}
        label={props.label ?? ''}
        value={props.value || undefined}
        digits={props.digits}
        onValueChange={(key) => {
          props.setValue?.(key)
          void onSelect?.({ metadata: { extensions: { katanaPeriod: { key } } } })
        }}
      />
    </Cell>
  )
})

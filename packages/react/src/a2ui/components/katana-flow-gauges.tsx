// SPDX-License-Identifier: MIT
// KatanaFlowGauges：订单流四个仪表一行（市场压力、价格变化、挂单深度、多周期背离）。只收算好的数与区间，不算；窗口不足传 null 显示「无数据」字样。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { FlowGauges, type FlowGaugeData } from '../../quant/index.ts'
import { Cell, parseList, weightSchema } from '../support.tsx'

const signed = (kind: 'pressure' | 'priceChange', what: string) =>
  z
    .object({
      kind: z.literal(kind).describe(what),
      id: z.string().min(1).describe('Stable id of the gauge.'),
      title: z.string().describe('The small title, including the period (for example "Market pressure 1m").'),
      value: z
        .number()
        .min(-100)
        .max(100)
        .nullable()
        .describe(
          'From -100 to +100. Null when the window is too short: the not-available text is shown and no bar is drawn.',
        ),
      valueText: z.string().describe('The value, already formatted and signed (for example "+62").'),
      note: z.string().describe('A line of explanation: basis and window.').optional(),
      estimated: z
        .boolean()
        .describe('True when the number is estimated without trade direction: it is greyed and marked.')
        .optional(),
    })
    .strict()

const itemSchema = z.discriminatedUnion('kind', [
  signed('pressure', 'Market pressure: buying against selling, from -100 to +100.'),
  signed('priceChange', 'Price change over the window, from -100 to +100.'),
  z
    .object({
      kind: z.literal('dom').describe('Depth of the first levels of the order book.'),
      id: z.string().min(1).describe('Stable id of the gauge.'),
      title: z.string().describe('The small title.'),
      bids: z.array(z.number()).describe('Size at each bid level, from the best price outward.'),
      asks: z.array(z.number()).describe('Size at each ask level, from the best price outward.'),
      summary: z
        .string()
        .describe('A whole sentence for screen readers (for example "Bids 71%, asks 29%"); the bars have no text.'),
      note: z.string().describe('A line of explanation.').optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('divergence').describe('Delta against price divergence over several windows.'),
      id: z.string().min(1).describe('Stable id of the gauge.'),
      title: z.string().describe('The small title.'),
      rows: z
        .array(
          z
            .object({
              window: z.string().describe('The period of the row (for example "1m").'),
              cells: z
                .array(z.enum(['off', 'on', 'ok', 'warn']))
                .nullable()
                .describe('One light per cell. Null when there is not enough data.'),
              summary: z.string().describe('A whole sentence saying what the row means.'),
            })
            .strict(),
        )
        .describe('One row per period.'),
      note: z.string().describe('A line of explanation.').optional(),
    })
    .strict(),
])

export const KatanaFlowGaugesApi = {
  name: 'KatanaFlowGauges',
  schema: z
    .object({
      gauges: z
        .union([z.array(itemSchema), CommonSchemas.DataBinding])
        .describe(
          'The gauges, in display order. Either a literal array or {"@path": "/flow"} bound to a data-model array. Each is told apart by kind. Items that do not fit are dropped. Values are never calculated here.',
        ),
      label: CommonSchemas.DynamicString.describe('Accessible name of the whole row.'),
      naText: CommonSchemas.DynamicString.describe('The text drawn where there is no number (for example "N/A").'),
      estimateText: CommonSchemas.DynamicString.describe('The text of the estimate mark (for example "est.").'),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaFlowGauges = createComponentImplementation(KatanaFlowGaugesApi, ({ props }) => (
  <Cell weight={props.weight}>
    <FlowGauges
      gauges={parseList(itemSchema, props.gauges) as FlowGaugeData[]}
      label={props.label ?? ''}
      naText={props.naText ?? ''}
      estimateText={props.estimateText ?? ''}
    />
  </Cell>
))

// SPDX-License-Identifier: MIT
// KatanaKeyStats：关键数据网格（标题加若干「标签、数值、单位、徽标」）。数值由智能体格式化好传来；标题与每一项可点，只发 Action。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { z } from 'zod'
import { KeyStats } from '../../quant/index.ts'
import { Cell, actionSchema, parseList, weightSchema } from '../support.tsx'

const itemSchema = z
  .object({
    key: z.string().min(1).describe('Stable id of the stat. The host gets it back when the stat is pressed.'),
    label: z.string().describe('The small grey label.'),
    value: z
      .string()
      .describe('The value, already formatted. Use an empty string when there is no data; a dash is shown.')
      .optional(),
    unit: z.string().describe('A small unit after the value (for example "USD").').optional(),
    badge: z.string().describe('A small badge under the value.').optional(),
  })
  .strict()

export const KatanaKeyStatsApi = {
  name: 'KatanaKeyStats',
  schema: z
    .object({
      title: CommonSchemas.DynamicString.describe('The heading of the block. Also its accessible name.'),
      items: z
        .union([z.array(itemSchema), CommonSchemas.DataBinding])
        .describe(
          'The stats. Either a literal array or {"@path": "/stats"} bound to a data-model array. Items that do not fit the shape are dropped.',
        ),
      columns: z.number().int().min(1).max(6).default(3).describe('Number of grid columns.').optional(),
      onTitle: actionSchema(
        'Dispatched when the user presses the heading. When it is omitted the heading is plain text.',
      ).optional(),
      onItem: actionSchema(
        'Dispatched when the user presses a stat label. metadata.extensions.katanaStat.key carries the stat key. When it is omitted the labels are plain text.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaKeyStats = createComponentImplementation(KatanaKeyStatsApi, ({ props }) => {
  const { onTitle, onItem } = props
  return (
    <Cell weight={props.weight}>
      <KeyStats
        title={props.title ?? ''}
        items={parseList(itemSchema, props.items).map((item) => ({ ...item, value: item.value || undefined }))}
        columns={props.columns}
        onTitle={onTitle ? () => void onTitle() : undefined}
        onItem={
          onItem ? (item) => void onItem({ metadata: { extensions: { katanaStat: { key: item.key } } } }) : undefined
        }
      />
    </Cell>
  )
})

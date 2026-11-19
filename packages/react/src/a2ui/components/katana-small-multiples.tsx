// SPDX-License-Identifier: MIT
// KatanaSmallMultiples：小图阵列，一个品种一张小折线，同步十字线。点标题发 Action，被点的那张由 metadata.extensions.katanaChartPoint 带给宿主。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { useMemo } from 'react'
import { z } from 'zod'
import { SmallMultiples } from '../../blocks/index.ts'
import { dispatch, formatSchema, listSchema, makeFormat, numbersCapped, parseCapped, text } from '../chart-support.ts'
import { Cell, actionSchema, weightSchema } from '../support.tsx'

const MAX_TILES = 60
const MAX_VALUES = 2000

const itemSchema = z
  .object({
    key: z.string().min(1).describe('Stable id of the tile. The host gets it back when the tile is chosen.'),
    label: text('Title of the tile, for example the instrument name.'),
    values: z
      .array(z.number())
      .max(MAX_VALUES)
      .describe('Values from oldest to newest, at most 2000. All tiles share the same x positions.'),
  })
  .strict()

type Item = z.infer<typeof itemSchema>

export const KatanaSmallMultiplesApi = {
  name: 'KatanaSmallMultiples',
  schema: z
    .object({
      items: listSchema(itemSchema, MAX_TILES, 'The tiles, one small line chart each.'),
      label: text('Accessible name of the whole array as a sentence.'),
      valueFormat: formatSchema('How the value at the end of each tile title is written.').optional(),
      xLabels: seriesSchemaStrings(
        'What each x position is called, in the same order as values (for example dates). Omit to hide the read-out row.',
      ).optional(),
      yScale: z
        .enum(['each', 'shared'])
        .default('each')
        .describe(
          "'each' gives every tile its own vertical range (shapes); 'shared' uses one range for all (comparable).",
        )
        .optional(),
      onSelect: actionSchema(
        'Dispatched when the user chooses a tile title. metadata.extensions.katanaChartPoint carries {key}. Without it titles are not interactive.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

function seriesSchemaStrings(what: string) {
  return z.array(z.string()).max(MAX_VALUES).describe(what)
}

export const KatanaSmallMultiples = createComponentImplementation(KatanaSmallMultiplesApi, ({ props }) => {
  const items = useMemo(
    () =>
      parseCapped<Item>(itemSchema, props.items, MAX_TILES).map((item) => ({
        key: item.key,
        label: item.label,
        values: numbersCapped(item.values, MAX_VALUES),
      })),
    [props.items],
  )
  const format = useMemo(() => makeFormat(props.valueFormat), [props.valueFormat])
  const xLabels = props.xLabels
  return (
    <Cell weight={props.weight}>
      <SmallMultiples
        items={items}
        label={props.label ?? ''}
        formatValue={format}
        formatX={xLabels ? (index) => xLabels[index] ?? '' : undefined}
        yScale={props.yScale}
        onSelect={props.onSelect ? (key) => dispatch(props.onSelect, 'katanaChartPoint', { key }) : undefined}
      />
    </Cell>
  )
})

// SPDX-License-Identifier: MIT
// KatanaSlopeChart：斜率图，每项两端各一个值（前后对比），线的升降一眼可见；rank 模式比名次。项是对象数组（可 @path 绑定）；
// 点一项发 Action，被点的项由 metadata.extensions.katanaChartPoint 带给宿主。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { useMemo } from 'react'
import { z } from 'zod'
import { SlopeChart, type SlopeItem } from '../../quant/index.ts'
import {
  MAX_ITEMS,
  dispatch,
  formatSchema,
  listSchema,
  makeFormat,
  parseCapped,
  text,
  viewProps,
  viewShape,
} from '../chart-support.ts'
import { Cell, actionSchema, fill, weightSchema } from '../support.tsx'

const itemSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the item. The host gets it back when the item is chosen.'),
    label: text('Name of the item, written at both ends of the line.'),
    before: z.number().describe('Value at the left end.'),
    after: z.number().describe('Value at the right end.'),
  })
  .strict()

export const KatanaSlopeChartApi = {
  name: 'KatanaSlopeChart',
  schema: z
    .object({
      items: listSchema(itemSchema, MAX_ITEMS, 'The items, one line each.'),
      label: text('Accessible name of the whole chart as a sentence.'),
      columns: z
        .object({ before: text('Head of the left column.'), after: text('Head of the right column.') })
        .strict()
        .describe('Heads of the two columns, for example before and after.'),
      describe: text(
        'One sentence for an item (accessible name and read-out) with {label}, {before}, {after} and {change}, for example "{label}: {before} to {after} ({change})".',
      ),
      mode: z
        .enum(['value', 'rank'])
        .describe(
          "'value' puts the numbers on the axis; 'rank' ranks the items at each end (first on top) and the line shows rank moves. Defaults to value.",
        )
        .optional(),
      valueFormat: formatSchema('How a value or a rank is written at the ends.').optional(),
      changeFormat: formatSchema(
        'How the change is written in {change}. Use signed. Defaults to valueFormat.',
      ).optional(),
      idle: z.string().describe('What the read-out says when nothing is hovered or focused.').optional(),
      actionLabels: viewShape.actionLabels,
      tableLabel: viewShape.tableLabel,
      tableHead: viewShape.tableHead,
      source: viewShape.source,
      onSelect: actionSchema(
        'Dispatched when the user chooses an item. metadata.extensions.katanaChartPoint carries {id}. Without it items are not interactive.',
      ).optional(),
      onExport: viewShape.onExport,
      onFullscreen: viewShape.onFullscreen,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaSlopeChart = createComponentImplementation(KatanaSlopeChartApi, ({ props }) => {
  const items = useMemo<SlopeItem[]>(() => parseCapped(itemSchema, props.items, MAX_ITEMS), [props.items])
  const format = useMemo(() => makeFormat(props.valueFormat), [props.valueFormat])
  const change = useMemo(
    () => makeFormat(props.changeFormat ?? props.valueFormat),
    [props.changeFormat, props.valueFormat],
  )
  const label = props.label ?? ''
  const { columns, actionLabels, tableLabel, tableHead } = props
  if (!columns || !actionLabels || !tableLabel || !tableHead) return null
  return (
    <Cell weight={props.weight}>
      <SlopeChart
        items={items}
        label={label}
        columns={columns}
        describe={(item, delta) =>
          fill(props.describe ?? '', {
            label: item.label,
            before: format(item.before),
            after: format(item.after),
            change: change(delta),
          })
        }
        mode={props.mode}
        formatValue={format}
        idle={props.idle}
        onSelect={props.onSelect ? (item) => dispatch(props.onSelect, 'katanaChartPoint', { id: item.id }) : undefined}
        {...viewProps({ ...props, actionLabels, tableLabel, tableHead }, label)}
      />
    </Cell>
  )
})

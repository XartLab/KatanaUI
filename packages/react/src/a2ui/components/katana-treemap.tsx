// SPDX-License-Identifier: MIT
// KatanaTreemap：矩形树图，面积按大小、颜色按涨跌分七档。条目是对象数组（可 @path 绑定）；点格子或组头发 Action，被点的项由 metadata.extensions.katanaChartPoint 带给宿主。
// 排布由 layoutTreemap 算（智能体不传坐标）；下钻要换数据，由宿主处理 Action 后改 items。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { useMemo } from 'react'
import { z } from 'zod'
import { Treemap, layoutTreemap, type TreemapItem } from '../../index.ts'
import { MAX_ITEMS, dispatch, listSchema, parseCapped, text } from '../chart-support.ts'
import { Cell, actionSchema, weightSchema } from '../support.tsx'

const itemSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the cell. The host gets it back when the cell is chosen.'),
    name: text('Name written in the cell.'),
    group: z
      .string()
      .describe(
        'Group the cell belongs to, for example the sector. Cells without one go to a group with an empty name.',
      )
      .optional(),
    size: z
      .number()
      .min(1e-9)
      .describe('Area weight, for example market value. Cells with no positive size are not drawn.'),
    change: z
      .number()
      .nullable()
      .describe('Change that sets the color, as a decimal: 0.012 means +1.2%. Null draws a neutral cell.'),
    text: text('The number written under the name, already formatted, for example "+1.20%".'),
  })
  .strict()

type Item = z.infer<typeof itemSchema>

export const KatanaTreemapApi = {
  name: 'KatanaTreemap',
  schema: z
    .object({
      items: listSchema(itemSchema, MAX_ITEMS, 'The cells.'),
      label: text('Accessible name of the whole treemap as a sentence.'),
      grouped: z.boolean().describe('Draw group blocks with a header. Defaults to true.').optional(),
      limit: z
        .number()
        .min(1e-9)
        .max(1)
        .describe(
          'Where the color scale ends, as a decimal. Changes are cut at plus and minus this value into seven steps. Defaults to 0.03.',
        )
        .optional(),
      legend: z
        .array(z.string().min(1))
        .length(7)
        .describe(
          'Text under the color scale for the seven steps, from the strongest fall to the strongest rise, for example "-3%" to "+3%".',
        ),
      onItem: actionSchema(
        'Dispatched when the user chooses a cell. metadata.extensions.katanaChartPoint carries {id, name}.',
      ).optional(),
      onGroup: actionSchema(
        'Dispatched when the user chooses a group header. metadata.extensions.katanaChartPoint carries {group}.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaTreemap = createComponentImplementation(KatanaTreemapApi, ({ props }) => {
  const grouped = props.grouped ?? true
  const blocks = useMemo(() => {
    const items: TreemapItem<Item>[] = parseCapped<Item>(itemSchema, props.items, MAX_ITEMS).map((item) => ({
      data: item,
      size: item.size,
      group: item.group ?? '',
    }))
    return layoutTreemap(items, grouped)
  }, [props.items, grouped])
  const legend = props.legend ?? []
  return (
    <Cell weight={props.weight}>
      <div role="group" aria-label={props.label ?? ''}>
        <Treemap
          blocks={blocks}
          heads={grouped}
          limit={props.limit}
          describe={(item) => ({ name: item.name, text: item.text, change: item.change })}
          legendText={(step) => legend[step + 3] ?? ''}
          onItem={
            props.onItem
              ? (item) => dispatch(props.onItem, 'katanaChartPoint', { id: item.id, name: item.name })
              : undefined
          }
          onGroup={props.onGroup ? (group) => dispatch(props.onGroup, 'katanaChartPoint', { group }) : undefined}
        />
      </div>
    </Cell>
  )
})

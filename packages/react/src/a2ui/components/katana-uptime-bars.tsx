// SPDX-License-Identifier: MIT
// KatanaUptimeBars：可用率条，一格一个时段（正常、降级、中断、无数据）。格是对象数组（可 @path 绑定）；状态永远「灯加词」，词由智能体给。
// 点一格发 Action，被点的格由 metadata.extensions.katanaChartPoint 带给宿主。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { useMemo } from 'react'
import { z } from 'zod'
import { UptimeBars } from '../../index.ts'
import { dispatch, listSchema, parseCapped, text, viewProps, viewShape } from '../chart-support.ts'
import { Cell, actionSchema, weightSchema } from '../support.tsx'

const MAX_CELLS = 1000

const cellSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the cell. The host gets it back when the cell is chosen.'),
    status: z
      .enum(['up', 'degraded', 'down', 'none'])
      .describe('up is normal, degraded is partial, down is an outage, none is no data.'),
    label: text(
      'A whole sentence for the cell (accessible name and read-out): the time, the state and the number of outages.',
    ),
  })
  .strict()

type UptimeCell = z.infer<typeof cellSchema>

export const KatanaUptimeBarsApi = {
  name: 'KatanaUptimeBars',
  schema: z
    .object({
      cells: listSchema(cellSchema, MAX_CELLS, 'The cells from oldest to newest.'),
      label: text('Accessible name of the whole bar as a sentence, for example "Market data feed A, last 30 days".'),
      idle: z
        .string()
        .describe('What the read-out says when nothing is hovered or focused, often the availability.')
        .optional(),
      statusLabels: z
        .object({
          up: text('Word for the normal state.'),
          degraded: text('Word for the degraded state.'),
          down: text('Word for the outage state.'),
          none: text('Word for the no data state.'),
        })
        .strict()
        .describe('One word per state; a row of lamp, word and count is drawn above the bar. Omit to hide the row.')
        .optional(),
      availability: z
        .string()
        .describe(
          'Availability already written as text, shown at the right of the row above the bar, for example "99.1 %".',
        )
        .optional(),
      range: z
        .array(z.string())
        .length(2)
        .describe('Times at both ends of the bar, written as text in ISO order.')
        .optional(),
      actionLabels: viewShape.actionLabels,
      tableLabel: viewShape.tableLabel,
      tableHead: viewShape.tableHead,
      source: viewShape.source,
      onSelect: actionSchema(
        'Dispatched when the user chooses a cell. metadata.extensions.katanaChartPoint carries {id, status}. Without it cells are not interactive.',
      ).optional(),
      onExport: viewShape.onExport,
      onFullscreen: viewShape.onFullscreen,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaUptimeBars = createComponentImplementation(KatanaUptimeBarsApi, ({ props }) => {
  const cells = useMemo(() => parseCapped<UptimeCell>(cellSchema, props.cells, MAX_CELLS), [props.cells])
  const label = props.label ?? ''
  const { actionLabels, tableLabel, tableHead } = props
  if (!actionLabels || !tableLabel || !tableHead) return null
  return (
    <Cell weight={props.weight}>
      <UptimeBars
        cells={cells}
        label={label}
        idle={props.idle}
        statusLabels={props.statusLabels}
        availability={props.availability}
        range={props.range && props.range.length === 2 ? [props.range[0] ?? '', props.range[1] ?? ''] : undefined}
        onSelect={
          props.onSelect
            ? (cell) => dispatch(props.onSelect, 'katanaChartPoint', { id: cell.id, status: cell.status })
            : undefined
        }
        {...viewProps({ ...props, actionLabels, tableLabel, tableHead }, label)}
      />
    </Cell>
  )
})

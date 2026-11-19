// SPDX-License-Identifier: MIT
// KatanaConnectedScatter：连线散点（点按时间顺序连起来，末端带箭头，看两个量怎么一起走）。序列是对象数组（可 @path 绑定）；
// 每个点的整句（读屏名与读数）由智能体写。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { useMemo } from 'react'
import { z } from 'zod'
import { ConnectedScatter, type ScatterSeries } from '../../quant/index.ts'
import {
  pair,
  formatSchema,
  listSchema,
  makeFormat,
  parseCapped,
  text,
  viewProps,
  viewShape,
} from '../chart-support.ts'
import { Cell, weightSchema } from '../support.tsx'

const MAX_SERIES = 20
const MAX_POINTS_PER_SERIES = 1000

const pointSchema = z
  .object({
    x: z.number().describe('Horizontal value.'),
    y: z.number().describe('Vertical value.'),
    label: text(
      'A whole sentence for this point, used as its accessible name and read-out, for example "2026-03: volatility 12%, return 8%".',
    ),
  })
  .strict()

const seriesDef = z
  .object({
    id: z.string().min(1).describe('Stable id of the series.'),
    label: text('Name of the series.'),
    points: z
      .array(pointSchema)
      .max(MAX_POINTS_PER_SERIES)
      .describe('Points in time order, at most 1000. The line connects them in this order.'),
  })
  .strict()

type Series = z.infer<typeof seriesDef>

export const KatanaConnectedScatterApi = {
  name: 'KatanaConnectedScatter',
  schema: z
    .object({
      series: listSchema(seriesDef, MAX_SERIES, 'The series, one connected line each.'),
      label: text('Accessible name of the whole chart as a sentence.'),
      axes: z
        .object({ x: text('Name of the horizontal axis.'), y: text('Name of the vertical axis.') })
        .strict()
        .describe('Names of the two axes.'),
      xFormat: formatSchema('How a horizontal value is written on the axis.').optional(),
      yFormat: formatSchema('How a vertical value is written on the axis.').optional(),
      xDomain: z
        .array(z.number())
        .length(2)
        .describe('Horizontal range [min, max]. Defaults to the data with 5% margin.')
        .optional(),
      yDomain: z
        .array(z.number())
        .length(2)
        .describe('Vertical range [min, max]. Defaults to the data with 5% margin.')
        .optional(),
      idle: z.string().describe('What the read-out says when nothing is hovered or focused.').optional(),
      actionLabels: viewShape.actionLabels,
      tableLabel: viewShape.tableLabel,
      tableHead: viewShape.tableHead,
      source: viewShape.source,
      onExport: viewShape.onExport,
      onFullscreen: viewShape.onFullscreen,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaConnectedScatter = createComponentImplementation(KatanaConnectedScatterApi, ({ props }) => {
  const series = useMemo<ScatterSeries[]>(
    () =>
      parseCapped<Series>(seriesDef, props.series, MAX_SERIES).map((item) => ({
        id: item.id,
        label: item.label,
        points: item.points,
      })),
    [props.series],
  )
  const fx = useMemo(() => makeFormat(props.xFormat), [props.xFormat])
  const fy = useMemo(() => makeFormat(props.yFormat), [props.yFormat])
  const label = props.label ?? ''
  const { axes, actionLabels, tableLabel, tableHead } = props
  if (!axes || !actionLabels || !tableLabel || !tableHead) return null
  return (
    <Cell weight={props.weight}>
      <ConnectedScatter
        series={series}
        label={label}
        axes={axes}
        formatX={fx}
        formatY={fy}
        xDomain={pair(props.xDomain)}
        yDomain={pair(props.yDomain)}
        idle={props.idle}
        {...viewProps({ ...props, actionLabels, tableLabel, tableHead }, label)}
      />
    </Cell>
  )
})

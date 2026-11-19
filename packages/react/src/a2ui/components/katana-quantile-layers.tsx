// SPDX-License-Identifier: MIT
// KatanaQuantileLayers：因子分层累计收益（每层一条线、多空差一条线、单调性结论、统计行）。层是对象数组（可 @path 绑定），每层序列有上限。
// 图头的表格视图总有，导出与全屏只在给了 Action 时出按钮。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { useMemo } from 'react'
import { z } from 'zod'
import { QuantileLayers, type QuantileLayer } from '../../quant/index.ts'
import {
  dispatch,
  formatSchema,
  listSchema,
  makeFormat,
  numbersCapped,
  parseCapped,
  text,
  viewShape,
} from '../chart-support.ts'
import { Cell, weightSchema } from '../support.tsx'

const MAX_LAYERS = 20
const MAX_VALUES = 2000

const layerSchema = z
  .object({
    rank: z.number().int().min(1).describe('Layer number from 1; a higher number means a higher factor value.'),
    label: text('Name of the layer.'),
    points: z
      .array(z.number())
      .max(MAX_VALUES)
      .describe('Cumulative return of the layer on each x position, at most 2000, the same count for every layer.'),
  })
  .strict()

type Layer = z.infer<typeof layerSchema>

export const KatanaQuantileLayersApi = {
  name: 'KatanaQuantileLayers',
  schema: z
    .object({
      layers: listSchema(layerSchema, MAX_LAYERS, 'The layers.'),
      longShort: z
        .array(z.number())
        .max(MAX_VALUES)
        .describe('Cumulative return of the long-short spread (top layer minus bottom layer), one per x position.'),
      longShortLabel: text('Name of the long-short line.'),
      title: z
        .string()
        .describe('Title of the chart, for example the factor name and the number of layers.')
        .optional(),
      xLabels: z
        .array(z.string())
        .max(MAX_VALUES)
        .describe('What each x position is called (for example its date), in the order of the series.'),
      valueFormat: formatSchema(
        'How a cumulative return is written on the axis, in the tooltip and in the table.',
      ).optional(),
      monotonic: z
        .boolean()
        .describe(
          'Whether the layers are monotonic. Omit to let the chart check that the last values rise with the layer number.',
        )
        .optional(),
      stats: z
        .array(
          z
            .object({
              key: z.string().min(1),
              label: text('Name of the statistic.'),
              value: z.string().describe('The statistic already written as text.'),
            })
            .strict(),
        )
        .max(8)
        .describe('The conclusion line, for example annualized long-short return, turnover, sample size.'),
      labels: z
        .object({
          chart: text('Accessible name of the whole chart.'),
          actions: viewShape.actionLabels,
          x: text('Head of the first table column (the x axis).'),
          layers: text('Accessible name of the row of layer buttons.'),
          table: text('Accessible name of the table view.'),
          monotonicPass: text('The word when the layers are monotonic.'),
          monotonicFail: text('The word when they are not.'),
          monotonic: text('Name of the monotonicity item.'),
          tooMany: text('Text shown instead of lines when there are too many layers to draw.'),
        })
        .strict()
        .describe('All visible words of the chart; it carries none of its own.'),
      source: viewShape.source,
      onExport: viewShape.onExport,
      onFullscreen: viewShape.onFullscreen,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaQuantileLayers = createComponentImplementation(KatanaQuantileLayersApi, ({ props }) => {
  const layers = useMemo<QuantileLayer[]>(
    () =>
      parseCapped<Layer>(layerSchema, props.layers, MAX_LAYERS).map((layer) => ({
        rank: layer.rank,
        label: layer.label,
        points: numbersCapped(layer.points, MAX_VALUES),
      })),
    [props.layers],
  )
  const format = useMemo(() => makeFormat(props.valueFormat), [props.valueFormat])
  const xLabels = props.xLabels ?? []
  const { labels } = props
  if (!labels) return null
  const label = labels.chart
  return (
    <Cell weight={props.weight}>
      <QuantileLayers
        layers={layers}
        longShort={numbersCapped(props.longShort, MAX_VALUES)}
        longShortLabel={props.longShortLabel ?? ''}
        labels={labels}
        formatValue={format}
        formatX={(index) => xLabels[index] ?? ''}
        monotonic={props.monotonic}
        stats={props.stats ?? []}
        source={props.source}
        title={props.title}
        onExport={props.onExport ? () => dispatch(props.onExport, 'katanaChart', { label }) : undefined}
        onFullscreen={props.onFullscreen ? () => dispatch(props.onFullscreen, 'katanaChart', { label }) : undefined}
      />
    </Cell>
  )
})

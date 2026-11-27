// SPDX-License-Identifier: MIT
// KatanaValuationBand：估值带（价格叠 PE / PB 历史分位带、当前分位读数、表格视图）。价格与倍数序列同长，可以给上限内的数组。
// 带名与当前分位的模板里 {q}（分位，如 25）、{level}（该档倍数）、{p}（当前分位）会被换掉。全部文字由智能体写。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { useMemo } from 'react'
import { z } from 'zod'
import { ValuationBand } from '../../quant/index.ts'
import { dispatch, formatSchema, makeFormat, text, viewShape } from '../chart-support.ts'
import { Cell, fill, weightSchema } from '../support.tsx'

const MAX_VALUES = 5000

const seriesOrNull = z.array(z.number().nullable()).max(MAX_VALUES)

export const KatanaValuationBandApi = {
  name: 'KatanaValuationBand',
  schema: z
    .object({
      prices: seriesOrNull.describe('Prices, one per x position.'),
      multiples: seriesOrNull.describe(
        'The valuation multiple (PE or PB) on the same x positions; negative values are left out.',
      ),
      quantiles: z
        .array(z.number().min(0).max(1))
        .min(1)
        .max(9)
        .describe('Quantile levels from low to high, 0..1. Defaults to 0.1, 0.25, 0.5, 0.75, 0.9.')
        .optional(),
      xLabels: z.array(z.string()).max(MAX_VALUES).describe('What each x position is called (its date).'),
      priceFormat: formatSchema('How a price is written.').optional(),
      multipleFormat: formatSchema('How a multiple is written.').optional(),
      title: z.string().describe('Title of the chart.').optional(),
      labels: z
        .object({
          chart: text('Accessible name of the chart.'),
          actions: viewShape.actionLabels,
          table: text('Accessible name of the table view.'),
          x: text('Head of the first table column.'),
          price: text('Name of the price line.'),
          multiple: text('Name of the multiple, for example PE.'),
          band: text('Name of one band; {q} is the percentile number and {level} the multiple.'),
          percentile: text('Reading of the current percentile; {p} is the percentile number.'),
          empty: text('Text when no usable multiple exists.'),
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

const clean = (values: unknown): (number | null)[] =>
  Array.isArray(values)
    ? values.slice(0, MAX_VALUES).map((value) => (typeof value === 'number' && Number.isFinite(value) ? value : null))
    : []

export const KatanaValuationBand = createComponentImplementation(KatanaValuationBandApi, ({ props }) => {
  const prices = useMemo(() => clean(props.prices), [props.prices])
  const multiples = useMemo(() => clean(props.multiples), [props.multiples])
  const price = useMemo(() => makeFormat(props.priceFormat), [props.priceFormat])
  const multiple = useMemo(() => makeFormat(props.multipleFormat), [props.multipleFormat])
  const xLabels = props.xLabels ?? []
  const { labels } = props
  if (!labels) return null
  const label = labels.chart
  return (
    <Cell weight={props.weight}>
      <ValuationBand
        prices={prices}
        multiples={multiples}
        quantiles={props.quantiles}
        title={props.title}
        source={props.source}
        formatPrice={price}
        formatMultiple={multiple}
        formatX={(index) => xLabels[index] ?? ''}
        labels={{
          ...labels,
          band: (q, level) =>
            fill(labels.band, { q: Math.round(q * 100), level: level === null ? '' : multiple(level) }),
          percentile: (p) => fill(labels.percentile, { p: Math.round(p * 100) }),
        }}
        onExport={props.onExport ? () => dispatch(props.onExport, 'katanaChart', { label }) : undefined}
        onFullscreen={props.onFullscreen ? () => dispatch(props.onFullscreen, 'katanaChart', { label }) : undefined}
      />
    </Cell>
  )
})

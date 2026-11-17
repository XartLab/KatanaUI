// SPDX-License-Identifier: MIT
// KatanaBrushChart：主图加概览条，拖概览条里的窗口只看一段。序列可字面量也可 @path 绑定；窗口变了发 Action，起止下标由 metadata.extensions.katanaChartWindow 带给宿主。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { useMemo } from 'react'
import { z } from 'zod'
import { BrushChart } from '../../quant/index.ts'
import { MAX_POINTS, dispatch, formatSchema, makeFormat, numbersCapped, seriesSchema, text } from '../chart-support.ts'
import { Cell, actionSchema, weightSchema } from '../support.tsx'

export const KatanaBrushChartApi = {
  name: 'KatanaBrushChart',
  schema: z
    .object({
      values: seriesSchema(MAX_POINTS, 'The whole series from oldest to newest.'),
      xLabels: z
        .array(z.string())
        .max(MAX_POINTS)
        .describe(
          'What each point is called (for example its date), in the same order as values. Missing entries read as empty.',
        ),
      label: text('Accessible name of the whole chart as a sentence.'),
      valueFormat: formatSchema('How a value is written on the axis and in the read-out.').optional(),
      labels: z
        .object({
          start: text('Accessible name of the left handle of the window.'),
          end: text('Accessible name of the right handle of the window.'),
          window: text('Accessible name of the window as a whole.'),
        })
        .strict()
        .describe('Accessible names of the two handles and of the window.'),
      defaultValue: z
        .array(z.number().int().min(0))
        .length(2)
        .describe('Initial window as [start, end) point indexes. Defaults to the whole series.')
        .optional(),
      onValueChange: actionSchema(
        'Dispatched when the user moves or resizes the window. metadata.extensions.katanaChartWindow carries {fromIndex, toIndex, from, to}; from and to are the xLabels at both ends.',
      ).optional(),
      defaultWindow: z
        .array(z.number().int().min(0))
        .length(2)
        .describe('Deprecated: use defaultValue. Kept for one release.')
        .optional(),
      onWindowChange: actionSchema('Deprecated: use onValueChange. Kept for one release.').optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaBrushChart = createComponentImplementation(KatanaBrushChartApi, ({ props }) => {
  const values = useMemo(() => numbersCapped(props.values), [props.values])
  const format = useMemo(() => makeFormat(props.valueFormat), [props.valueFormat])
  const xLabels = props.xLabels ?? []
  const { labels } = props
  const initial = props.defaultValue ?? props.defaultWindow
  if (!labels) return null
  return (
    <Cell weight={props.weight}>
      <BrushChart
        values={values}
        label={props.label ?? ''}
        formatX={(index) => xLabels[index] ?? ''}
        formatValue={format}
        labels={labels}
        defaultValue={initial ? [initial[0] ?? 0, initial[1] ?? 1] : undefined}
        onValueChange={(window) =>
          dispatch(props.onValueChange ?? props.onWindowChange, 'katanaChartWindow', {
            fromIndex: window[0],
            toIndex: window[1] - 1,
            from: xLabels[window[0]] ?? '',
            to: xLabels[window[1] - 1] ?? '',
          })
        }
      />
    </Cell>
  )
})

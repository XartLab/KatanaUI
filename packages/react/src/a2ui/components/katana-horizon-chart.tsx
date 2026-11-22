// SPDX-License-Identifier: MIT
// KatanaHorizonChart：地平线图，一行一条序列，用叠色带在很矮的行里放下正负值。行是对象数组（可 @path 绑定），每行的数列有上限。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { useMemo } from 'react'
import { z } from 'zod'
import { HorizonChart } from '../../quant/index.ts'
import { formatSchema, listSchema, makeFormat, numbersCapped, parseCapped, text } from '../chart-support.ts'
import { Cell, weightSchema } from '../support.tsx'

const MAX_ROWS = 100
const MAX_VALUES = 2000

const rowSchema = z
  .object({
    key: z.string().min(1).describe('Stable id of the row.'),
    label: text('Name of the row.'),
    values: z
      .array(z.number())
      .max(MAX_VALUES)
      .describe('Signed values from oldest to newest, at most 2000, the same count for every row.'),
  })
  .strict()

type Row = z.infer<typeof rowSchema>

export const KatanaHorizonChartApi = {
  name: 'KatanaHorizonChart',
  schema: z
    .object({
      rows: listSchema(rowSchema, MAX_ROWS, 'The rows, one series each.'),
      label: text('Accessible name of the whole chart as a sentence.'),
      valueFormat: formatSchema('How the value at the right of each row is written. Use signed.').optional(),
      xLabels: z
        .array(z.string())
        .max(MAX_VALUES)
        .describe('What each x position is called, in the order of values. Omit to hide the read-out row.')
        .optional(),
      bands: z.number().int().min(2).max(6).describe('How many color bands. Defaults to 3.').optional(),
      scale: z
        .enum(['shared', 'row'])
        .describe("'shared' uses one full scale for all rows (comparable); 'row' scales each row on its own (shapes).")
        .optional(),
      max: z
        .number()
        .min(1e-9)
        .describe('A fixed full scale, same unit as the values. Omit to derive it from the data.')
        .optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaHorizonChart = createComponentImplementation(KatanaHorizonChartApi, ({ props }) => {
  const rows = useMemo(
    () =>
      parseCapped<Row>(rowSchema, props.rows, MAX_ROWS).map((row) => ({
        key: row.key,
        label: row.label,
        values: numbersCapped(row.values, MAX_VALUES),
      })),
    [props.rows],
  )
  const format = useMemo(() => makeFormat(props.valueFormat), [props.valueFormat])
  const xLabels = props.xLabels
  return (
    <Cell weight={props.weight}>
      <HorizonChart
        rows={rows}
        label={props.label ?? ''}
        formatValue={format}
        formatX={xLabels ? (index) => xLabels[index] ?? '' : undefined}
        bands={props.bands}
        scale={props.scale}
        max={props.max}
      />
    </Cell>
  )
})

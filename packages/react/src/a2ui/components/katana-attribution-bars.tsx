// SPDX-License-Identifier: MIT
// KatanaAttributionBars：盈亏归因，钱从哪来。条目是对象数组（可 @path 绑定）；点一行发 Action，被点的项由 metadata.extensions.katanaChartPoint 带给宿主。
// 维度与区间的切换要宿主换数据，这一版不暴露（智能体直接换 items）。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import { AttributionBars, type AttributionItem } from '../../blocks/index.ts'
import {
  MAX_ITEMS,
  dispatch,
  formatSchema,
  listSchema,
  makeFormat,
  parseCapped,
  text,
  viewShape,
} from '../chart-support.ts'
import { Cell, actionSchema, fill, weightSchema } from '../support.tsx'

const itemSchema = z
  .object({
    key: z.string().min(1).describe('Stable id of the item. The host gets it back when the row is chosen.'),
    label: text('Name of the row, for example a ticker and a company name.'),
    value: z.number().describe('Contribution to profit and loss, signed, in the currency of the account.'),
    kind: z
      .enum(['item', 'fee'])
      .describe("'fee' is fees and taxes: always the last row, never colored as a loss.")
      .optional(),
    closed: z
      .string()
      .describe('A short tag shown after the name when the position is closed, for example "closed 09-18".')
      .optional(),
    detail: z
      .array(z.object({ label: z.string(), value: z.string() }).strict())
      .max(8)
      .describe('Extra lines in the tooltip, already written as text.')
      .optional(),
  })
  .strict()

type Item = z.infer<typeof itemSchema>

export const KatanaAttributionBarsApi = {
  name: 'KatanaAttributionBars',
  schema: z
    .object({
      items: listSchema(
        itemSchema,
        MAX_ITEMS,
        'The contributions. The chart sorts them by size, groups gains and losses and folds the small ones.',
      ),
      title: text('Title of the chart.'),
      meta: z
        .string()
        .describe('One line under the title. {scale} is replaced by the symmetric axis limit written with valueFormat.')
        .optional(),
      label: text('Accessible name of the whole chart as a sentence.'),
      valueFormat: formatSchema('How a contribution is written in the row and the tooltip. Use signed.').optional(),
      shareFormat: z
        .number()
        .int()
        .min(0)
        .max(3)
        .describe('Decimal places of the share column, written as a percentage. Defaults to 1.')
        .optional(),
      labels: z
        .object({
          other: text(
            'Name of the folded row, with {n} where the number of folded items goes, for example "Other x{n}".',
          ),
          share: text('Label of the share line in the tooltip.'),
        })
        .strict()
        .describe('Words of the chart: the folded row and the share line. Required (or the deprecated pair below).')
        .optional(),
      otherLabel: text('Deprecated: use labels.other. Kept for one release.').optional(),
      shareLabel: text('Deprecated: use labels.share. Kept for one release.').optional(),
      readouts: z
        .array(
          z
            .object({
              key: z.string().min(1),
              label: text('Name of the readout, for example Total.'),
              text: z.string().describe('The readout already written as text.'),
              value: z.number().describe('Sign decides the color of the text.').optional(),
            })
            .strict(),
        )
        .max(6)
        .describe('The summary line. The first is the total and is drawn larger.')
        .optional(),
      focusKey: CommonSchemas.DynamicString.describe(
        'Key of the row to highlight, for example the instrument the user is looking at.',
      ).optional(),
      heads: z
        .object({
          index: text('Head of the row number column.'),
          item: text('Head of the name column.'),
          value: text('Head of the contribution column.'),
          share: text('Head of the share column.'),
          shareTitle: z.string().describe('Hover text of the share head, naming the denominator.').optional(),
        })
        .strict()
        .describe('Column heads; the table view uses them too.'),
      footer: z
        .object({
          count: text('Footer text on item count, for example "12 items".'),
          source: z.string().optional(),
          note: z.string().optional(),
        })
        .strict()
        .describe('The footer line.'),
      actionLabels: viewShape.actionLabels,
      maxItems: z
        .number()
        .int()
        .min(2)
        .max(20)
        .describe('How many rows to show before folding into one. Defaults to 7.')
        .optional(),
      onSelect: actionSchema(
        'Dispatched when the user chooses a row. metadata.extensions.katanaChartPoint carries {key}. Without it rows are not interactive.',
      ).optional(),
      onExport: viewShape.onExport,
      onFullscreen: viewShape.onFullscreen,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaAttributionBars = createComponentImplementation(KatanaAttributionBarsApi, ({ props }) => {
  const items = useMemo<AttributionItem[]>(
    () =>
      parseCapped<Item>(itemSchema, props.items, MAX_ITEMS).map((item) => ({
        key: item.key,
        label: item.label,
        value: item.value,
        ...(item.kind === undefined ? {} : { kind: item.kind }),
        ...(item.closed === undefined ? {} : { closed: item.closed }),
        ...(item.detail === undefined ? {} : { detail: item.detail }),
      })),
    [props.items],
  )
  const format = useMemo(() => makeFormat(props.valueFormat), [props.valueFormat])
  const share = useMemo(() => makeFormat({ style: 'percent', digits: props.shareFormat ?? 1 }), [props.shareFormat])
  const { meta, heads, footer } = props
  const label = props.label ?? ''
  if (!heads || !footer) return null
  return (
    <Cell weight={props.weight}>
      <AttributionBars
        items={items}
        title={props.title ?? ''}
        meta={meta === undefined ? undefined : (scale) => fill(meta, { scale: format(scale) })}
        label={label}
        formatValue={format}
        labels={{
          other: (folded) => fill(props.labels?.other ?? props.otherLabel ?? '', { n: folded }),
          share: props.labels?.share ?? props.shareLabel ?? '',
        }}
        formatShare={(ratio) => share(ratio * 100)}
        readouts={props.readouts?.map((readout) => ({
          key: readout.key,
          label: readout.label,
          text: readout.text,
          ...(readout.value === undefined ? {} : { value: readout.value }),
        }))}
        focusKey={props.focusKey}
        onSelect={props.onSelect ? (key) => dispatch(props.onSelect, 'katanaChartPoint', { key }) : undefined}
        heads={heads}
        footer={footer}
        actionLabels={props.actionLabels!}
        onExport={props.onExport ? () => dispatch(props.onExport, 'katanaChart', { label }) : undefined}
        onFullscreen={props.onFullscreen ? () => dispatch(props.onFullscreen, 'katanaChart', { label }) : undefined}
        maxItems={props.maxItems}
      />
    </Cell>
  )
})

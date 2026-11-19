// SPDX-License-Identifier: MIT
// KatanaMarketHeatmap：市场热力图（按行业分组、面积与颜色各取一个指标，工具条切指标）。品种是对象数组（可 @path 绑定），上限 500；
// 徽标图片不收（会加载外部地址），格子画字母圆标。点格子发 Action，品种代码由 metadata.extensions.katanaChartPoint 带给宿主。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import { MarketHeatmap, type HeatmapColorBy, type HeatmapItem, type HeatmapSizeBy } from '../../quant/index.ts'
import { MAX_ITEMS, dispatch, formatSchema, listSchema, makeFormat, parseCapped, text } from '../chart-support.ts'
import { Cell, actionSchema, fill, weightSchema } from '../support.tsx'

const itemSchema = z
  .object({
    symbol: z.string().min(1).describe('Instrument symbol, unique in the list.').optional(),
    code: z.string().min(1).describe('Deprecated: use symbol. Kept for one release.').optional(),
    name: text('Full name of the instrument.'),
    group: z.string().describe('Group such as the sector. Items without one are put under labels.other.').optional(),
    price: z.number().describe('Last price.').optional(),
    size: z
      .record(z.string(), z.number())
      .describe('Value of each size metric, keyed by sizeBy key. Items with no positive value are not drawn.'),
    value: z
      .record(z.string(), z.number().nullable())
      .describe('Value of each color metric, keyed by colorBy key. Null means no data.'),
  })
  .strict()
  .refine((item) => item.symbol !== undefined || item.code !== undefined, 'symbol is required')

type Item = z.infer<typeof itemSchema>

const sizeBySchema = z
  .object({
    key: z.string().min(1).describe('Id of the size metric.'),
    label: text('Name of the metric in the toolbar.'),
    equal: z.boolean().describe('Every cell the same size; size values are not read.').optional(),
    format: formatSchema('How the size value is written. Defaults to compact (K, M, B).').optional(),
  })
  .strict()

const colorBySchema = z
  .object({
    key: z.string().min(1).describe('Id of the color metric.'),
    label: text('Name of the metric in the toolbar.'),
    unit: z.string().max(8).describe('Unit written after the number, for example "%".').optional(),
    digits: z.number().int().min(0).max(6).describe('Decimal places. Defaults to 2.').optional(),
    step: z
      .number()
      .min(1e-9)
      .describe('Width of one color step in the unit of the metric. Defaults to a round number derived from the data.')
      .optional(),
  })
  .strict()

export const KatanaMarketHeatmapApi = {
  name: 'KatanaMarketHeatmap',
  schema: z
    .object({
      items: listSchema(itemSchema, MAX_ITEMS, 'The instruments, one cell each.'),
      sizeBy: z.array(sizeBySchema).min(1).max(8).describe('The metrics that can set the area of a cell.'),
      colorBy: z.array(colorBySchema).min(1).max(8).describe('The metrics that can set the color of a cell.'),
      defaultSizeBy: z.string().describe('Key of the size metric shown first. Defaults to the first.').optional(),
      defaultColorBy: z.string().describe('Key of the color metric shown first. Defaults to the first.').optional(),
      defaultGrouped: z.boolean().describe('Start grouped by sector. Defaults to true.').optional(),
      scheme: z
        .enum(['classic', 'mono'])
        .describe("'classic' uses the rise and fall colors; 'mono' is greyscale.")
        .optional(),
      toolbar: z
        .enum(['dropdowns', 'segments'])
        .describe("'dropdowns' (default) or one row of buttons per metric when there are few metrics.")
        .optional(),
      priceFormat: formatSchema(
        'How a price is written in the cell and the hover card. Defaults to 2 digits.',
      ).optional(),
      selected: CommonSchemas.DynamicString.describe('Code of the instrument to mark as chosen.').optional(),
      labels: z
        .object({
          sizeBy: text('Name of the size dropdown.'),
          colorBy: text('Name of the color dropdown.'),
          view: text('Name of the grouping control.'),
          grouped: text('Name of the grouped view.'),
          flat: text('Name of the flat view.'),
          all: text('Root of the breadcrumb before zooming in.'),
          other: text('Group name of instruments without a group.'),
          price: text('Name of the price line in the hover card.'),
          group: text('Name of the group line in the hover card.'),
          summary: z
            .object({
              count: text('Name of the instrument count.'),
              up: text('Name of the rising count.'),
              down: text('Name of the falling count.'),
            })
            .strict(),
          segment: text(
            'Accessible name of one color scale step, with {range} where the value range goes, for example "Hide cells from {range}".',
          ),
          list: text('Accessible name of the whole heatmap.'),
          empty: text('Text shown when there is nothing to draw.'),
          fullscreen: z.string().describe('Name of the full screen button. Omit to hide the button.').optional(),
          openInScreener: z
            .string()
            .describe('Name of the open in screener button. Needed when onOpenInScreener is given.')
            .optional(),
          display: z
            .object({
              logo: text('Name of the logo switch.'),
              title: z
                .object({
                  label: text('Name of the title control.'),
                  none: text('Option: no title.'),
                  code: text('Option: the code.'),
                  name: text('Option: the full name.'),
                })
                .strict(),
              value: z
                .object({
                  label: text('Name of the value control.'),
                  none: text('Option: no value.'),
                  price: text('Option: the price.'),
                  size: text('Option: the size metric.'),
                  change: text('Option: the color metric.'),
                })
                .strict(),
            })
            .strict()
            .describe('Words of the display switches. Omit to hide the switches.')
            .optional(),
        })
        .strict()
        .describe('All visible words of the heatmap; it carries none of its own.'),
      onSelect: actionSchema(
        'Dispatched when the user chooses a cell. metadata.extensions.katanaChartPoint carries {symbol} (and the deprecated {code}, same value, for one release).',
      ).optional(),
      onOpenInScreener: actionSchema(
        'Dispatched when the user presses the open in screener button. Without it no button is drawn.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaMarketHeatmap = createComponentImplementation(KatanaMarketHeatmapApi, ({ props }) => {
  const items = useMemo<HeatmapItem[]>(
    () =>
      parseCapped<Item>(itemSchema, props.items, MAX_ITEMS).map((item) => ({
        symbol: (item.symbol ?? item.code)!,
        name: item.name,
        ...(item.group === undefined ? {} : { group: item.group }),
        ...(item.price === undefined ? {} : { price: item.price }),
        size: item.size,
        value: item.value,
      })),
    [props.items],
  )
  const sizeBy = useMemo<HeatmapSizeBy[]>(
    () =>
      (props.sizeBy ?? []).map((entry) => ({
        key: entry.key,
        label: entry.label,
        ...(entry.equal ? { equal: true } : {}),
        ...(entry.format ? { format: makeFormat(entry.format) } : {}),
      })),
    [props.sizeBy],
  )
  const colorBy = useMemo<HeatmapColorBy[]>(
    () =>
      (props.colorBy ?? []).map((entry) => ({
        key: entry.key,
        label: entry.label,
        ...(entry.unit === undefined ? {} : { unit: entry.unit }),
        ...(entry.digits === undefined ? {} : { digits: entry.digits }),
        ...(entry.step === undefined ? {} : { step: entry.step }),
      })),
    [props.colorBy],
  )
  const price = useMemo(() => makeFormat(props.priceFormat), [props.priceFormat])
  const { labels } = props
  if (!labels) return null
  return (
    <Cell weight={props.weight}>
      <MarketHeatmap
        items={items}
        sizeBy={sizeBy}
        colorBy={colorBy}
        labels={{
          sizeBy: labels.sizeBy,
          colorBy: labels.colorBy,
          view: labels.view,
          grouped: labels.grouped,
          flat: labels.flat,
          all: labels.all,
          other: labels.other,
          price: labels.price,
          group: labels.group,
          summary: labels.summary,
          segment: (range) => fill(labels.segment, { range }),
          list: labels.list,
          empty: labels.empty,
          // 库里的 cellMenu 只在传了 cellActions 时用，这里不传。
          ...(labels.fullscreen === undefined ? {} : { fullscreen: labels.fullscreen }),
          ...(labels.openInScreener === undefined ? {} : { openInScreener: labels.openInScreener }),
          ...(labels.display === undefined ? {} : { display: labels.display }),
        }}
        defaultSizeBy={props.defaultSizeBy}
        defaultColorBy={props.defaultColorBy}
        defaultGrouped={props.defaultGrouped}
        scheme={props.scheme}
        toolbar={props.toolbar}
        formatPrice={price}
        selected={props.selected}
        onSelect={
          props.onSelect
            ? (symbol) => dispatch(props.onSelect, 'katanaChartPoint', { symbol, code: symbol })
            : undefined
        }
        onOpenInScreener={
          props.onOpenInScreener
            ? () => dispatch(props.onOpenInScreener, 'katanaChart', { label: labels.list })
            : undefined
        }
      />
    </Cell>
  )
})

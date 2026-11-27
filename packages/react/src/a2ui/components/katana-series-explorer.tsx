// SPDX-License-Identifier: MIT
// KatanaSeriesExplorer：时间序列工作台（区间按钮、指标瓦片、堆叠柱与折线、概览条、明细表）。点、序列、指标、列都是数据，写法用枚举；
// 颜色不由智能体选（按序列顺序取 token 里的序列色）。导出与全屏只在给了 Action 时出按钮。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { useMemo } from 'react'
import { z } from 'zod'
import { SeriesExplorer, type SeriesPoint } from '../../blocks/index.ts'
import {
  MAX_POINTS,
  dispatch,
  formatSchema,
  formatTimeAs,
  listSchema,
  makeFormat,
  parseCapped,
  text,
  timeFormatSchema,
  viewShape,
} from '../chart-support.ts'
import { Cell, fill, isoToMs, weightSchema } from '../support.tsx'

const pointSchema = z
  .object({
    at: z.string().describe('When the point was recorded, ISO 8601.'),
    values: z
      .record(z.string(), z.number())
      .describe('Value of each series at this point, keyed by the series key. A missing key means no value.'),
    closed: z.boolean().describe('The market was closed at this point; the chart draws a shaded band.').optional(),
  })
  .strict()

type Point = z.infer<typeof pointSchema>

const seriesDef = z
  .object({
    key: z.string().min(1).describe('Key used in the values of each point.'),
    label: text('Name of the series in legend, tooltip and table.'),
    kind: z
      .enum(['bar', 'line'])
      .describe('bar is a stacked column (positive up, negative down); line is a line such as net value.'),
    cost: z.boolean().describe('A cost series (fees, taxes): drawn in a neutral ink, not as a loss.').optional(),
  })
  .strict()

const rangeDef = z
  .object({
    key: z.string().min(1).describe('Id of the range.'),
    label: text('Button text, for example "1M".'),
    months: z.number().int().min(1).max(600).nullable().describe('Latest calendar months to show; null for all.'),
  })
  .strict()

const kpiDef = z
  .object({
    key: z.string().min(1).describe('Id of the metric.'),
    label: text('Name of the metric on the tile and tab.'),
    series: z.string().min(1).describe('Key of the series the metric is computed from.'),
    reduce: z.enum(['sum', 'last', 'avg']).describe('sum adds the range, last takes its last point, avg averages it.'),
    format: formatSchema('How the metric value is written.').optional(),
    lowerIsBetter: z
      .boolean()
      .describe('Lower is better: the small trend line is not colored by direction.')
      .optional(),
    limit: z.number().describe('A limit line drawn in the chart, same unit as the series.').optional(),
  })
  .strict()

const columnDef = z
  .object({
    key: z.string().min(1).describe('Id of the column.'),
    label: text('Column head.'),
    series: z.string().min(1).describe('Key of the series the cell shows.'),
    format: formatSchema('How the cell is written.').optional(),
    signed: z.boolean().describe('Color the cell by sign (profit and loss). Leave off for costs.').optional(),
  })
  .strict()

export const KatanaSeriesExplorerApi = {
  name: 'KatanaSeriesExplorer',
  schema: z
    .object({
      points: listSchema(pointSchema, MAX_POINTS, 'The points from oldest to newest.'),
      series: z.array(seriesDef).min(1).max(12).describe('The series drawn, with how each is drawn.'),
      ranges: z.array(rangeDef).min(1).max(8).describe('Range buttons, for example 1M, 3M, all.'),
      defaultRange: z.string().describe('Key of the range shown first. Defaults to the last one.').optional(),
      kpis: z
        .array(kpiDef)
        .min(1)
        .max(8)
        .describe('Metric tiles; each one is also a tab that picks what the chart shows.'),
      columns: z.array(columnDef).max(8).describe('Columns of the detail table, after the time column.'),
      valueFormat: formatSchema('How values are written on the axis and in the tooltip.').optional(),
      changeDigits: z
        .number()
        .int()
        .min(0)
        .max(4)
        .describe('Decimal places of the change against the previous period, shown as a percentage. Defaults to 1.')
        .optional(),
      timeFormat: timeFormatSchema.optional(),
      meta: z.string().describe('One small line under the title, for example a run id and a date range.').optional(),
      events: z
        .array(
          z
            .object({ at: z.string().describe('When the event happened, ISO 8601.'), label: text('What happened.') })
            .strict(),
        )
        .max(50)
        .describe('Events drawn as numbered markers on the chart.')
        .optional(),
      labels: z
        .object({
          chart: text('Accessible name of the chart.'),
          ranges: text('Accessible name of the range buttons.'),
          metrics: text('Accessible name of the metric tabs.'),
          compare: text('Text of the switch that compares with the previous period.'),
          previous: text('Name of the previous period row in the tooltip.'),
          table: text('Accessible name of the detail table.'),
          time: text('Head of the time column.'),
          empty: text('Text shown when there are no points.'),
          spark: text(
            'Accessible name of a metric trend line, a sentence containing {metric} where the metric name goes.',
          ),
          limit: text('Name of the limit line.'),
          actions: viewShape.actionLabels,
          brush: z
            .object({
              start: text('Accessible name of the left handle of the overview window.'),
              end: text('Accessible name of the right handle of the overview window.'),
              window: text('Accessible name of the overview window as a whole.'),
            })
            .strict(),
        })
        .strict()
        .describe('All visible words of the component; it carries none of its own.'),
      source: viewShape.source,
      onExport: viewShape.onExport,
      onFullscreen: viewShape.onFullscreen,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaSeriesExplorer = createComponentImplementation(KatanaSeriesExplorerApi, ({ props }) => {
  const points = useMemo<SeriesPoint[]>(() => {
    const out: SeriesPoint[] = []
    for (const point of parseCapped<Point>(pointSchema, props.points, MAX_POINTS)) {
      const at = isoToMs(point.at)
      if (at !== undefined) out.push({ at, values: point.values, ...(point.closed ? { closed: true } : {}) })
    }
    return out.sort((a, b) => a.at - b.at)
  }, [props.points])
  const { labels } = props
  const label = labels?.chart ?? ''
  const valueFormat = useMemo(() => makeFormat(props.valueFormat), [props.valueFormat])
  const changeFormat = useMemo(
    () => makeFormat({ style: 'percent', digits: props.changeDigits ?? 1, signed: true }),
    [props.changeDigits],
  )
  const kpis = useMemo(
    () =>
      (props.kpis ?? []).map((kpi) => ({
        key: kpi.key,
        label: kpi.label,
        series: kpi.series,
        reduce: kpi.reduce,
        format: makeFormat(kpi.format),
        ...(kpi.lowerIsBetter ? { lowerIsBetter: true } : {}),
        ...(kpi.limit === undefined ? {} : { limit: kpi.limit }),
      })),
    [props.kpis],
  )
  const columns = useMemo(
    () =>
      (props.columns ?? []).map((column) => {
        const format = makeFormat(column.format)
        const read = (point: SeriesPoint) => point.values[column.series]
        return {
          key: column.key,
          label: column.label,
          text: (point: SeriesPoint) => {
            const value = read(point)
            return value === undefined ? '—' : format(value)
          },
          ...(column.signed ? { tone: (point: SeriesPoint) => read(point) ?? null } : {}),
        }
      }),
    [props.columns],
  )
  const events = useMemo(
    () =>
      (props.events ?? []).flatMap((event) => {
        const at = isoToMs(event.at)
        return at === undefined ? [] : [{ at, label: event.label }]
      }),
    [props.events],
  )
  if (!labels) return null
  return (
    <Cell weight={props.weight}>
      <SeriesExplorer
        points={points}
        series={(props.series ?? []).map((item) => ({
          key: item.key,
          label: item.label,
          kind: item.kind,
          ...(item.cost ? { cost: true } : {}),
        }))}
        ranges={props.ranges ?? []}
        defaultRange={props.defaultRange}
        kpis={kpis}
        columns={columns}
        labels={{
          chart: labels.chart,
          ranges: labels.ranges,
          metrics: labels.metrics,
          compare: labels.compare,
          previous: labels.previous,
          table: labels.table,
          time: labels.time,
          empty: labels.empty,
          spark: (metric) => fill(labels.spark, { metric }),
          limit: labels.limit,
          ...(props.source === undefined ? {} : { source: props.source }),
          actions: labels.actions,
          brush: labels.brush,
        }}
        formatAt={(at) => formatTimeAs(at, props.timeFormat)}
        formatValue={valueFormat}
        formatChange={(ratio) => changeFormat(ratio * 100)}
        meta={props.meta}
        events={events}
        onExport={props.onExport ? () => dispatch(props.onExport, 'katanaChart', { label }) : undefined}
        onFullscreen={props.onFullscreen ? () => dispatch(props.onFullscreen, 'katanaChart', { label }) : undefined}
      />
    </Cell>
  )
})

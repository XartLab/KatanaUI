// SPDX-License-Identifier: MIT
// KatanaEquityCurve：权益曲线（上区权益线、下区回撤面、底下刷选条）。数据是按时间排的点，整列可字面量也可 @path 绑定，坏点丢掉。
// 拖刷选条改窗口时发 Action，窗口的起止时刻由 metadata.extensions.katanaChartWindow 带给宿主。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { useMemo } from 'react'
import { z } from 'zod'
import { EquityCurve, type EquityCurvePoint } from '../../quant/index.ts'
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
import { Cell, actionSchema, isoToMs, weightSchema } from '../support.tsx'

const pointSchema = z
  .object({
    time: z.string().describe('When the point was recorded, ISO 8601. Points are placed on the time axis by this.'),
    equity: z.number().describe('Account equity at that time, in the currency of the account.'),
    drawdown: z
      .number()
      .max(0)
      .describe(
        'Distance below the previous equity high, zero or negative, same unit as equity. Omit to let the chart derive it from equity.',
      )
      .optional(),
  })
  .strict()

type Point = z.infer<typeof pointSchema>

export const KatanaEquityCurveApi = {
  name: 'KatanaEquityCurve',
  schema: z
    .object({
      points: listSchema(pointSchema, MAX_POINTS, 'Equity points from oldest to newest.'),
      title: text('Chart title, one line.'),
      hint: z.string().describe('How the numbers are measured; shown as a hover hint on the title.').optional(),
      name: text('Name of the equity line in legend and tooltip, for example the equity or net profit.'),
      label: text('Accessible name of the whole chart as a sentence.'),
      benchmark: z
        .object({
          name: text('Name of the benchmark line.'),
          values: z
            .array(z.number())
            .max(MAX_POINTS)
            .describe(
              'Benchmark values, one per point and in the same order. Ignored when the length differs from points.',
            ),
        })
        .strict()
        .describe('A benchmark drawn as a thin dashed line. Omit for none.')
        .optional(),
      valueFormat: formatSchema(
        'How equity and the benchmark are written on the axis and in the tooltip. Defaults to a number with 2 digits.',
      ).optional(),
      drawdownFormat: formatSchema('How the drawdown is written. Defaults to valueFormat.').optional(),
      timeFormat: timeFormatSchema.optional(),
      labels: z
        .object({
          drawdown: text('Name of the drawdown area in legend, tooltip and table head.'),
          time: text('Table head of the time column.'),
          scale: z
            .object({
              group: text('Accessible name of the linear / log switch.'),
              linear: text('Name of the linear axis option.'),
              log: text('Name of the log axis option.'),
            })
            .strict(),
          brush: z
            .object({
              start: text('Accessible name of the left handle of the overview window.'),
              end: text('Accessible name of the right handle of the overview window.'),
              window: text('Accessible name of the overview window as a whole.'),
            })
            .strict(),
          actions: viewShape.actionLabels,
        })
        .strict()
        .describe('All visible words of the chart; the component carries none of its own.'),
      source: viewShape.source,
      onValueChange: actionSchema(
        'Dispatched when the user drags the overview window. metadata.extensions.katanaChartWindow carries {from, to, fromIndex, toIndex} with the times in ISO 8601 and the indexes into points.',
      ).optional(),
      onWindowChange: actionSchema('Deprecated: use onValueChange. Kept for one release.').optional(),
      onExport: viewShape.onExport,
      onFullscreen: viewShape.onFullscreen,
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaEquityCurve = createComponentImplementation(KatanaEquityCurveApi, ({ props }) => {
  const kept = useMemo(() => {
    const out: { time: number; point: Point }[] = []
    for (const point of parseCapped<Point>(pointSchema, props.points, MAX_POINTS)) {
      const time = isoToMs(point.time)
      if (time !== undefined) out.push({ time, point })
    }
    return out.sort((a, b) => a.time - b.time)
  }, [props.points])
  const axis = useMemo(() => makeFormat(props.valueFormat), [props.valueFormat])
  const ddFormat = useMemo(
    () => makeFormat(props.drawdownFormat ?? props.valueFormat),
    [props.drawdownFormat, props.valueFormat],
  )
  const points = useMemo<EquityCurvePoint[]>(() => {
    let peak = -Infinity
    return kept.map(({ time, point }, index) => {
      peak = Math.max(peak, point.equity)
      const drawdown = point.drawdown ?? point.equity - peak
      return {
        time,
        equity: point.equity,
        drawdown,
        title: `#${index + 1} ${formatTimeAs(time, props.timeFormat)}`,
        equityText: axis(point.equity),
        drawdownText: ddFormat(drawdown),
      }
    })
  }, [kept, axis, ddFormat, props.timeFormat])
  const label = props.label ?? ''
  const benchmark =
    props.benchmark && props.benchmark.values.length === points.length
      ? { name: props.benchmark.name, values: props.benchmark.values }
      : undefined
  const { labels } = props
  if (!labels) return null
  return (
    <Cell weight={props.weight}>
      <EquityCurve
        points={points}
        title={props.title ?? ''}
        hint={props.hint}
        name={props.name ?? ''}
        benchmark={benchmark}
        label={label}
        axis={axis}
        formatTime={(time) => formatTimeAs(time, props.timeFormat)}
        labels={{
          drawdown: labels.drawdown,
          time: labels.time,
          scale: labels.scale,
          brush: labels.brush,
          actions: labels.actions,
        }}
        source={props.source}
        onValueChange={(window) => {
          const [from, to] = window
          const first = points[from]
          const last = points[Math.min(to, points.length) - 1]
          if (!first || !last) return
          dispatch(props.onValueChange ?? props.onWindowChange, 'katanaChartWindow', {
            from: new Date(first.time).toISOString(),
            to: new Date(last.time).toISOString(),
            fromIndex: from,
            toIndex: to - 1,
          })
        }}
        onExport={props.onExport ? () => dispatch(props.onExport, 'katanaChart', { label }) : undefined}
        onFullscreen={props.onFullscreen ? () => dispatch(props.onFullscreen, 'katanaChart', { label }) : undefined}
      />
    </Cell>
  )
})

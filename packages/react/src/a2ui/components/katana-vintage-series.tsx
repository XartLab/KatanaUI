// SPDX-License-Identifier: MIT
// KatanaVintageSeries：按发布时间画的宏观序列（同一统计期被一次次修订，可看「当时已知」或最新值）。观测是对象数组（可 @path 绑定），每期的发布次数有上限。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { useMemo } from 'react'
import { z } from 'zod'
import { VintageSeries, type VintageObservation } from '../../quant/index.ts'
import {
  formatSchema,
  formatTimeAs,
  listSchema,
  makeFormat,
  parseCapped,
  text,
  timeFormatSchema,
  viewProps,
  viewShape,
} from '../chart-support.ts'
import { Cell, isoToMs, weightSchema } from '../support.tsx'

const MAX_OBSERVATIONS = 1000
const MAX_RELEASES = 30

const releaseSchema = z
  .object({
    at: z.string().describe('When this value was published, ISO 8601.'),
    value: z.number().describe('The published value.'),
    note: z.string().describe('A short note on the release, for example "second revision".').optional(),
  })
  .strict()

const observationSchema = z
  .object({
    period: z.string().describe('The period the value is about, ISO 8601 (for example the first day of the month).'),
    releases: z.array(releaseSchema).max(MAX_RELEASES).describe('Every release of this period, at most 30.'),
  })
  .strict()

type Observation = z.infer<typeof observationSchema>

export const KatanaVintageSeriesApi = {
  name: 'KatanaVintageSeries',
  schema: z
    .object({
      observations: listSchema(observationSchema, MAX_OBSERVATIONS, 'The periods with their releases.'),
      periodFormat: timeFormatSchema.optional(),
      releaseFormat: timeFormatSchema.optional(),
      valueFormat: formatSchema('How a value is written.').optional(),
      deltaFormat: formatSchema(
        'How a change or revision is written. Use signed. Defaults to valueFormat with signed.',
      ).optional(),
      asOf: z
        .string()
        .describe(
          'A moment, ISO 8601: "known" mode shows the last release up to then. Omit for the first release of each period.',
        )
        .optional(),
      defaultMode: z
        .enum(['known', 'latest', 'both'])
        .describe('Which line starts on screen. Defaults to the library choice.')
        .optional(),
      labels: z
        .object({
          chart: text('Accessible name of the chart.'),
          mode: text('Accessible name of the switch between the three modes.'),
          known: text('Option: values as known at the time.'),
          latest: text('Option: latest revised values.'),
          both: text('Option: both.'),
          revisions: text('Name of the small chart of revision size.'),
          revision: text('Name of the cumulative revision row in the read-out.'),
          notYet: text('What the read-out says for a period not yet published at asOf.'),
          stats: z
            .object({
              revised: text('Name of the count of revised periods.'),
              meanAbs: text('Name of the mean absolute revision.'),
              bias: text('Name of the mean revision.'),
              largest: text('Name of the largest revision.'),
            })
            .strict(),
          empty: text('Text shown when there is no data.'),
        })
        .strict()
        .describe('All visible words of the chart; it carries none of its own.'),
      badge: z.string().describe('A small tag at the top right, for example that the data is a demo.').optional(),
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

export const KatanaVintageSeries = createComponentImplementation(KatanaVintageSeriesApi, ({ props }) => {
  const observations = useMemo<VintageObservation[]>(
    () =>
      parseCapped<Observation>(observationSchema, props.observations, MAX_OBSERVATIONS).flatMap((observation) => {
        const period = isoToMs(observation.period)
        if (period === undefined) return []
        const releases = observation.releases.flatMap((release) => {
          const at = isoToMs(release.at)
          return at === undefined
            ? []
            : [{ at, value: release.value, ...(release.note === undefined ? {} : { note: release.note }) }]
        })
        return [{ period, releases }]
      }),
    [props.observations],
  )
  const value = useMemo(() => makeFormat(props.valueFormat), [props.valueFormat])
  const delta = useMemo(
    () => makeFormat(props.deltaFormat ?? { ...(props.valueFormat ?? { style: 'number' }), signed: true }),
    [props.deltaFormat, props.valueFormat],
  )
  const { labels, actionLabels, tableLabel, tableHead } = props
  if (!labels || !actionLabels || !tableLabel || !tableHead) return null
  const label = labels.chart
  return (
    <Cell weight={props.weight}>
      <VintageSeries
        observations={observations}
        labels={labels}
        formatPeriod={(period) => formatTimeAs(period, props.periodFormat)}
        formatAt={(at) => formatTimeAs(at, props.releaseFormat ?? 'datetime')}
        formatValue={value}
        formatDelta={delta}
        asOf={isoToMs(props.asOf)}
        defaultMode={props.defaultMode}
        badge={props.badge}
        {...viewProps({ ...props, actionLabels, tableLabel, tableHead }, label)}
      />
    </Cell>
  )
})

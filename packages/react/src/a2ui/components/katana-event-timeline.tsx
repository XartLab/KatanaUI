// SPDX-License-Identifier: MIT
// KatanaEventTimeline：一天的事件时间线（异动、公告、成交、警报、运行），轴按交易时段排。点一个事件与拖选一段时间都只发 Action。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import { EventTimeline, type TimelineEvent } from '../../blocks/index.ts'
import { text, withExtension } from '../blocks-support.ts'
import { Cell, actionSchema, fill, isoToMs, parseList, weightSchema } from '../support.tsx'

const KINDS = ['anomaly', 'notice', 'fill', 'alert', 'run'] as const

const eventSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the event. The host gets it back when the user picks it.'),
    at: z.string().describe('When it happened, ISO 8601 with an offset or Z.'),
    kind: z
      .enum(KINDS)
      .describe(
        "'anomaly' unusual move, 'notice' announcement, 'fill' a trade fill, 'alert' a warning, 'run' a strategy run.",
      ),
    label: z.string().describe('A short label beside the marker, also shown in the tooltip.'),
    side: z.enum(['buy', 'sell']).describe("Direction of a 'fill' event.").optional(),
    ref: z.string().describe('What the event relates to, for example an order id; shown in the tooltip.').optional(),
    symbol: z.string().describe('The instrument code.').optional(),
    account: z.string().describe('The account name.').optional(),
  })
  .strict()

export const KatanaEventTimelineApi = {
  name: 'KatanaEventTimeline',
  schema: z
    .object({
      events: z
        .union([z.array(eventSchema), CommonSchemas.DataBinding])
        .describe('The events. Either a literal array or {"@path": "/events"} bound to a data-model array.'),
      timeZone: z
        .string()
        .min(1)
        .describe(
          'IANA time zone that decides which day and clock time an event falls on, for example "Asia/Shanghai".',
        ),
      session: z
        .array(z.array(z.number().int().min(0).max(1440)).length(2))
        .min(1)
        .max(4)
        .describe(
          'Trading sessions as [start, end] minutes since midnight in that time zone, for example [[570, 690], [780, 900]]. Gaps between sessions are squeezed.',
        ),
      now: CommonSchemas.DynamicString.describe(
        'The current time, ISO 8601. Draws a line at it. Omit for no line.',
      ).optional(),
      scope: CommonSchemas.DynamicString.describe(
        'A line at the top left naming what the timeline covers, for example an instrument and an account.',
      ).optional(),
      label: CommonSchemas.DynamicString.describe('Accessible name of the whole timeline.'),
      labels: z
        .object({
          kindAnomaly: text('Kind name: anomaly.'),
          kindNotice: text('Kind name: announcement.'),
          kindFill: text('Kind name: fill.'),
          kindAlert: text('Kind name: alert.'),
          kindRun: text('Kind name: run.'),
          now: text('Text on the now line.'),
          count: text('Event count at the top; {n}, for example "{n} events".'),
          cluster: text('Accessible name of a group marker; {n}, for example "{n} events".'),
          buy: text('The word for a buy.'),
          sell: text('The word for a sell.'),
          time: text('Tooltip and table header: time.'),
          kind: text('Tooltip and table header: kind.'),
          content: text('Tooltip and table header: content.'),
          ref: text('Tooltip and table header: reference.'),
          showTable: text('Button that switches to the table view.'),
          showTimeline: text('Button that switches back to the timeline.'),
          day: text(
            'Title of a day lane; {day} is YYYY-MM-DD and {count} the number of events, for example "{day} · {count}".',
          ),
          empty: text('Text when there are no events.'),
        })
        .strict()
        .describe('All visible and screen-reader text, in the language of the user.'),
      onPick: actionSchema(
        'Dispatched when the user picks an event (the earliest of a group). metadata.extensions.katanaEvent carries {id}.',
      ).optional(),
      onBrush: actionSchema(
        'Dispatched when the user drags a span on the axis. metadata.extensions.katanaRange carries {from, to} as ISO 8601.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaEventTimeline = createComponentImplementation(KatanaEventTimelineApi, ({ props }) => {
  const events = useMemo(
    () =>
      parseList(eventSchema, props.events).flatMap((event): TimelineEvent[] => {
        const at = isoToMs(event.at)
        if (at === undefined) return []
        return [
          {
            id: event.id,
            at,
            kind: event.kind,
            label: event.label,
            ...(event.side === undefined ? {} : { side: event.side }),
            ...(event.ref === undefined ? {} : { ref: event.ref }),
            ...(event.symbol === undefined ? {} : { symbol: event.symbol }),
            ...(event.account === undefined ? {} : { account: event.account }),
          },
        ]
      }),
    [props.events],
  )
  const t = props.labels
  if (!t) return null
  return (
    <Cell weight={props.weight}>
      <EventTimeline
        events={events}
        timeZone={props.timeZone}
        session={(props.session ?? []).map(([from = 0, to = 0]) => [from, to] as const)}
        now={isoToMs(props.now)}
        scope={props.scope}
        label={props.label ?? ''}
        onPick={
          props.onPick ? (event) => void props.onPick?.(withExtension('katanaEvent', { id: event.id })) : undefined
        }
        onBrush={
          props.onBrush
            ? (range) =>
                void props.onBrush?.(
                  withExtension('katanaRange', {
                    from: new Date(range.from).toISOString(),
                    to: new Date(range.to).toISOString(),
                  }),
                )
            : undefined
        }
        labels={{
          kinds: { anomaly: t.kindAnomaly, notice: t.kindNotice, fill: t.kindFill, alert: t.kindAlert, run: t.kindRun },
          now: t.now,
          count: (n) => fill(t.count, { n }),
          cluster: (n) => fill(t.cluster, { n }),
          buy: t.buy,
          sell: t.sell,
          time: t.time,
          kind: t.kind,
          content: t.content,
          ref: t.ref,
          showTable: t.showTable,
          showTimeline: t.showTimeline,
          day: (day, count) => fill(t.day, { day, count }),
          empty: t.empty,
        }}
      />
    </Cell>
  )
})

// SPDX-License-Identifier: MIT
// KatanaSystemMonitor：系统监控（连接状态条、策略实例表、延迟等小图、事件流）。启停策略、点连接、急停都只发 Action，
// 状态变化由智能体改数据写回；急停在件里要按住才触发，宿主收到后还要自己确认。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useMemo } from 'react'
import { z } from 'zod'
import {
  SystemMonitor,
  type MonitorEvent,
  type MonitorLink,
  type MonitorStrategy,
  type SystemMonitorMetric,
} from '../../blocks/index.ts'
import { agoOf, agoShape, text, withExtension } from '../blocks-support.ts'
import { Cell, actionSchema, fill, isoToMs, numberList, parseList, weightSchema } from '../support.tsx'

const linkSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the connection.'),
    name: z.string().describe('The connection name.'),
    group: z.string().describe('A group name shown on hover, for example "Exchange API".').optional(),
    state: z.enum(['ok', 'degraded', 'error', 'offline']).describe('The connection state.'),
    latencyMs: z
      .number()
      .min(0)
      .nullable()
      .describe('Round-trip time in milliseconds. Null when not measured.')
      .optional(),
    lastBeat: z.string().nullable().describe('When the last heartbeat arrived, ISO 8601. Null if never.').optional(),
    detail: z.string().describe('What went wrong, for hover and screen readers.').optional(),
  })
  .strict()

const strategySchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the strategy instance. The host gets it back with an action.'),
    name: z.string().describe('The strategy name.'),
    account: z.string().describe('The account name.'),
    symbol: z.string().describe('The instrument code.'),
    status: z.enum(['running', 'paused', 'stopped', 'error']).describe('The instance state.'),
    position: z
      .string()
      .nullable()
      .describe('The position as text, with direction and unit. Null for none.')
      .optional(),
    pnl: z
      .number()
      .nullable()
      .describe("Today's profit and loss; only its sign colors the text. Null for none.")
      .optional(),
    pnlText: z.string().nullable().describe('The profit and loss as text, already formatted.').optional(),
    quota: z
      .number()
      .min(0)
      .nullable()
      .describe('Share of the quota used, 0 to 1 (above 1 is over). Null for no quota.')
      .optional(),
    quotaText: z.string().nullable().describe('The quota as text, already formatted.').optional(),
    lastTradeAt: z.string().nullable().describe('When it last traded, ISO 8601. Null for none today.').optional(),
    error: z.string().describe('What went wrong when the status is error.').optional(),
  })
  .strict()

const metricSchema = z
  .object({
    key: z.string().min(1).describe('Stable key of the metric.'),
    label: z.string().describe('The metric name.'),
    value: z.string().nullable().describe('The current value as text. Null when there is no data.'),
    unit: z.string().describe('A small unit after the value.').optional(),
    series: z.array(z.number()).max(300).describe('Recent values, oldest first, for the small line.'),
    sparkLabel: z.string().describe('Accessible name of the small line, a whole sentence.'),
    threshold: z.number().describe('Draws an amber dashed line at this value.').optional(),
    state: z.enum(['normal', 'near', 'over']).describe('Whether the value is near or over its limit.').optional(),
    note: z.string().describe('A small note; write it when state is near or over.').optional(),
    trendTone: z.enum(['series', 'neutral']).describe("'neutral' for measures where lower is better.").optional(),
  })
  .strict()

const eventSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the event.'),
    at: z.string().describe('When it happened, ISO 8601.'),
    severity: z.enum(['info', 'warn', 'error']).describe('How serious it is.'),
    kind: z.string().describe('The value of one of the eventKinds.'),
    text: z.string().describe('What happened.'),
  })
  .strict()

const bound = <T extends z.ZodTypeAny>(item: T, what: string) =>
  z
    .union([z.array(item), CommonSchemas.DataBinding])
    .describe(`${what} Either a literal array or a {"@path": "/x"} binding to a data-model array.`)

export const KatanaSystemMonitorApi = {
  name: 'KatanaSystemMonitor',
  schema: z
    .object({
      links: bound(linkSchema, 'The connections (exchange APIs, quote feeds, engines).'),
      strategies: bound(strategySchema, 'The strategy instances.'),
      metrics: bound(metricSchema, 'Small charts such as latency and error rate. Use an empty array for none.'),
      events: bound(eventSchema, 'The event stream.'),
      eventKinds: z
        .array(z.object({ value: z.string().min(1), label: text('The kind name.') }).strict())
        .max(24)
        .describe('The event kinds the user can filter by, for example orders, fills, rejects.'),
      now: CommonSchemas.DynamicString.describe(
        'The current time, ISO 8601, used for relative times. Omit to use the clock of the device.',
      ).optional(),
      quotaWarnAt: z
        .number()
        .min(0)
        .max(1)
        .describe('Quota use above this turns the bar amber. Above 1 it is always red. Omit for no warning.')
        .optional(),
      labels: z
        .object({
          monitor: text('Accessible name of the whole monitor.'),
          heading: text('The panel heading.'),
          notConnected: text('Text for a block that has no data.'),
          links: text('Heading of the connections.'),
          strategies: text('Heading of the strategies.'),
          metrics: text('Heading of the small charts.'),
          events: text('Heading of the event stream.'),
          linkOk: text('Connection state: ok.'),
          linkDegraded: text('Connection state: degraded.'),
          linkError: text('Connection state: error.'),
          linkOffline: text('Connection state: offline.'),
          statusRunning: text('Strategy state: running.'),
          statusPaused: text('Strategy state: paused.'),
          statusStopped: text('Strategy state: stopped.'),
          statusError: text('Strategy state: error.'),
          severityInfo: text('Severity: info.'),
          severityWarn: text('Severity: warning.'),
          severityError: text('Severity: error.'),
          latency: text('Latency; {ms}, for example "{ms} ms".'),
          heartbeat: text('Prefix of the last heartbeat, for example "Heartbeat".'),
          noBeat: text('Text when no heartbeat was ever received.'),
          columnName: text('Strategy table column: name.'),
          columnAccount: text('Strategy table column: account.'),
          columnSymbol: text('Strategy table column: symbol.'),
          columnStatus: text('Strategy table column: status.'),
          columnPosition: text('Strategy table column: position.'),
          columnPnl: text('Strategy table column: profit and loss.'),
          columnQuota: text('Strategy table column: quota.'),
          columnLastTrade: text('Strategy table column: last trade.'),
          columnActions: text('Strategy table column: actions.'),
          actionStart: text('Name of the start button.'),
          actionPause: text('Name of the pause button.'),
          actionStop: text('Name of the stop button.'),
          emergencyStop: text('Text on the emergency stop button.'),
          emergencyHint: text('Hold hint, for example "Hold 2 seconds to stop all strategies".'),
          emergencyDone: text('Text once the hold is complete.'),
          eventKinds: text('Accessible name of the kind chips.'),
          eventSeverity: text('Accessible name of the severity filter.'),
          all: text('The "all" choice of a filter.'),
          clearKinds: text('Button that clears the kind filter.'),
          noEvents: text('Text when no event matches.'),
          quotaUsed: text('Quota bar reading; {percent}, for example "Quota used {percent}%".'),
          ...agoShape,
        })
        .strict()
        .describe('All visible and screen-reader text, in the language of the user.'),
      onStrategyAction: actionSchema(
        'Dispatched when the user presses start, pause or stop on a strategy. metadata.extensions.katanaStrategy carries {id, action}. The host confirms and acts; nothing is traded by the component.',
      ).optional(),
      onEmergencyStop: actionSchema(
        'Dispatched when the user holds the emergency stop to the end. Without it there is no emergency stop button. The host must confirm.',
      ).optional(),
      onLinkPick: actionSchema(
        'Dispatched when the user presses a connection. metadata.extensions.katanaLink carries {id}.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaSystemMonitor = createComponentImplementation(KatanaSystemMonitorApi, ({ props }) => {
  const fixed = isoToMs(props.now)
  const links = useMemo(
    () =>
      parseList(linkSchema, props.links).map((link): MonitorLink => ({
        id: link.id,
        name: link.name,
        state: link.state,
        ...(link.group === undefined ? {} : { group: link.group }),
        ...(link.latencyMs === undefined ? {} : { latencyMs: link.latencyMs }),
        ...(link.lastBeat === undefined
          ? {}
          : { lastBeat: link.lastBeat === null ? null : (isoToMs(link.lastBeat) ?? null) }),
        ...(link.detail === undefined ? {} : { detail: link.detail }),
      })),
    [props.links],
  )
  const strategies = useMemo(
    () =>
      parseList(strategySchema, props.strategies).map((item): MonitorStrategy => ({
        id: item.id,
        name: item.name,
        account: item.account,
        symbol: item.symbol,
        status: item.status,
        ...(item.position === undefined ? {} : { position: item.position }),
        ...(item.pnl === undefined ? {} : { pnl: item.pnl }),
        ...(item.pnlText === undefined ? {} : { pnlText: item.pnlText }),
        ...(item.quota === undefined ? {} : { quota: item.quota }),
        ...(item.quotaText === undefined ? {} : { quotaText: item.quotaText }),
        ...(item.lastTradeAt === undefined
          ? {}
          : { lastTradeAt: item.lastTradeAt === null ? null : (isoToMs(item.lastTradeAt) ?? null) }),
        ...(item.error === undefined ? {} : { error: item.error }),
      })),
    [props.strategies],
  )
  const metrics = useMemo(
    () =>
      parseList(metricSchema, props.metrics).map((metric): SystemMonitorMetric => ({
        key: metric.key,
        label: metric.label,
        value: metric.value,
        series: numberList(metric.series),
        sparkLabel: metric.sparkLabel,
        ...(metric.unit === undefined ? {} : { unit: metric.unit }),
        ...(metric.threshold === undefined ? {} : { threshold: metric.threshold }),
        ...(metric.state === undefined ? {} : { state: metric.state }),
        ...(metric.note === undefined ? {} : { note: metric.note }),
        ...(metric.trendTone === undefined ? {} : { trendTone: metric.trendTone }),
      })),
    [props.metrics],
  )
  const events = useMemo(
    () =>
      parseList(eventSchema, props.events).flatMap((event): MonitorEvent[] => {
        const at = isoToMs(event.at)
        return at === undefined
          ? []
          : [{ id: event.id, at, severity: event.severity, kind: event.kind, text: event.text }]
      }),
    [props.events],
  )
  const t = props.labels
  if (!t) return null
  return (
    <Cell weight={props.weight}>
      <SystemMonitor
        links={links}
        strategies={strategies}
        metrics={metrics}
        events={events}
        eventKinds={props.eventKinds ?? []}
        now={fixed ?? Date.now()}
        quotaWarnAt={props.quotaWarnAt}
        onStrategyAction={
          props.onStrategyAction
            ? (strategy, action) =>
                void props.onStrategyAction?.(withExtension('katanaStrategy', { id: strategy.id, action }))
            : undefined
        }
        onEmergencyStop={props.onEmergencyStop ? () => void props.onEmergencyStop?.() : undefined}
        onLinkPick={
          props.onLinkPick ? (link) => void props.onLinkPick?.(withExtension('katanaLink', { id: link.id })) : undefined
        }
        labels={{
          monitor: t.monitor,
          heading: t.heading,
          notConnected: t.notConnected,
          links: t.links,
          strategies: t.strategies,
          metrics: t.metrics,
          events: t.events,
          linkState: { ok: t.linkOk, degraded: t.linkDegraded, error: t.linkError, offline: t.linkOffline },
          strategyStatus: {
            running: t.statusRunning,
            paused: t.statusPaused,
            stopped: t.statusStopped,
            error: t.statusError,
          },
          severity: { info: t.severityInfo, warn: t.severityWarn, error: t.severityError },
          ago: agoOf(t),
          latency: (ms) => fill(t.latency, { ms }),
          heartbeat: t.heartbeat,
          noBeat: t.noBeat,
          columns: {
            name: t.columnName,
            account: t.columnAccount,
            symbol: t.columnSymbol,
            status: t.columnStatus,
            position: t.columnPosition,
            pnl: t.columnPnl,
            quota: t.columnQuota,
            lastTrade: t.columnLastTrade,
            actions: t.columnActions,
          },
          actions: { start: t.actionStart, pause: t.actionPause, stop: t.actionStop },
          emergencyStop: t.emergencyStop,
          emergencyHint: t.emergencyHint,
          emergencyDone: t.emergencyDone,
          eventKinds: t.eventKinds,
          eventSeverity: t.eventSeverity,
          all: t.all,
          clearKinds: t.clearKinds,
          noEvents: t.noEvents,
          quotaUsed: (percent) => fill(t.quotaUsed, { percent }),
        }}
      />
    </Cell>
  )
})

// SPDX-License-Identifier: MIT
// KatanaDecisionQueue：建议卡片队列。接受 / 拒绝 / 稍后都只发 Action，哪一条由 metadata.extensions.katanaDecision 带给宿主；
// 状态由宿主或智能体改完写回（件自己不改状态）。来源链接不直接跳：点了发 onOpenSource，让宿主决定开不开。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { DecisionQueue, type DecisionItem, type DecisionQueueLabels } from '../../blocks/index.ts'
import { text } from '../blocks-support.ts'
import { Cell, SourceClicks, actionSchema, fill, httpsUrl, isoToMs, parseList, weightSchema } from '../support.tsx'

const itemSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the suggestion. The host gets it back with every action.'),
    action: z.string().describe('The suggested action in a word or two, for example "Buy" or "Reduce".'),
    target: z.string().describe('What the action applies to: an instrument or a strategy name.'),
    targetTag: z.string().describe('A small tag next to the target, for example a ticker code.').optional(),
    rationale: z.string().describe('Why, in one or two sentences.'),
    confidence: z.number().min(0).max(1).describe('Confidence from 0 to 1. Omit when there is none.').optional(),
    basis: z
      .string()
      .describe('One line naming the evidence, for example "Backtest 2023-2026, Sharpe 1.4".')
      .optional(),
    sources: z
      .array(z.object({ label: z.string().describe('Link text.'), href: httpsUrl }).strict())
      .describe('Where the suggestion comes from. Opening one goes through onOpenSource; it never navigates by itself.')
      .optional(),
    createdAt: z.string().describe('When the suggestion was made, ISO 8601.'),
    expiresAt: z.string().describe('When it stops being actionable, ISO 8601. Omit for no expiry.').optional(),
    status: z
      .enum(['pending', 'snoozed', 'accepted', 'rejected', 'expired'])
      .describe("Where the suggestion stands. Defaults to 'pending'. Write the new status back after the user acts.")
      .optional(),
    resolvedBy: z.string().describe('Who accepted or rejected it.').optional(),
    resolvedAt: z.string().describe('When it was accepted or rejected, ISO 8601.').optional(),
  })
  .strict()

type Item = z.infer<typeof itemSchema>

const labelsSchema = z
  .object({
    queue: text('Accessible name of the whole queue, for example "Suggestions".'),
    filters: text('Accessible name of the status filter group.'),
    filterPending: text('Filter tab: pending suggestions.'),
    filterAccepted: text('Filter tab: accepted suggestions.'),
    filterRejected: text('Filter tab: rejected suggestions.'),
    filterExpired: text('Filter tab: expired suggestions.'),
    accept: text('The accept button.'),
    reject: text('The reject button.'),
    snooze: text('The postpone button.'),
    acceptHint: text('Hint that accepting needs a press and hold, for example "Hold to confirm".'),
    acceptedButton: text('Text of the accept button once held to the end.'),
    snoozed: text('Text shown after a suggestion was postponed.'),
    statusPending: text('Status word: pending.'),
    statusSnoozed: text('Status word: postponed.'),
    statusAccepted: text('Status word: accepted.'),
    statusRejected: text('Status word: rejected.'),
    statusExpired: text('Status word: expired.'),
    confidence: text('Confidence line; {percent} is the number 0 to 100, for example "Confidence {percent}%".'),
    basis: text('Heading of the basis line.'),
    sources: text('Heading of the source list.'),
    details: text('Label of the expand toggle.'),
    createdAgo: text('When it was made; {ago} is the relative time, for example "Created {ago}".'),
    expiresIn: text('Countdown; {time} is minutes and seconds, for example "{time} left".'),
    expired: text('Text of the countdown once it ran out.'),
    resolvedBy: text('Who resolved it and when; {by} and {ago}, for example "{by} · {ago}".'),
    secondsAgo: text('Relative time under a minute; {n} seconds, for example "{n}s ago".'),
    minutesAgo: text('Relative time under an hour; {n} minutes, for example "{n} min ago".'),
    hoursAgo: text('Relative time of an hour or more; {n} hours, for example "{n} h ago".'),
    emptyPending: text('Empty text of the pending tab.'),
    emptyAccepted: text('Empty text of the accepted tab.'),
    emptyRejected: text('Empty text of the rejected tab.'),
    emptyExpired: text('Empty text of the expired tab.'),
  })
  .strict()

type QueueText = z.infer<typeof labelsSchema>

/** 把智能体写的文案模板拼成件要的 labels：函数在这里造，智能体只传字。 */
function decisionLabels(t: QueueText): DecisionQueueLabels {
  const span = (seconds: number) =>
    seconds < 60
      ? fill(t.secondsAgo, { n: seconds })
      : seconds < 3600
        ? fill(t.minutesAgo, { n: Math.floor(seconds / 60) })
        : fill(t.hoursAgo, { n: Math.floor(seconds / 3600) })
  return {
    queue: t.queue,
    filters: t.filters,
    filter: {
      pending: t.filterPending,
      accepted: t.filterAccepted,
      rejected: t.filterRejected,
      expired: t.filterExpired,
    },
    accept: t.accept,
    reject: t.reject,
    snooze: t.snooze,
    acceptHint: t.acceptHint,
    accepted: t.acceptedButton,
    snoozed: t.snoozed,
    status: {
      pending: t.statusPending,
      snoozed: t.statusSnoozed,
      accepted: t.statusAccepted,
      rejected: t.statusRejected,
      expired: t.statusExpired,
    },
    confidence: (percent) => fill(t.confidence, { percent }),
    basis: t.basis,
    sources: t.sources,
    details: t.details,
    createdAgo: (seconds) => fill(t.createdAgo, { ago: span(seconds) }),
    expiresIn: (seconds) =>
      fill(t.expiresIn, { time: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` }),
    expired: t.expired,
    resolvedBy: (by, ago) => fill(t.resolvedBy, { by, ago }),
    ago: span,
    absolute: (time) => new Date(time).toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
    empty: { pending: t.emptyPending, accepted: t.emptyAccepted, rejected: t.emptyRejected, expired: t.emptyExpired },
  }
}

export const KatanaDecisionQueueApi = {
  name: 'KatanaDecisionQueue',
  schema: z
    .object({
      items: z
        .union([z.array(itemSchema), CommonSchemas.DataBinding])
        .describe(
          'The suggestions. Either a literal array or {"@path": "/decisions"} bound to a data-model array, so you can update them with updateDataModel. Suggestions are advice with sources; nothing happens until the user accepts, and the host (not this component) carries it out after its own confirmation.',
        ),
      now: CommonSchemas.DynamicString.describe(
        'The current time, ISO 8601, used for countdowns and expiry. Omit to use the clock of the device.',
      ).optional(),
      labels: labelsSchema.describe(
        'All visible and screen-reader text of the queue, written in the language of the user. Placeholders in braces are filled in by the component.',
      ),
      onAccept: actionSchema(
        'Dispatched when the user holds the accept button to the end. The suggestion is in metadata.extensions.katanaDecision.id. Accepting never places an order by itself.',
      ).optional(),
      onReject: actionSchema(
        'Dispatched when the user rejects a suggestion. The suggestion is in metadata.extensions.katanaDecision.id.',
      ).optional(),
      onSnooze: actionSchema(
        'Dispatched when the user postpones a suggestion. The suggestion is in metadata.extensions.katanaDecision.id.',
      ).optional(),
      onOpenSource: actionSchema(
        'Dispatched when the user opens a source link. metadata.extensions.katanaSource carries {itemId, label, href}; the host decides whether and how to open the https link.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

/** 时钟：给了就按给的（固定），没给就用本机时间每秒走一格。 */
function useNow(fixed: number | undefined): number {
  const [tick, setTick] = useState(() => Date.now())
  useEffect(() => {
    if (fixed !== undefined) return
    const timer = window.setInterval(() => setTick(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [fixed])
  return fixed ?? tick
}

function toItems(
  value: unknown,
  now: number,
): { items: DecisionItem[]; hrefs: Map<string, { itemId: string; label: string; href: string }> } {
  const hrefs = new Map<string, { itemId: string; label: string; href: string }>()
  const items = parseList<Item>(itemSchema, value).map((item): DecisionItem => {
    const resolvedAt = isoToMs(item.resolvedAt)
    return {
      id: item.id,
      action: item.action,
      target: item.target,
      ...(item.targetTag === undefined ? {} : { targetTag: item.targetTag }),
      rationale: item.rationale,
      ...(item.confidence === undefined ? {} : { confidence: item.confidence }),
      ...(item.basis === undefined ? {} : { basis: item.basis }),
      // 真实链接不进 DOM：卡上的 href 是占位，点击由 SourceClicks 拦下来交给宿主。
      sources: (item.sources ?? []).map((source, index) => {
        const key = `#source/${item.id}/${index}`
        hrefs.set(key, { itemId: item.id, label: source.label, href: source.href })
        return { label: source.label, href: key }
      }),
      createdAt: isoToMs(item.createdAt) ?? now,
      ...(isoToMs(item.expiresAt) === undefined ? {} : { expiresAt: isoToMs(item.expiresAt)! }),
      status: item.status ?? 'pending',
      ...(item.resolvedBy === undefined ? {} : { resolvedBy: item.resolvedBy }),
      ...(resolvedAt === undefined ? {} : { resolvedAt }),
    }
  })
  return { items, hrefs }
}

export const KatanaDecisionQueue = createComponentImplementation(KatanaDecisionQueueApi, ({ props }) => {
  const fixed = isoToMs(props.now)
  const now = useNow(fixed)
  const { items, hrefs } = useMemo(() => toItems(props.items, fixed ?? Date.now()), [props.items, fixed])
  const labels = useMemo(() => decisionLabels(props.labels as QueueText), [props.labels])
  const decide = (run: typeof props.onAccept) => (item: DecisionItem) =>
    void run?.({ metadata: { extensions: { katanaDecision: { id: item.id } } } })
  return (
    <Cell weight={props.weight}>
      <SourceClicks
        selector="a.k-dq-source"
        onOpen={(key) => {
          const source = hrefs.get(key)
          if (source) void props.onOpenSource?.({ metadata: { extensions: { katanaSource: source } } })
        }}
      >
        <DecisionQueue
          items={items}
          now={now}
          labels={labels}
          onAccept={decide(props.onAccept)}
          onReject={decide(props.onReject)}
          onSnooze={decide(props.onSnooze)}
        />
      </SourceClicks>
    </Cell>
  )
})

// SPDX-License-Identifier: MIT
// KatanaHypothesisLedger：假说账，只读。智能体给命题、失败条件、检验期限与证据；用户只能筛选与展开，不能改状态。
// 证据的出处链接不直接跳：点了发 onOpenSource，让宿主决定开不开。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { HypothesisLedger, type Hypothesis, type HypothesisLedgerLabels } from '../../blocks/index.ts'
import { text } from '../blocks-support.ts'
import { Cell, SourceClicks, actionSchema, fill, httpsUrl, isoToMs, parseList, weightSchema } from '../support.tsx'

const LAYERS = ['strategy', 'credit', 'fiscal', 'crossborder', 'industry', 'profit', 'allocation', 'haven'] as const

const evidenceSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the evidence.'),
    kind: z
      .enum(['scholar', 'policy', 'data', 'filing'])
      .describe('What kind of evidence it is, so opinions and facts are not mixed.'),
    source: z.string().describe('Name of the source.'),
    href: httpsUrl,
    publishedAt: z.string().describe('When it was published, ISO 8601.'),
    summary: z.string().describe('One sentence on what it says.'),
    stance: z.enum(['support', 'oppose']).describe('Whether it supports or opposes the claim.'),
  })
  .strict()

const hypothesisSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the hypothesis.'),
    claim: z.string().describe('The claim, written so that it can be proven wrong.'),
    layer: z.enum(LAYERS).describe('Which layer of the transmission chain the claim belongs to.'),
    status: z.enum(['pending', 'supported', 'refuted', 'expired']).describe('Where the claim stands.'),
    failure: z.string().describe('The condition, written in advance, that would show the claim is wrong.'),
    deadline: z.string().describe('The date by which it must be settled, ISO 8601.'),
    evidence: z.array(evidenceSchema).describe('Evidence for and against.'),
    assets: z
      .array(z.object({ label: z.string(), tag: z.string().optional() }).strict())
      .describe('Instruments or assets the claim is about.')
      .optional(),
  })
  .strict()

type Row = z.infer<typeof hypothesisSchema>

const labelsSchema = z
  .object({
    ledger: text('Accessible name of the whole ledger, for example "Hypotheses".'),
    views: text('Accessible name of the view switch.'),
    viewLedger: text('View tab: the ledger.'),
    viewWatch: text('View tab: the watch table.'),
    statusFilter: text('Accessible name of the status filter group.'),
    layerFilter: text('Accessible name of the layer filter group.'),
    clearLayers: text('Button that clears the layer filter.'),
    all: text('The "all" choice of a filter.'),
    layerStrategy: text('Layer name: strategy.'),
    layerCredit: text('Layer name: credit.'),
    layerFiscal: text('Layer name: fiscal.'),
    layerCrossborder: text('Layer name: cross-border.'),
    layerIndustry: text('Layer name: industry.'),
    layerProfit: text('Layer name: profit.'),
    layerAllocation: text('Layer name: allocation.'),
    layerHaven: text('Layer name: haven.'),
    statusPending: text('Status word: pending.'),
    statusSupported: text('Status word: supported.'),
    statusRefuted: text('Status word: refuted.'),
    statusExpired: text('Status word: expired.'),
    kindScholar: text('Evidence kind: scholar.'),
    kindPolicy: text('Evidence kind: policy.'),
    kindData: text('Evidence kind: data.'),
    kindFiling: text('Evidence kind: filing.'),
    stanceSupport: text('Evidence stance: supports the claim.'),
    stanceOppose: text('Evidence stance: opposes the claim.'),
    failure: text('Heading of the failure condition, for example "Fails if".'),
    evidence: text('Heading of the evidence list.'),
    assets: text('Heading of the asset list.'),
    noEvidence: text('Text when a claim has no evidence yet.'),
    tally: text('Evidence count; {support} and {oppose}, for example "{support} for · {oppose} against".'),
    dueToday: text('Deadline text when it is today.'),
    deadlineIn: text('Days left; {days}, for example "{days} d left".'),
    overdueBy: text('Days overdue; {days}, for example "{days} d overdue".'),
    empty: text('Text when there are no hypotheses.'),
    watchLayer: text('Watch table column: layer.'),
    watchEvidence: text('Watch table column: key evidence.'),
    watchConfusion: text('Watch table column: easily confused with.'),
  })
  .strict()

type LedgerText = z.infer<typeof labelsSchema>

/** 把智能体写的文案模板拼成件要的 labels：函数在这里造，智能体只传字。 */
function hypothesisLabels(t: LedgerText): HypothesisLedgerLabels {
  return {
    ledger: t.ledger,
    views: t.views,
    viewLedger: t.viewLedger,
    viewWatch: t.viewWatch,
    statusFilter: t.statusFilter,
    layerFilter: t.layerFilter,
    clearLayers: t.clearLayers,
    all: t.all,
    layer: {
      strategy: t.layerStrategy,
      credit: t.layerCredit,
      fiscal: t.layerFiscal,
      crossborder: t.layerCrossborder,
      industry: t.layerIndustry,
      profit: t.layerProfit,
      allocation: t.layerAllocation,
      haven: t.layerHaven,
    },
    status: {
      pending: t.statusPending,
      supported: t.statusSupported,
      refuted: t.statusRefuted,
      expired: t.statusExpired,
    },
    kind: { scholar: t.kindScholar, policy: t.kindPolicy, data: t.kindData, filing: t.kindFiling },
    stance: { support: t.stanceSupport, oppose: t.stanceOppose },
    failure: t.failure,
    evidence: t.evidence,
    assets: t.assets,
    noEvidence: t.noEvidence,
    tally: (support, oppose) => fill(t.tally, { support, oppose }),
    deadlineIn: (days) => (days === 0 ? t.dueToday : fill(t.deadlineIn, { days })),
    overdueBy: (days) => fill(t.overdueBy, { days }),
    date: (time) => new Date(time).toISOString().slice(0, 10),
    empty: t.empty,
    watchLayer: t.watchLayer,
    watchEvidence: t.watchEvidence,
    watchConfusion: t.watchConfusion,
  }
}

export const KatanaHypothesisLedgerApi = {
  name: 'KatanaHypothesisLedger',
  schema: z
    .object({
      items: z
        .union([z.array(hypothesisSchema), CommonSchemas.DataBinding])
        .describe(
          'The hypotheses. Either a literal array or {"@path": "/hypotheses"} bound to a data-model array. The list is read only: the user can filter and expand, never edit.',
        ),
      now: CommonSchemas.DynamicString.describe(
        'The current time, ISO 8601, used for deadlines. Omit to use the clock of the device.',
      ).optional(),
      labels: labelsSchema.describe(
        'All visible and screen-reader text of the ledger, written in the language of the user. Placeholders in braces are filled in by the component.',
      ),
      onOpenSource: actionSchema(
        'Dispatched when the user opens an evidence link. metadata.extensions.katanaSource carries {itemId, label, href}; the host decides whether and how to open the https link.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

function useNow(fixed: number | undefined): number {
  const [tick, setTick] = useState(() => Date.now())
  useEffect(() => {
    if (fixed !== undefined) return
    const timer = window.setInterval(() => setTick(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [fixed])
  return fixed ?? tick
}

export const KatanaHypothesisLedger = createComponentImplementation(KatanaHypothesisLedgerApi, ({ props }) => {
  const fixed = isoToMs(props.now)
  const now = useNow(fixed)
  const { items, hrefs } = useMemo(() => {
    const hrefs = new Map<string, { itemId: string; label: string; href: string }>()
    const items = parseList<Row>(hypothesisSchema, props.items).map((row): Hypothesis => ({
      id: row.id,
      claim: row.claim,
      layer: row.layer,
      status: row.status,
      failure: row.failure,
      deadline: isoToMs(row.deadline) ?? 0,
      evidence: row.evidence.map((evidence) => {
        const key = `#source/${row.id}/${evidence.id}`
        hrefs.set(key, { itemId: row.id, label: evidence.source, href: evidence.href })
        return {
          id: evidence.id,
          kind: evidence.kind,
          source: evidence.source,
          href: key,
          publishedAt: isoToMs(evidence.publishedAt) ?? 0,
          summary: evidence.summary,
          stance: evidence.stance,
        }
      }),
      ...(row.assets === undefined
        ? {}
        : { assets: row.assets.map((a) => ({ label: a.label, ...(a.tag === undefined ? {} : { tag: a.tag }) })) }),
    }))
    return { items, hrefs }
  }, [props.items])
  const labels = useMemo(() => hypothesisLabels(props.labels as LedgerText), [props.labels])
  return (
    <Cell weight={props.weight}>
      <SourceClicks
        selector="a.k-hl-source"
        onOpen={(key) => {
          const source = hrefs.get(key)
          if (source) void props.onOpenSource?.({ metadata: { extensions: { katanaSource: source } } })
        }}
      >
        <HypothesisLedger items={items} now={now} labels={labels} />
      </SourceClicks>
    </Cell>
  )
})

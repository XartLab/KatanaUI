// SPDX-License-Identifier: MIT
// KatanaHypothesisLedger：假说账，只读。智能体给命题、失败条件、检验期限与证据；用户只能筛选与展开，不能改状态。
// 证据的出处链接不直接跳：点了发 onOpenSource，让宿主决定开不开。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { CommonSchemas } from '@a2ui/web_core/v1_0'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { HypothesisLedger, type Hypothesis } from '../../blocks/index.ts'
import { hypothesisLabels } from '../labels.ts'
import { Cell, SourceClicks, actionSchema, httpsUrl, isoToMs, parseList, weightSchema } from '../support.tsx'

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
      labels: z
        .record(z.string(), z.string())
        .describe(
          'Overrides for the built-in English text, keyed by: ledger, views, statusFilter, layerFilter, clearLayers, all, layerStrategy, layerCredit, layerFiscal, layerCrossborder, layerIndustry, layerProfit, layerAllocation, layerHaven, statusPending, statusSupported, statusRefuted, statusExpired, kindScholar, kindPolicy, kindData, kindFiling, stanceSupport, stanceOppose, failure, evidence, assets, noEvidence, tally ({support}, {oppose}), dueToday, deadlineIn ({days}), overdueBy ({days}), empty. Write them in the language of the user.',
        )
        .optional(),
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
  const labels = useMemo(() => hypothesisLabels(props.labels), [props.labels])
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

// SPDX-License-Identifier: MIT
// KatanaTransmissionChain：传导链图（节点是环节，边是「A 传导到 B」的判断，带验证状态与证据）。节点与边是对象数组（可 @path 绑定）。
// 证据的出处链接不直接跳：点了发 onOpenSource，让宿主决定开不开；选中节点或边发 onSelect。
import { createComponentImplementation } from '@a2ui/react'
import type { ComponentApi } from '@a2ui/web_core'
import { useMemo } from 'react'
import { z } from 'zod'
import { TransmissionChain, type ChainEdge, type ChainNode } from '../../blocks/index.ts'
import { dispatch, formatTimeAs, listSchema, parseCapped, text, timeFormatSchema } from '../chart-support.ts'
import { Cell, SourceClicks, actionSchema, fill, httpsUrl, isoToMs, weightSchema } from '../support.tsx'

const MAX_NODES = 100
const MAX_EDGES = 300
const MAX_EVIDENCE = 20

const nodeSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the node, referenced by edges.'),
    label: text('Name of the node.'),
    note: z.string().describe('One sentence shown when the node is chosen.').optional(),
  })
  .strict()

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
    stance: z.enum(['support', 'oppose']).describe('Whether it supports or opposes the judgement of the edge.'),
  })
  .strict()

const edgeSchema = z
  .object({
    id: z.string().min(1).describe('Stable id of the edge.'),
    from: z.string().min(1).describe('Id of the node the effect starts from.'),
    to: z.string().min(1).describe('Id of the node the effect reaches.'),
    status: z
      .enum(['untested', 'supported', 'contradicted', 'partial'])
      .describe('Where the judgement stands against its evidence.'),
    label: z.string().describe('A short name for the mechanism, shown on the edge.').optional(),
    feedback: z.boolean().describe('The edge goes back upstream (a feedback loop); it is drawn dashed.').optional(),
    failureCondition: z.string().describe('What would show the judgement is wrong, written in advance.').optional(),
    evidence: z.array(evidenceSchema).max(MAX_EVIDENCE).describe('Evidence for and against, at most 20.').optional(),
  })
  .strict()

type Node = z.infer<typeof nodeSchema>
type Edge = z.infer<typeof edgeSchema>

const record = <K extends string>(keys: readonly K[], what: string) =>
  z.object(Object.fromEntries(keys.map((key) => [key, text(`${what}: ${key}.`)])) as Record<K, z.ZodString>).strict()

export const KatanaTransmissionChainApi = {
  name: 'KatanaTransmissionChain',
  schema: z
    .object({
      nodes: listSchema(nodeSchema, MAX_NODES, 'The links of the chain.'),
      edges: listSchema(edgeSchema, MAX_EDGES, 'The judgements between nodes. Edges to a missing node are dropped.'),
      direction: z.enum(['TB', 'LR']).describe("'TB' lays out top to bottom (default), 'LR' left to right.").optional(),
      dateFormat: timeFormatSchema.optional(),
      labels: z
        .object({
          chain: text('Accessible name of the whole chain.'),
          notConnected: text('Text shown when there are no nodes.'),
          status: record(['untested', 'supported', 'contradicted', 'partial'], 'Word for the edge status'),
          stance: record(['support', 'oppose'], 'Word for the evidence stance'),
          kind: record(['scholar', 'policy', 'data', 'filing'], 'Word for the evidence kind'),
          legend: text('Title of the legend.'),
          evidence: text('Title of the evidence section.'),
          noEvidence: text('Text when an edge has no evidence.'),
          failureCondition: text('Title of the failure condition section.'),
          noFailureCondition: text('Text when the failure condition is missing.'),
          feedback: text('Tag of a feedback edge.'),
          upstream: text('Title of the upstream list of a node.'),
          downstream: text('Title of the downstream list of a node.'),
          none: text('Text for an empty list.'),
          pickHint: text('Hint shown when nothing is chosen.'),
          counts: text(
            'Evidence count on an edge with {support} and {oppose}, for example "for {support} against {oppose}".',
          ),
          edgeName: text('Accessible name of an edge with {from} and {to}, for example "{from} to {to}".'),
          zoomIn: text('Name of the zoom in button.'),
          zoomOut: text('Name of the zoom out button.'),
          fit: text('Name of the fit to view button.'),
        })
        .strict()
        .describe('All visible words of the chain; it carries none of its own.'),
      onSelect: actionSchema(
        'Dispatched when the user chooses a node or an edge, or clears the choice. metadata.extensions.katanaChartPoint carries {kind, id}; kind is "node" or "edge", both null when cleared.',
      ).optional(),
      onOpenSource: actionSchema(
        'Dispatched when the user opens an evidence link. metadata.extensions.katanaSource carries {itemId, label, href}; the host decides whether and how to open the https link.',
      ).optional(),
      weight: weightSchema,
    })
    .strict(),
} satisfies ComponentApi

export const KatanaTransmissionChain = createComponentImplementation(KatanaTransmissionChainApi, ({ props }) => {
  const { nodes, edges, hrefs } = useMemo(() => {
    const hrefs = new Map<string, { itemId: string; label: string; href: string }>()
    const nodes: ChainNode[] = parseCapped<Node>(nodeSchema, props.nodes, MAX_NODES).map((node) => ({
      id: node.id,
      label: node.label,
      ...(node.note === undefined ? {} : { note: node.note }),
    }))
    const edges: ChainEdge[] = parseCapped<Edge>(edgeSchema, props.edges, MAX_EDGES).map((edge) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      status: edge.status,
      ...(edge.label === undefined ? {} : { label: edge.label }),
      ...(edge.feedback ? { feedback: true } : {}),
      ...(edge.failureCondition === undefined ? {} : { failureCondition: edge.failureCondition }),
      ...(edge.evidence === undefined
        ? {}
        : {
            evidence: edge.evidence.map((item) => {
              // 真实链接不进 DOM：href 是占位，点击由 SourceClicks 拦下来交给宿主。
              const key = `#source/${edge.id}/${item.id}`
              hrefs.set(key, { itemId: edge.id, label: item.source, href: item.href })
              return {
                id: item.id,
                kind: item.kind,
                source: item.source,
                href: key,
                publishedAt: isoToMs(item.publishedAt) ?? 0,
                summary: item.summary,
                stance: item.stance,
              }
            }),
          }),
    }))
    return { nodes, edges, hrefs }
  }, [props.nodes, props.edges])
  const { labels } = props
  const memoLabels = useMemo(
    () =>
      labels && {
        chain: labels.chain,
        notConnected: labels.notConnected,
        status: labels.status,
        stance: labels.stance,
        kind: labels.kind,
        legend: labels.legend,
        evidence: labels.evidence,
        noEvidence: labels.noEvidence,
        failureCondition: labels.failureCondition,
        noFailureCondition: labels.noFailureCondition,
        feedback: labels.feedback,
        upstream: labels.upstream,
        downstream: labels.downstream,
        none: labels.none,
        pickHint: labels.pickHint,
        counts: (support: number, oppose: number) => fill(labels.counts, { support, oppose }),
        date: (at: number) => formatTimeAs(at, props.dateFormat),
        edgeName: (from: string, to: string) => fill(labels.edgeName, { from, to }),
        zoomIn: labels.zoomIn,
        zoomOut: labels.zoomOut,
        fit: labels.fit,
      },
    [labels, props.dateFormat],
  )
  if (!memoLabels) return null
  return (
    <Cell weight={props.weight}>
      <SourceClicks
        selector="a.k-hl-source"
        onOpen={(key) => {
          const source = hrefs.get(key)
          if (source) dispatch(props.onOpenSource, 'katanaSource', source)
        }}
      >
        <TransmissionChain
          nodes={nodes}
          edges={edges}
          labels={memoLabels}
          direction={props.direction}
          onSelect={(selection) =>
            dispatch(props.onSelect, 'katanaChartPoint', { kind: selection?.kind ?? null, id: selection?.id ?? null })
          }
        />
      </SourceClicks>
    </Cell>
  )
})

// SPDX-License-Identifier: MIT
/**
 * Side panel of TransmissionChain: the selected edge's evidence and failure condition, or a node's upstream and downstream edges.
 * TransmissionChain 的右侧详情（体检 §7 从 transmission-chain.tsx 拆出）；证据行与假说账同一套标记（k-hl-ev）。
 */
import { Check, CircleDashed, Contrast, ExternalLink, X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { HypothesisEvidence } from '../hypothesis-ledger/hypothesis-ledger-model.ts'
import type { TransmissionChainLabels } from './transmission-chain.tsx'
import { evidenceCounts, type ChainEdge, type ChainNode, type ChainStatus } from './transmission-chain-model.ts'

/** 状态的图标：不只靠颜色。 */
export const STATUS_ICON: Record<ChainStatus, typeof Check> = {
  supported: Check,
  contradicted: X,
  partial: Contrast,
  untested: CircleDashed,
}

export function StatusBadge({ status, labels }: { status: ChainStatus; labels: TransmissionChainLabels }) {
  const Icon = STATUS_ICON[status]
  return (
    <span className="k-tc-badge" data-status={status}>
      <Icon aria-hidden width={12} height={12} />
      {labels.status[status]}
    </span>
  )
}

export function EdgeDetail({
  edge,
  nodeLabel,
  labels,
}: {
  edge: ChainEdge
  nodeLabel: (id: string) => string
  labels: TransmissionChainLabels
}) {
  const c = evidenceCounts(edge)
  return (
    <div className="k-tc-edge-detail" data-testid="tc-edge-detail">
      <h4 className="k-tc-title">
        {nodeLabel(edge.from)} → {nodeLabel(edge.to)}
      </h4>
      <div className="k-tc-meta">
        <StatusBadge status={edge.status} labels={labels} />
        {edge.feedback ? <span className="k-tc-tag">{labels.feedback}</span> : null}
        {edge.label ? <span className="k-tc-tag">{edge.label}</span> : null}
        <span className="k-tc-count">{labels.counts(c.support, c.oppose)}</span>
      </div>
      <Section title={labels.failureCondition}>
        {edge.failureCondition ? (
          <p className="k-tc-failure">{edge.failureCondition}</p>
        ) : (
          <p className="k-tc-missing">{labels.noFailureCondition}</p>
        )}
      </Section>
      <Section title={labels.evidence}>
        {edge.evidence?.length ? (
          <ul className="k-hl-evidence" aria-label={labels.evidence}>
            {edge.evidence.map((item) => (
              <EvidenceRow key={item.id} item={item} labels={labels} />
            ))}
          </ul>
        ) : (
          <p className="k-tc-missing">{labels.noEvidence}</p>
        )}
      </Section>
    </div>
  )
}

function EvidenceRow({ item, labels }: { item: HypothesisEvidence; labels: TransmissionChainLabels }) {
  // 标记与类名同假说账的证据行（k-hl-ev），样式不另写一份。
  return (
    <li className="k-hl-ev" data-stance={item.stance}>
      <span className="k-hl-kind" data-kind={item.kind}>
        {labels.kind[item.kind]}
      </span>
      <span className="k-hl-stance">
        <i aria-hidden="true" />
        {labels.stance[item.stance]}
      </span>
      <time className="k-hl-time" dateTime={new Date(item.publishedAt).toISOString()}>
        {labels.date(item.publishedAt)}
      </time>
      <a className="k-hl-source" href={item.href} target="_blank" rel="noreferrer">
        <ExternalLink size={11} aria-hidden />
        {item.source}
      </a>
      <span className="k-hl-summary">{item.summary}</span>
    </li>
  )
}

export function NodeDetail({
  node,
  edges,
  nodeLabel,
  labels,
  onSelectEdge,
}: {
  node: ChainNode
  edges: readonly ChainEdge[]
  nodeLabel: (id: string) => string
  labels: TransmissionChainLabels
  /** 点上下游列表里的一条边：选中它。 */
  onSelectEdge: (edgeId: string) => void
}) {
  const list = (title: string, items: readonly ChainEdge[], other: (e: ChainEdge) => string) => (
    <Section title={title}>
      {items.length ? (
        <ul className="k-tc-links">
          {items.map((e) => (
            <li key={e.id}>
              <button type="button" className="k-tc-link" data-status={e.status} onClick={() => onSelectEdge(e.id)}>
                <StatusBadge status={e.status} labels={labels} />
                <span>{nodeLabel(other(e))}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="k-tc-missing">{labels.none}</p>
      )}
    </Section>
  )
  return (
    <div className="k-tc-node-detail" data-testid="tc-node-detail">
      <h4 className="k-tc-title">{node.label}</h4>
      {node.note ? <p className="k-tc-note">{node.note}</p> : null}
      {list(
        labels.upstream,
        edges.filter((e) => e.to === node.id),
        (e) => e.from,
      )}
      {list(
        labels.downstream,
        edges.filter((e) => e.from === node.id),
        (e) => e.to,
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="k-tc-section">
      <h5>{title}</h5>
      {children}
    </section>
  )
}

// SPDX-License-Identifier: MIT
/**
 * Directed transmission-chain graph with edge verification status, evidence counts, zoom and pan.
 * 传导链图；右侧详情在 transmission-chain-detail.tsx（体检 §7 拆分）。
 */
import { Maximize, Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from '../../lib/cn.ts'
import { Button } from '../../primitives/button.tsx'
import {
  NODE_HEIGHT,
  NODE_WIDTH,
  evidenceCounts,
  fitView,
  layoutChain,
  smoothPath,
  statusTotals,
  validEdges,
  zoomAt,
  type ChainDirection,
  type ChainEdge,
  type ChainNode,
  type ChainStatus,
  type View,
} from './transmission-chain-model.ts'
import type { EvidenceKind, HypothesisEvidence } from '../hypothesis-ledger/hypothesis-ledger-model.ts'
import { fontFor, measureText, truncateText } from '../../lib/text-measure.ts'
import { EdgeDetail, NodeDetail, STATUS_ICON } from './transmission-chain-detail.tsx'

// 传导链图（#44）：有向图，节点是传导环节，边是传导关系；每条边有验证状态（未检验 / 有证据支持 / 证据反对 / 部分）和证据计数，
// 点边在右侧出证据列表与失败条件，点节点列出它的上下游边；支持沿链回到上游的反馈边。布局用 dagre（MIT），可缩放平移。
// 画法参照 TradingView 图表的手感：滚轮缩放、拖动平移、一键适应；边与图例不靠颜色单独表意：状态有图标与虚实线型，右侧有状态字。
// 状态色：支持 = 涨色（--pnl-up）、反对 = 跌色（--pnl-down）、部分 = 琥珀、未检验 = 灰虚线；橙色不画数据，不用蓝。
// 件只画、只回调：节点、边、证据与全部文字由调用方传，件不认识任何应用或研究框架。没有节点写 labels.notConnected，不补样本。

export type TransmissionChainLabels = {
  /** 整个件的读屏名。 */
  chain: string
  /** 没有节点时写的字。 */
  notConnected: string
  status: Record<ChainStatus, string>
  stance: Record<HypothesisEvidence['stance'], string>
  kind: Record<EvidenceKind, string>
  /** 图例标题与右侧各区标题。 */
  legend: string
  evidence: string
  noEvidence: string
  failureCondition: string
  /** 没写失败条件时的提示。 */
  noFailureCondition: string
  feedback: string
  upstream: string
  downstream: string
  none: string
  /** 右侧什么都没选时的提示。 */
  pickHint: string
  /** 证据计数写在边的标签上：「支 3 反 1」。 */
  counts: (support: number, oppose: number) => string
  /** 证据发布时间的写法。 */
  date: (at: number) => string
  /** 边的读屏名：「A 到 B」。 */
  edgeName: (from: string, to: string) => string
  zoomIn: string
  zoomOut: string
  fit: string
}

export type ChainSelection = { kind: 'edge' | 'node'; id: string } | null

export type TransmissionChainProps = {
  nodes: readonly ChainNode[]
  edges: readonly ChainEdge[]
  labels: TransmissionChainLabels
  /** 布局方向：TB 从上到下（默认，链长时横排会宽到缩得看不清），LR 从左到右。 */
  direction?: ChainDirection
  defaultSelected?: ChainSelection
  onSelect?: (selection: ChainSelection) => void
  className?: string
}

const STATUS_ORDER: readonly ChainStatus[] = ['supported', 'partial', 'contradicted', 'untested']
const ICON_SIZE = 14
const CHIP_PAD = 10

const chipText = (edge: ChainEdge, labels: TransmissionChainLabels) => {
  const c = evidenceCounts(edge)
  return [edge.label, edge.evidence?.length ? labels.counts(c.support, c.oppose) : ''].filter(Boolean).join(' ')
}
/** 边上标签胶囊的字（11px 说明档）与节点名（12px 半粗体）的字体：用 pretext 量真实字宽（2026-11-17），不再按全角 12、半角 7 估。 */
const CHIP_FONT = () => fontFor(400, 11, '--font-sans-small')
const NODE_FONT = () => fontFor(600, 12, '--font-sans')
const chipWidth = (edge: ChainEdge, labels: TransmissionChainLabels) =>
  CHIP_PAD * 2 + ICON_SIZE + 4 + Math.ceil(measureText(chipText(edge, labels), CHIP_FONT()))

/** 节点名放不下就截尾加省略号（SVG 里没有 text-overflow）。 */
const clip = (text: string, max: number) => truncateText(text, NODE_FONT(), max)

export function TransmissionChain({
  nodes,
  edges,
  labels,
  direction = 'TB',
  defaultSelected = null,
  onSelect,
  className,
}: TransmissionChainProps) {
  const kept = useMemo(() => validEdges(nodes, edges), [nodes, edges])
  const laid = useMemo(
    () => layoutChain(nodes, kept, { direction, labelWidth: (e) => chipWidth(e, labels) }),
    [nodes, kept, direction, labels],
  )
  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const edgeById = useMemo(() => new Map(kept.map((e) => [e.id, e])), [kept])
  const totals = statusTotals(kept)

  const [picked, setPicked] = useState<ChainSelection>(defaultSelected)
  const selected =
    picked && (picked.kind === 'node' ? nodeById.has(picked.id) : edgeById.has(picked.id)) ? picked : null
  const select = (next: ChainSelection) => {
    setPicked(next)
    onSelect?.(next)
  }

  const canvas = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })
  // null = 跟着视口自动适应；用户一缩放或平移就变成固定视图，点「适应」回到 null。
  const [view, setView] = useState<View | null>(null)
  const shown = view ?? fitView(box, laid)
  const shownRef = useRef(shown)
  useEffect(() => {
    shownRef.current = shown
  })

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const measure = () => setBox({ width: el.clientWidth, height: el.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    // 滚轮缩放要 preventDefault，React 的 onWheel 是被动监听，只能挂原生的。
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = el.getBoundingClientRect()
      const point = { x: event.clientX - rect.left, y: event.clientY - rect.top }
      setView(zoomAt(shownRef.current, point, Math.exp(-event.deltaY * 0.0015)))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      observer.disconnect()
      el.removeEventListener('wheel', onWheel)
    }
  }, [])

  const drag = useRef<{ x: number; y: number; view: View; moved: boolean } | null>(null)
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as Element).closest('[data-chain-item], button')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, y: event.clientY, view: shown, moved: false }
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    const dx = event.clientX - d.x
    const dy = event.clientY - d.y
    if (!d.moved && Math.hypot(dx, dy) < 3) return
    d.moved = true
    setView({ ...d.view, x: d.view.x + dx, y: d.view.y + dy })
  }
  const onPointerUp = () => {
    const d = drag.current
    drag.current = null
    if (d && !d.moved) select(null)
  }
  const zoomBy = (factor: number) => setView(zoomAt(shown, { x: box.width / 2, y: box.height / 2 }, factor))

  const activate = (event: KeyboardEvent, next: ChainSelection) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    select(next)
  }

  // 选了节点时，不挨着它的边淡出，视线跟着上下游走。
  const touches = (edge: { from: string; to: string }) =>
    selected?.kind !== 'node' || edge.from === selected.id || edge.to === selected.id
  const nodeLabel = (id: string) => nodeById.get(id)?.label ?? id
  const pos = new Map(laid.nodes.map((n) => [n.id, n]))
  const marker = (status: ChainStatus) => `k-tc-arrow-${status}`

  return (
    <div className={cn('k-tc', className)} role="group" aria-label={labels.chain} data-testid="tc">
      <div
        ref={canvas}
        className="k-tc-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
      >
        {nodes.length === 0 ? (
          <p className="k-tc-empty">{labels.notConnected}</p>
        ) : (
          <svg className="k-tc-svg" width="100%" height="100%" aria-hidden={false}>
            <defs>
              {STATUS_ORDER.map((status) => (
                <marker
                  key={status}
                  id={marker(status)}
                  className="k-tc-arrow"
                  data-status={status}
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="9"
                  markerHeight="9"
                  markerUnits="userSpaceOnUse"
                  orient="auto-start-reverse"
                >
                  <path d="M0,1 L10,5 L0,9 z" />
                </marker>
              ))}
            </defs>
            <g transform={`translate(${shown.x} ${shown.y}) scale(${shown.k})`} data-view-k={shown.k.toFixed(3)}>
              {laid.edges.map((l) => {
                const edge = edgeById.get(l.id)!
                const Icon = STATUS_ICON[edge.status]
                const text = chipText(edge, labels)
                const isSel = selected?.kind === 'edge' && selected.id === edge.id
                const c = evidenceCounts(edge)
                return (
                  <g
                    key={edge.id}
                    className="k-tc-edge"
                    data-chain-item="edge"
                    data-edge-id={edge.id}
                    data-status={edge.status}
                    data-feedback={edge.feedback ? 'true' : undefined}
                    data-selected={isSel ? 'true' : undefined}
                    data-dim={touches(edge) ? undefined : 'true'}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSel}
                    aria-label={`${labels.edgeName(nodeLabel(edge.from), nodeLabel(edge.to))}，${labels.status[edge.status]}，${labels.counts(c.support, c.oppose)}${edge.label ? `，${edge.label}` : ''}`}
                    onClick={() => select({ kind: 'edge', id: edge.id })}
                    onKeyDown={(event) => activate(event, { kind: 'edge', id: edge.id })}
                  >
                    <path className="k-tc-hit" d={smoothPath(l.points)} />
                    <path className="k-tc-line" d={smoothPath(l.points)} markerEnd={`url(#${marker(edge.status)})`} />
                    <g transform={`translate(${l.label.x - l.label.width / 2} ${l.label.y - l.label.height / 2})`}>
                      <rect
                        className="k-tc-chip"
                        width={l.label.width}
                        height={l.label.height}
                        rx={l.label.height / 2}
                      />
                      <Icon
                        className="k-tc-chip-icon"
                        x={CHIP_PAD}
                        y={(l.label.height - ICON_SIZE) / 2}
                        width={ICON_SIZE}
                        height={ICON_SIZE}
                      />
                      <text className="k-tc-chip-text" x={CHIP_PAD + ICON_SIZE + 4} y={l.label.height / 2}>
                        {text}
                      </text>
                    </g>
                  </g>
                )
              })}
              {nodes.map((node) => {
                const p = pos.get(node.id)!
                const isSel = selected?.kind === 'node' && selected.id === node.id
                const linked =
                  selected?.kind !== 'node' ||
                  isSel ||
                  kept.some((e) => touches(e) && (e.from === node.id || e.to === node.id))
                return (
                  <g
                    key={node.id}
                    className="k-tc-node"
                    data-chain-item="node"
                    data-node-id={node.id}
                    data-selected={isSel ? 'true' : undefined}
                    data-dim={linked ? undefined : 'true'}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSel}
                    aria-label={node.label}
                    transform={`translate(${p.x - NODE_WIDTH / 2} ${p.y - NODE_HEIGHT / 2})`}
                    onClick={() => select({ kind: 'node', id: node.id })}
                    onKeyDown={(event) => activate(event, { kind: 'node', id: node.id })}
                  >
                    <rect width={NODE_WIDTH} height={NODE_HEIGHT} rx={6} />
                    <text x={NODE_WIDTH / 2} y={NODE_HEIGHT / 2}>
                      {clip(node.label, NODE_WIDTH - 16)}
                    </text>
                  </g>
                )
              })}
            </g>
          </svg>
        )}
        <div className="k-tc-tools">
          <Button variant="icon" aria-label={labels.zoomIn} onClick={() => zoomBy(1.25)}>
            <Plus aria-hidden />
          </Button>
          <Button variant="icon" aria-label={labels.zoomOut} onClick={() => zoomBy(0.8)}>
            <Minus aria-hidden />
          </Button>
          <Button variant="icon" aria-label={labels.fit} onClick={() => setView(null)}>
            <Maximize aria-hidden />
          </Button>
        </div>
        <ul className="k-tc-legend" aria-label={labels.legend}>
          {STATUS_ORDER.map((status) => {
            const Icon = STATUS_ICON[status]
            return (
              <li key={status} data-status={status}>
                <svg width="26" height="8" aria-hidden>
                  <line className="k-tc-legend-line" x1="1" y1="4" x2="25" y2="4" />
                </svg>
                <Icon aria-hidden width={12} height={12} />
                <span>{labels.status[status]}</span>
                <b>{totals[status]}</b>
              </li>
            )
          })}
        </ul>
      </div>
      <aside className="k-tc-detail" aria-live="polite">
        {selected?.kind === 'edge' ? (
          <EdgeDetail edge={edgeById.get(selected.id)!} nodeLabel={nodeLabel} labels={labels} />
        ) : selected?.kind === 'node' ? (
          <NodeDetail
            node={nodeById.get(selected.id)!}
            edges={kept}
            nodeLabel={nodeLabel}
            labels={labels}
            onSelectEdge={(id) => select({ kind: 'edge', id })}
          />
        ) : (
          <p className="k-tc-hint">{labels.pickHint}</p>
        )}
      </aside>
    </div>
  )
}

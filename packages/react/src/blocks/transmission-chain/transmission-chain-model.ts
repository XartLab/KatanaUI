// SPDX-License-Identifier: MIT
import { Graph, layout } from '@dagrejs/dagre'
import type { HypothesisEvidence } from '../hypothesis-ledger/hypothesis-ledger-model.ts'

// 传导链图的纯函数：布局（dagre，MIT，https://github.com/dagrejs/dagre ，2026-11-15 读其类型定义：Graph 支持多重边与 acyclicer，
// 布局结果给出节点中心与边的折点、边标签的中心）、边的曲线路径、缩放与适应视图。不带 React 与 DOM。

/** 边的验证状态：未检验 / 有证据支持 / 证据反对 / 部分（有支持也有反对，或只在部分条件下成立）。 */
export type ChainStatus = 'untested' | 'supported' | 'contradicted' | 'partial'

// 证据行沿用假说账的 HypothesisEvidence（来源类别、立场、出处链接、时间、一句话摘要），两个件的证据是同一种数据。
export type ChainNode = {
  id: string
  label: string
  /** 一句说明，选中节点时显示。 */
  note?: string
}

export type ChainEdge = {
  id: string
  from: string
  to: string
  status: ChainStatus
  /** 边上的短标签（如「抵押品与再融资」）；不给就只画状态与证据计数。 */
  label?: string
  /** 反馈边（沿链回到上游）：虚线之外另标 data-feedback，布局时不参与定层。 */
  feedback?: boolean
  /** 这条判断怎样算错：写不出失败条件的判断不算判断。 */
  failureCondition?: string
  evidence?: readonly HypothesisEvidence[]
}

export type ChainDirection = 'LR' | 'TB'

export const NODE_WIDTH = 168
export const NODE_HEIGHT = 48
export const LABEL_HEIGHT = 22

export type LaidNode = { id: string; x: number; y: number; width: number; height: number }
export type LaidEdge = {
  id: string
  from: string
  to: string
  points: readonly { x: number; y: number }[]
  /** 标签框的中心与尺寸。 */
  label: { x: number; y: number; width: number; height: number }
}
export type ChainLayout = { nodes: readonly LaidNode[]; edges: readonly LaidEdge[]; width: number; height: number }

export type EvidenceCounts = { support: number; oppose: number }

export function evidenceCounts(edge: Pick<ChainEdge, 'evidence'>): EvidenceCounts {
  const counts = { support: 0, oppose: 0 }
  for (const item of edge.evidence ?? []) counts[item.stance] += 1
  return counts
}

/** 丢掉指向不存在的节点的边、自环与重复 id；调用方传错的数据不让布局崩。 */
export function validEdges(nodes: readonly ChainNode[], edges: readonly ChainEdge[]): ChainEdge[] {
  const ids = new Set(nodes.map((n) => n.id))
  const seen = new Set<string>()
  return edges.filter((e) => {
    if (!ids.has(e.from) || !ids.has(e.to) || e.from === e.to || seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })
}

/** 各状态的条数，给图例用。 */
export function statusTotals(edges: readonly ChainEdge[]): Record<ChainStatus, number> {
  const totals: Record<ChainStatus, number> = { untested: 0, supported: 0, contradicted: 0, partial: 0 }
  for (const e of edges) totals[e.status] += 1
  return totals
}

/** 估一段字画出来的宽度（像素，12px 字）：全角 12，其余 7。不量真实字宽，让布局不依赖 DOM。 */
export function textWidth(text: string): number {
  let width = 0
  for (const char of text) width += char.charCodeAt(0) > 255 ? 12 : 7
  return width
}

export function layoutChain(
  nodes: readonly ChainNode[],
  edges: readonly ChainEdge[],
  options: { direction: ChainDirection; labelWidth: (edge: ChainEdge) => number },
): ChainLayout {
  if (nodes.length === 0) return { nodes: [], edges: [], width: 0, height: 0 }
  const kept = validEdges(nodes, edges)
  // 反馈边不交给 dagre：它回到上游，会让 dagre 反转正向的边、整条链排乱。先只排正向边，反馈边事后从节点侧面绕出去。
  const forward = kept.filter((e) => !e.feedback)
  const g = new Graph({ multigraph: true })
  g.setGraph({
    rankdir: options.direction,
    nodesep: options.direction === 'LR' ? 28 : 36,
    ranksep: options.direction === 'LR' ? 64 : 40,
    edgesep: 16,
    marginx: 16,
    marginy: 16,
    // 调用方的正向边自己成环时，dagre 先反转一部分再把折点转回原方向。
    acyclicer: 'greedy',
  })
  g.setDefaultEdgeLabel(() => ({}))
  for (const n of nodes) g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  for (const e of forward)
    g.setEdge(e.from, e.to, { width: options.labelWidth(e), height: LABEL_HEIGHT, labelpos: 'c' }, e.id)
  layout(g)
  const info = g.graph()
  const laidNodes = nodes.map((n) => {
    const laid = g.node(n.id)
    return { id: n.id, x: laid.x ?? 0, y: laid.y ?? 0, width: NODE_WIDTH, height: NODE_HEIGHT }
  })
  const at = new Map(laidNodes.map((n) => [n.id, n]))
  const laidEdges: LaidEdge[] = []
  let width = info.width ?? 0
  let height = info.height ?? 0
  let lane = 0
  for (const e of kept) {
    if (!e.feedback) {
      const laid = g.edge(e.from, e.to, e.id)
      laidEdges.push({
        id: e.id,
        from: e.from,
        to: e.to,
        points: laid.points ?? [],
        label: { x: laid.x ?? 0, y: laid.y ?? 0, width: laid.width ?? 0, height: LABEL_HEIGHT },
      })
      continue
    }
    const s = at.get(e.from)!
    const t = at.get(e.to)!
    const labelW = options.labelWidth(e)
    // TB 从两端节点的右侧绕出去，LR 从下侧；每条反馈边各占一条车道，不重叠。
    let points: { x: number; y: number }[]
    let mid: { x: number; y: number }
    let chip: { x: number; y: number }
    if (options.direction === 'TB') {
      const out = Math.max(...laidNodes.map((n) => n.x)) + NODE_WIDTH / 2 + 48 + lane * (LABEL_HEIGHT + 12)
      mid = { x: out, y: (s.y + t.y) / 2 }
      points = [
        { x: s.x + NODE_WIDTH / 2, y: s.y },
        { x: out, y: s.y },
        mid,
        { x: out, y: t.y },
        { x: t.x + NODE_WIDTH / 2, y: t.y },
      ]
      chip = { x: out + labelW / 2 + 10, y: mid.y }
      width = Math.max(width, out + labelW + 26)
    } else {
      const out = Math.max(...laidNodes.map((n) => n.y)) + NODE_HEIGHT / 2 + 40 + lane * (LABEL_HEIGHT + 12)
      mid = { x: (s.x + t.x) / 2, y: out }
      points = [
        { x: s.x, y: s.y + NODE_HEIGHT / 2 },
        { x: s.x, y: out },
        mid,
        { x: t.x, y: out },
        { x: t.x, y: t.y + NODE_HEIGHT / 2 },
      ]
      chip = { x: mid.x, y: out + LABEL_HEIGHT / 2 + 10 }
      height = Math.max(height, out + LABEL_HEIGHT + 26)
    }
    lane += 1
    laidEdges.push({
      id: e.id,
      from: e.from,
      to: e.to,
      points,
      label: { x: chip.x, y: chip.y, width: labelW, height: LABEL_HEIGHT },
    })
  }
  // 保持传入顺序，方便读屏与测试。
  const order = new Map(kept.map((e, i) => [e.id, i]))
  laidEdges.sort((x, y) => order.get(x.id)! - order.get(y.id)!)
  return { nodes: laidNodes, edges: laidEdges, width, height }
}

/** 折点连成平滑曲线（Catmull-Rom 转三次贝塞尔，张力 1/6）。两点以内走直线。 */
export function smoothPath(points: readonly { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  const f = (n: number) => Number(n.toFixed(2))
  let d = `M${f(points[0]!.x)},${f(points[0]!.y)}`
  if (points.length === 2) return `${d}L${f(points[1]!.x)},${f(points[1]!.y)}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[Math.min(points.length - 1, i + 2)]!
    d += `C${f(p1.x + (p2.x - p0.x) / 6)},${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)},${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)},${f(p2.y)}`
  }
  return d
}

export type View = { x: number; y: number; k: number }
export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 3

const clampZoom = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k))

/** 把整张图放进视口并居中；放大不超过 1（小图不放大成一团）。 */
export function fitView(
  box: { width: number; height: number },
  size: { width: number; height: number },
  pad = 16,
): View {
  if (size.width <= 0 || size.height <= 0 || box.width <= 0 || box.height <= 0) return { x: 0, y: 0, k: 1 }
  const k = clampZoom(Math.min(1, (box.width - pad * 2) / size.width, (box.height - pad * 2) / size.height))
  return { k, x: (box.width - size.width * k) / 2, y: (box.height - size.height * k) / 2 }
}

/** 以视口里一点为中心缩放：该点下的图坐标缩放前后不动。 */
export function zoomAt(view: View, point: { x: number; y: number }, factor: number): View {
  const k = clampZoom(view.k * factor)
  const ratio = k / view.k
  return { k, x: point.x - (point.x - view.x) * ratio, y: point.y - (point.y - view.y) * ratio }
}

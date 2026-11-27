// SPDX-License-Identifier: MIT
import { Graph, layout } from '@dagrejs/dagre'
import type { ChainStatus } from '../transmission-chain/transmission-chain-model.ts'

// 白板（#51）的纯函数：数据类型（纯 JSON，存哪由调用方管）、下游、自动布局、对齐吸附、复制粘贴。不带 React 与 DOM。
// 自动布局改自 React Flow 官方示例「Dagre Tree」（https://reactflow.dev/examples/layout/dagre ，xyflow/web 仓库，MIT，
// Copyright (c) 2019-2025 webkid GmbH，2026-11-18 读）：dagre 给的是节点中心，换成左上角；我们另外跳过分组框与组内节点、反馈边不参与定层。
// 撤销重做、复制粘贴、辅助线吸附在 React Flow 官网是 Pro 示例（xyflow Pro License，不是 MIT，2026-11-18 核对页面），没有照抄，按同样的用法自己写。

export type WhiteboardPoint = { x: number; y: number }

type NodeBase = {
  id: string
  /** 左上角，画布坐标；有 parentId 时相对分组框的左上角。 */
  position: WhiteboardPoint
  /** 宽高：分组框必给（可拖角改），其余节点不给就按内容。 */
  width?: number
  height?: number
  /** 所在分组框的 id：跟着分组框一起拖。 */
  parentId?: string
}

/** 便签：一段字，双击改。 */
export type WhiteboardNoteNode = NodeBase & { type: 'note'; data: { text: string } }
/** 分组框：圈住一组节点，左上角写标题。 */
export type WhiteboardGroupNode = NodeBase & { type: 'group'; data: { title: string } }
/** 指标 / 序列：标题、当前值（调用方写好的字）、小折线（从旧到新）。计算由调用方做，件只显示。 */
export type WhiteboardMetricNode = NodeBase & {
  type: 'metric'
  data: { title: string; value: string; series?: number[]; unit?: string }
}
/** 卡片：标题 + 插槽，插槽里画什么由调用方的 renderCard 定（slot 是给它的键）。 */
export type WhiteboardCardNode = NodeBase & { type: 'card'; data: { title: string; slot?: string } }
/** 假说：状态（与传导链同一套）与支持 / 反对的证据计数。 */
export type WhiteboardHypothesisNode = NodeBase & {
  type: 'hypothesis'
  data: { title: string; status: ChainStatus; support?: number; oppose?: number }
}

export type WhiteboardNode =
  | WhiteboardNoteNode
  | WhiteboardGroupNode
  | WhiteboardMetricNode
  | WhiteboardCardNode
  | WhiteboardHypothesisNode
export type WhiteboardNodeType = WhiteboardNode['type']

export type WhiteboardEdge = {
  id: string
  source: string
  target: string
  /** 带验证状态的边：线型 + 图标 + 色与 TransmissionChain 同一套；不给是普通边。 */
  status?: ChainStatus
  /** 反馈边（回到上游）：点线，标签带回环图标；不参与自动布局定层，也不算下游。 */
  feedback?: boolean
  label?: string
}

export type WhiteboardDoc = {
  nodes: WhiteboardNode[]
  edges: WhiteboardEdge[]
  /** 连接点朝向与上一次自动布局的方向：TB 从上到下（缺省）、LR 从左到右。随文档存，打开时按它还原。 */
  layout?: WhiteboardDirection
}
export type WhiteboardDirection = 'TB' | 'LR'

/** 节点没量到尺寸时的估计（自动布局与吸附用）。 */
export const DEFAULT_SIZE: Record<WhiteboardNodeType, { width: number; height: number }> = {
  note: { width: 160, height: 72 },
  group: { width: 320, height: 200 },
  metric: { width: 184, height: 88 },
  card: { width: 220, height: 120 },
  hypothesis: { width: 200, height: 76 },
}

/**
 * 从一个节点沿边往下走能到的节点与经过的边（不含起点；反馈边默认不走，否则一个环会让整条链都算下游）。
 * 只认图，不算数：改一个指标要重算哪些，交给调用方按这份名单去算。
 */
export function getDownstream(
  edges: readonly WhiteboardEdge[],
  nodeId: string,
  options: { includeFeedback?: boolean } = {},
): { nodes: Set<string>; edges: Set<string> } {
  const out = Map.groupBy(
    edges.filter((e) => options.includeFeedback || !e.feedback),
    (e) => e.source,
  )
  const nodes = new Set<string>()
  const via = new Set<string>()
  const queue = [nodeId]
  while (queue.length) {
    const id = queue.shift()!
    for (const edge of out.get(id) ?? []) {
      via.add(edge.id)
      if (edge.target === nodeId || nodes.has(edge.target)) continue
      nodes.add(edge.target)
      queue.push(edge.target)
    }
  }
  return { nodes, edges: via }
}

/** 丢掉指向不存在节点的边、自环与重复 id（调用方的数据坏了不让画布崩）。 */
export function validEdges(doc: WhiteboardDoc): WhiteboardEdge[] {
  const ids = new Set(doc.nodes.map((n) => n.id))
  const seen = new Set<string>()
  return doc.edges.filter((e) => {
    if (!ids.has(e.source) || !ids.has(e.target) || e.source === e.target || seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })
}

/** 分组框排在组内节点前面（React Flow 要父节点先出现）；其余保持原次序。 */
export function parentsFirst<T extends { id: string; parentId?: string }>(nodes: readonly T[]): T[] {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const depth = (n: T, guard = 0): number => {
    const parent = n.parentId ? byId.get(n.parentId) : undefined
    return parent && guard < 32 ? 1 + depth(parent, guard + 1) : 0
  }
  return nodes
    .map((n, i) => ({ n, i, d: depth(n) }))
    .toSorted((a, b) => a.d - b.d || a.i - b.i)
    .map((x) => x.n)
}

/**
 * 自动布局（dagre，TB 从上到下 / LR 从左到右）：只排顶层、不是分组框的节点；分组框与组内节点不动，反馈边不参与定层。
 * sizeOf 给量到的尺寸，没量到用 DEFAULT_SIZE。
 */
export function layoutWhiteboard(
  doc: WhiteboardDoc,
  direction: WhiteboardDirection,
  sizeOf: (node: WhiteboardNode) => { width: number; height: number } = (n) => ({
    width: n.width ?? DEFAULT_SIZE[n.type].width,
    height: n.height ?? DEFAULT_SIZE[n.type].height,
  }),
): WhiteboardDoc {
  const free = doc.nodes.filter((n) => n.type !== 'group' && !n.parentId)
  if (free.length === 0) return { ...doc, layout: direction }
  const ids = new Set(free.map((n) => n.id))
  const g = new Graph({ multigraph: true })
  g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 64, marginx: 0, marginy: 0, acyclicer: 'greedy' })
  g.setDefaultEdgeLabel(() => ({}))
  for (const n of free) g.setNode(n.id, sizeOf(n))
  for (const e of validEdges(doc))
    if (!e.feedback && ids.has(e.source) && ids.has(e.target)) g.setEdge(e.source, e.target, {}, e.id)
  layout(g)
  // dagre 从 (0,0) 排起；整体挪到原来那批节点的左上角，免得一按布局图跑出视口。
  const left = Math.min(...free.map((n) => n.position.x))
  const top = Math.min(...free.map((n) => n.position.y))
  const placed = new Map(
    free.map((n) => {
      const at = g.node(n.id)
      const size = sizeOf(n)
      return [
        n.id,
        { x: Math.round(left + (at.x ?? 0) - size.width / 2), y: Math.round(top + (at.y ?? 0) - size.height / 2) },
      ]
    }),
  )
  return {
    ...doc,
    layout: direction,
    nodes: doc.nodes.map((n) => (placed.has(n.id) ? { ...n, position: placed.get(n.id)! } : n)),
  }
}

export type GuideRect = { x: number; y: number; width: number; height: number }
export type SnapResult = { x: number; y: number; guideX?: number; guideY?: number }

/**
 * 对齐吸附：拖动中的框的左 / 中 / 右、上 / 中 / 下离别的框的同类线不到 threshold（画布像素）就贴上去，
 * 并给出要画的辅助线（竖线的 x、横线的 y）。两个方向各自取最近的一条。
 */
export function snapToGuides(moving: GuideRect, others: readonly GuideRect[], threshold = 6): SnapResult {
  const xs = (r: GuideRect) => [r.x, r.x + r.width / 2, r.x + r.width]
  const ys = (r: GuideRect) => [r.y, r.y + r.height / 2, r.y + r.height]
  let best: { dx: number; line: number } | null = null
  let bestY: { dy: number; line: number } | null = null
  const mx = xs(moving)
  const my = ys(moving)
  for (const other of others) {
    for (const line of xs(other))
      for (const own of mx) {
        const dx = line - own
        if (Math.abs(dx) <= threshold && (!best || Math.abs(dx) < Math.abs(best.dx))) best = { dx, line }
      }
    for (const line of ys(other))
      for (const own of my) {
        const dy = line - own
        if (Math.abs(dy) <= threshold && (!bestY || Math.abs(dy) < Math.abs(bestY.dy))) bestY = { dy, line }
      }
  }
  return {
    x: moving.x + (best?.dx ?? 0),
    y: moving.y + (bestY?.dy ?? 0),
    guideX: best?.line,
    guideY: bestY?.line,
  }
}

export type WhiteboardClip = { nodes: WhiteboardNode[]; edges: WhiteboardEdge[] }

/** 复制：选中的节点（选了分组框连同组内节点）与两端都在里面的边。 */
export function copySelection(doc: WhiteboardDoc, ids: ReadonlySet<string>): WhiteboardClip {
  const picked = new Set(ids)
  for (const n of doc.nodes) if (n.parentId && picked.has(n.parentId)) picked.add(n.id)
  const nodes = doc.nodes.filter((n) => picked.has(n.id))
  const edges = doc.edges.filter((e) => picked.has(e.source) && picked.has(e.target))
  return structuredClone({ nodes, edges })
}

/**
 * 粘贴：换新 id（makeId 给），整体平移 offset；组内节点的分组框也粘了就跟新框走，没粘就留在原框里（原框不在了就变成顶层）。
 * 返回新文档与新节点的 id（粘完选中它们）。
 */
export function pasteClip(
  doc: WhiteboardDoc,
  clip: WhiteboardClip,
  offset: WhiteboardPoint,
  makeId: (old: string) => string,
): { doc: WhiteboardDoc; ids: string[] } {
  const remap = new Map(clip.nodes.map((n) => [n.id, makeId(n.id)]))
  const existing = new Set(doc.nodes.map((n) => n.id))
  const nodes = clip.nodes.map((n): WhiteboardNode => {
    const copy = structuredClone(n)
    copy.id = remap.get(n.id)!
    const parent = n.parentId
      ? (remap.get(n.parentId) ?? (existing.has(n.parentId) ? n.parentId : undefined))
      : undefined
    // 跟着新分组框走的节点位置是相对框的，不再平移。
    const moved = !(n.parentId && remap.has(n.parentId))
    if (moved) copy.position = { x: n.position.x + offset.x, y: n.position.y + offset.y }
    if (parent) copy.parentId = parent
    else delete copy.parentId
    return copy
  })
  const edges = clip.edges.map((e) => ({
    ...structuredClone(e),
    id: makeId(e.id),
    source: remap.get(e.source)!,
    target: remap.get(e.target)!,
  }))
  return {
    doc: { nodes: parentsFirst([...doc.nodes, ...nodes]), edges: [...doc.edges, ...edges] },
    ids: nodes.map((n) => n.id),
  }
}

/** 删掉一批节点（连同组内节点与挨着它们的边）与一批边。 */
export function removeItems(
  doc: WhiteboardDoc,
  nodeIds: ReadonlySet<string>,
  edgeIds: ReadonlySet<string>,
): WhiteboardDoc {
  const gone = new Set(nodeIds)
  let grew = true
  while (grew) {
    grew = false
    for (const n of doc.nodes)
      if (n.parentId && gone.has(n.parentId) && !gone.has(n.id)) {
        gone.add(n.id)
        grew = true
      }
  }
  return {
    nodes: doc.nodes.filter((n) => !gone.has(n.id)),
    edges: doc.edges.filter((e) => !edgeIds.has(e.id) && !gone.has(e.source) && !gone.has(e.target)),
  }
}

/** 撤销重做的历史：存整份文档的快照（文档是纯 JSON，几十上百个节点的快照很小）；最多留 limit 步。 */
export type History = { past: WhiteboardDoc[]; future: WhiteboardDoc[] }
export const HISTORY_LIMIT = 100

export function pushHistory(history: History, before: WhiteboardDoc, limit = HISTORY_LIMIT): History {
  return { past: [...history.past, before].slice(-limit), future: [] }
}
export function undoHistory(history: History, current: WhiteboardDoc): { history: History; doc: WhiteboardDoc } | null {
  const doc = history.past.at(-1)
  if (!doc) return null
  return { doc, history: { past: history.past.slice(0, -1), future: [current, ...history.future] } }
}
export function redoHistory(history: History, current: WhiteboardDoc): { history: History; doc: WhiteboardDoc } | null {
  const doc = history.future[0]
  if (!doc) return null
  return { doc, history: { past: [...history.past, current], future: history.future.slice(1) } }
}

// SPDX-License-Identifier: MIT
// FlowSankey 的纯逻辑：把节点与流量排成桑基图、算占比、找上下游、键盘在节点间走。
// 排布用 d3-sankey 0.12.3（BSD-3-Clause，2026-11-15 核对其 LICENSE 与 package.json），不自己写；它的依赖 d3-array 2.12.1、d3-shape 1.3.7、d3-path 1.0.9 也是 BSD-3-Clause。
// 口径：「交易流量」(flow) 是真有资金从 A 流到 B；「价格重估」(revaluation) 是估值变了、没有资金移动，两者分开记：
//   占比与来源总量只算交易流量；重估链路只在图上占位（斜纹）、在读数里单独列，不并进流量。
import { sankey, sankeyJustify, sankeyLinkHorizontal } from 'd3-sankey'

export type FlowKind = 'flow' | 'revaluation'

export type FlowNode = {
  id: string
  label: string
  /** 第几列（从 0 起）：全部节点都给才按它排；不全给就由 d3-sankey 按链路深度排。 */
  column?: number
  /** 节点色（CSS 颜色）；不给用中性灰。 */
  color?: string
}

export type FlowLink = {
  /** 链路 id；不给用 `源>去>类型`。 */
  id?: string
  source: string
  target: string
  value: number
  /** 默认 flow。 */
  kind?: FlowKind
  /** 悬停框里多写一行说明。 */
  note?: string
}

export type LaidNode = FlowNode & {
  x0: number
  x1: number
  y0: number
  y1: number
  layer: number
  /** 只算交易流量。 */
  flowIn: number
  flowOut: number
  revalIn: number
  revalOut: number
  /** 占总量的比例（交易流量，取流入流出较大者）；总量为 0 是 null。 */
  share: number | null
}

export type LaidLink = {
  id: string
  source: string
  target: string
  kind: FlowKind
  value: number
  note?: string
  /** 带宽（排布单位）。 */
  width: number
  /** 路径（中心线，笔宽 = width）。 */
  d: string
  /** 占来源节点交易流出的比例；重估链路是 null。 */
  shareOfSource: number | null
  /** 占总量的比例；重估链路是 null。 */
  shareOfTotal: number | null
}

export type FlowLayout = {
  ok: true
  nodes: LaidNode[]
  links: LaidLink[]
  /** 总量：没有交易流入的节点的交易流出之和（资金的起点）。 */
  total: number
  /** 被丢掉的链路数（值不是正数、端点不存在）。 */
  dropped: number
  columns: number
}
export type FlowLayoutFailure = { ok: false; reason: 'empty' | 'cycle' }

export type FlowLayoutOptions = {
  width: number
  height: number
  top?: number
  bottom?: number
  nodeWidth?: number
  nodePadding?: number
  /** false 时重估链路整条不进排布（图上只剩交易流量）。 */
  showRevaluation?: boolean
}

type SNode = FlowNode & { x0?: number; x1?: number; y0?: number; y1?: number; layer?: number }
type SLink = {
  id: string
  source: string | SNode
  target: string | SNode
  value: number
  kind: FlowKind
  note?: string
}

const linkId = (link: Pick<FlowLink, 'id' | 'source' | 'target' | 'kind'>): string =>
  link.id ?? `${link.source}>${link.target}>${link.kind ?? 'flow'}`

const ratio = (part: number, whole: number): number | null => (whole > 0 ? part / whole : null)

export function layoutFlow(
  nodes: readonly FlowNode[],
  links: readonly FlowLink[],
  { width, height, top = 0, bottom = 0, nodeWidth = 12, nodePadding = 14, showRevaluation = true }: FlowLayoutOptions,
): FlowLayout | FlowLayoutFailure {
  const known = new Set(nodes.map((node) => node.id))
  const valid: SLink[] = []
  let dropped = 0
  for (const link of links) {
    const kind = link.kind ?? 'flow'
    if (!(link.value > 0) || !Number.isFinite(link.value) || !known.has(link.source) || !known.has(link.target)) {
      dropped += 1
      continue
    }
    if (kind === 'revaluation' && !showRevaluation) continue
    valid.push({
      id: linkId({ ...link, kind }),
      source: link.source,
      target: link.target,
      value: link.value,
      kind,
      note: link.note,
    })
  }
  const used = new Set(valid.flatMap((link) => [link.source as string, link.target as string]))
  const kept: SNode[] = nodes.filter((node) => used.has(node.id)).map((node) => ({ ...node }))
  if (kept.length === 0) return { ok: false, reason: 'empty' }

  const byColumn = kept.every((node) => Number.isInteger(node.column) && node.column! >= 0)
  const layout = sankey<SNode, SLink>()
    .nodeId((node) => node.id)
    .nodeWidth(nodeWidth)
    .nodePadding(nodePadding)
    .nodeSort(null)
    .extent([
      [0, top],
      [width, height - bottom],
    ])
    .nodeAlign(byColumn ? (node) => (node as SNode).column! : sankeyJustify)
  let graph
  try {
    graph = layout({ nodes: kept, links: valid.map((link) => ({ ...link })) })
  } catch {
    // d3-sankey 遇到环就抛：资金流向图应当是有向无环的，环要调用方先拆开（例如把回流记成另一个节点）。
    return { ok: false, reason: 'cycle' }
  }

  const flowIn = new Map<string, number>()
  const flowOut = new Map<string, number>()
  const revalIn = new Map<string, number>()
  const revalOut = new Map<string, number>()
  const add = (map: Map<string, number>, id: string, value: number) => map.set(id, (map.get(id) ?? 0) + value)
  for (const link of valid) {
    const source = link.source as string
    const target = link.target as string
    if (link.kind === 'flow') {
      add(flowOut, source, link.value)
      add(flowIn, target, link.value)
    } else {
      add(revalOut, source, link.value)
      add(revalIn, target, link.value)
    }
  }
  let total = 0
  for (const node of kept) if (!flowIn.has(node.id)) total += flowOut.get(node.id) ?? 0

  const path = sankeyLinkHorizontal()
  const laidLinks: LaidLink[] = graph.links.map((link) => {
    const source = (link.source as SNode).id
    const target = (link.target as SNode).id
    const flow = link.kind === 'flow'
    return {
      id: link.id,
      source,
      target,
      kind: link.kind,
      value: link.value,
      note: link.note,
      width: link.width ?? 0,
      d: path(link as never) ?? '',
      shareOfSource: flow ? ratio(link.value, flowOut.get(source) ?? 0) : null,
      shareOfTotal: flow ? ratio(link.value, total) : null,
    }
  })
  const laidNodes: LaidNode[] = graph.nodes.map((node) => {
    const inFlow = flowIn.get(node.id) ?? 0
    const outFlow = flowOut.get(node.id) ?? 0
    return {
      ...node,
      x0: node.x0 ?? 0,
      x1: node.x1 ?? 0,
      y0: node.y0 ?? 0,
      y1: node.y1 ?? 0,
      layer: node.layer ?? 0,
      flowIn: inFlow,
      flowOut: outFlow,
      revalIn: revalIn.get(node.id) ?? 0,
      revalOut: revalOut.get(node.id) ?? 0,
      share: ratio(Math.max(inFlow, outFlow), total),
    }
  })
  return {
    ok: true,
    nodes: laidNodes,
    links: laidLinks,
    total,
    dropped,
    columns: Math.max(...laidNodes.map((node) => node.layer)) + 1,
  }
}

/** 一个节点的上游（沿链路倒着走）与下游（顺着走）：节点与链路的 id 集合，含它自己。 */
export function neighborhood(
  links: readonly Pick<LaidLink, 'id' | 'source' | 'target'>[],
  nodeId: string,
): { nodes: Set<string>; links: Set<string> } {
  const nodes = new Set([nodeId])
  const picked = new Set<string>()
  const walk = (from: 'source' | 'target', to: 'source' | 'target') => {
    const queue = [nodeId]
    const seen = new Set(queue)
    while (queue.length > 0) {
      const at = queue.shift()!
      for (const link of links) {
        if (link[from] !== at) continue
        picked.add(link.id)
        nodes.add(link[to])
        if (!seen.has(link[to])) {
          seen.add(link[to])
          queue.push(link[to])
        }
      }
    }
  }
  walk('source', 'target')
  walk('target', 'source')
  return { nodes, links: picked }
}

/** 一条链路两端的节点（悬停链路时只亮它与两端，不连带整条上下游）。 */
export function linkEnds(link: Pick<LaidLink, 'id' | 'source' | 'target'>): { nodes: Set<string>; links: Set<string> } {
  return { nodes: new Set([link.source, link.target]), links: new Set([link.id]) }
}

/**
 * 键盘在节点间走：↑↓ 同一列里上一个 / 下一个（按纵向位置），←→ 去上一列 / 下一列里被链路连着的、纵向最近的节点；
 * Home / End 去第一个 / 最后一个节点。走不动或不是这些键返回 null。
 */
export function moveNode(
  nodes: readonly Pick<LaidNode, 'id' | 'layer' | 'y0' | 'y1'>[],
  links: readonly Pick<LaidLink, 'source' | 'target'>[],
  from: string,
  key: string,
): string | null {
  const here = nodes.find((node) => node.id === from)
  if (!here) return null
  // js/copying-array-methods：toSorted 替代「展开复制再 sort」。
  const order = nodes.toSorted((a, b) => a.layer - b.layer || a.y0 - b.y0)
  if (key === 'Home') return order[0]!.id
  if (key === 'End') return order[order.length - 1]!.id
  if (key === 'ArrowUp' || key === 'ArrowDown') {
    const column = order.filter((node) => node.layer === here.layer)
    const next = column[column.findIndex((node) => node.id === from) + (key === 'ArrowUp' ? -1 : 1)]
    return next?.id ?? null
  }
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return null
  const forward = key === 'ArrowRight'
  const linked = new Set(
    links.flatMap((link) =>
      forward ? (link.source === from ? [link.target] : []) : link.target === from ? [link.source] : [],
    ),
  )
  const mid = (here.y0 + here.y1) / 2
  const near = nodes
    .filter((node) => linked.has(node.id))
    .sort((a, b) => Math.abs((a.y0 + a.y1) / 2 - mid) - Math.abs((b.y0 + b.y1) / 2 - mid))
  return near[0]?.id ?? null
}

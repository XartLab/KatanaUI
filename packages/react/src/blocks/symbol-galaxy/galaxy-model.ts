// SPDX-License-Identifier: MIT
// SymbolGalaxy 的纯逻辑：按分组做圆堆积的布局、命中判断、团内方向键移动。功能参照 Arc Customer galaxy（uiarc.dev，2026-11-14 读），实现原创。
// 布局用 d3-hierarchy 的 pack（ISC，包里已有的依赖）：同样的数据永远排出同样的位置（输入先按大小与 id 定序，不用随机、不跑力模拟），可测。
import { hierarchy, pack } from 'd3-hierarchy'

export type GalaxyNode = {
  id: string
  label: string
  /** 圆的面积按它定（市值、仓位）；不是正的有限数的点不画。 */
  size: number
  /** 涨跌幅（小数）；null 是没有数，用中性色。 */
  change: number | null
  /** 每种分组方式下它属于哪一团：键是分组方式的 id，值是团名（调用方按界面语言写好）。 */
  groups: Readonly<Record<string, string>>
}

export type GalaxyGroup = { key: string; count: number; total: number; x: number; y: number; r: number }
export type GalaxyPlace = { x: number; y: number; r: number; group: string }
export type GalaxyLayout = { groups: GalaxyGroup[]; places: Map<string, GalaxyPlace> }

type Datum = { id: string; key: string; size: number; children?: Datum[] }

/** 团与团之间、团内点与点之间留的缝（布局单位，画布宽 800）。点多时点很小，缝大了就吃掉大半面积，所以团内取小。视觉取值，待定。 */
const GROUP_GAP = 6
const NODE_GAP = 1

export function layoutGalaxy(
  nodes: readonly GalaxyNode[],
  groupBy: string,
  frame: { width: number; height: number; pad: number; headroom: number },
): GalaxyLayout {
  const buckets = new Map<string, Datum[]>()
  for (const node of nodes) {
    if (!(node.size > 0) || !Number.isFinite(node.size)) continue
    const key = node.groups[groupBy] ?? ''
    const list = buckets.get(key) ?? []
    list.push({ id: node.id, key, size: node.size })
    buckets.set(key, list)
  }
  if (buckets.size === 0) return { groups: [], places: new Map() }
  const root = hierarchy<Datum>({
    id: '',
    key: '',
    size: 0,
    children: [...buckets].map(([key, list]) => ({ id: `group:${key}`, key, size: 0, children: list })),
  })
    .sum((datum) => (datum.children ? 0 : datum.size))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0) || (a.data.id < b.data.id ? -1 : a.data.id > b.data.id ? 1 : 0))
  const w = frame.width - 2 * frame.pad
  const h = frame.height - 2 * frame.pad - frame.headroom
  pack<Datum>()
    .size([w, h])
    // pack 的 padding 按「父节点」取：根的是团与团之间的缝，团的是它里面点与点之间的缝。
    .padding((node) => (node.depth === 0 ? GROUP_GAP : NODE_GAP))(root)
  const dx = frame.pad
  const dy = frame.pad + frame.headroom
  const places = new Map<string, GalaxyPlace>()
  const groups = (root.children ?? []).map((group) => {
    for (const leaf of group.children ?? [])
      places.set(leaf.data.id, { x: leaf.x + dx, y: leaf.y + dy, r: leaf.r, group: group.data.key })
    return {
      key: group.data.key,
      count: group.children?.length ?? 0,
      total: group.value ?? 0,
      x: group.x + dx,
      y: group.y + dy,
      r: group.r,
    }
  })
  return { groups, places }
}

/** 点 (x, y) 落在哪个点上：包含它的最小的圆；没有返回 null。多个圆重叠时（缝为正，正常不会）取小的。 */
export function hitNode(places: ReadonlyMap<string, GalaxyPlace>, x: number, y: number): string | null {
  let best: string | null = null
  let bestR = Infinity
  for (const [id, place] of places) {
    if (place.r < bestR && Math.hypot(place.x - x, place.y - y) <= place.r) {
      best = id
      bestR = place.r
    }
  }
  return best
}

const DIRECTIONS: Record<string, [number, number]> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
}

/**
 * 在一团里按方向键走：从 from 出发，只看方向键那一侧（前进分量为正）的点，挑「前进距离与两倍横向偏移合成」最近的；那一侧没有点就留在原地（返回 from）。
 * 不是方向键返回 null。ids 是这一团里的点。
 */
export function stepNode(
  places: ReadonlyMap<string, GalaxyPlace>,
  ids: readonly string[],
  from: string,
  key: string,
): string | null {
  const direction = DIRECTIONS[key]
  const origin = places.get(from)
  if (!direction || !origin) return null
  let best = from
  let bestScore = Infinity
  for (const id of ids) {
    const place = places.get(id)
    if (!place || id === from) continue
    const vx = place.x - origin.x
    const vy = place.y - origin.y
    const along = vx * direction[0] + vy * direction[1]
    if (along <= 0) continue
    const across = Math.abs(vx * direction[1] - vy * direction[0])
    const score = Math.hypot(along, across * 2)
    if (score < bestScore) {
      best = id
      bestScore = score
    }
  }
  return best
}

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

export type LabelBox = { x0: number; y0: number; x1: number; y1: number }
export type GalaxyGroup = {
  key: string
  count: number
  total: number
  x: number
  y: number
  r: number
  /** 团名的框（布局单位）：默认在外接圆正上方；上方被邻团占了就放下方或左右挪开。 */
  label: LabelBox
}
export type GalaxyPlace = { x: number; y: number; r: number; group: string }
export type GalaxyLayout = { groups: GalaxyGroup[]; places: Map<string, GalaxyPlace> }

type Datum = { id: string; key: string; size: number; children?: Datum[] }

/** 团与团之间、团内点与点之间留的缝（布局单位，画布宽 800）。点多时点很小，缝大了就吃掉大半面积，所以团内取小。视觉取值，待定。 */
const NODE_GAP = 1
/** 团名一行的高度：11px 字（--text-caption）的行高，画布宽 800 时布局单位约等于像素。 */
export const LABEL_H = 16
/** 团名与它的圈之间的空；团与团之间的缝 = 一行团名 + 这个空 + 余量 2，这样团名放在圈上方的留白里不会碰到邻团。视觉取值，待定。 */
const LABEL_GAP = 2
const GROUP_GAP = LABEL_H + LABEL_GAP + 2
/** 团名宽度的估计：中日韩字一格 11，其余 6.5，两端各留 4。字体度量要到浏览器里才有，布局是纯函数，只能估；偏差靠 GROUP_GAP 的余量吸收。 */
function labelWidth(text: string): number {
  let w = 8
  for (const ch of text) w += /[\u2e80-\u9fff\uff00-\uffef]/.test(ch) ? 11 : 6.5
  return w
}
/** 图实际画多宽决定团名占多少布局单位：团名是真实像素的字，图缩到 0.6 倍时它在布局里就是 1/0.6 倍大。 */
const MIN_SCALE = 0.3

function hitsCircle(box: LabelBox, cx: number, cy: number, r: number): boolean {
  const nx = Math.min(Math.max(cx, box.x0), box.x1)
  const ny = Math.min(Math.max(cy, box.y0), box.y1)
  return Math.hypot(nx - cx, ny - cy) < r
}

function hitsBox(a: LabelBox, b: LabelBox): boolean {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1
}

type Circle = { key: string; x: number; y: number; r: number }

/** 给每个团挑团名的框：先试正上方，再试正下方，再沿上下沿左右挪开；挑第一个不碰别团的圈、不碰已放的团名、不出画布的；都不行用正上方。 */
function placeLabels(
  circles: readonly Circle[],
  frame: { width: number; height: number },
  unit: number,
): Map<string, LabelBox> {
  const out = new Map<string, LabelBox>()
  for (const c of [...circles].sort((a, b) => b.r - a.r)) {
    const w = labelWidth(c.key) * unit
    const lh = LABEL_H * unit
    const above = c.y - c.r - LABEL_GAP * unit - lh
    const below = c.y + c.r + LABEL_GAP * unit
    // 候选：正上、正下，再沿圈的上沿与下沿左右挪开几档。
    const tries: [number, number][] = []
    for (const y of [above, below]) for (const f of [0.5, 0.25, 0.75, 0, 1, -0.1, 1.1]) tries.push([c.x - w * f, y])
    const boxes = tries.map(([x0, y0]) => ({ x0, y0, x1: x0 + w, y1: y0 + lh }))
    const ok = (box: LabelBox) =>
      box.x0 >= 0 &&
      box.y0 >= 0 &&
      box.x1 <= frame.width &&
      box.y1 <= frame.height &&
      circles.every((o) => o.key === c.key || !hitsCircle(box, o.x, o.y, o.r)) &&
      [...out.values()].every((placed) => !hitsBox(box, placed))
    out.set(c.key, boxes.find(ok) ?? boxes[0]!)
  }
  return out
}

export function layoutGalaxy(
  nodes: readonly GalaxyNode[],
  groupBy: string,
  frame: { width: number; height: number; pad: number; headroom: number; scale?: number },
): GalaxyLayout {
  const unit = 1 / Math.max(MIN_SCALE, frame.scale ?? 1)
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
  const packed = pack<Datum>()
    .size([w, h])
    // pack 的 padding 按「父节点」取：根的是团与团之间的缝，团的是它里面点与点之间的缝。
    .padding((node) => (node.depth === 0 ? GROUP_GAP * unit : NODE_GAP))(root)
  const dx = frame.pad
  const dy = frame.pad + frame.headroom
  const places = new Map<string, GalaxyPlace>()
  const circles = (packed.children ?? []).map((group) => {
    for (const leaf of group.children ?? [])
      places.set(leaf.data.id, { x: leaf.x + dx, y: leaf.y + dy, r: leaf.r, group: group.data.key })
    return { key: group.data.key, x: group.x + dx, y: group.y + dy, r: group.r }
  })
  const labels = placeLabels(circles, frame, unit)
  const groups = (packed.children ?? []).map((group, i) => ({
    key: group.data.key,
    count: group.children?.length ?? 0,
    total: group.value ?? 0,
    x: circles[i]!.x,
    y: circles[i]!.y,
    r: group.r,
    label: labels.get(group.data.key)!,
  }))
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

/**
 * 一个点的颜色档（-2..2，null 是没有数）：正负各两档，只有 |涨跌幅| 达到 hotAt（调用方取 |值| 的 80 分位，dataviz §2）的才用 ±2（div-*-200），
 * 其余 ±1（div-*-100），0 是中点灰；全饱和的涨跌色不上面积。
 */
export function galaxyStep(change: number | null | undefined, hotAt: number): -2 | -1 | 0 | 1 | 2 | null {
  if (change === null || change === undefined || !Number.isFinite(change)) return null
  if (change === 0) return 0
  const hot = Math.abs(change) >= hotAt
  return change > 0 ? (hot ? 2 : 1) : hot ? -2 : -1
}

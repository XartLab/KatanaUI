// SPDX-License-Identifier: MIT
// 矩形树图的排布：一格一项，面积按 size，按分组先分块、块头留一条写组名。排布用 d3-hierarchy 的 squarify（ISC），不自己写。纯函数。
// 从应用的 src/analysis/treemap.ts 提来（#1884；原来照 TradingView 股票市场热图，#443）。
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy'

export const TREEMAP_W = 1000
export const TREEMAP_H = 600
/** 组头那一条有多高（排布单位）。 */
const HEAD = 28

/** 排布的尺寸与组头高；不给就是 1000 × 600 的排布单位与 28（旧调用方不变）。传实际像素就能按真实尺寸排、按像素判断格子够不够大。 */
export type TreemapLayoutOptions = {
  /** Width of the layout box. */
  width?: number
  /** Height of the layout box. */
  height?: number
  /** Height reserved for each group header. */
  head?: number
}

export type TreemapItem<T> = { data: T; size: number; group: string }
export type TreemapCell<T> = { data: T; x0: number; y0: number; x1: number; y1: number }
export type TreemapBlock<T> = { name: string; x0: number; y0: number; x1: number; y1: number; cells: TreemapCell<T>[] }

type Node<T> = { name: string; item?: TreemapItem<T>; children?: Node<T>[] }

/** grouped 为 false 时整张一块、不留组头。size 不是正数的项不画。块按面积从大到小。 */
export function layoutTreemap<T>(
  items: readonly TreemapItem<T>[],
  grouped: boolean,
  { width = TREEMAP_W, height = TREEMAP_H, head = HEAD }: TreemapLayoutOptions = {},
): TreemapBlock<T>[] {
  const buckets = new Map<string, TreemapItem<T>[]>()
  for (const item of items) {
    if (!(item.size > 0) || !Number.isFinite(item.size)) continue
    const key = grouped ? item.group : ''
    const list = buckets.get(key) ?? []
    list.push(item)
    buckets.set(key, list)
  }
  const root = hierarchy<Node<T>>({
    name: '',
    children: [...buckets].map(([name, list]) => ({ name, children: list.map((item) => ({ name, item })) })),
  })
    .sum((node) => node.item?.size ?? 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  const laid = treemap<Node<T>>()
    .tile(treemapSquarify)
    .size([width, height])
    .paddingInner(2)
    .paddingTop((node) => (grouped && node.depth === 1 ? head : 0))(root)
  return (laid.children ?? []).map((node) => ({
    name: node.data.name,
    x0: node.x0,
    y0: node.y0,
    x1: node.x1,
    y1: node.y1,
    cells: (node.children ?? []).map((leaf) => ({
      data: leaf.data.item!.data,
      x0: leaf.x0,
      y0: leaf.y0,
      x1: leaf.x1,
      y1: leaf.y1,
    })),
  }))
}

/** 颜色档：涨跌幅（小数）按 ±limit 分成 −3 到 +3 七档（照 TradingView 热图底部的色例），没有数是 null。 */
export function colorStep(value: unknown, limit = 0.03): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const step = Math.round((value / limit) * 3)
  return Math.max(-3, Math.min(3, step))
}

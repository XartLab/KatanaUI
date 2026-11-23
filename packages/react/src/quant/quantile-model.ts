// SPDX-License-Identifier: MIT
// QuantileLayers 的纯逻辑：分层的颜色档（序数，--k-heat-1..5）、单调性（期末累计收益是否随分层序号单调上升）、纵轴范围。
// 卡：design/katana-console/project/components/QuantileLayers/README.md（2026-11-14 读）。

export type QuantileLayer = {
  /** 层号（1 起，越大因子值越高）。 */
  rank: number
  label: string
  /** 累计收益序列，与横轴一一对应；非有限数是缺口。 */
  points: readonly number[]
}

/** 一条序列最后一个有限的值；没有返回 NaN。 */
export function lastFinite(values: readonly number[]): number {
  for (let i = values.length - 1; i >= 0; i--) if (Number.isFinite(values[i])) return values[i]!
  return Number.NaN
}

/** 分层按层号排好（不改入参）。 */
export const sortLayers = (layers: readonly QuantileLayer[]): QuantileLayer[] =>
  // js/copying-array-methods：toSorted 替代「展开复制再 sort」。
  layers.toSorted((a, b) => a.rank - b.rank)

/** 单调：按层号排好后，期末累计收益严格递增（不是「基本递增」，卡写的是「一眼看出是否单调」）。少于两层、有缺值的不算单调。 */
export function isMonotonic(layers: readonly QuantileLayer[]): boolean {
  const finals = sortLayers(layers).map((layer) => lastFinite(layer.points))
  if (finals.length < 2 || finals.some((value) => !Number.isFinite(value))) return false
  return finals.every((value, i) => i === 0 || value > finals[i - 1]!)
}

/** 第 index 层（按层号排好后的序号）在 heat 档 0..4（--k-heat-1..5）上的档：最低层 0、最高层 4，中间等分取整；只有一层取最亮。 */
export function layerLevel(index: number, count: number): number {
  return count <= 1 ? 4 : Math.round((index / (count - 1)) * 4)
}

/** 纵轴要盖住的范围：所有层与多空差的最低最高，并包进 0（0 线要在图里）。 */
export function quantileRange(layers: readonly QuantileLayer[], longShort: readonly number[]): [number, number] {
  let lo = 0
  let hi = 0
  for (const values of [...layers.map((layer) => layer.points), longShort])
    for (const value of values) {
      if (!Number.isFinite(value)) continue
      if (value < lo) lo = value
      if (value > hi) hi = value
    }
  return [lo, hi]
}

/** 分层多于它不画线（卡：分层数 > 10 改热力图）。 */
export const MAX_LINE_LAYERS = 10

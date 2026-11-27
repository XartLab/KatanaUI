// SPDX-License-Identifier: MIT
/**
 * Geometry of FlowGauges: signed bar spans and depth column heights.
 * FlowGauges 的几何（纯函数，G6 从 flow-gauges.tsx 拆出）。
 */

/** 零轴居中的条：正数从中线往右、负数往左，各占半宽；越界贴边，null 与非有限数不画。返回 left、width（百分数）。纯函数。 */
export function signedSpan(value: number | null, limit = 100): { left: number; width: number } | null {
  if (value === null || !Number.isFinite(value) || limit <= 0) return null
  const half = (Math.min(limit, Math.abs(value)) / limit) * 50
  return value >= 0 ? { left: 50, width: half } : { left: 50 - half, width: half }
}

/** 挂单柱的高度（百分数）：按两边最大的一档排，最大的 100。两边都没有量返回 null（N/A）。纯函数。 */
export function depthHeights(
  bids: readonly number[],
  asks: readonly number[],
): { bids: number[]; asks: number[] } | null {
  const all = [...bids, ...asks].filter((size) => Number.isFinite(size) && size > 0)
  if (all.length === 0) return null
  const top = Math.max(...all)
  const scale = (sizes: readonly number[]) => sizes.map((size) => (size > 0 ? (size / top) * 100 : 0))
  return { bids: scale(bids), asks: scale(asks) }
}

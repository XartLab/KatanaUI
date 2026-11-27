// SPDX-License-Identifier: MIT
/**
 * Pure model of ValuationBand: the percentile levels of a valuation history and where a value sits in it.
 * 估值带（#260）的纯函数：历史估值的分位线（线性插值，同 chart-kit 的 quantile）与某个值在历史里的分位名次。
 * 口径写死在这里，调用方要换窗口就截历史再传：分位按传进来的整段历史算（含当前这一点），不是滚动窗口，也不剔除极端值。
 */
import { quantile } from '../lib/chart/chart-kit/series-colors.ts'

/** A history point: a label of the time (date text or timestamp) and the valuation (PE, PB…); null is a missing value. */
export type ValuationPoint = {
  time: string | number
  /** 估值倍数；null（或不是有限数）是缺值：线在这里断开，不进分位。亏损的市盈率没有意义，调用方给 null。 */
  value: number | null
}

/** 默认的三条分位线。 */
export const DEFAULT_PERCENTILES: readonly number[] = [20, 50, 80]

/** 整理分位：只留 0–100 之间（不含两端）的有限数，升序去重。 */
export function normalizePercentiles(percentiles: readonly number[]): number[] {
  return [...new Set(percentiles.filter((p) => Number.isFinite(p) && p > 0 && p < 100))].sort((a, b) => a - b)
}

/** 历史里的有限值（不改变次序）。 */
export const finiteValues = (points: readonly ValuationPoint[]): number[] =>
  points.flatMap((point) => (typeof point.value === 'number' && Number.isFinite(point.value) ? [point.value] : []))

/** 各分位线的值：{ p: 20, value }，次序同归一后的 percentiles；历史里没有有限值返回空。 */
export function valuationLevels(
  points: readonly ValuationPoint[],
  percentiles: readonly number[] = DEFAULT_PERCENTILES,
): { p: number; value: number }[] {
  const values = finiteValues(points)
  if (values.length === 0) return []
  return normalizePercentiles(percentiles).map((p) => ({ p, value: quantile(values, p / 100) }))
}

/**
 * 一个值在历史里的分位名次，0 到 100：历史里不大于它的点占的百分比（含它自己，所以最小值是 1/n × 100，不是 0；最大值是 100）。
 * 历史里没有有限值返回 null。纯函数。
 */
export function valuationPercentile(points: readonly ValuationPoint[], value: number | null): number | null {
  const values = finiteValues(points)
  if (values.length === 0 || value === null || !Number.isFinite(value)) return null
  return (values.filter((v) => v <= value).length / values.length) * 100
}

/** 最后一个有值的点的序号；一个都没有返回 -1。 */
export const lastIndexWithValue = (points: readonly ValuationPoint[]): number =>
  points.findLastIndex((point) => typeof point.value === 'number' && Number.isFinite(point.value))

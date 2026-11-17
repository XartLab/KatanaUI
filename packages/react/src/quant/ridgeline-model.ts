// SPDX-License-Identifier: MIT
// Ridgeline 的纯逻辑：高斯核密度估计、Silverman 带宽、各组的山脊曲线。功能参照 Arc Ridgeline（uiarc.dev，2026-11-14 读），实现原创。
import { quantileSorted } from '../lib/chart/chart-scale.ts'

export type RidgeGroup = { id: string; label: string; values: readonly number[] }

export type RidgeStats = { n: number; mean: number; median: number; min: number; max: number }

const finite = (values: readonly number[]) => values.filter((value) => Number.isFinite(value))

/** 一组数的个数、均值、中位数、范围（不是有限数的先丢掉）；空组的数都是 NaN。 */
export function ridgeStats(values: readonly number[]): RidgeStats {
  const sorted = finite(values).sort((a, b) => a - b)
  if (sorted.length === 0) return { n: 0, mean: NaN, median: NaN, min: NaN, max: NaN }
  const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length
  return { n: sorted.length, mean, median: quantileSorted(sorted, 0.5), min: sorted[0]!, max: sorted.at(-1)! }
}

/**
 * Silverman 经验带宽：h = 0.9 · min(σ, IQR / 1.34) · n^(−1/5)（Silverman 1986，《Density Estimation for Statistics and Data Analysis》式 3.31）。
 * σ 用样本标准差（n − 1），IQR 用 type 7 分位数。少于两个数或散布为 0（全相等）取不出来，返回 null，由调用方给兜底。
 */
export function silvermanBandwidth(values: readonly number[]): number | null {
  const sorted = finite(values).sort((a, b) => a - b)
  const n = sorted.length
  if (n < 2) return null
  const mean = sorted.reduce((sum, value) => sum + value, 0) / n
  const sd = Math.sqrt(sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1))
  const iqr = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25)
  const spread = iqr > 0 ? Math.min(sd, iqr / 1.34) : sd
  return spread > 0 ? 0.9 * spread * Math.pow(n, -0.2) : null
}

/** 高斯核密度估计：在 xs 各点上的密度（积分为 1）。 */
export function gaussianKde(values: readonly number[], xs: readonly number[], bandwidth: number): number[] {
  const data = finite(values)
  if (data.length === 0 || !(bandwidth > 0)) return xs.map(() => 0)
  const norm = 1 / (data.length * bandwidth * Math.sqrt(2 * Math.PI))
  return xs.map((x) => {
    let sum = 0
    for (const value of data) {
      const z = (x - value) / bandwidth
      sum += Math.exp(-0.5 * z * z)
    }
    return sum * norm
  })
}

export type Ridge = {
  id: string
  stats: RidgeStats
  bandwidth: number
  /** 曲线上的点，x 是数据值，density 是密度。 */
  xs: number[]
  density: number[]
}

/**
 * 各组的山脊。domain 不给时取全体数据的范围、两头各放宽 3 个带宽（高斯核在 3 个带宽外的尾巴小到可以不画）；
 * 取不出带宽的组（少于两个数或全相等）用 fallbackBandwidth（调用方给；默认 domain 宽的 1/50，只管画出一个窄峰，取值待定）。
 * 取样点数只影响曲线平滑度，不影响估计，默认 96 点（待定）。
 */
export function ridgelines(
  groups: readonly RidgeGroup[],
  options: { domain?: readonly [number, number]; bandwidth?: number; points?: number } = {},
): { domain: [number, number]; ridges: Ridge[]; peak: number } {
  const all = groups.flatMap((group) => finite(group.values))
  const bandwidths = groups.map((group) => options.bandwidth ?? silvermanBandwidth(group.values))
  const dataMin = all.length ? Math.min(...all) : 0
  const dataMax = all.length ? Math.max(...all) : 1
  const widest = Math.max(0, ...bandwidths.map((h) => h ?? 0))
  const domain: [number, number] = options.domain
    ? [options.domain[0], options.domain[1]]
    : [dataMin - 3 * widest, dataMax + 3 * widest]
  if (!(domain[1] > domain[0])) domain[1] = domain[0] + 1
  const points = Math.max(2, options.points ?? 96)
  const xs = Array.from({ length: points }, (_, i) => domain[0] + ((domain[1] - domain[0]) * i) / (points - 1))
  const fallback = (domain[1] - domain[0]) / 50
  const ridges = groups.map((group, index) => {
    const bandwidth = bandwidths[index] ?? fallback
    return {
      id: group.id,
      stats: ridgeStats(group.values),
      bandwidth,
      xs,
      density: gaussianKde(group.values, xs, bandwidth),
    }
  })
  return { domain, ridges, peak: Math.max(0, ...ridges.flatMap((ridge) => ridge.density)) }
}

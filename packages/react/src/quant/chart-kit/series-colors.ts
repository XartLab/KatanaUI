// SPDX-License-Identifier: MIT
// 图表配色的分配（dataviz.md §2，纯函数）：类别用 series-1..7 固定顺序、第 8 个起折进「其他」、筛选后不重新上色；大小用 seq；正负用 div。
// 颜色只在这里写成 token 名，件里不用模板字符串拼：主题检查要求 token 以字面量出现。

const SERIES = [
  'var(--series-1)',
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)',
  'var(--series-6)',
  'var(--series-7)',
] as const

export const SERIES_OTHER = 'var(--series-other)'
/** 有名字的序列最多这么多条；再多的折进「其他」（dataviz §2、EquityCurve 卡：超过 7 条折进「其他」或拆小多图）。 */

/**
 * 给一列序列的键分配颜色：按它们在**完整列表**里的次序取 series-1..7，第 8 个起一律 series-other。
 * 传完整列表而不是筛选后的列表：筛选后幸存的序列不重新上色。
 */
export function assignSeries(keys: readonly string[]): Record<string, string> {
  return Object.fromEntries(keys.map((key, index) => [key, SERIES[index] ?? SERIES_OTHER]))
}

const SEQ = ['var(--seq-200)', 'var(--seq-300)', 'var(--seq-400)', 'var(--seq-500)', 'var(--seq-600)'] as const

/** 大小的顺序色阶（暗到亮）：level 0..4 对应 seq-200..600，越界取两端。 */
export const seqColor = (level: number): string => SEQ[Math.max(0, Math.min(SEQ.length - 1, Math.round(level)))]!

/** 一列数的第 q 分位（0..1，线性插值）；忽略非有限数，没有数返回 0。 */
export function quantile(values: readonly number[], q: number): number {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (sorted.length === 0) return 0
  const at = Math.max(0, Math.min(1, q)) * (sorted.length - 1)
  const lo = Math.floor(at)
  const hi = Math.ceil(at)
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (at - lo)
}

/** 「超 80 分位」的分位：dataviz 与 Calendar 卡写的是 80 分位，用 |值| 算。 */
export const DIV_HOT_QUANTILE = 0.8

/** 一组值里 |值| 的 80 分位：超过它的值才用 -200 档，其余用 -100 档（全饱和不出现）。 */
export const divHotThreshold = (values: readonly number[]): number =>
  quantile(
    values.map((v) => Math.abs(v)),
    DIV_HOT_QUANTILE,
  )

/** 正负的发散色：0 取中点灰；正负各两档，-200 只给 hot（超 80 分位）的格。面积与格子用它，不用涨跌色。 */
export function divColor(value: number, hot = false): string {
  if (!(value !== 0) || !Number.isFinite(value)) return 'var(--div-mid)'
  if (value > 0) return hot ? 'var(--div-pos-200)' : 'var(--div-pos-100)'
  return hot ? 'var(--div-neg-200)' : 'var(--div-neg-100)'
}

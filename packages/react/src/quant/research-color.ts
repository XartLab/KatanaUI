// SPDX-License-Identifier: MIT
// 研究类热力件（周期收益表、参数曲面）共用的涨跌发散色：两端是主题的发散色 token，零附近落在中性灰，不用彩虹色阶。
// 涨跌色不直接上面，用中档 --div-pos-200 / --div-neg-200 与中点灰 --div-mid 混合（和日历热力图同一套端点）。

/** 值在 [-limit, limit] 里的位置，夹到 -1..1；limit 不是正数或值不是有限数时是 0。 */
export function divergingShare(value: number, limit: number): number {
  if (!Number.isFinite(value) || !(limit > 0)) return 0
  return Math.min(1, Math.max(-1, value / limit))
}

/** 零附近的死区（占 limit 的比例）：落在里面的格子一律是中性灰，免得 0.01% 的差别被染成涨或跌。 */
export const NEUTRAL_SHARE = 0.06

/** 位置换成 CSS 颜色：死区内是中点灰，其余按距离把端点色混进中点灰。 */
export function divergingColor(share: number): string {
  const size = Math.abs(share)
  if (size < NEUTRAL_SHARE) return 'var(--div-mid)'
  const end = share > 0 ? 'var(--div-pos-200)' : 'var(--div-neg-200)'
  return `color-mix(in srgb, ${end} ${Math.round(size * 100)}%, var(--div-mid))`
}

/** 色条的渐变（和 divergingColor 同一套端点）。 */
export const DIVERGING_GRADIENT = 'linear-gradient(90deg, var(--div-neg-200), var(--div-mid) 50%, var(--div-pos-200))'

/** 单色（没有负值的目标）的色阶：0 是中点灰，1 是亮灰；不用橙与蓝。 */
export function sequentialColor(share: number): string {
  const size = Math.min(1, Math.max(0, share))
  return `color-mix(in srgb, var(--k-content-primary-foreground) ${Math.round(size * 55)}%, var(--div-mid))`
}

/** 单色色条的渐变。 */
export const SEQUENTIAL_GRADIENT =
  'linear-gradient(90deg, var(--div-mid), color-mix(in srgb, var(--k-content-primary-foreground) 55%, var(--div-mid)))'

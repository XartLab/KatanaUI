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

/** 端点色最多混到 70%：console 的 --div-neg-200 / --div-pos-200 整色压上主文字只有 4.2 / 3.4:1（axe，#190），70% 两个主题都 ≥4.6:1。 */
export const DIVERGING_MAX = 0.7

/** 位置换成 CSS 颜色：死区内是中点灰，其余按距离把端点色混进中点灰（最多 DIVERGING_MAX）。 */
export function divergingColor(share: number): string {
  const size = Math.abs(share)
  if (size < NEUTRAL_SHARE) return 'var(--div-mid)'
  const end = share > 0 ? 'var(--div-pos-200)' : 'var(--div-neg-200)'
  return `color-mix(in srgb, ${end} ${Math.round(size * DIVERGING_MAX * 100)}%, var(--div-mid))`
}

const DIVERGING_END = `${Math.round(DIVERGING_MAX * 100)}%`

/** 色条的渐变（和 divergingColor 同一套端点，两头也只混到 DIVERGING_MAX）。 */
export const DIVERGING_GRADIENT = `linear-gradient(90deg, color-mix(in srgb, var(--div-neg-200) ${DIVERGING_END}, var(--div-mid)), var(--div-mid) 50%, color-mix(in srgb, var(--div-pos-200) ${DIVERGING_END}, var(--div-mid)))`

/** 单色（没有负值的目标）的色阶：0 是中点灰，1 是亮灰；不用橙与蓝。 */
export function sequentialColor(share: number): string {
  const size = Math.min(1, Math.max(0, share))
  return `color-mix(in srgb, var(--k-content-primary-foreground) ${Math.round(size * 55)}%, var(--div-mid))`
}

/** 单色色阶从这个位置起格上的字换深色（--k-heat-fg-high）：亮灰那头压主文字色不到 4.5:1（axe，#190）。
 *  console 的主文字色与最深色之间，0.52–0.68 这一段两种字都只有 3.9–4.5:1，0.6 是两边的交点；graphite 两边都过。 */
export const SEQUENTIAL_DARK_INK = 0.6

/** 单色色阶上格子里的字色：亮的那头是深色，其余不写（沿用 CSS 的主文字色）。 */
export function sequentialInk(share: number): string | undefined {
  return share >= SEQUENTIAL_DARK_INK ? 'var(--k-heat-fg-high)' : undefined
}

/** 单色色条的渐变。 */
export const SEQUENTIAL_GRADIENT =
  'linear-gradient(90deg, var(--div-mid), color-mix(in srgb, var(--k-content-primary-foreground) 55%, var(--div-mid)))'

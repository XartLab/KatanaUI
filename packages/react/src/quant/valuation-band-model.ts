// SPDX-License-Identifier: MIT
// 估值带（ValuationBand，KATANAview #2395）的纯函数：估值倍数的历史分位，按分位倍数折回价格的带线，当前倍数落在第几分位。
// 做法是常见的 PE / PB Band：每股盈利 EPS(t) = 价格(t) / PE(t)，第 k 条带 = EPS(t) × PE 的第 k 分位（理杏仁、Wind 的 PE Band 同此口径，待核对）。

/** 默认的分位档：10 / 25 / 50 / 75 / 90。依据：理杏仁、Wind PE Band 常用档位（待核对，KATANAview #2395）。 */
export const DEFAULT_BAND_QUANTILES = [0.1, 0.25, 0.5, 0.75, 0.9] as const

const ok = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value)

/** 线性插值的分位数（与 numpy 默认的 linear 同法）；没有数时 null。 */
export function bandQuantile(sorted: readonly number[], q: number): number | null {
  if (sorted.length === 0) return null
  const at = Math.min(1, Math.max(0, q)) * (sorted.length - 1)
  const lo = Math.floor(at)
  const hi = Math.ceil(at)
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (at - lo)
}

/** 只用正的倍数算分布：负 PE（亏损）没有估值意义，不进分位，也不折回价格。 */
export const usableMultiples = (multiples: readonly (number | null)[]): number[] =>
  multiples.filter((value): value is number => ok(value) && value > 0).toSorted((a, b) => a - b)

/** 各分位档的倍数。 */
export function bandMultiples(multiples: readonly (number | null)[], quantiles: readonly number[]): (number | null)[] {
  const sorted = usableMultiples(multiples)
  return quantiles.map((q) => bandQuantile(sorted, q))
}

/** 一条带折回价格：price(t) × m_k / multiple(t)；当期倍数不可用时是 NaN（线断开）。 */
export function bandLine(
  prices: readonly (number | null)[],
  multiples: readonly (number | null)[],
  level: number | null,
): number[] {
  return prices.map((price, i) => {
    const m = multiples[i]
    return level !== null && ok(price) && ok(m) && m > 0 ? (price * level) / m : Number.NaN
  })
}

/** 当前（最后一个可用的）倍数在历史里的分位（0..1，小于它的占比加一半等于它的）；没有时 null。 */
export function currentPercentile(multiples: readonly (number | null)[]): number | null {
  const sorted = usableMultiples(multiples)
  const last = multiples.findLast((value): value is number => ok(value) && value > 0)
  if (last === undefined || sorted.length === 0) return null
  let below = 0
  let equal = 0
  for (const value of sorted) {
    if (value < last) below += 1
    else if (value === last) equal += 1
  }
  return (below + equal / 2) / sorted.length
}

// SPDX-License-Identifier: MIT
// 分布与关系类的图（Ridgeline、SlopeChart、ConnectedScatter）共用的纯函数：线性比例尺、好看的刻度、分位数。不带 React 与 DOM。

/** 线性比例尺：domain 映到 range；domain 退化（两端相等）时都映到 range 的中点。 */
export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): (value: number) => number {
  const span = domain[1] - domain[0]
  return (value) =>
    span === 0 ? (range[0] + range[1]) / 2 : range[0] + ((value - domain[0]) / span) * (range[1] - range[0])
}

/**
 * 好看的刻度：步长取 1、2、5 乘 10 的幂，刻度落在 [min, max] 里，个数大约 count。
 * 做法是 Heckbert「Nice Numbers for Graph Labels」（Graphics Gems，1990）的 nice number：按 span / count 的量级与首位数字取整到 1、2、5、10。
 */
export function niceTicks(min: number, max: number, count: number): number[] {
  if (!(max > min) || count < 1) return Number.isFinite(min) ? [min] : []
  const raw = (max - min) / count
  const power = Math.pow(10, Math.floor(Math.log10(raw)))
  const lead = raw / power
  const step = (lead < 1.5 ? 1 : lead < 3 ? 2 : lead < 7 ? 5 : 10) * power
  const decimals = Math.max(0, -Math.floor(Math.log10(step)))
  const ticks: number[] = []
  for (let value = Math.ceil(min / step) * step; value <= max + step * 1e-9; value += step)
    ticks.push(Number(value.toFixed(decimals)))
  return ticks
}

/** 分位数：已升序排好的数列，线性插值（R 的 type 7，numpy 与 Excel 的默认）；空数列返回 NaN。 */
export function quantileSorted(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return NaN
  const at = Math.min(1, Math.max(0, p)) * (sorted.length - 1)
  const lo = Math.floor(at)
  const hi = Math.ceil(at)
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (at - lo)
}

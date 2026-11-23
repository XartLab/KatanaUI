// SPDX-License-Identifier: MIT
// SymbolOverview 的纯逻辑：百分比口径（每条线除以自己第一个有效值，画成相对起点的涨跌幅，TradingView Symbol Overview 的 scaleMode Percentage）、
// 按时刻摆横坐标、找离某个时刻最近的点。不碰 DOM。
import { PLOT_W } from '../lib/chart/series-geometry.ts'

/** 相对第一个有效值的涨跌幅（百分数，1.5 就是 +1.5%）；第一个有效值是 0 或没有有效值时整条是 NaN（没法比）。 */
export function percentSeries(values: readonly number[]): number[] {
  const base = values.find((value) => Number.isFinite(value))
  if (base === undefined || base === 0) return values.map(() => Number.NaN)
  return values.map((value) => (Number.isFinite(value) ? ((value - base) / Math.abs(base)) * 100 : Number.NaN))
}

/** 时刻到横坐标（0..PLOT_W）；起止相同时放在正中。 */
export function timeX(time: number, start: number, end: number): number {
  return end === start ? PLOT_W / 2 : ((time - start) / (end - start)) * PLOT_W
}

/** 有序时刻里离 at 最近的那个下标（二分）；空列表是 null。一样近取靠后的（读数从最新处读起）。 */
export function nearestIndex(times: readonly number[], at: number): number | null {
  if (times.length === 0) return null
  let lo = 0
  let hi = times.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (times[mid]! <= at) lo = mid
    else hi = mid
  }
  return Math.abs(times[hi]! - at) <= Math.abs(times[lo]! - at) ? hi : lo
}

/** 几条序列合起来的时间范围；没有点是 null。 */
export function timeSpan(series: readonly (readonly number[])[]): readonly [number, number] | null {
  let start = Number.POSITIVE_INFINITY
  let end = Number.NEGATIVE_INFINITY
  for (const times of series) {
    if (times.length === 0) continue
    start = Math.min(start, times[0]!)
    end = Math.max(end, times[times.length - 1]!)
  }
  return Number.isFinite(start) && Number.isFinite(end) ? [start, end] : null
}

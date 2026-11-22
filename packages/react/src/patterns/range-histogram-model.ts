// SPDX-License-Identifier: MIT
// RangeHistogramSlider 的纯逻辑：分箱、取整到步长、位置与数值互换、键盘步进。功能参照 Arc Range histogram slider（uiarc.dev，2026-11-14 读），实现原创。

import { clamp } from '../lib/num.ts'

/** 把一列数分进 bins 个等宽的箱（[min, max]，最后一箱含 max）；不是有限数或在范围外的丢掉。 */
export function histogramBins(values: readonly number[], min: number, max: number, bins: number): number[] {
  const counts = Array.from({ length: Math.max(0, Math.floor(bins)) }, () => 0)
  if (counts.length === 0 || !(max > min)) return counts
  for (const value of values) {
    if (!Number.isFinite(value) || value < min || value > max) continue
    const index = Math.min(counts.length - 1, Math.floor(((value - min) / (max - min)) * counts.length))
    counts[index]!++
  }
  return counts
}

/** 取整到最近的步长（从 min 起算），再夹在 [min, max] 里。浮点误差按步长的小数位收掉。 */
export function snapValue(value: number, min: number, max: number, step: number): number {
  const clamped = clamp(value, min, max)
  if (!(step > 0)) return clamped
  const snapped = min + Math.round((clamped - min) / step) * step
  const decimals = (String(step).split('.')[1] ?? '').length
  return clamp(Number(snapped.toFixed(decimals)), min, max)
}

/** 数值在 [min, max] 里的位置（0 到 1，越界夹住）。 */
export const ratioOf = (value: number, min: number, max: number): number =>
  max > min ? clamp((value - min) / (max - min), 0, 1) : 0

/** 位置（0 到 1）对应的数值，不取整。 */
export const valueAt = (ratio: number, min: number, max: number): number => min + clamp(ratio, 0, 1) * (max - min)

export type Thumb = 'low' | 'high'

/** 一次指针落在哪个位置（0 到 1）时，该动哪个把手：离得近的；一样近时（正好在两把手的中点，或两把手叠在一起）：叠在一起看落在左还是右，在中点动 high。 */
export function nearestThumb(ratio: number, low: number, high: number): Thumb {
  const toLow = Math.abs(ratio - low)
  const toHigh = Math.abs(ratio - high)
  if (toLow !== toHigh) return toLow < toHigh ? 'low' : 'high'
  return ratio < low ? 'low' : 'high'
}

/** 键盘之后把手的新值；不处理的键返回 null。方向键一个步长；PageUp / PageDown 十个步长（Radix Slider 的 shift+方向键同为 10 倍，WAI-ARIA APG 要求有比方向键更大的一档）；Home / End 去端点。 */
export function stepValue(value: number, key: string, min: number, max: number, step: number): number | null {
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      return snapValue(value - step, min, max, step)
    case 'ArrowRight':
    case 'ArrowUp':
      return snapValue(value + step, min, max, step)
    case 'PageDown':
      return snapValue(value - step * 10, min, max, step)
    case 'PageUp':
      return snapValue(value + step * 10, min, max, step)
    case 'Home':
      return min
    case 'End':
      return max
    default:
      return null
  }
}

/** 动一个把手后的区间：两个把手不交叉（low 最多到 high，high 最少到 low）。 */
export function moveThumb(range: readonly [number, number], thumb: Thumb, next: number): [number, number] {
  return thumb === 'low' ? [Math.min(next, range[1]), range[1]] : [range[0], Math.max(next, range[0])]
}

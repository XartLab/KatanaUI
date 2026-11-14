// SPDX-License-Identifier: MIT
// Splitter 的纯函数：吸附与夹取。逻辑从应用 workspace/split-tree.ts 的 snapSplitRatio、clampSplitRatio 搬来（#1901），应用那边改成引这里，只留一份。

/** 默认吸附点：1/3、1/2、2/3（组件卡 Splitter：靠近这几处 6px 内吸附）。 */
export const DEFAULT_SNAP_POINTS: readonly number[] = [1 / 3, 0.5, 2 / 3]

/** 比例离某个吸附点不超过 thresholdPx（按 span 折成像素）就落到那个点上；阈值为 0 或没有吸附点就原样返回。 */
export function snapSplitRatio(
  ratio: number,
  span: number,
  thresholdPx: number,
  points: readonly number[] = DEFAULT_SNAP_POINTS,
): number {
  if (!Number.isFinite(ratio) || !Number.isFinite(span) || span <= 0 || thresholdPx <= 0) return ratio
  return points.find((point) => Math.abs(point - ratio) * span <= thresholdPx) ?? ratio
}

/**
 * 把分隔比例夹在两边最小尺寸（px）之间。两边的最小尺寸加起来都放不下时，按两边最小尺寸的比例分（两边一样就是对半）：
 * 一律对半的话，向一边嵌套的树（9 列 = 1 列 | 剩下 8 列）会一层层减半，最后几块几乎看不见。
 */
export function clampSplitRatio(ratio: number, span: number, firstMinimum: number, secondMinimum: number): number {
  if (!Number.isFinite(ratio) || !Number.isFinite(span) || span <= 0) return 0.5
  if (span < firstMinimum + secondMinimum)
    return firstMinimum + secondMinimum > 0 ? firstMinimum / (firstMinimum + secondMinimum) : 0.5
  const minimum = firstMinimum / span
  const maximum = 1 - secondMinimum / span
  return Math.max(minimum, Math.min(maximum, ratio))
}

/** 键盘：返回新比例，不是这个方向就返回 null。方向键按 stepPx 挪（Shift 用 fastStepPx），Home / End 到两端，Enter 回默认。 */
export function splitKeyRatio(
  key: string,
  options: {
    axis: 'row' | 'column'
    ratio: number
    span: number
    shift: boolean
    stepPx: number
    fastStepPx: number
    defaultRatio: number
  },
): number | null {
  const { axis, ratio, span, shift, stepPx, fastStepPx, defaultRatio } = options
  if (key === 'Enter') return defaultRatio
  if (key === 'Home') return 0
  if (key === 'End') return 1
  const forward = axis === 'row' ? 'ArrowRight' : 'ArrowDown'
  const backward = axis === 'row' ? 'ArrowLeft' : 'ArrowUp'
  const sign = key === forward ? 1 : key === backward ? -1 : 0
  if (!sign) return null
  return ratio + (sign * (shift ? fastStepPx : stepPx)) / Math.max(span, 1)
}

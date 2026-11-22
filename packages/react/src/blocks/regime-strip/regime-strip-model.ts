// SPDX-License-Identifier: MIT
/**
 * Data types and span layout of RegimeStrip.
 * RegimeStrip 的数据类型与段的排布（纯函数，G6 从 regime-strip.tsx 拆出）。
 */

/** 状态的色：series-1…7 之一（≤ 6 态，挑色距大的几个，如 1、2、4、7）。 */
export type RegimeColor = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type RegimeState = {
  id: string
  name: string
  color: RegimeColor
  /** 图例里名字后面的小字（如占比「47%」），已格式化。 */
  detail?: string
}

export type RegimeSegment = {
  /** 起止时间（调用方的时间单位，毫秒、序号都行，只要跟 scale 一致）。 */
  from: number
  to: number
  /** 对应 RegimeState.id。 */
  state: string
  /** 还没被后面的数据确认（最后一段常见）。 */
  estimated?: boolean
}

/** 每段的 left 与 width（0 到 1 的比例，越界裁到带内）；起止倒过来或在带外的段不画。纯函数。 */
export function regimeSpans(
  segments: readonly RegimeSegment[],
  scale?: (time: number) => number,
): ({ segment: RegimeSegment; left: number; width: number } | null)[] {
  const times = segments.flatMap((s) => [s.from, s.to])
  const lo = Math.min(...times)
  const hi = Math.max(...times)
  const at = scale ?? ((t: number) => (hi > lo ? (t - lo) / (hi - lo) : 0))
  return segments.map((segment) => {
    const left = Math.min(1, Math.max(0, at(segment.from)))
    const right = Math.min(1, Math.max(0, at(segment.to)))
    return right > left ? { segment, left, width: right - left } : null
  })
}

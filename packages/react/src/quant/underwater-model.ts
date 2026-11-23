// SPDX-License-Identifier: MIT
// 水下回撤图的纯逻辑：找最大回撤段（前高、谷底、恢复），算各段的时长。横轴用 EquityCurve 同一个 timeX（见 equity-curve-model.ts），
// 同样的起止时刻在两张图上落在同一个横向位置。不带 React 与 DOM。

export type UnderwaterPoint = {
  time: number
  /** 离此前高点的回撤，≤ 0，用小数（-0.12 即 -12%）；创新高时是 0。 */
  drawdown: number
}

export type DrawdownSegment = {
  /** 回撤开始前的高点（最后一个回撤为 0 的点；序列一上来就在水下则是第 0 点）。 */
  peakIndex: number
  troughIndex: number
  /** 回到前高的第一个点；到序列结束还没回来是 null。 */
  recoveryIndex: number | null
  /** 谷底的回撤（负数）。 */
  depth: number
  /** 前高到谷底的毫秒数。 */
  fallMs: number
  /** 谷底到恢复的毫秒数；没恢复是 null。 */
  recoveryMs: number | null
  /** 画图用：这一段在横轴上覆盖到哪一点（恢复点，没恢复就到末点）。 */
  endIndex: number
}

/** 最大回撤段；整段都没有回撤（全是 0）返回 null。最深的有几处并列取最早的那处。 */
export function maxDrawdownSegment(points: readonly UnderwaterPoint[]): DrawdownSegment | null {
  let trough = -1
  points.forEach((point, index) => {
    if (point.drawdown < 0 && (trough < 0 || point.drawdown < points[trough]!.drawdown)) trough = index
  })
  if (trough < 0) return null
  let peak = trough
  while (peak > 0 && points[peak]!.drawdown < 0) peak--
  let recovery: number | null = null
  for (let index = trough + 1; index < points.length; index++)
    if (points[index]!.drawdown >= 0) {
      recovery = index
      break
    }
  const time = (index: number) => points[index]!.time
  return {
    peakIndex: peak,
    troughIndex: trough,
    recoveryIndex: recovery,
    depth: points[trough]!.drawdown,
    fallMs: time(trough) - time(peak),
    recoveryMs: recovery === null ? null : time(recovery) - time(trough),
    endIndex: recovery ?? points.length - 1,
  }
}

/** 在水下的点占全部点的比例（0..1）；没有点是 0。 */
export const underwaterShare = (points: readonly UnderwaterPoint[]): number =>
  points.length === 0 ? 0 : points.filter((point) => point.drawdown < 0).length / points.length

/** 回撤纵轴区间：0 在最上，最深的回撤在最下；全是 0 时给 [-1, 0] 避免除零。 */
export function underwaterDomain(points: readonly UnderwaterPoint[]): readonly [number, number] {
  const deepest = Math.min(0, ...points.map((point) => point.drawdown))
  return deepest === 0 ? [-1, 0] : [deepest, 0]
}

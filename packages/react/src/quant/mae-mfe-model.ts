// SPDX-License-Identifier: MIT
// MAE / MFE 散点的纯逻辑：把逐笔的最大浮亏、最大浮盈与最终盈亏变成点，分赢亏，算两侧的平均偏移。不带 React 与 DOM。
// 件不算 MAE / MFE（要逐笔行情）：调用方把每笔的金额与百分比两套都传来，件只负责摆。

import { niceTicks } from '../lib/chart/chart-scale.ts'

export type ExcursionTrade = {
  id: string
  /** 最终盈亏：金额与百分比（小数，0.03 即 3%）。 */
  pnl: number
  pnlPct: number
  /** 持仓期间的最大浮亏（≤ 0）：金额与百分比。画图取绝对值，横轴向右是「亏得更深」。 */
  mae: number
  maePct: number
  /** 持仓期间的最大浮盈（≥ 0）：金额与百分比。 */
  mfe: number
  mfePct: number
}

export type ExcursionAxis = 'mae' | 'mfe'
export type ExcursionUnit = 'amount' | 'percent'
export type ExcursionKind = 'win' | 'loss' | 'flat'

export type ExcursionPoint = {
  id: string
  index: number
  /** 横轴：偏移的大小（绝对值）。 */
  x: number
  /** 纵轴：最终盈亏（带符号）。 */
  y: number
  kind: ExcursionKind
}

export const kindOf = (pnl: number): ExcursionKind => (pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'flat')

/** 取出一个轴与一种单位下的点；任何一个值不是有限数的那笔跳过。 */
export function excursionPoints(
  trades: readonly ExcursionTrade[],
  axis: ExcursionAxis,
  unit: ExcursionUnit,
): ExcursionPoint[] {
  const points: ExcursionPoint[] = []
  trades.forEach((trade, index) => {
    const excursion =
      axis === 'mae' ? (unit === 'amount' ? trade.mae : trade.maePct) : unit === 'amount' ? trade.mfe : trade.mfePct
    const result = unit === 'amount' ? trade.pnl : trade.pnlPct
    if (!Number.isFinite(excursion) || !Number.isFinite(result)) return
    points.push({ id: trade.id, index, x: Math.abs(excursion), y: result, kind: kindOf(trade.pnl) })
  })
  return points
}

export type ExcursionSummary = {
  count: number
  wins: number
  losses: number
  flats: number
  /** 赢单、亏单的平均偏移（横轴值）；那一侧没有单是 null。看 MAE 时亏单的均值远大于赢单，说明止损放得比赢单能承受的更宽。 */
  meanWinX: number | null
  meanLossX: number | null
}

const mean = (values: readonly number[]): number | null =>
  values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length

export function summarizeExcursions(points: readonly ExcursionPoint[]): ExcursionSummary {
  const of = (kind: ExcursionKind) => points.filter((point) => point.kind === kind)
  return {
    count: points.length,
    wins: of('win').length,
    losses: of('loss').length,
    flats: of('flat').length,
    meanWinX: mean(of('win').map((point) => point.x)),
    meanLossX: mean(of('loss').map((point) => point.x)),
  }
}

/** 离 (x, y)（像素）最近的点的下标；超过 radius 或没有点是 -1。xy 与 points 一一对应。 */
export function nearestPoint(
  xy: readonly { x: number; y: number }[],
  at: { x: number; y: number },
  radius: number,
): number {
  let best = -1
  let bestDistance = radius
  xy.forEach((point, index) => {
    const distance = Math.hypot(point.x - at.x, point.y - at.y)
    if (distance <= bestDistance) {
      best = index
      bestDistance = distance
    }
  })
  return best
}

/** 键盘：按横轴从左到右走点，到头不绕回；Home / End 去两端。start 是当前下标（-1 表示还没选）。 */
export function stepPoint(order: readonly number[], current: number, key: string): number | null {
  if (order.length === 0) return null
  const position = order.indexOf(current)
  if (key === 'Home') return order[0]!
  if (key === 'End') return order[order.length - 1]!
  if (key === 'ArrowRight' || key === 'ArrowUp')
    return order[position < 0 ? 0 : Math.min(order.length - 1, position + 1)]!
  if (key === 'ArrowLeft' || key === 'ArrowDown') return order[position < 0 ? 0 : Math.max(0, position - 1)]!
  return null
}

/**
 * 纵轴定义域：把全部点包进去并留一点边，再按刻度步长向外取整（niceTicks 只取区间内的刻度，
 * 最高 / 最低的点会落在绘图区外，压到轴标题上）。返回的刻度全在定义域内，首尾刻度就是定义域两端。
 */
export function outwardDomain(
  lo: number,
  hi: number,
  count = 5,
  pad = 0.06,
): { domain: [number, number]; ticks: number[] } {
  if (!(hi > lo)) return { domain: [lo - 1, hi + 1], ticks: [lo] }
  const room = (hi - lo) * pad
  const first = niceTicks(lo - room, hi + room, count)
  const step = first.length > 1 ? first[1]! - first[0]! : hi - lo
  const decimals = Math.max(0, -Math.floor(Math.log10(step)))
  const fix = (v: number) => Number(v.toFixed(decimals + 1))
  const domain: [number, number] = [
    fix(Math.floor((lo - room) / step) * step),
    fix(Math.ceil((hi + room) / step) * step),
  ]
  return { domain, ticks: niceTicks(domain[0], domain[1], Math.round((domain[1] - domain[0]) / step)) }
}

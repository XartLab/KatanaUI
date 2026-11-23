// SPDX-License-Identifier: MIT
// 限额排程的纯逻辑（KATANAview #1908 第二批）：一天里几个抓取任务（仓库回补、新闻轮询、因子重算的取数），每个按固定速率跑一段时间；
// 叠起来是这个数据源一天的负载曲线，跟它的限额比。时间都是「从窗口开始算的分钟」（0..span），窗口从几点开始由调用方定、写时间时自己加上。
// 跟 affectUI 的 Rate Limit Planner 的负载形状不同：它用「爬升到峰再按半衰期衰减」，这里用矩形（回补与轮询是匀速打请求的，按限流器的速率跑）。
// 不带 React 与 DOM。

/** One planned job against one rate limit. */
export type PlannedRun = {
  /** Stable key. */
  id: string
  /** Job name. */
  name: string
  /** Start in minutes from the start of the window. */
  start: number
  /** How long it runs, in minutes. */
  duration: number
  /** Load while running, in the limit's unit per minute (requests, weight). */
  rate: number
}

/** Where a plan stands against its limit. */
export type PlanStatus = 'ok' | 'near' | 'over'

/** 键盘一步 15 分钟、Shift 或 PageUp / PageDown 一小时（照 #1908 写的交互，出自 affectUI Rate Limit Planner 页，2026-11-23 读）。 */
export const MOVE_STEP = 15
export const MOVE_BIG_STEP = 60
/** 曲线的格宽：一步的三分之一，挪一步曲线至少变三格。 */
export const CURVE_STEP = 5
/** 一天的分钟数。 */
export const DAY_MINUTES = 1440

const finite = (n: number) => Number.isFinite(n)

/** 不合法的数退成安全值：开始与时长不是有限数或为负时当 0，速率不是有限正数时当 0。 */
export function sanitizeRun(run: PlannedRun): PlannedRun {
  return {
    ...run,
    start: finite(run.start) && run.start > 0 ? run.start : 0,
    duration: finite(run.duration) && run.duration > 0 ? run.duration : 0,
    rate: finite(run.rate) && run.rate > 0 ? run.rate : 0,
  }
}

/** 负载曲线：第 i 格是 [i·step, (i+1)·step) 这段时间里各任务速率之和（任务盖住这一格的一部分也算满格：限流看的是峰值）。 */
export function loadCurve(runs: readonly PlannedRun[], span = DAY_MINUTES, step = CURVE_STEP): number[] {
  const cells = Math.max(1, Math.ceil(span / step))
  const curve = Array.from({ length: cells }, () => 0)
  for (const raw of runs) {
    const run = sanitizeRun(raw)
    if (run.duration === 0 || run.rate === 0) continue
    const from = Math.max(0, Math.floor(run.start / step))
    const to = Math.min(cells, Math.ceil((run.start + run.duration) / step))
    for (let i = from; i < to; i++) curve[i]! += run.rate
  }
  return curve
}

/** 峰值与它所在的格（并列取最早的）。 */
export function peakOf(curve: readonly number[]): { value: number; index: number } {
  let index = 0
  curve.forEach((value, i) => {
    if (value > curve[index]!) index = i
  })
  return { value: curve[index] ?? 0, index }
}

/** 跟限额比：超过限额是 over；超过 限额 × buffer 是 near；否则 ok。buffer 是 0..1 的比例。 */
export function planStatus(peak: number, limit: number, buffer: number): PlanStatus {
  if (!(limit > 0)) return 'ok'
  if (peak > limit) return 'over'
  return peak > limit * buffer ? 'near' : 'ok'
}

/** 开始时间夹进 [earliest, span − duration]；放不下时贴着 earliest。 */
export function clampStart(start: number, duration: number, earliest: number, span = DAY_MINUTES): number {
  const latest = Math.max(earliest, span - duration)
  return Math.min(latest, Math.max(earliest, start))
}

/**
 * 键盘挪一个任务：返回新的开始时间；这个键不归它管返回 undefined。
 * ←↓ 早 15 分、→↑ 晚 15 分；Shift 加方向或 PageDown / PageUp 一小时；Home 最早（now 或窗口开始）、End 最晚（还放得下的最后时刻）。
 */
export function keyMove(
  start: number,
  duration: number,
  key: string,
  shift: boolean,
  earliest: number,
  span = DAY_MINUTES,
): number | undefined {
  const step = shift ? MOVE_BIG_STEP : MOVE_STEP
  let next: number
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      next = start - step
      break
    case 'ArrowRight':
    case 'ArrowUp':
      next = start + step
      break
    case 'PageDown':
      next = start - MOVE_BIG_STEP
      break
    case 'PageUp':
      next = start + MOVE_BIG_STEP
      break
    case 'Home':
      next = earliest
      break
    case 'End':
      next = span - duration
      break
    default:
      return undefined
  }
  return clampStart(next, duration, earliest, span)
}

/** 按格对齐：拖动时落到最近的一步（15 分）。 */
export const snap = (minutes: number, step = MOVE_STEP): number => Math.round(minutes / step) * step

/**
 * 错开：把还能挪的任务（开始不早于 earliest 的）一个个重新摆，压低峰值。贪心：负载大的（速率 × 时长）先摆，
 * 每个在 [earliest, span − duration] 里按 15 分一步试，取放下后整条曲线峰值最低的位置，并列取离原位置最近的。已开始的任务不动。
 * 返回新的任务表（次序不变）。贪心不保证全局最优，但每一步都不会让峰值比不动更高（原位置也在候选里）。
 */
export function spreadRuns(
  runs: readonly PlannedRun[],
  earliest = 0,
  span = DAY_MINUTES,
  step = MOVE_STEP,
): PlannedRun[] {
  const clean = runs.map(sanitizeRun)
  const movable = clean.filter((run) => run.start >= earliest)
  const placed: PlannedRun[] = clean.filter((run) => run.start < earliest)
  const order = [...movable].sort((a, b) => b.rate * b.duration - a.rate * a.duration)
  const result = new Map<string, PlannedRun>()
  for (const run of placed) result.set(run.id, run)
  for (const run of order) {
    const latest = Math.max(earliest, span - run.duration)
    const candidates = new Set<number>([clampStart(run.start, run.duration, earliest, span)])
    for (let t = Math.ceil(earliest / step) * step; t <= latest; t += step) candidates.add(t)
    let best = run.start
    let bestPeak = Number.POSITIVE_INFINITY
    for (const start of candidates) {
      const peak = peakOf(loadCurve([...result.values(), { ...run, start }], span)).value
      const closer = Math.abs(start - run.start) < Math.abs(best - run.start)
      if (peak < bestPeak || (peak === bestPeak && closer)) {
        best = start
        bestPeak = peak
      }
    }
    result.set(run.id, { ...run, start: best })
  }
  return clean.map((run) => result.get(run.id) ?? run)
}

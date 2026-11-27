// SPDX-License-Identifier: MIT
/**
 * Pure model of IntradaySeries: minute points on the A-share session axis (the lunch break squeezed to a thin seam), line breaks at missing minutes, shared left and right value axes, and the time ticks.
 * 盘中分钟线（#260）的纯函数：分钟点落到 A 股时段轴上（午休压成一道细缝）、缺分钟处断线、左右两条值轴、时间刻度。
 * 时段边界与分钟换算都复用 session.ts（CN_SESSIONS、cnAxisPosition、cnTradingMinutesBetween），这里只加「缝」：
 * 轴是 [集合竞价 09:15–09:25（可选）] [上午 09:30–11:30] [下午 13:00–15:00] 三段首尾各隔一道缝，缝宽是固定的占宽比例，不按分钟算。
 */
import { niceTicks, type Domain } from '../lib/chart/series-geometry.ts'
import { CN_AXIS_MINUTES, CN_SESSIONS, cnAxisPosition, cnTradingMinutesBetween, parseClock } from './session.ts'

/** One minute point: "09:31" style clock time and a value; null (or a missing minute) leaves a gap, never a line to zero. */
export type IntradayPoint = {
  /** 时刻，「09:31」。 */
  time: string
  /** 值；null 留空、线在这里断开，不当 0。 */
  value: number | null
}

/** 缝的宽度，占整条轴宽度的比例（午休、竞价与开盘之间各一道）。待定：没有出处，取 1.2%（约 700px 宽的图上 8px，看得出是一道缝又不占宽）。 */
export const INTRADAY_SEAM = 0.012

/** 竞价段（09:15–09:25）占的分钟数。 */
const AUCTION_MINUTES = CN_SESSIONS[0]!.to - CN_SESSIONS[0]!.from

export type IntradayAxisOptions = {
  /** 画不画集合竞价段（09:15–09:25）；默认不画，轴从 09:30 起。 */
  auction?: boolean
}

/** 轴上有几段交易时间、几道缝。 */
const segments = (auction: boolean) => (auction ? CN_SESSIONS : CN_SESSIONS.filter((s) => s.key !== 'auction'))

/** 轴的总分钟数（不含缝）：不画竞价是 240，画是 250。 */
export const intradayMinutes = (auction = false): number =>
  auction ? CN_AXIS_MINUTES : CN_AXIS_MINUTES - AUCTION_MINUTES

/**
 * 时刻在轴上的位置，0 到 1。落在缝里的时刻（09:25–09:30 与午休）贴到前一段的末尾；早于轴头或晚于 15:00、写不对返回 null，不硬凑。
 * 不画竞价时 09:30 之前的时刻返回 null。
 */
export function intradayX(minutes: number | null, { auction = false }: IntradayAxisOptions = {}): number | null {
  if (cnAxisPosition(minutes) === null || minutes === null) return null
  if (!auction && minutes < CN_SESSIONS[1]!.from) return null
  const list = segments(auction)
  // 落在两段之间的空档里（09:25–09:30、午休）：贴到前一段的末尾。
  let at = minutes
  for (let i = 0; i < list.length - 1; i++) if (at > list[i]!.to && at < list[i + 1]!.from) at = list[i]!.to
  let elapsed = cnAxisPosition(at)! * CN_AXIS_MINUTES
  if (!auction) elapsed -= AUCTION_MINUTES
  const total = intradayMinutes(auction)
  // 已经走过几道缝：每过一段的末尾算一道。
  let seams = 0
  for (let i = 0; i < list.length - 1; i++) if (at > list[i]!.to) seams++
  const width = 1 - (list.length - 1) * INTRADAY_SEAM
  return (elapsed / total) * width + seams * INTRADAY_SEAM
}

/** 轴的缝：每道缝的起止位置（占宽比例），给图画斜纹或竖线用。 */
export function intradaySeams({ auction = false }: IntradayAxisOptions = {}): { from: number; to: number }[] {
  const list = segments(auction)
  const total = intradayMinutes(auction)
  const width = 1 - (list.length - 1) * INTRADAY_SEAM
  const out: { from: number; to: number }[] = []
  let at = 0
  for (const segment of list.slice(0, -1)) {
    at += ((segment.to - segment.from) / total) * width
    out.push({ from: at, to: at + INTRADAY_SEAM })
    at += INTRADAY_SEAM
  }
  return out
}

/** 时间刻度：整点（半点）与缝两侧；午休那道缝写成一个「11:30 / 13:00」。 */
export type IntradayTick = { x: number; text: string }

/** 轴下面的刻度：不画竞价 09:30、10:30、11:30/13:00、14:00、15:00；画竞价在最前加 09:15。 */
export function intradayTicks({ auction = false }: IntradayAxisOptions = {}): IntradayTick[] {
  const at = (clock: string) => intradayX(parseClock(clock), { auction })!
  const lunch = intradaySeams({ auction }).at(-1)!
  const ticks: IntradayTick[] = [
    { x: at('09:30'), text: '09:30' },
    { x: at('10:30'), text: '10:30' },
    { x: (lunch.from + lunch.to) / 2, text: '11:30/13:00' },
    { x: at('14:00'), text: '14:00' },
    { x: at('15:00'), text: '15:00' },
  ]
  return auction ? [{ x: at('09:15'), text: '09:15' }, ...ticks] : ticks
}

/** 一条序列整理后的点：位置、时刻与值（值取不到是 null）。 */
export type IntradayPlotPoint = { x: number; minutes: number; value: number | null }

/** 整理一条序列：写不对的时刻、不在轴上的点丢掉，按时刻排序（同一时刻后到的在后），不是有限数的值当 null。 */
export function intradayPoints(
  points: readonly IntradayPoint[],
  options: IntradayAxisOptions = {},
): IntradayPlotPoint[] {
  return points
    .map((point, index) => {
      const minutes = parseClock(point.time)
      return { minutes, x: intradayX(minutes, options), index, value: point.value }
    })
    .filter((item): item is { minutes: number; x: number; index: number; value: number | null } => item.x !== null)
    .sort((a, b) => a.minutes - b.minutes || a.index - b.index)
    .map(({ minutes, x, value }) => ({
      x,
      minutes,
      value: typeof value === 'number' && Number.isFinite(value) ? value : null,
    }))
}

/**
 * 折线分段：值取不到、或与前一个点隔了超过 gapMinutes 个交易分钟（缺分钟）就断开，每段是连续的点。
 * 默认 gapMinutes 为 1：一分钟线缺一分钟就留空，不连过去；5 分钟线给 5。午休、09:25–09:30 不算缺分钟（算交易分钟，不是钟面分钟）。
 */
export function intradayRuns(points: readonly IntradayPlotPoint[], gapMinutes = 1): IntradayPlotPoint[][] {
  const runs: IntradayPlotPoint[][] = []
  let current: IntradayPlotPoint[] = []
  let previous: IntradayPlotPoint | null = null
  for (const point of points) {
    if (point.value === null) {
      if (current.length) runs.push(current)
      current = []
      previous = null
      continue
    }
    if (previous) {
      const gap = cnTradingMinutesBetween(previous.minutes, point.minutes)
      if (gap === null || gap > gapMinutes + 1e-6) {
        runs.push(current)
        current = []
      }
    }
    current.push(point)
    previous = point
  }
  if (current.length) runs.push(current)
  return runs
}

/** 值轴：数据范围取整成好看的刻度；全空返回 null。baseline 给了就把它包进范围（柱要从 0 起）。 */
export function intradayAxis(
  values: readonly number[],
  { includeZero = false, ticks = 4 }: { includeZero?: boolean; ticks?: number } = {},
): { domain: Domain; ticks: readonly number[] } | null {
  const finite = values.filter(Number.isFinite)
  if (finite.length === 0) return null
  const lo = Math.min(includeZero ? 0 : Infinity, ...finite)
  const hi = Math.max(includeZero ? 0 : -Infinity, ...finite)
  const nice = niceTicks(lo, hi, ticks)
  return { domain: nice.domain, ticks: nice.ticks }
}

/** 一条折线的路径：每段 M…L…；x 乘宽、值落到纵轴（px，上小下大，padTop / padBottom 为上下留白）。纯函数。 */
export function intradayPath(
  runs: readonly (readonly IntradayPlotPoint[])[],
  domain: Domain,
  width: number,
  height: number,
  pad = 6,
): string {
  const span = domain[1] - domain[0] || 1
  const y = (value: number) => (height - pad - ((value - domain[0]) / span) * (height - 2 * pad)).toFixed(2)
  return runs
    .map((run) =>
      run.map((point, i) => `${i === 0 ? 'M' : 'L'}${(point.x * width).toFixed(2)},${y(point.value!)}`).join(''),
    )
    .join('')
}

/** 值落到纵轴的 y（px）。 */
export const intradayY = (value: number, domain: Domain, height: number, pad = 6): number =>
  height - pad - ((value - domain[0]) / (domain[1] - domain[0] || 1)) * (height - 2 * pad)

/** 全部序列里出现过的时刻（分钟数，升序去重）：十字光标在这些时刻上走。 */
export function intradayTimes(...lists: readonly (readonly IntradayPlotPoint[])[]): number[] {
  return [...new Set(lists.flatMap((points) => points.map((point) => point.minutes)))].sort((a, b) => a - b)
}

/** 距离 x（占宽比例）最近的时刻在 times 里的序号；没有时刻返回 null。 */
export function nearestTimeIndex(
  times: readonly number[],
  x: number,
  options: IntradayAxisOptions = {},
): number | null {
  if (times.length === 0) return null
  let best = 0
  let bestGap = Infinity
  times.forEach((minutes, index) => {
    const gap = Math.abs((intradayX(minutes, options) ?? 0) - x)
    if (gap < bestGap) {
      best = index
      bestGap = gap
    }
  })
  return best
}

/** 某一序列在某一时刻的值（没有这个时刻的点是 null）。 */
export function valueAtMinute(points: readonly IntradayPlotPoint[], minutes: number): number | null {
  return points.find((point) => point.minutes === minutes)?.value ?? null
}

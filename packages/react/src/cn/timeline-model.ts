// SPDX-License-Identifier: MIT
// LimitUpTimeline 的纯函数（#110）：按分钟聚合、排序、题材筛选、时段计数、蛇形分行。件与单测共用，不带 React。
import type { StreakValue } from './badge-model.ts'
import type { BoardKind } from './labels.ts'
import { cnPhaseOf, formatClock, parseClock, type CnPhase } from './session.ts'

export type TimelineItem = {
  /** Stock code, unique within the timeline. */
  code: string
  /** Stock name. */
  name: string
  /**
   * First-seal time ("09:31" or "09:31:05"); one that is missing or outside trading hours is left off the axis.
   * 首次封板时刻；取不到或不在交易时间内的不上轴。
   */
  time?: string | null
  /** Boards in a row, shown as a StreakBadge. */
  streak?: number | StreakValue | null
  /** Themes of the stock; the first is written on the card and the filter chips use all of them. */
  themes?: readonly string[]
  /** Turnover in yuan (written in wan or yi); a dash when unavailable. */
  amount?: number | null
  /** Board kind; a mark is drawn for the 20cm and 30cm boards and ST. */
  board?: BoardKind | null
}

export type TimelineOrder = 'latest' | 'earliest'

export type TimelineStation = {
  /** 「14:49」，也是站点的 key。 */
  key: string
  /** 自 0 点起的整分钟数。 */
  minutes: number
  phase: CnPhase
  /** 这一分钟封板的票，按封板的先后（含秒）排。 */
  items: TimelineItem[]
}

/** 站点：同一分钟封板的票并成一站；按时刻排（latest 最新在前，earliest 最早在前）。没有封板时刻、不在交易时间内的票放 untimed，不上轴。纯函数。 */
export function groupStations(
  items: readonly TimelineItem[],
  order: TimelineOrder,
): { stations: TimelineStation[]; untimed: TimelineItem[] } {
  const byMinute = new Map<number, { item: TimelineItem; at: number }[]>()
  const untimed: TimelineItem[] = []
  for (const item of items) {
    const at = parseClock(item.time)
    const phase = cnPhaseOf(at)
    if (at === null || phase === null) {
      untimed.push(item)
      continue
    }
    const minute = Math.floor(at)
    const list = byMinute.get(minute) ?? []
    list.push({ item, at })
    byMinute.set(minute, list)
  }
  const stations = [...byMinute.entries()]
    .sort((a, b) => (order === 'latest' ? b[0] - a[0] : a[0] - b[0]))
    .map(([minutes, list]) => ({
      key: formatClock(minutes),
      minutes,
      phase: cnPhaseOf(minutes)!,
      items: [...list].sort((a, b) => a.at - b.at).map((entry) => entry.item),
    }))
  return { stations, untimed }
}

/** 各时段的站数与只数（只算上了轴的）。四个时段都在，没有的是 0。纯函数。 */
export function phaseSummary(
  stations: readonly TimelineStation[],
): Record<CnPhase, { stations: number; stocks: number }> {
  const out: Record<CnPhase, { stations: number; stocks: number }> = {
    auction: { stations: 0, stocks: 0 },
    morning: { stations: 0, stocks: 0 },
    afternoon: { stations: 0, stocks: 0 },
    late: { stations: 0, stocks: 0 },
  }
  for (const station of stations) {
    out[station.phase].stations += 1
    out[station.phase].stocks += station.items.length
  }
  return out
}

/** 题材 chip：按票数从多到少（同数按首次出现的先后）；一只票的每个题材各算一次。纯函数。 */
export function themeCounts(items: readonly TimelineItem[]): { name: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const item of items) for (const name of new Set(item.themes ?? [])) counts.set(name, (counts.get(name) ?? 0) + 1)
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
}

/** 按题材筛：null 是全部。纯函数。 */
export const filterByTheme = (items: readonly TimelineItem[], theme: string | null): TimelineItem[] =>
  theme === null ? [...items] : items.filter((item) => item.themes?.includes(theme))

export type SnakeRow<T> = {
  /** 第几行，从 1 数。 */
  index: number
  /** 这一行的流向：奇数行从左往右，偶数行从右往左（蛇形）。 */
  flow: 'ltr' | 'rtl'
  /** 按序列次序（流向的先后）排的站点。 */
  sequence: T[]
  /** 按屏幕从左到右的次序排的站点（rtl 行是序列反过来）。 */
  display: T[]
}

/** 蛇形分行：每行 perRow 个站点，奇数行左到右、偶数行右到左。perRow 小于 1 当 1。纯函数。 */
export function snakeRows<T>(stations: readonly T[], perRow: number): SnakeRow<T>[] {
  const size = Math.max(1, Math.floor(perRow))
  const rows: SnakeRow<T>[] = []
  for (let start = 0; start < stations.length; start += size) {
    const sequence = stations.slice(start, start + size)
    const index = rows.length + 1
    const flow = index % 2 === 1 ? 'ltr' : 'rtl'
    rows.push({ index, flow, sequence, display: flow === 'ltr' ? sequence : [...sequence].reverse() })
  }
  return rows
}

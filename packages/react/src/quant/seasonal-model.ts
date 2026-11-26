// SPDX-License-Identifier: MIT
// SeasonalChart 的纯逻辑：把一串带时刻的价格按年切开，每年画成「366 格日历的第几格 → 相对年初基准的涨跌幅」，几年叠在一起看季节性。
// 366 格日历：1 月 1 日是 0，2 月 29 日是 59（平年空着这一格），3 月 1 日总是 60，12 月 31 日总是 365；同一个日期在每一年落在同一格（#147）。
// 年初基准：上一年最后一个收盘价（年初至今的通常算法，#147）；数据里没有上一年时用这一年第一个价。
// 年与日按 UTC 算，交易所所在时区由调用方经 offsetMs 给（东八区给 8 × 3600000）。不碰 DOM。
import { scrubKey } from '../lib/use-scrubber.ts'

const DAY_MS = 86_400_000

/** 平年每月第一天是一年里的第几天（0 起），配 dayOfYear / seasonalDayText。图用 CALENDAR_MONTH_START。 */
export const MONTH_START_DAYS: readonly number[] = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

/** 366 格日历上每月 1 日落在第几格（2 月按 29 天排）。 */
export const CALENDAR_MONTH_START: readonly number[] = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]

/** 一年 366 格：横轴从 0 到 365。 */
export const YEAR_DAYS = 366

export type SeasonalPoint = {
  /** Slot on the 366-day calendar: 0 is 1 January, 59 is 29 February, 60 is 1 March, 365 is 31 December. */
  day: number
  /** Change from the year's base, in percent (1.5 means +1.5%). */
  pct: number
}

export type SeasonalYear = {
  /** Calendar year. */
  year: number
  /** Points of the year by day, ascending. */
  points: readonly SeasonalPoint[]
}

/** 时刻（毫秒）在偏移 offsetMs 后落在哪一年、一年里的第几天（0 起；闰年 3 月 1 日是 60，平年是 59）。 */
export function dayOfYear(time: number, offsetMs = 0): { year: number; day: number } {
  const local = new Date(time + offsetMs)
  const year = local.getUTCFullYear()
  return { year, day: Math.floor((local.getTime() - Date.UTC(year, 0, 1)) / DAY_MS) }
}

/** 时刻（毫秒）在偏移 offsetMs 后落在哪一年、366 格日历的第几格（3 月 1 日每年都是 60）。 */
export function calendarDay(time: number, offsetMs = 0): { year: number; day: number } {
  const local = new Date(time + offsetMs)
  return { year: local.getUTCFullYear(), day: CALENDAR_MONTH_START[local.getUTCMonth()]! + local.getUTCDate() - 1 }
}

/**
 * 按年切开并换成相对年初基准的涨跌幅：points 是从旧到新的 { time, value }；不是有限数的点跳过；同一天有几个点取最后一个（收盘）。
 * 基准是上一年最后一天的收盘价；数据里没有上一年（或那个价是 0）时用这一年第一个价；基准是 0 时整年没法比，不要这一年。
 * day 是 366 格日历的格（calendarDay）。按年份从早到晚。
 */
export function seasonalSeries(points: readonly { time: number; value: number }[], offsetMs = 0): SeasonalYear[] {
  const years = new Map<number, { first: number; byDay: Map<number, number> }>()
  for (const point of points) {
    if (!Number.isFinite(point.value) || !Number.isFinite(point.time)) continue
    const { year, day } = calendarDay(point.time, offsetMs)
    let entry = years.get(year)
    if (!entry) {
      entry = { first: point.value, byDay: new Map() }
      years.set(year, entry)
    }
    entry.byDay.set(day, point.value)
  }
  const daysOf = (year: number) => [...(years.get(year)?.byDay ?? [])].sort(([a], [b]) => a - b)
  return [...years.entries()]
    .sort(([a], [b]) => a - b)
    .flatMap(([year, entry]) => {
      const previous = daysOf(year - 1).at(-1)?.[1]
      const base = previous !== undefined && previous !== 0 ? previous : entry.first
      if (base === 0) return []
      return [
        { year, points: daysOf(year).map(([day, value]) => ({ day, pct: ((value - base) / Math.abs(base)) * 100 })) },
      ]
    })
}

/** 一年的点里离 day 最近的那个（二分）；没有点、或 day 在这一年第一个点之前 / 最后一个点之后（今年还没走到）是 null。 */
export function nearestDay(points: readonly SeasonalPoint[], day: number): SeasonalPoint | null {
  if (points.length === 0 || day < points[0]!.day || day > points[points.length - 1]!.day) return null
  let lo = 0
  let hi = points.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (points[mid]!.day <= day) lo = mid
    else hi = mid
  }
  return Math.abs(points[hi]!.day - day) < Math.abs(points[lo]!.day - day) ? points[hi]! : points[lo]!
}

/**
 * 读数里某一年在 day 这一格的涨跌幅：点的范围里取最近的点（nearestDay）；晚于最后一个点时 carry 为真沿用最后一个点
 * （往年最后一个交易日之后到年底），为假是 null（今年还没到的日子，读数写「—」）；早于第一个点是 null。
 */
export function seasonalValueAt(points: readonly SeasonalPoint[], day: number, carry: boolean): number | null {
  const last = points.at(-1)
  if (carry && last && day > last.day) return last.pct
  return nearestDay(points, day)?.pct ?? null
}

/** 表格视图的一格：这个月（366 格日历，month 0 起）里最后一个点的涨跌幅，即月末；这个月没有点是 null（今年还没到的月份）。 */
export function monthClose(points: readonly SeasonalPoint[], month: number): number | null {
  const start = CALENDAR_MONTH_START[month] ?? YEAR_DAYS
  const end = CALENDAR_MONTH_START[month + 1] ?? YEAR_DAYS
  return points.findLast((point) => point.day >= start && point.day < end)?.pct ?? null
}

/** PageUp / PageDown：跳到 day 之前 / 之后最近的一个月初；前面没有月初到第 0 格，后面没有到最后一格。 */
export function monthStep(day: number, direction: -1 | 1): number {
  if (direction > 0) return CALENDAR_MONTH_START.find((start) => start > day) ?? YEAR_DAYS - 1
  return CALENDAR_MONTH_START.findLast((start) => start < day) ?? 0
}

/**
 * 图上的键位：PageUp / PageDown 到上一个 / 下一个月初（没选中时从 anchor 算）；没选中时第一下 ← / → 落在 anchor
 * （最新一年的最后一个点，即「今天」在一年里的位置）；其余同 scrubKey（←→ 一格、Shift 三格、Home / End、Esc）。
 * 返回新的格；null 是清掉；undefined 是这个键不归它管。
 */
export function seasonalKey(
  day: number | null,
  key: string,
  shift: boolean,
  anchor: number,
): number | null | undefined {
  if (key === 'PageUp' || key === 'PageDown') return monthStep(day ?? anchor, key === 'PageUp' ? -1 : 1)
  if (day === null && (key === 'ArrowLeft' || key === 'ArrowRight')) return anchor
  return scrubKey(day, YEAR_DAYS, key, shift)
}

/** 图例开关一年：返回新的隐去列表；关了它就一年都看不见时返回 null（最后一个看得见的年不让关）。years 是能画的年。 */
export function toggleHidden(hidden: readonly number[], year: number, years: readonly number[]): number[] | null {
  const next = hidden.includes(year) ? hidden.filter((entry) => entry !== year) : [...hidden, year]
  return years.some((entry) => !next.includes(entry)) ? next : null
}

/** 一年里第几天写成「月 日」（平年的天数，配 dayOfYear）：月名由调用方按界面语言给 12 个。 */
export function seasonalDayText(day: number, months: readonly string[]): string {
  let month = 0
  for (let index = 0; index < MONTH_START_DAYS.length; index++) if (day >= MONTH_START_DAYS[index]!) month = index
  return `${months[month] ?? ''} ${day - MONTH_START_DAYS[month]! + 1}`
}

/** 366 格日历的第几格写成「月 日」（59 是 2 月 29 日）：月名由调用方按界面语言给 12 个。 */
export function calendarDayText(day: number, months: readonly string[]): string {
  const month = Math.max(
    0,
    CALENDAR_MONTH_START.findLastIndex((start) => day >= start),
  )
  return `${months[month] ?? ''} ${day - CALENDAR_MONTH_START[month]! + 1}`
}

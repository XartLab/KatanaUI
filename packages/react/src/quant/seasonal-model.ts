// SPDX-License-Identifier: MIT
// SeasonalChart 的纯逻辑：把一串带时刻的价格按年切开，每年画成「一年里的第几天 → 相对这一年第一个价的涨跌幅」，几年叠在一起看季节性。
// 「相对年初第一个价」是我们定的口径（TradingView 的 Seasonal Chart 页面只写「把各年的价格表现叠在一起」，它用年初开盘还是上年收盘，待核对）。
// 年与日按 UTC 算，交易所所在时区由调用方经 offsetMs 给（东八区给 8 × 3600000）。不碰 DOM。

const DAY_MS = 86_400_000

/** 平年每月第一天是一年里的第几天（0 起）。闰年 2 月之后的日子会往后错一天，叠画时差一天看不出，不另算。 */
export const MONTH_START_DAYS: readonly number[] = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

/** 一年最多 366 天：横轴从 0 到 365。 */
export const YEAR_DAYS = 366

export type SeasonalPoint = {
  /** Day of the year, 0 for January 1. */
  day: number
  /** Change from the year's first value, in percent (1.5 means +1.5%). */
  pct: number
}

export type SeasonalYear = {
  /** Calendar year. */
  year: number
  /** Points of the year by day, ascending. */
  points: readonly SeasonalPoint[]
}

/** 时刻（毫秒）在偏移 offsetMs 后落在哪一年、一年里的第几天（0 起）。 */
export function dayOfYear(time: number, offsetMs = 0): { year: number; day: number } {
  const local = new Date(time + offsetMs)
  const year = local.getUTCFullYear()
  return { year, day: Math.floor((local.getTime() - Date.UTC(year, 0, 1)) / DAY_MS) }
}

/**
 * 按年切开并换成相对年初第一个价的涨跌幅：points 是从旧到新的 { time, value }；不是有限数的点跳过；
 * 一年的第一个价是 0 时整年没法比，不要这一年。同一天有几个点取最后一个（收盘）。按年份从早到晚。
 */
export function seasonalSeries(points: readonly { time: number; value: number }[], offsetMs = 0): SeasonalYear[] {
  const years = new Map<number, { base: number; byDay: Map<number, number> }>()
  for (const point of points) {
    if (!Number.isFinite(point.value) || !Number.isFinite(point.time)) continue
    const { year, day } = dayOfYear(point.time, offsetMs)
    let entry = years.get(year)
    if (!entry) {
      entry = { base: point.value, byDay: new Map() }
      years.set(year, entry)
    }
    entry.byDay.set(day, point.value)
  }
  return [...years.entries()]
    .filter(([, entry]) => entry.base !== 0)
    .sort(([a], [b]) => a - b)
    .map(([year, entry]) => ({
      year,
      points: [...entry.byDay.entries()]
        .sort(([a], [b]) => a - b)
        .map(([day, value]) => ({ day, pct: ((value - entry.base) / Math.abs(entry.base)) * 100 })),
    }))
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

/** 一年里第几天写成「月 日」：月名由调用方按界面语言给 12 个。 */
export function seasonalDayText(day: number, months: readonly string[]): string {
  let month = 0
  for (let index = 0; index < MONTH_START_DAYS.length; index++) if (day >= MONTH_START_DAYS[index]!) month = index
  return `${months[month] ?? ''} ${day - MONTH_START_DAYS[month]! + 1}`
}

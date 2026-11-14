// SPDX-License-Identifier: MIT
// 经济日历（EventCalendar）的纯函数：按显示时区分天、区间预设、筛选、倒计时。件里不读时钟，「现在」由调用方传。
// 周从周一起（口径同 date-range-model，主会话定，没有出处）；今天 / 本周 / 下周按「现在」所在的显示时区算。

export type EconomicImportance = 1 | 2 | 3
export type EconomicTone = 'up' | 'down' | 'flat'
export type EconomicRangeKey = 'today' | 'week' | 'next' | 'custom'

export type EconomicEvent = {
  id: string
  /** 发生时刻（毫秒时间戳）。 */
  at: number
  /** 国家 / 地区代码（US、CN）。 */
  region: string
  /** 国家 / 地区名：国家多选里写它。 */
  regionName: string
  /** 旗帜图片地址；不给就画字母圆标。 */
  flag?: string
  name: string
  importance: EconomicImportance
  /** 实际 / 预期 / 前值：调用方格式化好的文字；没有就不给（画「—」）。 */
  actual?: string
  forecast?: string
  previous?: string
  /** 实际值相对预期的好坏方向，由调用方按事件给（CPI 高是坏、非农高是好）；不给就不上色。 */
  tone?: EconomicTone
}

/** 某一时刻在时区里的日期（YYYY-MM-DD）。 */
export function dayKeyOf(at: number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at)
}

export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d! + days)).toISOString().slice(0, 10)
}

/** 这天所在周的周一。 */
export function weekStartOf(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const dow = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay() // 0 = 周日
  return addDays(key, -((dow + 6) % 7))
}

export type DayRange = { start: string; end: string }

/** 今天 / 本周 / 下周对应的日期区间（含两端）；custom 返回 null，由调用方给的区间决定。 */
export function presetRange(key: Exclude<EconomicRangeKey, 'custom'>, today: string): DayRange {
  if (key === 'today') return { start: today, end: today }
  const monday = weekStartOf(today)
  const start = key === 'week' ? monday : addDays(monday, 7)
  return { start, end: addDays(start, 6) }
}

export type EconomicFilter = {
  range: DayRange
  importance: readonly EconomicImportance[]
  regions: readonly string[]
  onlyHigh: boolean
  timeZone: string
}

/** 筛选并按时间排序。importance、regions 为空表示不筛；onlyHigh 开着只留最高一档（盖过 importance，国家照筛）。 */
export function filterEvents(events: readonly EconomicEvent[], filter: EconomicFilter): EconomicEvent[] {
  return events
    .filter((event) => {
      const day = dayKeyOf(event.at, filter.timeZone)
      if (day < filter.range.start || day > filter.range.end) return false
      if (filter.regions.length > 0 && !filter.regions.includes(event.region)) return false
      if (filter.onlyHigh) return event.importance === 3
      return filter.importance.length === 0 || filter.importance.includes(event.importance)
    })
    .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))
}

export type DayGroup = { day: string; events: EconomicEvent[] }

export function groupByDay(events: readonly EconomicEvent[], timeZone: string): DayGroup[] {
  const groups: DayGroup[] = []
  for (const event of events) {
    const day = dayKeyOf(event.at, timeZone)
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.events.push(event)
    else groups.push({ day, events: [event] })
  }
  return groups
}

/** 离发生还有几分钟（向上取整）；已经过了返回 null。 */
export function minutesUntil(at: number, now: number): number | null {
  const ms = at - now
  return ms > 0 ? Math.ceil(ms / 60_000) : null
}

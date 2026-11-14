// SPDX-License-Identifier: MIT
// 经济日历（EventCalendar）的纯函数：按显示时区分天、区间预设、筛选、倒计时。件里不读时钟，「现在」由调用方传。
// 周从周一起（口径同 date-range-model，主会话定，没有出处）；今天 / 本周 / 下周按「现在」所在的显示时区算。

export type EconomicImportance = 1 | 2 | 3
export type EconomicTone = 'up' | 'down' | 'flat'
export type EconomicRangeKey = 'yesterday' | 'today' | 'tomorrow' | 'week' | 'next' | 'custom'
export type CalendarCategory = 'economic' | 'earnings' | 'dividends' | 'ipo'
export type EarningsSession = 'before' | 'during' | 'after'

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
  /** 详情：事件说明、数据来源（调用方写好的文字）。 */
  description?: string
  source?: string
  /** 历史值（从旧到新，数字）：详情里画成小图；少于两个不画。 */
  history?: readonly number[]
  /** 下次发布时刻（毫秒）。 */
  nextAt?: number
}

type Located = { id: string; at: number; region: string; regionName: string; flag?: string }

/** 财报：at 是披露时刻（只知道盘前 / 盘后时给当天开盘前或收盘后的约数，由调用方定）；数字都是原值，件按 formatVolume 写。 */
export type EarningsEvent = Located & {
  code: string
  name: string
  logo?: string
  session?: EarningsSession
  epsActual?: number
  epsForecast?: number
  revenueActual?: number
  revenueForecast?: number
  marketCap?: number
}

/** 分红：at 是除权除息日（取当天，件按日显示、不写钟点）；payAt 是派息日。amount 与 yield（百分数）是原值。 */
export type DividendEvent = Located & {
  code: string
  name: string
  logo?: string
  amount: number
  /** 币种符号或代码，写在每股金额前，例「$」。 */
  currency?: string
  yield?: number
  payAt?: number
}

/** 新股：at 是上市或定价日（取当天）；状态文字由调用方写（「已定价」「待定」）。 */
export type IpoEvent = Located & {
  code?: string
  name: string
  logo?: string
  exchange?: string
  priceLow?: number
  priceHigh?: number
  shares?: number
  dealSize?: number
  status?: string
}

/** 实际对预期：数字比较，高于预期为 up（财报、营收越高越好）；缺一个或相等是 flat。 */
export function surpriseTone(actual: number | undefined, forecast: number | undefined): EconomicTone {
  if (actual === undefined || forecast === undefined || actual === forecast) return 'flat'
  return actual > forecast ? 'up' : 'down'
}

/** 这一行相对「现在」的状态：已发布（有实际值）、待发布（还没到点）、已到点未出数。 */
export type ReleaseState = 'released' | 'upcoming' | 'overdue'
export function releaseState(event: { at: number; actual?: unknown }, now: number): ReleaseState {
  if (event.actual !== undefined) return 'released'
  return event.at > now ? 'upcoming' : 'overdue'
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

/** 昨天 / 今天 / 明天 / 本周 / 下周对应的日期区间（含两端）；custom 返回 null，由调用方给的区间决定。 */
export function presetRange(key: Exclude<EconomicRangeKey, 'custom'>, today: string): DayRange {
  if (key === 'today') return { start: today, end: today }
  if (key === 'yesterday') return { start: addDays(today, -1), end: addDays(today, -1) }
  if (key === 'tomorrow') return { start: addDays(today, 1), end: addDays(today, 1) }
  const monday = weekStartOf(today)
  const start = key === 'week' ? monday : addDays(monday, 7)
  return { start, end: addDays(start, 6) }
}

export type EconomicFilter = {
  range: DayRange
  importance: readonly EconomicImportance[]
  regions: readonly string[]
  timeZone: string
}

type Filterable = { id: string; at: number; region: string; importance?: EconomicImportance }

/** 筛选并按时间排序。importance、regions 为空表示不筛；没有 importance 字段的事件（财报、分红、新股）不受重要程度筛选。 */
export function filterEvents<T extends Filterable>(events: readonly T[], filter: EconomicFilter): T[] {
  return events
    .filter((event) => {
      const day = dayKeyOf(event.at, filter.timeZone)
      if (day < filter.range.start || day > filter.range.end) return false
      if (filter.regions.length > 0 && !filter.regions.includes(event.region)) return false
      if (event.importance === undefined || filter.importance.length === 0) return true
      return filter.importance.includes(event.importance)
    })
    .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))
}

export type DayGroup<T extends { at: number } = EconomicEvent> = { day: string; events: T[] }

export function groupByDay<T extends { at: number }>(events: readonly T[], timeZone: string): DayGroup<T>[] {
  const groups: DayGroup<T>[] = []
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

/** 「现在」线插在这一天的第几行之前（0 = 全部还没到，长度 = 全部已过）。 */
export function nowIndex(events: readonly { at: number }[], now: number): number {
  const at = events.findIndex((event) => event.at > now)
  return at === -1 ? events.length : at
}

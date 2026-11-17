// SPDX-License-Identifier: MIT
// 日历（EventCalendar）的纯函数：按显示时区分天、周条的七天、筛选、倒计时、财报意外百分比。件里不读时钟，「现在」由调用方传。
// 周从周一起（TradingView 日历的周条是周一到周日，主会话 2026-11-15 实测）；今天按「现在」所在的显示时区算。

import type { Tone } from '../lib/tone.ts'
import { dayKeyIn, isoDate } from '../lib/date.ts'

export type EconomicImportance = 1 | 2 | 3
/** @deprecated Use `Tone` from lib/tone.ts; same three values. */
export type EconomicTone = Tone
/** 经济事件的类别（TradingView「All categories」下拉的 12 项，主会话 2026-11-15 实测）。 */
export type EconomicCategory =
  | 'bonds'
  | 'business'
  | 'consumer'
  | 'gdp'
  | 'government'
  | 'health'
  | 'housing'
  | 'labor'
  | 'money'
  | 'prices'
  | 'trade'
  | 'taxes'
export const ECONOMIC_CATEGORIES: readonly EconomicCategory[] = [
  'bonds',
  'business',
  'consumer',
  'gdp',
  'government',
  'health',
  'housing',
  'labor',
  'money',
  'prices',
  'trade',
  'taxes',
]
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
  /** 实际 / 预期 / 前值：调用方格式化好的文字（带单位后缀）；没有就不给（画「—」）。实际值只加粗，不上涨跌色（TradingView 经济页如此）。 */
  actual?: string
  forecast?: string
  previous?: string
  category?: EconomicCategory
  /** 国家选择框里的地区分组（NORTH AMERICA、EUROPE…），由调用方写好。 */
  regionGroup?: string
  /** 详情：事件说明、数据来源（调用方写好的文字）。 */
  description?: string
  source?: string
  /** 历史值（从旧到新，数字）：详情里画成小图；少于两个不画。 */
  history?: readonly number[]
  /** 下次发布时刻（毫秒）。 */
  nextAt?: number
}

type Located = {
  id: string
  at: number
  region: string
  regionName: string
  flag?: string
  /** 国家选择框里的地区分组（NORTH AMERICA、EUROPE…），由调用方写好；不给归到末尾一组。 */
  regionGroup?: string
}

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
  /** 币种小字（USD），写在营收与市值后面。 */
  currency?: string
  /** 意外百分比：不给就按 (实际 − 预期) / |预期| × 100 算。 */
  epsSurprise?: number
  revenueSurprise?: number
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

/** 意外百分比：(实际 − 预期) / |预期| × 100；缺一个或预期为 0 返回 undefined。 */
export function surprisePercent(actual: number | undefined, estimate: number | undefined): number | undefined {
  if (actual === undefined || estimate === undefined || estimate === 0) return undefined
  return ((actual - estimate) / Math.abs(estimate)) * 100
}

export const toneOfSign = (value: number | undefined): EconomicTone =>
  value === undefined || Number(value.toFixed(2)) === 0 ? 'flat' : value > 0 ? 'up' : 'down'

/** 这一行相对「现在」的状态：已发布（有实际值）、待发布（还没到点）、已到点未出数。 */
export type ReleaseState = 'released' | 'upcoming' | 'overdue'
export function releaseState(event: { at: number; actual?: unknown }, now: number): ReleaseState {
  if (event.actual !== undefined) return 'released'
  return event.at > now ? 'upcoming' : 'overdue'
}

/** 某一时刻在时区里的日期（YYYY-MM-DD）。 */
export function dayKeyOf(at: number, timeZone: string): string {
  return dayKeyIn(at, timeZone)
}

export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return isoDate(Date.UTC(y!, m! - 1, d! + days))
}

/** 这天所在周的周一。 */
export function weekStartOf(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const dow = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay() // 0 = 周日
  return addDays(key, -((dow + 6) % 7))
}

export type DayRange = { start: string; end: string }

/** 这天所在周的周一到周日。 */
export function weekDays(key: string): string[] {
  const monday = weekStartOf(key)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

export type EconomicFilter = {
  range: DayRange
  /** 只看最高一档（TradingView 的重要性是一个开关）。 */
  highOnly: boolean
  /** 空 = 全部类别。 */
  category: EconomicCategory | ''
  /** 空 = 全部国家。 */
  regions: readonly string[]
  timeZone: string
}

type Filterable = {
  id: string
  at: number
  region: string
  importance?: EconomicImportance
  category?: EconomicCategory
}

/** 筛选并按时间排序。regions 为空表示不筛；重要程度与类别只管经济事件（财报、分红、新股没有这两个字段，不受影响）。 */
export function filterEvents<T extends Filterable>(events: readonly T[], filter: EconomicFilter): T[] {
  return events
    .filter((event) => {
      const day = dayKeyOf(event.at, filter.timeZone)
      if (day < filter.range.start || day > filter.range.end) return false
      if (filter.regions.length > 0 && !filter.regions.includes(event.region)) return false
      if (filter.highOnly && event.importance !== undefined && event.importance !== 3) return false
      if (filter.category !== '' && event.importance !== undefined && event.category !== filter.category) return false
      return true
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

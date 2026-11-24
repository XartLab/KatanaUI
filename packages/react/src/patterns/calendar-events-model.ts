// SPDX-License-Identifier: MIT
import type { ReactNode } from 'react'
import type { Severity } from '../lib/severity.ts'

// 日历事件点与洞察（#226）的纯函数：事件从哪来、一天读成什么话、格子里画几个点。
// 日期一律是 YYYY-MM-DD 字符串；事件与文字都由调用方给（包里不带语言），这里只做取与排。不读时钟。

/** 一天里的一件事：财报、宏观数据、除权、期权到期、半日市这类；tone 是点的颜色语气（默认 neutral）。 */
export type CalendarDayEvent = {
  /** 读出来的话，例如「AAPL 财报」「美国 CPI」。 */
  label: string
  /** 点的语气：neutral 灰、ok 绿、warn 黄、danger 红。 */
  tone?: Severity
  /** 稳定的键；不给就用 label。 */
  id?: string
}

/** 事件的来源：按日期索引的表（YYYY-MM-DD → 当天的事），或一个按日期查的函数（事件很多、按需算的时候）。 */
export type CalendarEventSource =
  | Readonly<Record<string, readonly CalendarDayEvent[]>>
  | ((day: string) => readonly CalendarDayEvent[] | undefined)

/** 日历底部的一条洞察：图标加一句话，例如「已避开 11-27 美股半日市」。 */
export type CalendarInsight = {
  /** 那一句话。 */
  text: string
  /** 字前的图标；不给用星花。 */
  icon?: ReactNode
  /** 语气（neutral 默认）：只改图标颜色。 */
  tone?: Severity
}

/** 一格里最多画几个点：三个以上点挤成一团，读不出，多的在悬停的读数里列全。 */
export const DOT_LIMIT = 3

const NONE: readonly CalendarDayEvent[] = []

/** 取某天的事件；没有是空数组（不返回 undefined）。 */
export function eventsOn(source: CalendarEventSource | undefined, day: string): readonly CalendarDayEvent[] {
  if (!source) return NONE
  const found = typeof source === 'function' ? source(day) : source[day]
  return found ?? NONE
}

/** 格子上画的点：最多 DOT_LIMIT 个，次序是调用方给的次序；tone 缺省 neutral。 */
export function dotsOf(events: readonly CalendarDayEvent[]): Severity[] {
  return events.slice(0, DOT_LIMIT).map((event) => event.tone ?? 'neutral')
}

/** 一天的事件读成一句话（读屏描述与读数行共用）：按语言的列表写法连起来，「财报、CPI 和 FOMC」。 */
export function describeEvents(events: readonly CalendarDayEvent[], locale: string): string {
  const labels = events.map((event) => event.label)
  try {
    return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(labels)
  } catch {
    return labels.join(', ')
  }
}

/** 读数行前面的日期：「11月27日」「Nov 27」，按语言；不合法的日期原样返回。固定按 UTC 排，不受机器时区影响。 */
export function dayLabel(day: string, locale: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match) return day
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  try {
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date)
  } catch {
    return day
  }
}

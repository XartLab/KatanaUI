// SPDX-License-Identifier: MIT
// 事件时间线（EventTimeline）的分组规则（纯函数，组件与单测共用）：按显示时区的自然日分组，新的在前。
// 时区由调用方传（应用的显示时区，IANA 名）：同一刻在上海与纽约可能落在不同的「天」，件里不猜、不读系统时区。

export type TimelineTone = 'neutral' | 'up' | 'down' | 'warn' | 'info'

export type TimelineEvent = {
  /** 稳定的 id（React key 与选中回调用）。 */
  id: string
  /** 事件发生的时刻（毫秒时间戳）。 */
  at: number
  title: string
  /** 标题下一行的说明。 */
  detail?: string
  /** 来源标签（公告、告警、成交、数据源……）：字由调用方给。 */
  source?: string
  /** 圆点的颜色：涨 / 跌 / 警示 / 信息，默认中性。 */
  tone?: TimelineTone
}

export type DayGroup = { day: string; events: TimelineEvent[] }

const dayFormats = new Map<string, Intl.DateTimeFormat>()
const clockFormats = new Map<string, Intl.DateTimeFormat>()

/** 某一刻在时区 timeZone 里是哪一天：YYYY-MM-DD。 */
export function dayKey(at: number, timeZone: string): string {
  let format = dayFormats.get(timeZone)
  if (!format) {
    format = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    dayFormats.set(timeZone, format)
  }
  return format.format(at)
}

/** 某一刻在时区 timeZone 里的钟点：HH:mm:ss（24 小时制）。 */
export function clock(at: number, timeZone: string): string {
  let format = clockFormats.get(timeZone)
  if (!format) {
    format = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    clockFormats.set(timeZone, format)
  }
  return format.format(at)
}

/** 按天分组：天与天之间新的在前，同一天里新的在前；同一刻的保持传入的先后。 */
export function groupByDay(events: readonly TimelineEvent[], timeZone: string): DayGroup[] {
  const sorted = events
    .map((event, index) => ({ event, index }))
    .sort((a, b) => b.event.at - a.event.at || a.index - b.index)
    .map(({ event }) => event)
  const groups: DayGroup[] = []
  for (const event of sorted) {
    const day = dayKey(event.at, timeZone)
    const last = groups.at(-1)
    if (last?.day === day) last.events.push(event)
    else groups.push({ day, events: [event] })
  }
  return groups
}

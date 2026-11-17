// SPDX-License-Identifier: MIT
// 日历热力图的格子排布、档位与键盘（纯函数）。日期都是不带时区的日历日 YYYY-MM-DD，用 @internationalized/date 的 CalendarDate 算（跟 DateRangePicker、DateTimeInput 同一套），不碰本地时区与夏令时。
// 列是周、行是星期；weekStart 决定一周从哪天起（0 周日、1 周一）。第一列开头与最后一列结尾不在区间里的格子不画。
// 格色：正负各两档（div-*-100 与 -200，-200 只给超 80 分位的格），不再按比例分四档。

import { CalendarDate, endOfMonth, getDayOfWeek, parseDate } from '@internationalized/date'

/** 一周从哪天起（0 周日、1 周一）对应 @internationalized/date 的 firstDayOfWeek；locale 只是占位，起始日由它定。 */
const FIRST = { 0: 'sun', 1: 'mon' } as const
const rowOf = (day: CalendarDate, weekStart: 0 | 1) => getDayOfWeek(day, 'en-US', FIRST[weekStart])

/** YYYY-MM-DD → 日历日；写错或日子不存在（2026-02-30）返回 null。 */
function dayOf(text: string): CalendarDate | null {
  try {
    return parseDate(text)
  } catch {
    return null
  }
}

/** 日历日加减几天；日期写错原样返回。 */
export const addDays = (text: string, days: number): string => dayOf(text)?.add({ days }).toString() ?? text

export type CalendarCell = { date: string; col: number; row: number }

export type CalendarGrid = {
  cols: number
  cells: readonly CalendarCell[]
  /** 每个月第一天所在的列（含区间起点那一列），给月份标签定位。 */
  months: readonly { col: number; month: number }[]
}

/** from 到 to（含）每天一格。from 晚于 to 或日期写错返回空格子。 */
export function calendarGrid(from: string, to: string, weekStart: 0 | 1 = 1): CalendarGrid {
  const start = dayOf(from)
  const end = dayOf(to)
  if (!start || !end || start.compare(end) > 0) return { cols: 0, cells: [], months: [] }
  const firstRow = rowOf(start, weekStart)
  const cells: CalendarCell[] = []
  const months: { col: number; month: number }[] = []
  let lastMonth = -1
  for (let day = start, index = 0; day.compare(end) <= 0; day = day.add({ days: 1 }), index++) {
    const col = Math.floor((index + firstRow) / 7)
    // month 保持 0 起（一月是 0），月份标签照旧用它取名字。
    const month = day.month - 1
    if (month !== lastMonth) {
      months.push({ col, month })
      lastMonth = month
    }
    cells.push({ date: day.toString(), col, row: rowOf(day, weekStart) })
  }
  return { cols: cells[cells.length - 1]!.col + 1, cells, months }
}

export type CalendarTone = 'pos1' | 'pos2' | 'neg1' | 'neg2' | 'flat' | 'none'

/**
 * 格色档：没数据 none、0 是 flat；正负各两档，-100 是大多数，-200 只给 |值| 超过 hotAbove 的格（Calendar 卡：超月内 80 分位；全饱和不出现）。
 * hotAbove 由调用方按月内的 |值| 算（divHotThreshold）；它是 0 时没有 hot 格。
 */
export function calendarTone(value: number | null, hotAbove: number): CalendarTone {
  if (value === null || !Number.isFinite(value)) return 'none'
  if (value === 0) return 'flat'
  const hot = hotAbove > 0 && Math.abs(value) > hotAbove
  return value > 0 ? (hot ? 'pos2' : 'pos1') : hot ? 'neg2' : 'neg1'
}

/** ISO 8601 周序号（周四所在的那一周算本年，1 到 53）。 */
export function isoWeek(date: string): number {
  const day = dayOf(date)
  if (!day) return Number.NaN
  // 本周的周四落在哪一年，这一周就算哪一年；周序号 = 周四是那年第几天 / 7。
  const thursday = day.add({ days: 3 - getDayOfWeek(day, 'en-US', 'mon') })
  return Math.floor(thursday.compare(new CalendarDate(thursday.year, 1, 1)) / 7) + 1
}

export type MonthWeek = { week: number; days: readonly { date: string; inMonth: boolean }[] }

/** 一个月的月历：每行一周、每周 7 格，前后补上相邻月的日子（inMonth 为 false）。month 写 YYYY-MM；写错返回空。 */
export function monthGrid(month: string, weekStart: 0 | 1 = 1): MonthWeek[] {
  const first = dayOf(`${month}-01`)
  if (!first) return []
  const lead = rowOf(first, weekStart)
  const total = Math.ceil((lead + endOfMonth(first).day) / 7) * 7
  const weeks: MonthWeek[] = []
  for (let i = 0; i < total; i += 7) {
    const days = Array.from({ length: 7 }, (_, k) => {
      const date = first.add({ days: i + k - lead }).toString()
      return { date, inMonth: date.startsWith(month) }
    })
    weeks.push({ week: isoWeek(days[weekStart === 1 ? 0 : 1]!.date), days })
  }
  return weeks
}

/**
 * 键盘走一步：←→ 前后一天，↑↓ 前后一周（月历每行一周），Home / End 区间头尾，都夹在 [from, to]；Esc 清掉（null）；别的键返回 undefined。
 * 没选中时任一方向键先落到最后一天（最新）。
 */
export function calendarKey(date: string | null, key: string, from: string, to: string): string | null | undefined {
  if (key === 'Escape') return date === null ? undefined : null
  if (key === 'Home') return from
  if (key === 'End') return to
  const step =
    key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : key === 'ArrowUp' ? -7 : key === 'ArrowDown' ? 7 : 0
  if (step === 0) return undefined
  if (date === null) return to
  const next = addDays(date, step)
  return next < from ? from : next > to ? to : next
}

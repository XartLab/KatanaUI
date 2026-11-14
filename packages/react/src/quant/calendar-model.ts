// SPDX-License-Identifier: MIT
// 日历热力图的格子排布、档位与键盘（纯函数）。日期都是不带时区的日历日 YYYY-MM-DD，内部按 UTC 零点算，不碰本地时区与夏令时。
// 列是周、行是星期；weekStart 决定一周从哪天起（0 周日、1 周一）。第一列开头与最后一列结尾不在区间里的格子不画。
// 格色：正负各两档（div-*-100 与 -200，-200 只给超 80 分位的格），不再按比例分四档。

const DAY = 86_400_000
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseDate(text: string): number {
  const match = DATE.exec(text)
  if (!match) return Number.NaN
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return formatDate(ms) === text ? ms : Number.NaN
}

export function formatDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

export const addDays = (text: string, days: number): string => formatDate(parseDate(text) + days * DAY)

export type CalendarCell = { date: string; col: number; row: number }

export type CalendarGrid = {
  cols: number
  cells: readonly CalendarCell[]
  /** 每个月第一天所在的列（含区间起点那一列），给月份标签定位。 */
  months: readonly { col: number; month: number }[]
}

/** from 到 to（含）每天一格。from 晚于 to 或日期写错返回空格子。 */
export function calendarGrid(from: string, to: string, weekStart: 0 | 1 = 1): CalendarGrid {
  const start = parseDate(from)
  const end = parseDate(to)
  if (!(start <= end)) return { cols: 0, cells: [], months: [] }
  const rowOf = (ms: number) => (new Date(ms).getUTCDay() - weekStart + 7) % 7
  const firstRow = rowOf(start)
  const cells: CalendarCell[] = []
  const months: { col: number; month: number }[] = []
  let lastMonth = -1
  for (let ms = start, index = 0; ms <= end; ms += DAY, index++) {
    const col = Math.floor((index + firstRow) / 7)
    const month = new Date(ms).getUTCMonth()
    if (month !== lastMonth) {
      months.push({ col, month })
      lastMonth = month
    }
    cells.push({ date: formatDate(ms), col, row: rowOf(ms) })
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
  const ms = parseDate(date)
  const weekday = (new Date(ms).getUTCDay() + 6) % 7
  const thursday = ms + (3 - weekday) * DAY
  const year = new Date(thursday).getUTCFullYear()
  const first = Date.UTC(year, 0, 4)
  const firstThursday = first + (3 - ((new Date(first).getUTCDay() + 6) % 7)) * DAY
  return 1 + Math.round((thursday - firstThursday) / (7 * DAY))
}

export type MonthWeek = { week: number; days: readonly { date: string; inMonth: boolean }[] }

/** 一个月的月历：每行一周、每周 7 格，前后补上相邻月的日子（inMonth 为 false）。month 写 YYYY-MM；写错返回空。 */
export function monthGrid(month: string, weekStart: 0 | 1 = 1): MonthWeek[] {
  const first = `${month}-01`
  const ms = parseDate(first)
  if (Number.isNaN(ms)) return []
  const last = new Date(Date.UTC(new Date(ms).getUTCFullYear(), new Date(ms).getUTCMonth() + 1, 0)).getTime()
  const lead = (new Date(ms).getUTCDay() - weekStart + 7) % 7
  const total = Math.ceil((lead + (last - ms) / DAY + 1) / 7) * 7
  const weeks: MonthWeek[] = []
  for (let i = 0; i < total; i += 7) {
    const days = Array.from({ length: 7 }, (_, k) => {
      const date = formatDate(ms + (i + k - lead) * DAY)
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

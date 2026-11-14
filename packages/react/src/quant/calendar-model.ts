// SPDX-License-Identifier: MIT
// 日历热力图的格子排布、档位与键盘（纯函数）。日期都是不带时区的日历日 YYYY-MM-DD，内部按 UTC 零点算，不碰本地时区与夏令时。
// 列是周、行是星期；weekStart 决定一周从哪天起（0 周日、1 周一）。第一列开头与最后一列结尾不在区间里的格子不画。
// 档位：按 |值| 占最大 |值| 的比例分 4 档（1 到 4），0 单独一档，涨跌各一套。4 档是照 GitHub 贡献图的惯例（待定：没有针对盈亏数据的出处，等看过真实分布再调）。

const DAY = 86_400_000
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export const CALENDAR_LEVELS = 4

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

/** 值的档位：-4 到 4，0 是持平；max 是整张图 |值| 的最大值（0 或没有时全部 0 档）。 */
export function calendarLevel(value: number, max: number): number {
  if (!Number.isFinite(value) || value === 0 || !(max > 0)) return 0
  const level = Math.min(CALENDAR_LEVELS, Math.max(1, Math.ceil((Math.abs(value) / max) * CALENDAR_LEVELS)))
  return value > 0 ? level : -level
}

/**
 * 键盘走一步：←→ 前后一周（同一行换列），↑↓ 前后一天，Home / End 区间头尾，都夹在 [from, to]；Esc 清掉（null）；别的键返回 undefined。
 * 没选中时任一方向键先落到最后一天（最新）。
 */
export function calendarKey(date: string | null, key: string, from: string, to: string): string | null | undefined {
  if (key === 'Escape') return date === null ? undefined : null
  if (key === 'Home') return from
  if (key === 'End') return to
  const step =
    key === 'ArrowLeft' ? -7 : key === 'ArrowRight' ? 7 : key === 'ArrowUp' ? -1 : key === 'ArrowDown' ? 1 : 0
  if (step === 0) return undefined
  if (date === null) return to
  const next = addDays(date, step)
  return next < from ? from : next > to ? to : next
}

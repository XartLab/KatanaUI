// SPDX-License-Identifier: MIT
// 交易日选择（TradingDatePicker，#110）的纯函数。包里不带交易日历数据：哪天开市由调用方传，
// 可以是一组日期（Set 或数组，YYYY-MM-DD）或一个判定函数。日期都是 YYYY-MM-DD 字符串，日期运算用 UTC（不读时钟、不吃时区）。

/** 交易日历：一组开市日期，或判定函数（传入 YYYY-MM-DD，开市返回 true）。 */
export type TradingCalendar = ReadonlySet<string> | readonly string[] | ((date: string) => boolean)

const DAY = /^\d{4}-\d{2}-\d{2}$/

/** YYYY-MM-DD → UTC 毫秒；写法不对或不是真有的日期（2026-02-30）返回 null。 */
export function dayMs(date: string): number | null {
  if (!DAY.test(date)) return null
  const ms = Date.parse(`${date}T00:00:00Z`)
  return Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== date ? null : ms
}

/** 加减若干天。 */
export function addDays(date: string, days: number): string | null {
  const ms = dayMs(date)
  return ms === null ? null : new Date(ms + days * 86_400_000).toISOString().slice(0, 10)
}

/** 星期几，0 是周日；日期写不对返回 null。 */
export function weekdayOf(date: string): number | null {
  const ms = dayMs(date)
  return ms === null ? null : new Date(ms).getUTCDay()
}

/** 交易日历 → 判定函数；日期写不对一律不是交易日。 */
export function tradingDayTest(calendar: TradingCalendar): (date: string) => boolean {
  if (typeof calendar === 'function') return (date) => dayMs(date) !== null && calendar(date) === true
  const set = calendar instanceof Set ? (calendar as ReadonlySet<string>) : new Set(calendar as readonly string[])
  return (date) => set.has(date)
}

export type TradingRange = { min?: string; max?: string }

const within = (date: string, { min, max }: TradingRange) =>
  (min === undefined || date >= min) && (max === undefined || date <= max)

/**
 * 沿一个方向找下一个交易日（不含起点）：step 为 1 往后、-1 往前；超出 min / max 或扫了 maxScan 天（默认 40，比任何长假都长）没找到返回 null。
 */
export function shiftTradingDay(
  date: string,
  calendar: TradingCalendar,
  step: 1 | -1,
  range: TradingRange = {},
  maxScan = 40,
): string | null {
  const isTrading = tradingDayTest(calendar)
  let cursor: string | null = date
  for (let i = 0; i < maxScan; i++) {
    cursor = addDays(cursor, step)
    if (cursor === null || !within(cursor, range)) return null
    if (isTrading(cursor)) return cursor
  }
  return null
}

/** 离 date 最近的、不晚于它的交易日（date 自己是交易日就是它）；往前找不到返回 null。 */
export function latestTradingDayOnOrBefore(
  date: string,
  calendar: TradingCalendar,
  range: TradingRange = {},
  maxScan = 40,
): string | null {
  if (!within(date, range)) return null
  return tradingDayTest(calendar)(date) ? date : shiftTradingDay(date, calendar, -1, range, maxScan)
}

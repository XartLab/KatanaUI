// SPDX-License-Identifier: MIT
// 周期收益表的纯逻辑：把细粒度的收益（日收益或逐笔）复利成月、季、周，按年分行，行尾算年度合计。不带 React 与 DOM。
// 时区由调用方给（utcOffsetMinutes）：同一个时刻在东八区与 UTC 可能落在不同的月，件不猜。

/** 一个收益样本：time 是这笔收益归属的时刻（毫秒），value 是小数（0.012 即 1.2%）。 */
export type ReturnSample = { time: number; value: number }

export type PeriodUnit = 'month' | 'quarter' | 'week'

export type PeriodCell = {
  /** 复利后的收益；这个周期没有样本时整格是 null（不是 0）。 */
  value: number
  /** 落在这格里的样本数。 */
  count: number
}

export type PeriodRow = {
  /** 月、季按日历年；周按 ISO 周所属的年（1 月初可能属于上一年的第 52、53 周）。 */
  year: number
  /** 下标是列：月 0..11、季 0..3、周 0..(列数-1)；没有样本是 null。 */
  cells: (PeriodCell | null)[]
  /** 这一年所有样本复利后的合计；整年没有样本不会有这一行。 */
  total: number
}

/** 一串收益复利成一个：(1+r₁)(1+r₂)… − 1。空串是 0。 */
export const compound = (values: readonly number[]): number => values.reduce((acc, value) => acc * (1 + value), 1) - 1

/** 某时刻在给定时区下的年月日（用 UTC 方法读，所以先把时刻整体平移偏移量）。 */
function civil(time: number, utcOffsetMinutes: number): { year: number; month: number; day: number; weekday: number } {
  const date = new Date(time + utcOffsetMinutes * 60_000)
  return { year: date.getUTCFullYear(), month: date.getUTCMonth(), day: date.getUTCDate(), weekday: date.getUTCDay() }
}

/** ISO 8601 周：周一为一周之首，含该年第一个周四的那周是第 1 周。返回 ISO 年与周序（1 起）。 */
export function isoWeek(time: number, utcOffsetMinutes = 0): { year: number; week: number } {
  const { year, month, day, weekday } = civil(time, utcOffsetMinutes)
  const date = new Date(Date.UTC(year, month, day))
  // 挪到本周的周四（周日按 7 算），周四所在的年就是 ISO 年。
  date.setUTCDate(date.getUTCDate() + 4 - (weekday === 0 ? 7 : weekday))
  const isoYear = date.getUTCFullYear()
  const firstDay = Date.UTC(isoYear, 0, 1)
  return { year: isoYear, week: Math.floor((date.getTime() - firstDay) / 86_400_000 / 7) + 1 }
}

/** 样本落在哪一年哪一列。 */
export function periodSlot(time: number, unit: PeriodUnit, utcOffsetMinutes = 0): { year: number; column: number } {
  if (unit === 'week') {
    const { year, week } = isoWeek(time, utcOffsetMinutes)
    return { year, column: week - 1 }
  }
  const { year, month } = civil(time, utcOffsetMinutes)
  return { year, column: unit === 'month' ? month : Math.floor(month / 3) }
}

/** 把样本聚合成「年 × 周期」的行：年份升序，每格复利，行尾合计是该年全部样本复利。非有限数的样本跳过。周视图每行至少 52 列。 */
export function aggregateReturns(
  samples: readonly ReturnSample[],
  unit: PeriodUnit,
  utcOffsetMinutes = 0,
): PeriodRow[] {
  const buckets = new Map<number, Map<number, number[]>>()
  for (const sample of samples) {
    if (!Number.isFinite(sample.time) || !Number.isFinite(sample.value)) continue
    const { year, column } = periodSlot(sample.time, unit, utcOffsetMinutes)
    const row = buckets.get(year) ?? new Map<number, number[]>()
    const cell = row.get(column) ?? []
    cell.push(sample.value)
    row.set(column, cell)
    buckets.set(year, row)
  }
  const width = unit === 'month' ? 12 : unit === 'quarter' ? 4 : 0
  return [...buckets.keys()]
    .sort((a, b) => a - b)
    .map((year) => {
      const row = buckets.get(year)!
      const columns = width || Math.max(52, ...[...row.keys()].map((column) => column + 1))
      const cells = Array.from({ length: columns }, (_, column): PeriodCell | null => {
        const values = row.get(column)
        return values === undefined ? null : { value: compound(values), count: values.length }
      })
      return { year, cells, total: compound([...row.values()].flat()) }
    })
}

/** 周视图的列数要整张表一致（有的年有第 53 周）：把各行补齐到同一宽度。 */
export function padRows(rows: readonly PeriodRow[], width: number): PeriodRow[] {
  return rows.map((row) =>
    row.cells.length >= width
      ? row
      : { ...row, cells: [...row.cells, ...Array.from({ length: width - row.cells.length }, () => null)] },
  )
}

/** 着色用的上限：所有格子绝对值的最大者（年度合计不进，免得一年的合计把月份压成灰）；没有格子是 0。 */
export const periodLimit = (rows: readonly PeriodRow[]): number =>
  Math.max(0, ...rows.flatMap((row) => row.cells.map((cell) => (cell === null ? 0 : Math.abs(cell.value)))))

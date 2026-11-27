// SPDX-License-Identifier: MIT
/**
 * Pure model of MatrixHeat: shading level of a value, sorting rows by a column and columns by a row (empty cells always last), and the sort cycle.
 * 矩阵热力（#260）的纯函数：一个值落在哪一档（五档，档位 = ⌊t × 5⌋，封顶 4，规则同 ThemeHeatMatrix 与 CalendarHeatmap 的换手视图）、
 * 行按某一列排序、列按某一行排序（空格永远排最后，不管升降）、点列头 / 行头的循环。
 */

/** One cell. null (or value null) is an empty cell: written as a dash, never shaded. */
export type MatrixHeatCell = {
  /** The value that decides the shading; null is empty. 决定底色的值；null 是空格。 */
  value: number | null
  /** Text in the cell; defaults to the formatted value. 格内写的字；默认是格式化后的值。 */
  text?: string
  /** Why: shown in the hover window (also for an empty cell, say why it is empty). 悬停窗里的原因（空格写为什么空）。 */
  reason?: string
}

export type MatrixHeatRow = {
  id: string
  /** Row header text. */
  label: string
  /** One cell per column, in the order of `columns`; null (or missing) is an empty cell. */
  cells: readonly (MatrixHeatCell | null)[]
}

export type MatrixHeatColumn = { id: string; label: string }

/** sequential: one neutral ramp from low to high (counts, turnover). diverging: the up and down tones around 0 (changes, net flows). */
export type MatrixHeatScale = 'sequential' | 'diverging'

export type MatrixHeatSort = {
  /** rows: the rows are ordered by the column `key`. cols: the columns are ordered by the row `key`. */
  axis: 'rows' | 'cols'
  key: string
  desc: boolean
}

/** Shading of one cell: level 0–4 and, for diverging, the tone of the side it is on. */
export type MatrixHeatShade = { level: number; tone: 'seq' | 'up' | 'down' }

/** 值的有限数检查：null、NaN、Infinity 都算空。 */
export const cellValue = (cell: MatrixHeatCell | null | undefined): number | null =>
  cell && typeof cell.value === 'number' && Number.isFinite(cell.value) ? cell.value : null

/** 全部格的最小与最大值；没有值返回 null。 */
export function matrixExtent(rows: readonly MatrixHeatRow[]): [number, number] | null {
  let lo = Infinity
  let hi = -Infinity
  for (const row of rows)
    for (const cell of row.cells) {
      const value = cellValue(cell)
      if (value === null) continue
      lo = Math.min(lo, value)
      hi = Math.max(hi, value)
    }
  return lo === Infinity ? null : [lo, hi]
}

/**
 * 一个值的底色档：
 * sequential：t = (值 − 下界) / (上界 − 下界)，下界默认 0（计数、换手这类非负量）；值 ≤ 下界不着色（零与空一样），上界与下界相等时算最深一档。
 * diverging：t = |值| / max(|下界|, |上界|)，正数走涨色、负数走跌色，0 不着色。
 * 空格返回 null。domain 省略时取全部格的范围。
 */
export function matrixShade(
  value: number | null,
  scale: MatrixHeatScale,
  domain: readonly [number, number] | null,
): MatrixHeatShade | null {
  if (value === null || !Number.isFinite(value) || domain === null) return null
  const level = (t: number) => Math.min(4, Math.max(0, Math.floor(t * 5)))
  if (scale === 'diverging') {
    const reach = Math.max(Math.abs(domain[0]), Math.abs(domain[1]))
    if (value === 0 || !(reach > 0)) return null
    return { level: level(Math.abs(value) / reach), tone: value > 0 ? 'up' : 'down' }
  }
  const [lo, hi] = domain
  if (value <= lo) return null
  return { level: hi > lo ? level((value - lo) / (hi - lo)) : 4, tone: 'seq' }
}

/** 顺序色阶的默认范围：下界 0，上界取全部格的最大值（全是空或最大值不大于 0 返回 null）。 */
export function sequentialDomain(rows: readonly MatrixHeatRow[]): [number, number] | null {
  const extent = matrixExtent(rows)
  return extent && extent[1] > 0 ? [0, extent[1]] : null
}

const byValue = (desc: boolean) => (a: number | null, b: number | null) => {
  if (a === null || b === null) return Number(a === null) - Number(b === null)
  return desc ? b - a : a - b
}

/** 行按第 col 列的值排序（稳定；空格排最后，不管升降）。 */
export function sortRowsByColumn(rows: readonly MatrixHeatRow[], col: number, desc: boolean): MatrixHeatRow[] {
  const compare = byValue(desc)
  return rows
    .map((row, index) => ({ row, index, value: cellValue(row.cells[col]) }))
    .sort((a, b) => compare(a.value, b.value) || a.index - b.index)
    .map((entry) => entry.row)
}

/** 列按某一行的值排序：返回新的列次序（原列序号，稳定；空格排最后）。 */
export function sortColumnsByRow(row: MatrixHeatRow, count: number, desc: boolean): number[] {
  const compare = byValue(desc)
  return Array.from({ length: count }, (_, index) => ({ index, value: cellValue(row.cells[index]) }))
    .sort((a, b) => compare(a.value, b.value) || a.index - b.index)
    .map((entry) => entry.index)
}

/** 点同一个表头的循环：没排 → 降序（大的在前）→ 升序 → 不排。点别的表头从降序起。 */
export function nextMatrixSort(
  current: MatrixHeatSort | null,
  axis: MatrixHeatSort['axis'],
  key: string,
): MatrixHeatSort | null {
  if (!current || current.axis !== axis || current.key !== key) return { axis, key, desc: true }
  return current.desc ? { axis, key, desc: false } : null
}

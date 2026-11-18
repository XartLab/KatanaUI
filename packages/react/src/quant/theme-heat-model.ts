// SPDX-License-Identifier: MIT
/**
 * Data types and pure helpers of ThemeHeatMatrix.
 * 题材热度矩阵（#11）的数据形状与纯函数：分档与日历热力图的换手视图同一条（五档，档位 = ⌊只数 / 最大只数 × 5⌋，封顶 4），键盘走格。
 */

/** One cell: the caller's count for this theme on this day, and its rank that day. 一格：当天这个题材的涨停只数与名次。 */
export type ThemeHeatCell = {
  /** Limit-up count (or whatever heat count the caller uses). 涨停只数（或调用方定的热度计数）。 */
  count: number
  /** Rank among themes that day, 1 is hottest. 当天名次，1 最热。 */
  rank?: number
}

/** One theme row; cells follow the dates order, null where the theme had no data. 一行题材，格子跟 dates 次序对应，没有数据给 null。 */
export type ThemeHeatRow = {
  id: string
  name: string
  cells: readonly (ThemeHeatCell | null)[]
}

/** Position of a cell: row index and day index. 格子的位置。 */
export type ThemeHeatPos = { row: number; col: number }

/** Heat level 0–4 of a count against the matrix max (same rule as CalendarHeatmap's turnover view); null for no data or zero. */
export function heatLevel(count: number | undefined, max: number): number | null {
  if (count === undefined || !Number.isFinite(count) || count <= 0 || !(max > 0)) return null
  return Math.min(4, Math.floor((count / max) * 5))
}

/** Largest count in the matrix (0 when empty). 矩阵里最大的只数。 */
export const heatMax = (rows: readonly ThemeHeatRow[]): number =>
  rows.reduce((m, row) => row.cells.reduce((n, cell) => Math.max(n, cell?.count ?? 0), m), 0)

/** One keyboard step: arrows move a cell, Home / End go to the row ends, clamped; other keys return undefined. 键盘走一步。 */
export function heatKey(at: ThemeHeatPos, key: string, rows: number, cols: number): ThemeHeatPos | undefined {
  const clamp = (v: number, n: number) => Math.max(0, Math.min(n - 1, v))
  switch (key) {
    case 'ArrowLeft':
      return { row: at.row, col: clamp(at.col - 1, cols) }
    case 'ArrowRight':
      return { row: at.row, col: clamp(at.col + 1, cols) }
    case 'ArrowUp':
      return { row: clamp(at.row - 1, rows), col: at.col }
    case 'ArrowDown':
      return { row: clamp(at.row + 1, rows), col: at.col }
    case 'Home':
      return { row: at.row, col: 0 }
    case 'End':
      return { row: at.row, col: cols - 1 }
    default:
      return undefined
  }
}

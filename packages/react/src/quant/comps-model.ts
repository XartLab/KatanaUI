// SPDX-License-Identifier: MIT
// 同业对比表（CompsTable，KATANAview #2395）的纯函数：中位数、相对中位数的偏离、本公司置顶的排序。
// 功能参照 Koyfin Comps 与 Bloomberg RV（只取「本公司置顶、底部中位数与均值、按相对中位数着色」这几样），实现原创。

/** 越高越好、越低越好；不写就不着色（字段语义推不出的不自动给方向，KATANAview invariants「数据」）。 */
export type CompsBetter = 'higher' | 'lower'

export type CompsRow = {
  id: string
  symbol: string
  name?: string
  /** 本公司：置顶、高亮，不参与排序。 */
  subject?: boolean
  values: Readonly<Record<string, number | null | undefined>>
}

export const finite = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/** 中位数；没有数时 null。 */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null
  const sorted = values.toSorted((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

/** 一列的中位数（含本公司）。 */
export function columnMedian(rows: readonly CompsRow[], metric: string): number | null {
  return median(rows.flatMap((row) => (finite(row.values[metric]) ? [row.values[metric]] : [])))
}

/**
 * 相对中位数的偏离，按「好」的方向取正：higher 时高于中位为正，lower 时低于中位为正。
 * 用相对偏离（除以中位数绝对值），中位数是 0 时用绝对偏离；没有方向、没有数或没有中位数时 null（不着色）。
 */
export function goodness(
  value: number | null | undefined,
  mid: number | null,
  better: CompsBetter | undefined,
): number | null {
  if (better === undefined || !finite(value) || mid === null) return null
  const raw = mid === 0 ? value : (value - mid) / Math.abs(mid)
  return better === 'higher' ? raw : -raw
}

/** 着色的量程：一列各格 goodness 绝对值的最大者；全是 0 或没有时 null。 */
export function goodnessLimit(
  rows: readonly CompsRow[],
  metric: string,
  better: CompsBetter | undefined,
): number | null {
  const mid = columnMedian(rows, metric)
  let limit = 0
  for (const row of rows) {
    const g = goodness(row.values[metric], mid, better)
    if (g !== null) limit = Math.max(limit, Math.abs(g))
  }
  return limit > 0 ? limit : null
}

/** 排序：本公司始终在最前，其余按这一列，没数的排最后。by 为 null 时保持原次序（本公司仍置顶）。 */
export function orderComps(rows: readonly CompsRow[], by: { id: string; desc: boolean } | null): CompsRow[] {
  const subjects = rows.filter((row) => row.subject)
  const others = rows.filter((row) => !row.subject)
  if (by === null) return [...subjects, ...others]
  const key = (row: CompsRow) => (by.id === 'symbol' ? null : row.values[by.id])
  const sorted = others.toSorted((a, b) => {
    if (by.id === 'symbol') return by.desc ? b.symbol.localeCompare(a.symbol) : a.symbol.localeCompare(b.symbol)
    const x = key(a)
    const y = key(b)
    if (!finite(x) && !finite(y)) return 0
    if (!finite(x)) return 1
    if (!finite(y)) return -1
    return by.desc ? y - x : x - y
  })
  return [...subjects, ...sorted]
}

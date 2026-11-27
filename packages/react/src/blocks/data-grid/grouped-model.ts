// SPDX-License-Identifier: MIT
/**
 * Pure model of GroupedTable: split rows into groups, order the groups by a summary number, put the ungrouped rows in a trailing "other" group,
 * and flatten to the header-plus-rows list DataGrid's sections understand.
 * 分组表（#260）的纯函数：行按组分开、组按汇总数排序、没分进组的放尾部「其他」，再摊平成 DataGrid 分节认得的「标题行 + 行」。
 * 不用 TanStack 的 grouping：DataGrid 已有分节（收起、标题汇总、按列的组内汇总、节内排序），分组表只是把「按哪一列分组、组怎么排」算出来喂给它，
 * 不另起一套表（用户 2026-11-27 定：能做成 DataGrid 的一个能力就不另造表）。
 */

/** One group: its key (null is the trailing "other" group) and its rows in input order. */
export type Group<Row> = {
  /** 组键；null 是尾部的「其他」。 */
  key: string | null
  /** 组内的行，保持传入次序。 */
  rows: readonly Row[]
}

/** What a group summary callback receives. */
export type GroupInfo<Row> = Group<Row> & {
  /** 行数。 */
  count: number
  /** 是不是尾部的「其他」组。 */
  other: boolean
}

/** 一个标题行或一行数据：DataGrid 里的行是它们的并集（标题行是合成的，不是调用方的行）。 */
export type GroupedItem<Row> = { kind: 'row'; row: Row } | { kind: 'group'; id: string; group: GroupInfo<Row> }

const OTHER_ID = 'group:\u0000other'

/** 组标题行的 id；组键是 null（其他）用一个调用方写不出来的固定 id。 */
export const groupItemId = (key: string | null): string => (key === null ? OTHER_ID : `group:${key}`)

/** 组键：字符串去空白后非空才算有组；null、undefined、空串都是「其他」。 */
export const normalizeGroupKey = (key: string | null | undefined): string | null => {
  const text = typeof key === 'string' ? key.trim() : ''
  return text === '' ? null : text
}

export type GroupOptions<Row> = {
  groupBy: (row: Row) => string | null | undefined
  /**
   * 组的排序数：汇总里最该看的那一个（组内合计金额、晋级率……）；省略是行数。null 排在有数的后面。
   */
  metric?: (group: GroupInfo<Row>) => number | null
  /** desc（默认）大的在前；asc 小的在前。同数保持首次出现的次序。「其他」不参与排序，永远在最后。 */
  order?: 'asc' | 'desc'
}

/** 分组并排序：有组的按汇总数排，「其他」（没有组键的行）放最后；没有行就没有组。 */
export function buildGroups<Row>(
  rows: readonly Row[],
  { groupBy, metric, order = 'desc' }: GroupOptions<Row>,
): Group<Row>[] {
  const named = new Map<string, Row[]>()
  const other: Row[] = []
  for (const row of rows) {
    const key = normalizeGroupKey(groupBy(row))
    if (key === null) other.push(row)
    else {
      const bucket = named.get(key)
      if (bucket) bucket.push(row)
      else named.set(key, [row])
    }
  }
  const infos = [...named].map(([key, members]) => info({ key, rows: members }))
  const scored = infos.map((entry, index) => {
    const value = metric ? metric(entry) : entry.count
    return { entry, index, value: typeof value === 'number' && Number.isFinite(value) ? value : null }
  })
  const sign = order === 'asc' ? 1 : -1
  scored.sort((a, b) => {
    if (a.value === null || b.value === null)
      return Number(a.value === null) - Number(b.value === null) || a.index - b.index
    return (a.value - b.value) * sign || a.index - b.index
  })
  const groups: Group<Row>[] = scored.map(({ entry }) => ({ key: entry.key, rows: entry.rows }))
  if (other.length > 0) groups.push({ key: null, rows: other })
  return groups
}

const info = <Row>(group: Group<Row>): GroupInfo<Row> => ({
  ...group,
  count: group.rows.length,
  other: group.key === null,
})

/** 摊平成 DataGrid 的行：每组一个标题行，后面跟这一组的行。 */
export function flattenGroups<Row>(groups: readonly Group<Row>[]): GroupedItem<Row>[] {
  return groups.flatMap((group) => [
    { kind: 'group', id: groupItemId(group.key), group: info(group) } as const,
    ...group.rows.map((row) => ({ kind: 'row', row }) as const),
  ])
}

/** 组标题行 id → 组键（给 collapsed 的回调）；不是组标题行的 id 返回 undefined，「其他」是 null。 */
export function groupKeyOfId(id: string): string | null | undefined {
  if (id === OTHER_ID) return null
  return id.startsWith('group:') ? id.slice('group:'.length) : undefined
}

/** 晋级这类「k/n」：n 是组内行数，k 是满足条件的行数。 */
export function countPassed<Row>(rows: readonly Row[], passed: (row: Row) => boolean): { k: number; n: number } {
  return { k: rows.filter(passed).length, n: rows.length }
}

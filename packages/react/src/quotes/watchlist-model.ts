// SPDX-License-Identifier: MIT
// 自选列表的纯函数：最新价变动时只给「变了的尾数」上色，以及按列排序。

/** 新旧两串价格文字从哪一位开始不同：返回不变的头与变了的尾（长度不同时，从长度分叉处起都算尾）。相同返回尾为空串。 */
export function changedTail(prev: string, next: string): { head: string; tail: string } {
  let i = 0
  while (i < prev.length && i < next.length && prev[i] === next[i]) i += 1
  return { head: next.slice(0, i), tail: next.slice(i) }
}

export type WatchlistSortKey = 'symbol' | 'last' | 'chg' | 'chgPct'
export type WatchlistSort = { key: WatchlistSortKey; dir: 'asc' | 'desc' }

/** 点列头的循环：没排 → 升序 → 降序 → 回到原顺序（null）。换了列从升序起。 */
export function nextSort(current: WatchlistSort | null, key: WatchlistSortKey): WatchlistSort | null {
  if (!current || current.key !== key) return { key, dir: 'asc' }
  return current.dir === 'asc' ? { key, dir: 'desc' } : null
}

/** 排序要的字段：symbol（旧名 code 也认，一个版本后去掉）、last、change、changePct。 */
type Sortable = {
  symbol?: string
  /** Deprecated: use symbol. @deprecated Use symbol. */ code?: string
  last: number
  change: number
  changePct: number
}

/** 排序后的新数组（不改入参）；没有排序规则时原顺序。不是有限数的排最后。 */
export function sortRows<T extends Sortable>(rows: readonly T[], sort: WatchlistSort | null): T[] {
  if (!sort) return [...rows]
  const pick = (row: T) =>
    sort.key === 'symbol'
      ? (row.symbol ?? row.code ?? '')
      : sort.key === 'last'
        ? row.last
        : sort.key === 'chg'
          ? row.change
          : row.changePct
  const sign = sort.dir === 'asc' ? 1 : -1
  // js/copying-array-methods：toSorted 替代「展开复制再 sort」。
  return rows.toSorted((a, b) => {
    const x = pick(a)
    const y = pick(b)
    if (typeof x === 'number' && typeof y === 'number') {
      const bad = (n: number) => !Number.isFinite(n)
      if (bad(x) || bad(y)) return Number(bad(x)) - Number(bad(y))
      return (x - y) * sign
    }
    return String(x).localeCompare(String(y)) * sign
  })
}

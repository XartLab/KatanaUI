// SPDX-License-Identifier: MIT
// MarketBrowser 的纯函数：按搜索词筛行。排序与「点列头的循环」直接用自选列表的那一份（watchlist-model.ts），不另写。

type Searchable = { symbol: string; name?: string; keywords?: readonly string[] }

/**
 * 按搜索词筛：代码、名称、别名里任何一处含有词（不分大小写，空格两头去掉）就留下；词是空的原样返回。
 * 代码里的场所与计价币不特别处理：搜「btc」能找到 BTC-USDT-SWAP，搜「usdt」也能。
 */
export function filterMarketRows<T extends Searchable>(rows: readonly T[], query: string): T[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return [...rows]
  return rows.filter((row) =>
    [row.symbol, row.name ?? '', ...(row.keywords ?? [])].some((text) => text.toLowerCase().includes(needle)),
  )
}

/**
 * 一行要从列表里消失时（在「自选」页签取消星标），焦点该去哪一行：下一行，没有下一行就上一行，都没有是 null（列表空了，焦点去页签）。
 * 照 Radix / WAI-ARIA 列表删除项的通行做法：焦点留在原位附近，不掉回 body。
 */
export function neighborId(ids: readonly string[], id: string): string | null {
  const at = ids.indexOf(id)
  if (at < 0) return null
  return ids[at + 1] ?? ids[at - 1] ?? null
}

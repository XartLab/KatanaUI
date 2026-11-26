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

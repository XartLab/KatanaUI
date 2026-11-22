// SPDX-License-Identifier: MIT
// 品种搜索的纯函数（#77 第 1 条）：匹配高亮的区段、最近搜索的增删、按分段过滤。组件与单测共用。

/** One searchable instrument. Data comes from the caller; the component has no market data of its own. */
export type SymbolSearchItem = {
  /** Unique id (for example `BINANCE:BTCUSDT`); recent searches are keyed by it. */
  id: string
  /** Symbol code shown in bold (BTCUSDT, 600519). */
  symbol: string
  /** Description under the code (Bitcoin / TetherUS). */
  name?: string
  /** Exchange or source shown on the right (Binance, SSE). */
  exchange?: string
  /** Segment id this item belongs to (stock, crypto…); used to filter recent searches by segment. */
  market?: string
  /** Short type tag after the name (spot, perpetual, ETF). */
  type?: string
  /** Logo URL for SymbolMark; letters are drawn when omitted. */
  logo?: string
}

/** One segment of the market filter; the caller gives the list, the first is usually "all". */
export type SymbolSearchSegment = {
  /** Segment id passed to onQuery; `all` (or any id no item's market equals) shows every recent item. */
  id: string
  /** Visible label. */
  label: string
}

/** 文字里与查询词相同（不分大小写）的第一段：[起, 止)；没有命中或查询为空返回 null。 */
export function matchRange(text: string, query: string): readonly [number, number] | null {
  const needle = query.trim().toLowerCase()
  if (!needle) return null
  const at = text.toLowerCase().indexOf(needle)
  return at < 0 ? null : [at, at + needle.length]
}

/** 把文字按命中切成三段：前、命中、后（没命中时只有「前」）。 */
export function splitMatch(text: string, query: string): { before: string; hit: string; after: string } {
  const range = matchRange(text, query)
  if (!range) return { before: text, hit: '', after: '' }
  return { before: text.slice(0, range[0]), hit: text.slice(range[0], range[1]), after: text.slice(range[1]) }
}

/** 选中一项后的最近列表：挪到最前、按 id 去重、最多 limit 项。 */
export function pushRecent(
  list: readonly SymbolSearchItem[],
  item: SymbolSearchItem,
  limit: number,
): SymbolSearchItem[] {
  return [item, ...list.filter((entry) => entry.id !== item.id)].slice(0, Math.max(0, limit))
}

/** 最近列表按分段过滤：分段 id 是 allId 就全给，否则只给 market 等于它的。 */
export function recentInSegment(list: readonly SymbolSearchItem[], segment: string, allId = 'all'): SymbolSearchItem[] {
  if (segment === allId) return [...list]
  return list.filter((item) => item.market === segment)
}

/** 最近列表的形状检查（usePersistedState 的 validate）：存档被改坏时当没存过。 */
export function isRecentList(value: unknown): value is SymbolSearchItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item !== null &&
        typeof item === 'object' &&
        typeof (item as SymbolSearchItem).id === 'string' &&
        typeof (item as SymbolSearchItem).symbol === 'string',
    )
  )
}

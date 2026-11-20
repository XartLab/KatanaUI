// SPDX-License-Identifier: MIT

export type NewsSymbol = { code: string; name?: string }

export type NewsItem = {
  id: string
  /** 毫秒时间戳。 */
  time: number
  /** 频道的 value（对应 NewsFeedProps.channels）。 */
  channel: string
  /** 来源的 value（对应 NewsFeedProps.sources）。 */
  source: string
  title: string
  /** 摘要：卡片排法里显示两行。 */
  summary?: string
  symbols?: readonly NewsSymbol[]
  important?: boolean
  /** 预计阅读分钟数：写在时间后面（labels.read 传了才写）。 */
  readMinutes?: number
  /** 有链接就把标题渲染成链接（新窗口打开）。 */
  href?: string
  /** 类别的 value（对应 NewsFeedProps.categories，如公告类别、增减持）；不带就不在任何类别里，选了类别时会被筛掉。 */
  category?: string
  /** 组合过滤用的分面取值：键是 NewsFacet.key，值是这条新闻在这个分面上的取值（可多个）。 */
  facets?: Readonly<Record<string, readonly string[]>>
}

/** 组合过滤的一个分面（TradingView News Flow 的 Instrument、Market、Corporate activity、Economics、Country、Provider…，主会话 2026-11-15 实测）：类别与取值由调用方定义。 */
export type NewsFacet = {
  key: string
  label: string
  options: readonly { value: string; label: string }[]
  /** 只许选一个（TradingView 里只有 Watchlist 如此）。 */
  single?: boolean
  /** 一开始就在过滤条上。 */
  shown?: boolean
}

export type NewsFilter = {
  /** 空字符串：全部频道。 */
  channel: string
  /** 空数组：全部来源。 */
  sources: readonly string[]
  query: string
  /** 选中的类别 value：空数组或不给是全部类别；多选是「或」。 */
  categories?: readonly string[]
  /** 分面选中的取值：键是分面 key；没有这个键或空数组 = 这个分面不筛；多个取值是「或」，分面之间是「且」。 */
  facets?: Readonly<Record<string, readonly string[]>>
}

/** 频道、来源、关键词三道筛选（关键词在标题、摘要、品种代码与名称里找，不分大小写、空白分词都要命中）。 */
export function filterNews(items: readonly NewsItem[], filter: NewsFilter): NewsItem[] {
  const words = filter.query.toLowerCase().split(/\s+/).filter(Boolean)
  return items.filter((item) => {
    if (filter.channel !== '' && item.channel !== filter.channel) return false
    if (filter.sources.length > 0 && !filter.sources.includes(item.source)) return false
    if (filter.categories && filter.categories.length > 0 && !filter.categories.includes(item.category ?? ''))
      return false
    for (const [key, picked] of Object.entries(filter.facets ?? {})) {
      if (picked.length === 0) continue
      const has = item.facets?.[key] ?? []
      if (!picked.some((value) => has.includes(value))) return false
    }
    if (words.length === 0) return true
    const hay = [item.title, item.summary ?? '', ...(item.symbols ?? []).flatMap((s) => [s.code, s.name ?? ''])]
      .join('\n')
      .toLowerCase()
    return words.every((w) => hay.includes(w))
  })
}

/** 新的在前；同一时间按 id 定序，列表不跳。 */
export function sortNews(items: readonly NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => b.time - a.time || (a.id < b.id ? -1 : 1))
}

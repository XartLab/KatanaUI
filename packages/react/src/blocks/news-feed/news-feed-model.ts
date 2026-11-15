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
  /** 有链接就把标题渲染成链接（新窗口打开）。 */
  href?: string
}

export type NewsFilter = {
  /** 空字符串：全部频道。 */
  channel: string
  /** 空数组：全部来源。 */
  sources: readonly string[]
  query: string
}

/** 频道、来源、关键词三道筛选（关键词在标题、摘要、品种代码与名称里找，不分大小写、空白分词都要命中）。 */
export function filterNews(items: readonly NewsItem[], filter: NewsFilter): NewsItem[] {
  const words = filter.query.toLowerCase().split(/\s+/).filter(Boolean)
  return items.filter((item) => {
    if (filter.channel !== '' && item.channel !== filter.channel) return false
    if (filter.sources.length > 0 && !filter.sources.includes(item.source)) return false
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

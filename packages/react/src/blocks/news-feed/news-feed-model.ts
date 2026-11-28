// SPDX-License-Identifier: MIT
import type { ReactNode } from 'react'

export type NewsSymbol = { code: string; name?: string }

/**
 * Tone of a tag after the headline. Only neutral, info and warn: there is no up / down tone, because price colors on a
 * news tag read as a price call (#2189).
 * 标题后标签的语气：只有 neutral / info / warn 三档，没有涨跌两档（涨跌色给新闻标签用，读起来就是价格判断）。
 */
export type NewsTagTone = 'neutral' | 'info' | 'warn'

/** A short plain-text tag drawn after the headline (a category, a direction word). 画在标题后面的短标签，纯文本。 */
export type NewsTag = { label: string; tone?: NewsTagTone }

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
  /** Tags drawn after the headline, in order. 画在标题后面的标签（按顺序）；纯文本，颜色只重复语气，不表示涨跌。 */
  tags?: readonly NewsTag[]
  /** How many outlets reported this item (merged duplicates). Written as `labels.sourceCount(n)` when above 1. 合并后有几家报道；大于 1 才写。 */
  sourcesCount?: number
  /** Names of the other outlets, shown as a hover description on the source count. 另外几家的名字，放在来源数的悬停说明里。 */
  alsoFrom?: readonly string[]
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

/** The group a row belongs to, returned by `NewsFeedProps.groupBy`. 一行所属的组（小标题）。 */
export type NewsGroup = {
  key: string
  label: ReactNode
  /** Shown beside the label; the caller counts (the feed may hold only part of the group). 写在小标题旁边的条数，由调用方给。 */
  count?: number
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
  // js/copying-array-methods：toSorted 直接返回新数组，少一次展开复制。
  return items.toSorted((a, b) => b.time - a.time || (a.id < b.id ? -1 : 1))
}

/** One drawn row of the list: a headline row or a group heading. 列表里的一行：一条新闻或一个组的小标题。 */
export type NewsEntry =
  | { kind: 'item'; id: string; item: NewsItem; index: number }
  | { kind: 'group'; id: string; group: NewsGroup }

/**
 * Lays the items out as rows, putting a heading in front of each run of items with the same group key.
 * The caller orders the groups (the feed does not sort when it groups), so a key that comes back after another key gets a second heading
 * rather than being merged; its id gets a `#n` suffix so row keys stay unique.
 * 把条目排成行：同一个组键连续的一段前面放一个小标题。组序由调用方排好（分组时件不排序）；隔开又回来的组键再出一个小标题，id 加 `#n` 后缀保持唯一。
 */
export function buildEntries(items: readonly NewsItem[], groupBy?: (item: NewsItem) => NewsGroup): NewsEntry[] {
  const entries: NewsEntry[] = []
  const seen = new Map<string, number>()
  let current: string | null = null
  items.forEach((item, index) => {
    if (groupBy) {
      const group = groupBy(item)
      if (group.key !== current) {
        current = group.key
        const times = seen.get(group.key) ?? 0
        seen.set(group.key, times + 1)
        entries.push({ kind: 'group', id: `g:${group.key}${times ? `#${times + 1}` : ''}`, group })
      }
    }
    entries.push({ kind: 'item', id: `i:${item.id}`, item, index })
  })
  return entries
}

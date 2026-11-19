// SPDX-License-Identifier: MIT
// ComponentCatalog 的纯函数：按类别与搜索词筛、把「推荐」提到最前、其余按类别分组。

export type CatalogKind = 'chart' | 'table' | 'list' | 'form' | 'gauge' | 'text'

export type CatalogItem = {
  id: string
  name: string
  /** Id of one of the categories. */
  category: string
  /** Which stock thumbnail to draw when no thumbnail node is given. */
  kind?: CatalogKind
  /** Extra words the search matches (aliases, English names). */
  keywords?: readonly string[]
  /** Already placed in the workspace: drawn with a tick. */
  inUse?: boolean
  /** Why it cannot be added here (no data for this market, say); drawn greyed with this as its hint. */
  unavailable?: string
  /** Fits what the user is looking at now; listed first under the recommended heading. */
  recommended?: boolean
  /** Kinds of component this one goes well beside (an order book beside a chart); recommended when the context is one of them. */
  pairsWith?: readonly string[]
}

export type CatalogCategory = { id: string; name: string }

export type CatalogGroup = { id: string; name: string; items: readonly CatalogItem[] }

const matches = (item: CatalogItem, query: string): boolean => {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [item.name, ...(item.keywords ?? [])].some((text) => text.toLowerCase().includes(needle))
}

/**
 * 分组：选了类别只看这一类；没选时先一组「推荐」（宿主标了 recommended，或 pairsWith 含当前的 context；能加且还没在用的），再按类别的次序各一组（推荐的不重复出现）。
 * 空组不返回。每组里能加的排前面、不能加的排后面，各自保持原次序。
 */
export function groupCatalog(
  items: readonly CatalogItem[],
  categories: readonly CatalogCategory[],
  options: { category?: string | null; query?: string; recommendedName?: string; context?: string } = {},
): CatalogGroup[] {
  const { category = null, query = '', recommendedName, context } = options
  // 推荐 = 宿主直接标的，或它声明了「适合放在 context 这种组件旁边」；已经在用的不再推荐。
  const fits = (item: CatalogItem) =>
    !item.unavailable &&
    !item.inUse &&
    (item.recommended === true || (context !== undefined && item.pairsWith?.includes(context) === true))
  const found = items.filter((item) => matches(item, query) && (category === null || item.category === category))
  const order = (list: readonly CatalogItem[]) => [
    ...list.filter((item) => !item.unavailable),
    ...list.filter((item) => item.unavailable),
  ]
  const groups: CatalogGroup[] = []
  const lead = category === null && recommendedName ? found.filter(fits) : []
  if (lead.length > 0) groups.push({ id: 'recommended', name: recommendedName!, items: lead })
  for (const { id, name } of categories) {
    const own = found.filter((item) => item.category === id && !lead.includes(item))
    if (own.length > 0) groups.push({ id, name, items: order(own) })
  }
  return groups
}

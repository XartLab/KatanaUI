// SPDX-License-Identifier: MIT
// 财务报表表（StatementTable，KATANAview #2395）的纯函数：科目树、可见行、同比 / 环比。
// 功能参照 TradingView 品种页 Financials（科目成树、期间做列、季 / 年切换）与 Koyfin 的 FA 表，只取「有哪些部分」，实现原创。

/** 科目的种类：普通行、小计（毛利、营业利润）、合计（净利润）。小计加粗，合计上方一条细线。 */
export type StatementItemKind = 'line' | 'subtotal' | 'total'

/** 一个科目：id、名字（调用方按界面语言给）、父科目（没有就是顶层）、种类。 */
export type StatementItem = {
  id: string
  label: string
  parent?: string
  kind?: StatementItemKind
}

/** 一个期间：id（数据里的键，如 2026Q3）、列头的字（调用方给）。 */
export type StatementPeriod = { id: string; label: string }

/** 一格：数，或带更正标记（这一格是第几版披露，>1 就是更正过）。 */
export type StatementValue = number | null | { value: number | null; revision?: number; note?: string }

/** 各科目各期间的值：values[科目 id][期间 id]。 */
export type StatementValues = Readonly<Record<string, Readonly<Record<string, StatementValue>>>>

/** 显示哪种数：原值、同比、环比。 */
export type StatementMode = 'value' | 'yoy' | 'qoq'

export type StatementRow = {
  item: StatementItem
  level: number
  hasChildren: boolean
  expanded: boolean
}

export const valueOf = (cell: StatementValue | undefined): number | null =>
  cell === undefined || cell === null ? null : typeof cell === 'number' ? cell : cell.value

export const revisionOf = (cell: StatementValue | undefined): number | undefined =>
  cell !== undefined && cell !== null && typeof cell === 'object' ? cell.revision : undefined

/**
 * 按树的先序排好可见行：收起的科目，它的子孙都不出现。父科目写了但不存在的，当顶层（不丢行）；
 * 有环（父子互指）时环上的科目当顶层，保证每个科目恰好出现一次。
 */
export function statementRows(items: readonly StatementItem[], collapsed: ReadonlySet<string>): StatementRow[] {
  const known = new Set(items.map((item) => item.id))
  const children = new Map<string, StatementItem[]>()
  const roots: StatementItem[] = []
  for (const item of items) {
    const parent = item.parent !== undefined && known.has(item.parent) && item.parent !== item.id ? item.parent : null
    if (parent === null) roots.push(item)
    else children.set(parent, [...(children.get(parent) ?? []), item])
  }
  const out: StatementRow[] = []
  const placed = new Set<string>()
  const walk = (item: StatementItem, level: number, visible: boolean) => {
    if (placed.has(item.id)) return
    placed.add(item.id)
    const kids = children.get(item.id) ?? []
    const expanded = !collapsed.has(item.id)
    if (visible) out.push({ item, level, hasChildren: kids.length > 0, expanded })
    for (const kid of kids) walk(kid, level + 1, visible && expanded)
  }
  for (const root of roots) walk(root, 1, true)
  // 环上的科目从根走不到：照原次序补成顶层。
  for (const item of items) if (!placed.has(item.id)) walk(item, 1, true)
  return out
}

/**
 * 某一格的变化率（小数，0.12 是 +12%）：同比与同一期间往前 periodsPerYear 列比，环比与前一列比。
 * 期间按 periods 的次序（从早到晚）。分母是 0、缺数，或前面没有可比的列，返回 null。分母取绝对值，负数基数时方向仍对（亏损收窄是正）。
 */
export function changeAt(
  values: Readonly<Record<string, StatementValue>> | undefined,
  periods: readonly StatementPeriod[],
  index: number,
  mode: Exclude<StatementMode, 'value'>,
  periodsPerYear: number,
): number | null {
  const back = mode === 'yoy' ? periodsPerYear : 1
  const base = periods[index - back]
  const here = periods[index]
  if (!values || !base || !here) return null
  const now = valueOf(values[here.id])
  const before = valueOf(values[base.id])
  if (now === null || before === null || before === 0 || !Number.isFinite(now) || !Number.isFinite(before)) return null
  return (now - before) / Math.abs(before)
}

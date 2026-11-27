// SPDX-License-Identifier: MIT
/**
 * Pure functions of manual row order: normalize a stored order, move rows to a drop spot, move them one step.
 * 手动行序的纯函数（#77 G7）：把存下的次序对上现有的行、把几行挪到落点、上下挪一格；分节行（分组标题）带着组里的行一起走。
 * 出处：TradingView 自选表拖放排序与「Add section」（自选页、右键菜单，主会话 2026-11-18 实看）；键盘 Alt+↑/↓ 是应用自选表的写法（#22 对齐表 L922）。
 */

/** 分节行判断：返回 true 的 id 是一节的标题行，它后面直到下一个标题的行属于这一节。 */
export type IsSection = (id: string) => boolean

/** 把存下的次序对上现在的行：不在的去掉，新来的按 ids 里的先后接在最后。 */
export function normalizeOrder(order: readonly string[] | undefined, ids: readonly string[]): string[] {
  if (!order) return [...ids]
  const present = new Set(ids)
  const kept = order.filter((id) => present.has(id))
  const seen = new Set(kept)
  return [...new Set(kept), ...ids.filter((id) => !seen.has(id))]
}

/** 要挪的行：拖的是分节标题时，连同它那一节的行一起；按 order 的先后返回。 */
export function expandMoving(order: readonly string[], moving: readonly string[], isSection?: IsSection): string[] {
  const picked = new Set(moving)
  const out = new Set<string>()
  let inSection = false
  for (const id of order) {
    if (isSection?.(id)) inSection = picked.has(id)
    if (picked.has(id) || inSection) out.add(id)
  }
  return order.filter((id) => out.has(id))
}

/**
 * 把 moving 挪到 before 之前（null 是挪到最后），保持它们原来的相对次序。
 * 挪的里面有分节标题时，落点吸到节的边界（下一个标题之前或最后），不把别的节拆开。
 */
export function moveRows(
  order: readonly string[],
  moving: readonly string[],
  before: string | null,
  isSection?: IsSection,
): string[] {
  const block = expandMoving(order, moving, isSection)
  if (block.length === 0) return [...order]
  const inBlock = new Set(block)
  const rest = order.filter((id) => !inBlock.has(id))
  let at: number
  if (before === null) at = rest.length
  else if (inBlock.has(before)) {
    // 落在自己身上：放回块后面的第一行之前（就是原处）。
    const next = order.slice(order.indexOf(before)).find((id) => !inBlock.has(id))
    at = next === undefined ? rest.length : rest.indexOf(next)
  } else at = rest.indexOf(before)
  if (at < 0) at = rest.length
  if (block.some((id) => isSection?.(id))) {
    while (at < rest.length && !isSection?.(rest[at])) at++
  }
  return [...rest.slice(0, at), ...block, ...rest.slice(at)]
}

/** 往上（-1）或往下（+1）挪一格：普通行跨过一行（跨过标题就进了上一节或下一节）；分节整节跨过相邻的一节。 */
export function moveRowsBy(
  order: readonly string[],
  moving: readonly string[],
  delta: -1 | 1,
  isSection?: IsSection,
): string[] {
  const block = expandMoving(order, moving, isSection)
  if (block.length === 0) return [...order]
  const inBlock = new Set(block)
  const rest = order.filter((id) => !inBlock.has(id))
  const first = order.indexOf(block[0])
  const p = order.slice(0, first).filter((id) => !inBlock.has(id)).length
  let at: number
  if (block.some((id) => isSection?.(id))) {
    const bounds = [0, ...rest.flatMap((id, i) => (isSection?.(id) ? [i] : [])), rest.length]
    // 往上落在上一节标题前；往下越过下一节整节，落在再下一节的标题前（或最后）。
    at = delta < 0 ? (bounds.findLast((b) => b < p) ?? 0) : (bounds.find((b) => b > p) ?? rest.length)
  } else at = Math.max(0, Math.min(rest.length, p + delta))
  return [...rest.slice(0, at), ...block, ...rest.slice(at)]
}

/** 挪完是不是跟原来一样（拖回原处不算一次挪动，不播报、不回调）。 */
export const isSameOrder = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id, i) => id === b[i])

/** 按 order 排行：不在 order 里的行接在最后、保持原来的先后。 */
export function applyRowOrder<Row>(rows: readonly Row[], rowId: (row: Row) => string, order: readonly string[]): Row[] {
  const rank = new Map(order.map((id, i) => [id, i]))
  return rows
    .map((row, i) => ({ row, key: rank.get(rowId(row)) ?? order.length + i }))
    .toSorted((a, b) => a.key - b.key)
    .map((entry) => entry.row)
}

/**
 * 只挪了看得见的一部分行（过滤中）：把新次序填回整份次序里这些行原来的位置，藏起来的行不动。
 * full 里没有的行接在最后。
 */
export function mergeVisibleOrder(full: readonly string[], visibleNext: readonly string[]): string[] {
  const visible = new Set(visibleNext)
  const known = new Set(full)
  let at = 0
  const merged = full.map((id) => (visible.has(id) ? visibleNext[at++] : id))
  return [...merged, ...visibleNext.filter((id) => !known.has(id))]
}

/** 每一节有哪些行（按 order 的先后）：标题之后、下一个标题之前的行属于这一节；第一个标题之前的行不在任何节里。 */
export function sectionMembers(order: readonly string[], isSection: IsSection): Map<string, string[]> {
  const out = new Map<string, string[]>()
  let current: string[] | null = null
  for (const id of order) {
    if (isSection(id)) out.set(id, (current = []))
    else current?.push(id)
  }
  return out
}

/**
 * 按列排序时分节不动（#87 第 1 条）：标题行留在手动次序里的位置，每节里的行（与第一个标题之前没分节的行）按 sorted 的先后。
 * 表格按列排序时标题行也被当成数据排了进去；这里按 order 认出每行属于哪一节，再在节内按 sorted 排。
 */
export function sortWithinSections(
  order: readonly string[],
  sorted: readonly string[],
  isSection: IsSection,
): string[] {
  const rank = new Map(sorted.map((id, i) => [id, i]))
  const byRank = (a: string, b: string) => (rank.get(a) ?? Infinity) - (rank.get(b) ?? Infinity)
  const firstSection = order.findIndex((id) => isSection(id))
  const lead = (firstSection < 0 ? order : order.slice(0, firstSection)).toSorted(byRank)
  const members = sectionMembers(order, isSection)
  return [...lead, ...[...members].flatMap(([section, ids]) => [section, ...ids.toSorted(byRank)])]
}

/**
 * 收起的节挪完后放回藏着的行（#87 第 1 条）：visibleNext 是只含看得见的行的新次序，收起的节在里面只有标题；
 * 把它们的行（取自挪动前的 full）接在标题后面，跟着标题走，不落进别的节。挪进收起节的行接在这一节已有的行后面。
 */
export function restoreCollapsed(
  visibleNext: readonly string[],
  full: readonly string[],
  collapsed: ReadonlySet<string>,
  isSection: IsSection,
): string[] {
  if (collapsed.size === 0) return [...visibleNext]
  const members = sectionMembers(full, isSection)
  return visibleNext.flatMap((id) => (isSection(id) && collapsed.has(id) ? [id, ...(members.get(id) ?? [])] : [id]))
}

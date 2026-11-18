// SPDX-License-Identifier: MIT
/**
 * Data types and the flattening of ReasonGroupList.
 * 涨停原因分组（#11）的数据形状与纯函数：分组摊成表格行（组头一行、展开时跟着组内个股），按原因筛选，组头的家数与最高板。
 * 分组的次序、组内个股的次序都照调用方给的，不重排；哪只票归哪个原因也由调用方定。
 */

/** One limit-up stock under a reason. 一只涨停股。 */
export type ReasonStock = {
  code: string
  name: string
  /** Consecutive limit-up count (1 is the first board). 连板数，首板是 1。 */
  board: number
  /** Change, already a percentage (10 means +10%). 涨跌幅，百分数。 */
  change: number
  /** First seal time, formatted by the caller (「09:31」). 首次封板时刻。 */
  firstSeal?: string
  /** Seal order amount. 封单额。 */
  sealAmount?: number
  /** Turnover amount. 成交额。 */
  turnover?: number
  /** Extra reason tags shown in the last column. 别的原因标签。 */
  tags?: readonly string[]
  /** Logo image URL; letters without it. 徽标图片地址。 */
  logo?: string
}

/** One reason with its stocks. 一个原因与它下面的票。 */
export type ReasonGroup = {
  id: string
  reason: string
  items: readonly ReasonStock[]
}

/** A table row: a group head or a stock in a group. 表格的一行：组头或组内的票。 */
export type ReasonRow =
  | { kind: 'group'; id: string; group: ReasonGroup; highest: number; collapsed: boolean }
  | { kind: 'stock'; id: string; group: ReasonGroup; stock: ReasonStock }

/** Highest board in a group (0 when empty). 组内最高板。 */
export const highestBoard = (group: ReasonGroup): number => group.items.reduce((m, item) => Math.max(m, item.board), 0)

/** Groups kept by the filter (empty filter keeps all), flattened to rows; collapsed groups keep only their head. */
export function reasonRows(
  groups: readonly ReasonGroup[],
  filter: readonly string[],
  collapsed: ReadonlySet<string>,
): ReasonRow[] {
  const kept = filter.length === 0 ? groups : groups.filter((group) => filter.includes(group.id))
  return kept.flatMap((group): ReasonRow[] => {
    const shut = collapsed.has(group.id)
    const head: ReasonRow = { kind: 'group', id: `g:${group.id}`, group, highest: highestBoard(group), collapsed: shut }
    if (shut) return [head]
    return [
      head,
      ...group.items.map((stock): ReasonRow => ({ kind: 'stock', id: `s:${group.id}:${stock.code}`, group, stock })),
    ]
  })
}

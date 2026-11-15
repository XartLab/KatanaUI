// SPDX-License-Identifier: MIT
// 过滤条（FilterBar）的纯函数：条件怎么匹配、怎么写成一句话、字段怎么分组搜索。字段与运算符由调用方定义，这里只认几个约定的运算符名：
// gt、gte、lt、lte、eq、neq、between（值写成「下限..上限」）、contains、in（值是逗号分隔的列表）；别的运算符名调用方自己匹配。

export type FilterOperator = { value: string; label: string }

/** 预设条件：主文字 + 灰色副标题（TradingView 选股器过滤浮层的预设列表，主会话 2026-11-15 实测）。 */
export type FilterPreset = { key: string; label: string; hint?: string; op: string; value: string }

export type FilterField = {
  key: string
  label: string
  /** 「+」浮层里的分组名；不给归到末尾的未分组。 */
  group?: string
  /** 值怎么输入：number / text。默认 number。 */
  input?: 'number' | 'text'
  operators: readonly FilterOperator[]
  presets?: readonly FilterPreset[]
  /** 一开始就在过滤条上。 */
  shown?: boolean
}

export type FilterCondition = {
  id: string
  field: string
  op: string
  value: string
  /** 来自预设时的名字，芯片上写它；手动设的写「运算符 值」。 */
  label?: string
}

export function matchCondition(
  condition: Pick<FilterCondition, 'op' | 'value'>,
  cell: number | string | null | undefined,
): boolean {
  if (cell === null || cell === undefined) return false
  const { op, value } = condition
  if (op === 'contains') return String(cell).toLowerCase().includes(value.toLowerCase())
  if (op === 'in')
    return value
      .split(',')
      .map((v) => v.trim())
      .includes(String(cell))
  if (op === 'between') {
    const [lo, hi] = value.split('..').map(Number)
    const n = Number(cell)
    return Number.isFinite(n) && n >= (lo ?? -Infinity) && n <= (hi ?? Infinity)
  }
  if (op === 'eq') return String(cell) === value
  if (op === 'neq') return String(cell) !== value
  const n = Number(cell)
  const v = Number(value)
  if (!Number.isFinite(n) || !Number.isFinite(v)) return false
  if (op === 'gt') return n > v
  if (op === 'gte') return n >= v
  if (op === 'lt') return n < v
  if (op === 'lte') return n <= v
  return true
}

/** 所有条件都满足（条件之间是「且」）；同一字段的多条也是且。getCell 按字段键取这一行的值。 */
export function applyFilters<Row>(
  rows: readonly Row[],
  conditions: readonly FilterCondition[],
  getCell: (row: Row, field: string) => number | string | null | undefined,
): Row[] {
  if (conditions.length === 0) return [...rows]
  return rows.filter((row) => conditions.every((c) => matchCondition(c, getCell(row, c.field))))
}

/** 芯片上写的一句话：预设写它的名字，手动的写「运算符 值」。 */
export function conditionText(condition: FilterCondition, field: FilterField): string {
  if (condition.label) return condition.label
  const op = field.operators.find((o) => o.value === condition.op)?.label ?? condition.op
  return `${op} ${condition.value}`
}

/** 字段按分组归拢（保持字段次序，组按首次出现的次序），可按关键词搜（字段名，不分大小写）。 */
export function groupFields(
  fields: readonly FilterField[],
  query: string,
  otherGroup: string,
): { group: string; fields: FilterField[] }[] {
  const needle = query.trim().toLowerCase()
  const groups = new Map<string, FilterField[]>()
  for (const field of fields) {
    if (needle && !field.label.toLowerCase().includes(needle)) continue
    const key = field.group ?? otherGroup
    groups.set(key, [...(groups.get(key) ?? []), field])
  }
  return [...groups].map(([group, list]) => ({ group, fields: list }))
}

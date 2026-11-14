// SPDX-License-Identifier: MIT
// 列摆法的纯函数（#27）：列头菜单、拖动重排、ColumnPicker 共用。layout 的次序就是显示次序，不在 visible 里的列只是藏起来、仍占着次序。
import type { GridColumnLayout } from './data-grid.tsx'

type Layout = readonly GridColumnLayout[]

const indexOf = (layout: Layout, id: string) => layout.findIndex((column) => column.id === id)

/** 把 from 列拖到 to 列的位置（to 原来的位置让给它）。 */
export function reorderColumn(layout: Layout, from: string, to: string): GridColumnLayout[] {
  const a = indexOf(layout, from)
  const b = indexOf(layout, to)
  if (a < 0 || b < 0 || a === b) return [...layout]
  const next = [...layout]
  const [moved] = next.splice(a, 1)
  next.splice(b, 0, moved)
  return next
}

/** 左移 / 右移一格：跳过藏起来的列，跟看得见的邻居换位；到头不动。 */
export function moveColumn(layout: Layout, id: string, direction: -1 | 1): GridColumnLayout[] {
  const at = indexOf(layout, id)
  if (at < 0) return [...layout]
  for (let i = at + direction; i >= 0 && i < layout.length; i += direction) {
    if (layout[i].visible) return reorderColumn(layout, id, layout[i].id)
  }
  return [...layout]
}

/** 显示或隐藏；最后一列看得见的不许藏（表不能空得没有列头可点）。 */
export function setColumnVisible(layout: Layout, id: string, visible: boolean): GridColumnLayout[] {
  if (!visible && layout.filter((column) => column.visible).length <= 1) return [...layout]
  return layout.map((column) => (column.id === id ? { ...column, visible } : column))
}

/** 固定到左边或取消：固定的列挨着排在最前面（粘在左边的列要连着），取消的回到固定列之后。 */
export function setColumnFixed(layout: Layout, id: string, fixed: boolean): GridColumnLayout[] {
  const target = layout.find((column) => column.id === id)
  if (!target) return [...layout]
  const rest = layout.filter((column) => column.id !== id)
  const pinned = rest.filter((column) => column.fixed).length
  const next = [...rest]
  next.splice(pinned, 0, { ...target, fixed })
  return next
}

/** 套用一个列集：集里的列显示并按集的次序排在最前，其余的藏起来、保持原次序排在后面。集里不认识的 id 忽略。 */
export function applyColumnSet(layout: Layout, columns: readonly string[]): GridColumnLayout[] {
  const known = columns.filter((id) => indexOf(layout, id) >= 0)
  const inSet = known.map((id) => ({ ...layout[indexOf(layout, id)], visible: true }))
  const others = layout.filter((column) => !known.includes(column.id)).map((column) => ({ ...column, visible: false }))
  return [...inSet, ...others]
}

/** 现在看得见的列恰好等于某个列集（不看次序）时返回它的 id。 */
export function activeColumnSet(
  layout: Layout,
  sets: readonly { id: string; columns: readonly string[] }[],
): string | undefined {
  const shown = layout.filter((column) => column.visible).map((column) => column.id)
  return sets.find((set) => set.columns.length === shown.length && set.columns.every((id) => shown.includes(id)))?.id
}

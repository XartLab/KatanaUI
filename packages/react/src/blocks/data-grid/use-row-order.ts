// SPDX-License-Identifier: MIT
/**
 * Manual row order for DataGrid: controlled or uncontrolled, normalized against the current rows.
 * DataGrid 的手动行序（#77 G7）：受控（value / onValueChange）或不受控（defaultValue）；次序总对着现在的行（不在的去掉、新来的接最后）。
 * 把返回的 gridProps 摊到 DataGrid 上，表就能拖行、Alt+↑/↓ 挪行、右键上移下移；要存盘就把 value 接到 usePersistedState。
 */
import { useState } from 'react'
import { moveRows, moveRowsBy, normalizeOrder, type IsSection } from './row-order-model.ts'

export type UseRowOrderOptions = {
  /** 现在所有行的 id（按数据源的先后）。 */
  ids: readonly string[]
  /** 受控的次序；给了它，挪动只经 onValueChange 通知。 */
  value?: readonly string[]
  /** 不受控时的初始次序；省略是 ids 的先后。 */
  defaultValue?: readonly string[]
  onValueChange?: (next: string[]) => void
  /** 分节标题行：拖它带着整节走。 */
  isSection?: IsSection
}

export type RowOrder = {
  /** 对着现在的行整理过的次序。 */
  order: string[]
  /** 把几行挪到 before 之前（null 是最后）。 */
  move: (ids: readonly string[], before: string | null) => void
  /** 上下挪一格。 */
  moveBy: (ids: readonly string[], delta: -1 | 1) => void
  /** 回到 ids 的先后。 */
  reset: () => void
  /** 摊到 DataGrid 上的两个 prop。 */
  gridProps: { rowOrder: string[]; onRowOrderChange: (next: string[]) => void }
}

export function useRowOrder({ ids, value, defaultValue, onValueChange, isSection }: UseRowOrderOptions): RowOrder {
  const [own, setOwn] = useState<readonly string[] | undefined>(defaultValue)
  const order = normalizeOrder(value ?? own, ids)
  const set = (next: string[]) => {
    if (value === undefined) setOwn(next)
    onValueChange?.(next)
  }
  return {
    order,
    move: (moving, before) => set(moveRows(order, moving, before, isSection)),
    moveBy: (moving, delta) => set(moveRowsBy(order, moving, delta, isSection)),
    reset: () => set([...ids]),
    gridProps: { rowOrder: order, onRowOrderChange: set },
  }
}

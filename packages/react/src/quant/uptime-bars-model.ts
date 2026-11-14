// SPDX-License-Identifier: MIT
// UptimeBars 的纯逻辑：可用率与键盘移动。功能参照 Arc Uptime status（uiarc.dev，2026-11-14 读），实现原创。

export type UptimeStatus = 'up' | 'degraded' | 'down' | 'none'

export type UptimeCell = {
  id: string
  status: UptimeStatus
  /** 整句，读屏与悬停读数都用它（日期 / 小时、状态、断流次数由调用方按界面语言写）。 */
  label: string
}

/** 可用格（up）占有数据的格的比例（0 到 1）；degraded 与 down 都不算可用，不另给权重；没有数据的格（none）不进分母；全是 none 返回 null。 */
export function uptimeShare(cells: readonly UptimeCell[]): number | null {
  let known = 0
  let up = 0
  for (const cell of cells) {
    if (cell.status === 'none') continue
    known++
    if (cell.status === 'up') up++
  }
  return known === 0 ? null : up / known
}

/** 每种状态有几格（给状态灯加词那一行写个数）。 */
export function countStatuses(cells: readonly UptimeCell[]): Record<UptimeStatus, number> {
  const out: Record<UptimeStatus, number> = { up: 0, degraded: 0, down: 0, none: 0 }
  for (const cell of cells) out[cell.status]++
  return out
}

/** 左右键、Home、End 之后焦点去哪一格；到头不绕回（同 APG 的 listbox 习惯）；其他键返回 null。 */
export function moveCell(index: number, key: string, count: number): number | null {
  if (count <= 0) return null
  switch (key) {
    case 'ArrowLeft':
      return Math.max(0, index - 1)
    case 'ArrowRight':
      return Math.min(count - 1, index + 1)
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

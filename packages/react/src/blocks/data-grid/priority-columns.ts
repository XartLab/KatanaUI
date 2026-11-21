// SPDX-License-Identifier: MIT
// 列优先级（#122）：容器放不下全部可见列时，按优先级从低到高收起，直到放得下；收起只影响显示，不改 layout，复制与导出不看它。
// 做法照响应式表格的「列优先级」（Filament Group 的 Responsive Tables 列切换模式：每列标优先级，窄了先收低的，出处页待核对）。
// 本文件只有纯函数，量宽度与画胶囊在 data-grid.tsx。

/** 至少留几列：名称加一个主数（跟 compact 分量没标 compact 时留的列数一致，#117）。 */
export const MIN_KEPT_COLUMNS = 2

/**
 * 胶囊（「+N 列」按钮，加上它旁边的 headEnd）还没量到时预留的宽度（px），只管第一帧；量到以后用真实宽度（data-grid.tsx 的 toggleBox）。
 * 依据：2026-11-22 在文档站 DataGrid 页（Graphite、default 密度、Chromium）实测盒宽：「+5 cols」58、「+99 cols」与「Collapse」65；
 * 取 65 向上取整到 4 的倍数。没有 headEnd 的情形；带 headEnd 的表第一帧可能差一帧，量到后自己修正。
 */
export const COLUMNS_TOGGLE_RESERVE = 68

export type PriorityColumn = {
  id: string
  /** 这一列的宽度（px）：layout 里的 width。 */
  width: number
  /** 优先级：1 最高，数大的先收。 */
  priority: number
  /** 固定在左边的列不收（用户明确钉住的）。 */
  fixed?: boolean
}

export type PriorityFit = {
  /** 留下的列 id。 */
  kept: ReadonlySet<string>
  /** 收起的列数；0 是放得下，不出胶囊。 */
  hidden: number
}

/** 列声明的优先级：写了用写的，没写按声明顺序递增（第一列 1、第二列 2……），所以名称与主数默认最先保留。 */
export const priorityOf = (declared: number | undefined, index: number): number => declared ?? index + 1

/**
 * 在 available 宽度里按优先级留列。`columns` 是按显示次序排好的可见列。
 * 全部放得下就全留；放不下时给胶囊让出 reserve，再从优先级最低的列开始收（同级的先收显示次序靠后的），
 * 收到放得下、或只剩 MIN_KEPT_COLUMNS 列（固定列也算留着的）为止。available 不是正数（还没量到）当放得下。
 */
export function fitPriorityColumns(
  columns: readonly PriorityColumn[],
  available: number,
  reserve: number,
): PriorityFit {
  const all = new Set(columns.map((column) => column.id))
  const total = columns.reduce((sum, column) => sum + column.width, 0)
  if (available <= 0 || total <= available) return { kept: all, hidden: 0 }
  const budget = available - reserve
  const order = columns
    .map((column, at) => ({ column, at }))
    .filter(({ column }) => !column.fixed)
    .sort((a, b) => b.column.priority - a.column.priority || b.at - a.at)
  const kept = new Set(all)
  let width = total
  for (const { column } of order) {
    if (width <= budget || kept.size <= MIN_KEPT_COLUMNS) break
    kept.delete(column.id)
    width -= column.width
  }
  return { kept, hidden: all.size - kept.size }
}

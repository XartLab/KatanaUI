// SPDX-License-Identifier: MIT
import { createContext, useContext, type KeyboardEvent, type ReactNode } from 'react'

// DataGridHost：表要用、但属于宿主应用的能力经这个 context 注入（#1869）：快捷键表、文案、右键菜单怎么画、「问 Agent」。
// 没有 Provider 时表照常能用：能点、能排序、能键盘选行，只是没有快捷键，右键菜单里没有标准项（复制、导出、重置列）。
// 包里不带语言：所有文案经 labels 传（旧名 texts 留一个版本）；菜单项与快捷键提示都是宿主给的字。

/** 表自己有的几个动作；快捷键是宿主的键位表定。 */
export type GridAction = 'copy' | 'save' | 'resetColumns' | 'contextMenu' | 'askAgent'

/** 右键菜单的一项；形状是宿主菜单项的子集（宿主的菜单项类型多出来的字段直接忽略）。 */
export type GridMenuEntry =
  | {
      type: 'item'
      label: string
      /** 快捷键的字（已经写好的，例：Ctrl+C）。 */
      keys?: string
      hint?: string
      /** 名字前的图标（行快捷操作的项带它）。 */
      icon?: ReactNode
      checked?: boolean
      disabled?: boolean
      onSelect: () => void
    }
  | {
      type: 'submenu'
      label: string
      entries: readonly GridMenuEntry[]
      keys?: string
      checked?: boolean
      onSelect?: () => void
    }
  | { type: 'separator' }

/** Menu item texts and accessible names of DataGrid. */
export type DataGridLabels = {
  /** 菜单项。三项都给了，菜单里才有标准项。 */
  copy: string
  save: string
  resetColumns: string
  /** 「问 Agent」菜单项；没给就没有这一项。 */
  askAgent?: string
  /** 屏幕阅读器念的表名：label 是调用方给的表名；宿主可以在后面接上操作提示（上下键挑一行、快捷键）。 */
  gridLabel: (label: string) => string
  menuLabel: (label: string) => string
  /** compact 分量只留前几行时，表下面写没显示的行数：「另有 7 行」（不静默截断）。 */
  moreRows: (hidden: number) => string
  /** 列放不下被收起时，表头右端胶囊上的字：「+4 列」（不静默截断，#122）；点开显示全部列后胶囊写 collapseColumns。 */
  moreColumns: (hidden: number) => string
  /** 全部列展开（横向滚动）后，胶囊上的字：点了回到收起。 */
  collapseColumns: string
  /** 行快捷操作按钮条的名字（屏幕阅读器念）。 */
  rowActions: string
  sortTitle: (column: { id: string; label: string }) => string
  resizeLabel: (column: { id: string; label: string }) => string
  /** 选了几行（多于一行时读出来）；给对象而不是数，宿主的复数写法好跟原来的文案对上。 */
  selectedRows: (selected: { size: number }) => string
  /** 挪行（#77 G7）：右键菜单的四项与读屏播报；可省，省略用英文默认。 */
  rowOrder?: {
    moveUp?: string
    moveDown?: string
    moveTop?: string
    moveBottom?: string
    /** 按列排序时为什么不能挪（Alt+↑/↓ 读出、菜单项的提示）。 */
    sorted?: string
    /** 挪完读出新位置。 */
    moved?: (info: { count: number; position: number; total: number }) => string
    /** 拖到一半按 Esc。 */
    cancelled?: string
  }
  /** 分节标题行上收起 / 展开钮的读屏名（#87）；可省，省略用英文默认。 */
  sections?: {
    collapse?: string
    expand?: string
  }
  /** 列头右键菜单的项（#27）。 */
  columnMenu: {
    sortAsc: string
    sortDesc: string
    clearSort: string
    pin: string
    unpin: string
    hide: string
    moveLeft: string
    moveRight: string
    /** 「适应内容」：这一列宽度设成列头与数据里最宽的字（可省，省略用英文默认）。 */
    fitContent?: string
    /** 「全部列适应内容」（可省，省略用英文默认）。 */
    fitAll?: string
    /** 菜单的读屏名。 */
    label: (column: { id: string; label: string }) => string
  }
}

export type DataGridHost = {
  /**
   * Which table action a key press stands for; null if none. The key map lives in the host.
   * 这次按键对应表的哪个动作；null 不是。键位表在宿主，用户改过键就是改过的。
   */
  matchKey?: (event: KeyboardEvent<HTMLElement>) => GridAction | null
  /**
   * How an action's shortcut is written (shown at the right of menu items and in the table name).
   * 动作的快捷键写法（菜单项右边的字、表名里的提示）。
   */
  keysOf?: (action: GridAction) => string | undefined
  /**
   * Texts of the menu items and accessible names; the standard menu items appear only when copy, save and resetColumns are all given.
   */
  labels?: Partial<DataGridLabels>
  /**
   * Old name of labels.
   * @deprecated Use `labels`; kept for one version.
   */
  texts?: Partial<DataGridLabels>
  /**
   * What to draw in the menu: use it when the host's items go beyond GridMenuEntry; by default the package draws item, submenu and separator.
   * 菜单里画什么：宿主的菜单项比 GridMenuEntry 多（收藏星、自带内容的二级……）时自己画；省略时包里画 item / submenu / separator。
   */
  renderMenu?: (entries: readonly GridMenuEntry[]) => ReactNode
  /**
   * Ask the agent: when given together with askText, rows get a context menu item and the key works while the table is focused. null text only opens the panel.
   * 「问 Agent」：给了它，调用方又给了 askText，行的右键菜单多一项，表获得焦点时按键也一样。text 为 null 只打开对话面板。
   */
  askAgent?: (text: string | null) => void
}

/** @deprecated Renamed to `DataGridLabels`; kept for one version. */
export type DataGridTexts = DataGridLabels

const Context = createContext<DataGridHost | undefined>(undefined)

export const DataGridHostProvider = Context.Provider

export const useDataGridHost = (): DataGridHost | undefined => useContext(Context)

/** 没有宿主文案时的英文（表头提示这类不能空）。 */
export const DEFAULT_LABELS: Omit<
  DataGridLabels,
  'copy' | 'save' | 'resetColumns' | 'columnMenu' | 'rowOrder' | 'sections'
> & {
  columnMenu: Required<DataGridLabels['columnMenu']>
  rowOrder: Required<NonNullable<DataGridLabels['rowOrder']>>
  sections: Required<NonNullable<DataGridLabels['sections']>>
} = {
  gridLabel: (label) => label,
  menuLabel: (label) => `${label} menu`,
  rowActions: 'Row actions',
  moreRows: (hidden) => `${hidden} more rows`,
  moreColumns: (hidden) => `+${hidden} cols`,
  collapseColumns: 'Collapse',
  sortTitle: (column) => `${column.label}: click to sort, again to reverse`,
  resizeLabel: (column) => `Resize column ${column.label}`,
  selectedRows: (selected) => `${selected.size} rows selected`,
  rowOrder: {
    moveUp: 'Move up',
    moveDown: 'Move down',
    moveTop: 'Move to top',
    moveBottom: 'Move to bottom',
    sorted: 'Clear the column sort to reorder rows',
    moved: ({ count, position, total }) =>
      `${count > 1 ? `${count} rows moved` : 'Moved'} to position ${position} of ${total}`,
    cancelled: 'Move cancelled',
  },
  sections: { collapse: 'Collapse section', expand: 'Expand section' },
  columnMenu: {
    sortAsc: 'Sort ascending',
    sortDesc: 'Sort descending',
    clearSort: 'Clear sort',
    pin: 'Pin to left',
    unpin: 'Unpin',
    hide: 'Hide column',
    moveLeft: 'Move left',
    moveRight: 'Move right',
    fitContent: 'Fit column to content',
    fitAll: 'Fit all columns to content',
    label: (column) => `${column.label} column menu`,
  },
}

/** 宿主文案与默认英文合起来；columnMenu 逐键合并：宿主只翻旧的几项时，新加的「适应内容」仍有默认英文。 */
export function resolveLabels(host: DataGridHost | undefined) {
  const given = host?.labels ?? host?.texts
  return {
    ...DEFAULT_LABELS,
    ...given,
    columnMenu: { ...DEFAULT_LABELS.columnMenu, ...given?.columnMenu },
    rowOrder: { ...DEFAULT_LABELS.rowOrder, ...given?.rowOrder },
    sections: { ...DEFAULT_LABELS.sections, ...given?.sections },
  }
}

/** DataGrid 里用的整份文案（标准菜单三项仍可能缺）。 */
export type ResolvedGridLabels = ReturnType<typeof resolveLabels>

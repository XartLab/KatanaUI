// SPDX-License-Identifier: MIT
/**
 * Props and layout types of DataGrid.
 * DataGrid 的 props 与列摆法类型（体检 §7：data-grid.tsx 拆分，类型单放一个文件）。
 */
import type { ReactNode } from 'react'
import type { RowAction } from '../../quotes/row-actions.tsx'
import type { GridColumn } from './columns.ts'
import type { GridSummary } from './grid-summary-row.tsx'
import type { GridMenuEntry } from './host.tsx'
import type { SortSpec } from './model.ts'

/** 一列在这张表里的摆法：次序就是显示次序；不在里面的列不画。 */
export type GridColumnLayout = {
  id: string
  /** 表头上的字（宿主按界面语言翻好的）。 */
  label: string
  width: number
  visible: boolean
  /** 省略时按列类型：数字类靠右，别的靠左。 */
  align?: 'start' | 'end'
  /** 横向滚动时粘在左边（#248）。 */
  fixed?: boolean
  /** 表头第二行的小字（口径：TTM、TTM YoY；或总数）；有任何一列给了，表头加高到放得下两行（照 TradingView 选股器，主会话 2026-11-15 实测）。 */
  sub?: string
}

/**
 * 行高档：compact 20、default 24、relaxed 32、comfortable 40（像素）。
 * comfortable（#90，照 TradingView 选股器）给整页的表（选股器、持仓、报告）：格内左右 12、首列左 20、正文 14px、表头 13px、行间横线；
 * compact / default 留给面板里的密表（自选栏、盘口），三档原值不变（KATANAview 在用）。
 */
export type GridDensity = 'compact' | 'default' | 'relaxed' | 'comfortable'
/** 各档行高（像素）。 */
export const ROW_HEIGHTS: Readonly<Record<GridDensity, number>> = {
  compact: 20,
  default: 24,
  relaxed: 32,
  comfortable: 40,
}
/** 各档表头高（像素）；有列带 sub 时再加 HEAD_SUB_EXTRA。 */
export const HEAD_HEIGHTS: Readonly<Record<GridDensity, number>> = {
  compact: 22,
  default: 26,
  relaxed: 30,
  comfortable: 48,
}
/** 有列带 sub（表头第二行）时表头加高多少；comfortable 的 48 本来就放得下两行 13px。 */
export const HEAD_SUB_EXTRA: Readonly<Record<GridDensity, number>> = {
  compact: 14,
  default: 14,
  relaxed: 14,
  comfortable: 0,
}
/** 拖宽与适应内容的最小列宽（像素）。 */
export const MIN_WIDTH = 24

/** 外层各部分额外挂的类名（宿主给自己的样式与测试留钩子）。 */
export type GridSlot =
  | 'root'
  | 'grid'
  | 'scroll'
  | 'inner'
  | 'head'
  | 'col'
  | 'rows'
  | 'row'
  | 'cell'
  | 'subrow'
  | 'foot'

/** `rowProps` 能给一行加的属性：类名、悬停提示、data-*（测试与样式的钩子）、aria-*。 */
export type GridRowProps = {
  className?: string
  title?: string
  [attribute: `data-${string}`]: string | number | boolean | undefined
  [attribute: `aria-${string}`]: string | number | boolean | undefined
}

export type DataGridProps<Row extends object> = {
  /**
   * Column definitions, a module-level constant (column objects must be stable).
   * 列的定义，模块级常量（表里的列对象要稳定）。
   */
  columns: readonly GridColumn<Row>[]
  /**
   * How the columns are laid out: order, visibility, width and header text; stored by the caller.
   * 列怎么摆：次序、显隐、宽度、表头的字。调用方存。
   */
  layout: readonly GridColumnLayout[]
  /** The rows. */
  rows: readonly Row[]
  /** Returns the stable id of a row. */
  rowId: (row: Row) => string
  /**
   * Table name read by screen readers.
   * 屏幕阅读器念的表名。
   */
  label: string
  /**
   * Current sort; omit for unsorted.
   * 现在的排序；省略是不排。
   */
  sort?: SortSpec | null
  /**
   * Without it sorting is off and headers are plain text, not buttons.
   * 没给就不能排序：表头是普通的字，不是按钮。
   */
  onSortChange?: (next: SortSpec | null) => void
  /**
   * When false the third click goes back to ascending (a table with a default sort cannot be unsorted).
   * 点到第三下回到不排；false 时回到正序（有默认排序的表不允许「不排」）。
   */
  sortRemovable?: boolean
  /**
   * Layout changed (column menu pin / hide / move, header drag reorder): gets the whole new layout; the caller stores it.
   * Without it those menu items are absent and headers cannot be dragged.
   * 列摆法变了（列头菜单的固定 / 隐藏 / 左右移、拖动列头重排）：给出新的整份 layout，调用方存。
   * 没给就没有这些菜单项，列头也不能拖。
   */
  onLayoutChange?: (next: GridColumnLayout[]) => void
  /**
   * Called after a column width drag; without it there are no drag handles and no reset-columns item.
   * 拖完列宽。
   */
  onResize?: (id: string, width: number) => void
  /**
   * Reset columns (menu item and shortcut): the caller puts order, visibility, width and sort back to defaults.
   * 重置列（菜单项与快捷键）：调用方把次序、显隐、宽度、排序放回默认。
   */
  onResetColumns?: () => void
  /**
   * What a plain click on a row does.
   * 点一行（不带修饰键）做的事。
   */
  onOpen?: (row: Row) => void
  /**
   * Row to put keyboard focus back on when returning from a detail view (WCAG 2.4.3); only works at mount.
   * 从详情返回时把键盘所在的行放回它（WCAG 2.4.3）；只在挂上来那一刻管用。
   */
  restoreRow?: string | null
  /**
   * Whether a row is the one currently open (an accent stripe on its left).
   * 正开着的那一行（左边一道强调色）。
   */
  isOpened?: (row: Row) => boolean
  /** Extra class name for a row. */
  rowClass?: (row: Row) => string | undefined
  /**
   * Row quick actions (usually the result of symbolMenu(...)): hovering or keyboard-focusing a row floats the first few icon buttons at its right end; the whole list also leads the context menu when it opens on a single row.
   * 行快捷操作（#23，一般传 symbolMenu(...) 的结果）：悬停这一行或键盘落到这一行时，行右端浮出前几颗带图标的按钮；右键整份进菜单最前面，只在右键落在单独一行时出现。
   */
  rowActions?: (row: Row) => readonly RowAction[]
  /**
   * Extra attributes for a row (class name, tooltip, data-*, aria-*), so state and test hooks need no wrapper.
   * 给一行加属性（类名、悬停提示、data-*、aria-*）：状态、测试钩子这类行上的东西从这里来，不用包一层。
   */
  rowProps?: (row: Row) => GridRowProps | undefined
  /**
   * Expandable detail row spanning the full width; return null, undefined or false for a row without one. The grid reads as an ARIA treegrid: rows with a detail row carry aria-expanded, and the focused row expands with ArrowRight and collapses with ArrowLeft.
   * 可展开的子行（跨满整行宽，高度跟着内容走）：返回要画的内容；返回 null / undefined / false 是这一行没有子行。
   * 表按 ARIA treegrid 读：有子行的行带 aria-expanded，键盘所在的行按 → 展开、← 收起（WAI-ARIA APG 的 Treegrid 键位）。
   */
  renderSubRow?: (row: Row) => ReactNode
  /**
   * Expanded row ids (controlled); when given, expanding and collapsing only notify through onExpandedChange.
   * 展开的行 id（受控）；给了它，展开收起只经 onExpandedChange 通知调用方，表自己不记。
   */
  expanded?: ReadonlySet<string>
  /** Called when a row is expanded or collapsed. */
  onExpandedChange?: (id: string, expanded: boolean) => void
  /**
   * Uncontrolled: whether a row the user has not toggled starts expanded; omit for collapsed.
   * 不受控时，一行没被用户展开或收起过的话是不是展开（待生效的提示默认摊开）。省略是收起。
   */
  defaultExpanded?: (row: Row) => boolean
  /**
   * Items appended after the standard ones in the context menu, acting on the selected rows.
   * 右键菜单里标准项之后追加的项，对选中的行生效。
   */
  menu?: (rows: Row[]) => readonly GridMenuEntry[]
  /**
   * Put the items from menu before the standard ones (copy, export, reset columns) instead of after.
   * 默认标准项（复制、导出、重置列）在前，menu 的项在后；设 true 反过来（照 TradingView：表自己的操作在前、表格工具垫底）。
   */
  extrasFirst?: boolean
  /**
   * Items placed after the standard ones when extrasFirst is set.
   * extrasFirst 时垫在标准项后面的项。
   */
  menuTail?: () => readonly GridMenuEntry[]
  /**
   * Items added to the menu when the click lands on empty space.
   * 点在空白处时菜单里追加的项。
   */
  panelMenu?: () => readonly GridMenuEntry[]
  /**
   * Gray text at the bottom of the context menu for a row (an id, say).
   * 右键菜单底部的灰字（交易表的 Id、Exec id）。
   */
  rowInfo?: (row: Row) => string
  /**
   * Summary text of the selected rows for "Ask the agent" (null when there is nothing to write); needs askAgent from the host.
   * 「问 Agent」：把选中的行写成摘要文字（没有可写的返回 null）。要宿主提供 askAgent 才有这一项。
   */
  askText?: (rows: Row[]) => string | null
  /**
   * File name for the export, without extension.
   * 导出的文件名（不含扩展名）；宿主的 download 能力不在包里，导出由 onExport 接手。
   */
  exportName?: string
  /**
   * Called with the CSV text and file name; without it there is no export item.
   * 导出 CSV：包里算好文字与文件名，交给宿主存。没给就没有导出。
   */
  onExport?: (csv: string, fileName: string) => void
  /**
   * A line of text under the table.
   * 表下面的一行说明。
   */
  foot?: ReactNode
  /**
   * Summary rows at the foot (totals, averages): per-column aggregates over all rows, on the same column template and pinned columns; they stick to the bottom while scrolling.
   * 表尾合计 / 均值行（#77）：按列配聚合，对全部行算，跟表同一份列宽与固定列，滚动时粘在底边。
   */
  summary?: readonly GridSummary<Row>[]
  /**
   * Rows are already sorted by the caller (group rows with children): the header still shows the sort marker but the table does not sort.
   * 行已经由调用方排好（分组行带子行）：表照样画表头的标记，但不再自己排。
   */
  presorted?: boolean
  /**
   * Tree rows: the table reads as an ARIA treegrid and rows carry aria-level and aria-expanded.
   * 树形行：表按 ARIA treegrid 读，行带 aria-level 与 aria-expanded。
   */
  rowTree?: (row: Row) => { level: number; expanded?: boolean }
  /**
   * Time zone of time columns: 'local' (default), 'utc' or an IANA name.
   * time 列的时区：'local'（默认）、'utc'、IANA 名。
   */
  timeZone?: string
  /**
   * Locale for sorting text columns (Intl.Collator); follows the runtime when omitted.
   * 文字列排序的语言（Intl.Collator）；省略跟运行环境。
   */
  sortLocale?: string
  /**
   * Priority columns (default true): at standard and hero emphasis, when the visible columns do not fit the container, the lowest-priority
   * columns (GridColumn.priority; undeclared ones count up in declaration order) are collapsed and a "+N cols" capsule appears at the right end
   * of the header; clicking it switches to horizontal scrolling with every column. Display only: copy and export still take all visible columns.
   * The header and the rows leave the capsule's width free at the right end, so it never covers the last column (with `stretch` the kept columns fill the container minus the capsule).
   * Needs a header; at least two columns stay. false keeps plain horizontal scrolling.
   * 列优先级（默认 true，#122）：standard 与 hero 分量下，可见列放不下容器时按 GridColumn.priority 从低到高收起（没写的按声明顺序），
   * 表头右端出「+N 列」胶囊，点了切成横向滚动、显示全部列。胶囊出现时表头与数据行在右端让出它的宽度（#128），不盖住最后一列；stretch 的表，保留的列撑满的是容器宽减胶囊宽。
   * 只影响显示：复制与导出仍是全部可见列。要有表头；至少留两列。false 是一直横向滚动。
   */
  collapseColumns?: boolean
  /**
   * Container width in px for the priority columns; measured with a ResizeObserver when omitted.
   * Give it where the width is known and nothing can be measured (server rendering).
   * 列优先级用的容器宽度（像素）；省略时自己用 ResizeObserver 量。服务端渲染这类量不了、宽度又已知的地方给。
   */
  containerWidth?: number
  /**
   * Row height tier: compact, default, relaxed for dense panel tables; comfortable (40px rows, 14px text, ruled) for full-page tables.
   * 行高档：compact / default / relaxed 是面板里的密表；comfortable 是整页的表（行 40、正文 14px、默认画行间线）。
   */
  density?: GridDensity
  /**
   * Locale of compact numbers (K/M/B/T for en-US, CJK myriad units for zh-CN) and date columns; a column's format.locale wins. Defaults to en-US.
   * compact 缩写与 date 列用哪种语言（en-US 是 K/M/B/T，zh-CN 是 万/亿）；列的 format.locale 优先。省略是 en-US。
   */
  locale?: string
  /**
   * Do not draw the header (a two-column metrics table, say).
   * 不画表头（两列的指标表之类）。
   */
  hideHeader?: boolean
  /**
   * Extra content after the sort button in each column head (a search icon on the Symbol head, say): given per column id, null for none.
   * 列头里排序按钮后面的附加内容（例如 Symbol 列头上的搜索图标）：按列 id 给，没有返回 null。
   */
  headExtra?: (columnId: string) => ReactNode
  /**
   * Content at the far right of the header (the "+ add column" button, wired to ColumnPicker); floats over the header end and takes no column.
   * 表头最右端的内容（「+ 加列」按钮，接 ColumnPicker）；浮在表头右端，不占列。
   */
  headEnd?: ReactNode
  /**
   * Row height follows the content (multi-line cells, buttons in rows): the density height is a minimum and the measured height wins; cell text may wrap.
   * 行高跟着内容走（多行的格子、行里有按钮）：density 的行高是最小高度，量到的真实高度为准；格子里的字可以折行。
   */
  autoRowHeight?: boolean
  /**
   * Draw a thin rule between rows; on by default for density comfortable.
   * 行与行之间画一道细线；comfortable 默认画。
   */
  ruled?: boolean
  /**
   * When false, clicking a row neither selects nor opens it and there is no hover tint; only keyboard movement and expanding remain (for tables of mostly buttons). Default true.
   * false：点行不选、不打开，没有悬停底色，只留键盘移动与展开（行里主要是按钮的表）。默认 true。
   */
  selectable?: boolean
  /**
   * Interactive (default true): rows can be clicked, selected and moved with the keyboard, with a context menu. false is a read-only ARIA table.
   * 可交互（默认 true）：能点行、选行、键盘移动、右键菜单。false 是只读的展示表：语义是 ARIA table，行不响应点击。
   */
  interactive?: boolean
  /**
   * Treat column widths as proportions: when the container is wider than the sum, the extra space is shared by width ratio; by default widths are fixed pixels.
   * 列宽当比例：容器比列宽之和宽时按 width 的比例把多出来的撑给各列（对话框里的小表）；默认列宽是定死的像素。
   */
  stretch?: boolean
  /**
   * Height follows the content (a small table in a dialog): no scrollbar up to maxHeight px. Fills the parent when omitted.
   * 高度跟着内容走（对话框里的小表）：不撑满父级；maxHeight（像素）以内不出滚动条。省略时撑满父级。
   */
  fit?: boolean
  /** Largest height in px when fit is set. */
  maxHeight?: number
  /**
   * Live data mode (default false): numeric cells (number, price, quantity, pnl, change) flash the up or down color when their value changes, rows glide to their new place when the sort order changes, and newly added rows are highlighted briefly.
   * 实时数据模式（默认 false，向后兼容）：数值类列（number、price、quantity、pnl、change）的格子值变了闪涨跌色；排序顺序变了行平滑换位（只对已渲染的行）；新增的行高亮一阵。文本列不闪。
   */
  live?: boolean
  /**
   * Manual row order (controlled): row ids in display order; ids not in it go last. Usually useRowOrder(...).gridProps.
   * 手动行序（受控，#77 G7）：按显示次序的行 id，不在里面的行接在最后；一般摊 useRowOrder(...).gridProps。
   */
  rowOrder?: readonly string[]
  /**
   * Called with the whole new order after a drag, Alt+Up / Alt+Down or a move item in the row menu. Without it rows cannot be reordered.
   * While a column sort is on, reordering is off and Alt+Up / Alt+Down announces why (labels.rowOrder.sorted).
   * 拖行、Alt+↑/↓、右键「上移 / 下移 / 移到顶 / 移到底」之后给出新的整份次序。没给就不能挪行。
   * 按列排序时不能挪（挪了也看不出来）：拖不起来，Alt+↑/↓ 读出原因（labels.rowOrder.sorted），菜单项灰掉。
   */
  onRowOrderChange?: (next: string[]) => void
  /**
   * Section header rows (watchlist sections): return the heading for a row that is a section header, null / undefined for a normal row.
   * The header spans the full width; dragging it moves the whole section, and dropping rows below it puts them into the section.
   * 分节标题行（自选表的分组）：这一行是标题时返回标题内容，普通行返回 null / undefined。
   * 标题跨满整行；拖标题带着整节走，把行拖到它下面就进了这一节。
   */
  rowSection?: (row: Row) => ReactNode
  /** Extra class names per part. */
  classNames?: Partial<Record<GridSlot, string>>
}

// SPDX-License-Identifier: MIT
import {
  columnOrderingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnSizingState,
  type ColumnVisibilityState,
  type SortingState,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/cn.ts'
import { useEmphasis } from '../../layout/emphasis.tsx'
import { SymbolMark } from '../../katana/symbol-mark.tsx'
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '../../primitives/context-menu.tsx'
import { useMenuParts } from '../../primitives/menu-any.tsx'
import { MenuItemHint, MenuItemLabel } from '../../primitives/menu-parts.tsx'
import { RowActions, type RowAction } from '../../patterns/row-actions.tsx'
import { LimitStatus } from '../../cn/limit-status.tsx'
import { StreakBadge } from '../../cn/streak-badge.tsx'
import { ToneText } from '../../quant/tone-text.tsx'
import {
  barExtent,
  barRatio,
  defaultAlign,
  resolveCell,
  resolveHeat,
  sortComparator,
  type GridColumn,
} from './columns.ts'
import { moveColumn, reorderColumn, setColumnFixed, setColumnVisible } from './layout-model.ts'
import { DEFAULT_TEXTS, useDataGridHost, type GridMenuEntry } from './host.tsx'
import {
  EMPTY_SELECTION,
  clickSelection,
  moveCursor,
  tableCsv,
  tableTsv,
  type Selection,
  type SortSpec,
} from './model.ts'

// 数据表：账户、仓位、订单、交易这几张表共用的表格，从应用的 panels/kit/DataTable 拆出（#1869）。包里这一份不认识应用：
// 列的排序、显隐、宽度、顺序是受控的（调用方存），行为交给 @tanstack/react-table（v9 的 headless 表），行多时只画看得见的那一段
// （@tanstack/react-virtual，行高固定）；应用的能力（快捷键、文案、右键菜单怎么画、问 Agent）经 DataGridHost 注入。
// 行为出处：ATAS X 8.0.15 Tables 四张表，2026-10-11 实测（#232）：列可排序、可调宽、可隐藏；行右键 Copy (Ctrl+C)、
// Save to file… (Ctrl+S)、Reset (Ctrl+R)。键盘与多选照自选表：↑↓ 移一行、Home / End、Enter 打开、Shift / Ctrl 点选多行、Esc 清掉选择、
// 菜单键 / Shift+F10 开右键菜单。语义是 ARIA grid：焦点停在表上，aria-activedescendant 指着键盘所在的那一行。

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

/** 行高档：compact 20、default 24、relaxed 32（像素）。 */
export type GridDensity = 'compact' | 'default' | 'relaxed'
export const ROW_HEIGHTS: Readonly<Record<GridDensity, number>> = { compact: 20, default: 24, relaxed: 32 }
const HEAD_HEIGHTS: Readonly<Record<GridDensity, number>> = { compact: 22, default: 26, relaxed: 30 }
const MIN_WIDTH = 24

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

/** compact 分量（#115）只留表的前几行；待定：起始值，看 KATANAview 样板时量。 */
const COMPACT_ROW_LIMIT = 5

/** 子行没有内容的写法（null、undefined、false）：这一行不能展开。 */
const hasContent = (node: ReactNode): boolean => node !== null && node !== undefined && node !== false

/** 虚拟滚动给没量过的子行的估高（像素）；量到以后以真实高度为准。 */
const SUBROW_ESTIMATE = 96

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnVisibilityFeature,
  columnSizingFeature,
  columnOrderingFeature,
})

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
  /** Row height tier. */
  density?: GridDensity
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
   * Draw a thin rule between rows.
   * 行与行之间画一道细线。
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
  /** Extra class names per part. */
  classNames?: Partial<Record<GridSlot, string>>
}

/** 行快捷按钮条贴在行尾；表横向滚开时行尾在可视区外，把滚出去的那段宽度写成变量让条往里挪（theme/row-actions.css 读它）。 */
function keepActionsInView(scroll: HTMLElement) {
  scroll.style.setProperty(
    '--k-grid-hidden-right',
    `${Math.max(0, scroll.scrollWidth - scroll.clientWidth - scroll.scrollLeft)}px`,
  )
}

export function DataGrid<Row extends object>({
  columns,
  layout,
  rows,
  rowId,
  label,
  sort = null,
  onSortChange,
  sortRemovable = true,
  onLayoutChange,
  onResize,
  onResetColumns,
  onOpen,
  restoreRow,
  isOpened,
  rowClass,
  rowProps,
  renderSubRow,
  expanded,
  onExpandedChange,
  defaultExpanded,
  menu,
  rowActions,
  extrasFirst,
  menuTail,
  panelMenu,
  rowInfo,
  askText,
  exportName = 'table',
  onExport,
  foot,
  presorted,
  rowTree,
  timeZone,
  sortLocale,
  density = 'default',
  hideHeader,
  headExtra,
  headEnd,
  autoRowHeight,
  ruled,
  selectable = true,
  interactive = true,
  fit,
  stretch,
  maxHeight,
  classNames = {},
}: DataGridProps<Row>) {
  const host = useDataGridHost()
  const texts = { ...DEFAULT_TEXTS, ...host?.texts }
  // 分量（#115）：compact 不出表头、只留排好序之后的前几行；hero 字上一档（样子在 data-grid.css）；密度（行高）仍由 density 管。
  const emphasis = useEmphasis()
  const compact = emphasis === 'compact'
  const noHeader = hideHeader === true || compact
  const id = useId()
  const rowHeight = ROW_HEIGHTS[density]
  const headHeight = layout.some((column) => column.visible && column.sub)
    ? HEAD_HEIGHTS[density] + 14
    : HEAD_HEIGHTS[density]
  const byId = useMemo(() => new Map(columns.map((column) => [column.id, column])), [columns])
  const layoutOf = useMemo(() => new Map(layout.map((entry) => [entry.id, entry])), [layout])
  const labelOf = (column: string) => layoutOf.get(column)?.label ?? column
  const alignOf = (column: string) => layoutOf.get(column)?.align ?? defaultAlign(byId.get(column)?.type)
  const env = { timeZone }
  // bar 列的条按整列归一：本列所有行里绝对值最大者当满格（虚拟滚动只画看得见的行，但基准看全部行）。
  const extents = useMemo(
    () =>
      new Map(
        columns
          .filter((column) => column.type === 'bar')
          .map((column) => [column.id, barExtent(column, rows, { timeZone })] as const),
      ),
    [columns, rows, timeZone],
  )

  const defs = useMemo(() => {
    const helper = createColumnHelper<typeof features, Row>()
    return helper.columns(
      columns.map((column) => {
        const compare = sortComparator(column.type, sortLocale)
        return helper.accessor((row) => resolveCell(column, row, { timeZone }).sort, {
          id: column.id,
          header: column.id,
          sortUndefined: 'last',
          sortDescFirst: false,
          sortFn: (a, b, columnId) => compare(a.getValue(columnId), b.getValue(columnId)),
        })
      }),
    )
  }, [columns, sortLocale, timeZone])

  const sorting: SortingState = sort ? [{ id: sort.id, desc: sort.desc }] : []
  const visibility: ColumnVisibilityState = Object.fromEntries(layout.map((column) => [column.id, column.visible]))
  const [drag, setDrag] = useState<{ id: string; width: number } | null>(null)
  const sizing: ColumnSizingState = Object.fromEntries(
    layout.map((column) => [column.id, drag?.id === column.id ? drag.width : column.width]),
  )
  const table = useTable({
    features,
    columns: defs,
    data: rows as Row[],
    getRowId: rowId,
    state: { sorting, columnVisibility: visibility, columnSizing: sizing, columnOrder: layout.map((c) => c.id) },
    enableSortingRemoval: sortRemovable,
    manualSorting: presorted === true,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      onSortChange?.(next[0] ? { id: next[0].id, desc: next[0].desc } : null)
    },
  })

  const sortedRows = table.getRowModel().rows
  const modelRows = compact ? sortedRows.slice(0, COMPACT_ROW_LIMIT) : sortedRows
  // 不静默截断（KATANAview 决策记录 0030）：被 compact 截掉的行数写在表下面。
  const hiddenRows = sortedRows.length - modelRows.length
  const order = modelRows.map((row) => row.id)
  // 展开：受控时听调用方，不然自己记「用户展开或收起过的行」，没动过的行看 defaultExpanded。
  const [toggled, setToggled] = useState<ReadonlyMap<string, boolean>>(new Map())
  const isExpanded = (rowKey: string, original: Row): boolean =>
    expanded ? expanded.has(rowKey) : (toggled.get(rowKey) ?? defaultExpanded?.(original) ?? false)
  const hasSubRow = (original: Row): boolean => renderSubRow !== undefined && hasContent(renderSubRow(original))
  const setExpanded = (rowKey: string, next: boolean) => {
    if (!expanded) setToggled(new Map(toggled).set(rowKey, next))
    onExpandedChange?.(rowKey, next)
  }
  // 画出来的条目：每行一条，展开了的行后面跟它的子行。
  const items: { row: (typeof modelRows)[number]; sub: boolean }[] = []
  for (const row of modelRows) {
    items.push({ row, sub: false })
    if (isExpanded(row.id, row.original) && hasSubRow(row.original)) items.push({ row, sub: true })
  }
  const itemIndexOf = (rowKey: string) => items.findIndex((item) => item.row.id === rowKey && !item.sub)
  const [selection, setSelection] = useState<Selection>(() =>
    restoreRow != null && rows.some((row) => rowId(row) === restoreRow)
      ? { selected: new Set([restoreRow]), anchor: restoreRow, cursor: restoreRow }
      : EMPTY_SELECTION,
  )
  const [menuOn, setMenuOn] = useState<'rows' | 'panel' | 'column'>('panel')
  const [menuColumn, setMenuColumn] = useState<string | null>(null)
  // 拖列头重排：dragFrom 是被拖的列，dropOn 是正悬在哪一列上；拖列宽时（resizing）不许起拖。
  const [dragFrom, setDragFrom] = useState<string | null>(null)
  const [dropOn, setDropOn] = useState<string | null>(null)
  const resizing = useRef(false)
  const keyboardMenu = useRef(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const cursor = selection.cursor !== null && order.includes(selection.cursor) ? selection.cursor : null
  const rowDomId = (rowKey: string) => `${id}-${order.indexOf(rowKey)}`

  // initialRect：没量到滚动区之前（第一帧、服务端渲染）按 20 行高估，量到以后以真实高度为准。
  // 返回的函数不能被 React Compiler 记忆化，只在这个组件里用，不传给别的记忆化组件。
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scroller.current,
    estimateSize: (index) => (items[index].sub ? SUBROW_ESTIMATE : rowHeight),
    overscan: 8,
    initialRect: { width: 0, height: maxHeight ?? rowHeight * 20 },
    getItemKey: (index) => (items[index].sub ? `${items[index].row.id}\u0000sub` : items[index].row.id),
  })

  const visibleColumns = table.getVisibleLeafColumns()
  const totalWidth = visibleColumns.reduce((sum, column) => sum + column.getSize(), 0)
  const template = visibleColumns
    .map((column) => (stretch ? `minmax(${column.getSize()}px, ${column.getSize()}fr)` : `${column.getSize()}px`))
    .join(' ')
  // 标了 fixed 的列横向滚动时粘在左边：靠前的固定列挨着排，每列的 left 是它前面固定列的宽度之和。
  const stuck = new Map<string, number>()
  for (let at = 0, left = 0; at < visibleColumns.length; at++) {
    const column = visibleColumns[at]
    if (!layoutOf.get(column.id)?.fixed) continue
    stuck.set(column.id, left)
    left += column.getSize()
  }
  const stuckIds = visibleColumns.filter((column) => stuck.has(column.id)).map((column) => column.id)
  const stickClass = (columnId: string) =>
    stuck.has(columnId)
      ? ` is-fixed${columnId === stuckIds[0] ? ' is-fixed-first' : ''}${columnId === stuckIds.at(-1) ? ' is-fixed-last' : ''}`
      : ''
  const stickStyle = (columnId: string) => (stuck.has(columnId) ? { left: stuck.get(columnId) } : undefined)

  const targetRows = (): Row[] => {
    const picked = modelRows.filter((row) => selection.selected.has(row.id))
    if (picked.length) return picked.map((row) => row.original)
    const at = cursor !== null ? modelRows.find((row) => row.id === cursor) : undefined
    return at ? [at.original] : []
  }
  const cellText = (column: string, row: Row) => {
    const spec = byId.get(column)
    return spec ? resolveCell(spec, row, env).text : ''
  }
  const header = visibleColumns.map((column) => labelOf(column.id))
  const lines = (list: readonly Row[]) => list.map((row) => visibleColumns.map((column) => cellText(column.id, row)))

  const copy = () => {
    const target = targetRows()
    if (target.length === 0) return
    void navigator.clipboard?.writeText(tableTsv(header, lines(target))).catch(() => {})
  }
  const save = () => {
    if (!onExport) return
    const csvHeader = visibleColumns.map((column) => byId.get(column.id)?.csvHeader?.() ?? labelOf(column.id))
    const csvLines = modelRows.map(({ original }) =>
      visibleColumns.map((column) => {
        const spec = byId.get(column.id)
        return spec?.csv ? spec.csv(original) : cellText(column.id, original)
      }),
    )
    onExport(tableCsv(csvHeader, csvLines), `${exportName}.csv`)
  }
  const resetColumns = () => onResetColumns?.()

  const open = (row: Row) => onOpen?.(row)
  const ask = (target: Row[]) => host?.askAgent?.(askText?.(target) ?? null)
  const canAsk = askText !== undefined && host?.askAgent !== undefined
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!interactive || event.target !== event.currentTarget) return
    // 宿主没给键位表时，菜单键与 Shift+F10 也开右键菜单（这是系统通用的键，不属于宿主的键位表）。
    const action =
      host?.matchKey?.(event) ??
      (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey) ? 'contextMenu' : null)
    if (action === 'askAgent') {
      if (!canAsk) return
      event.preventDefault()
      ask(targetRows())
      return
    }
    if (action === 'copy') copy()
    else if (action === 'save') save()
    else if (action === 'resetColumns') resetColumns()
    if (action === 'copy' || action === 'save' || action === 'resetColumns') {
      event.preventDefault()
      return
    }
    // 其余的键是选行与导航：带 Alt、Ctrl、⌘ 的不是。
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const step = ({ ArrowUp: 'up', ArrowDown: 'down', Home: 'first', End: 'last' } as const)[
      event.key as 'ArrowUp' | 'ArrowDown' | 'Home' | 'End'
    ]
    if (step) {
      event.preventDefault()
      const next = moveCursor(order, cursor, step)
      if (next === null) return
      setSelection({ selected: new Set(selectable ? [next] : []), anchor: next, cursor: next })
      virtualizer.scrollToIndex(itemIndexOf(next), { align: 'auto' })
      return
    }
    // treegrid 的键位：→ 展开键盘所在的行，← 收起它。
    if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && renderSubRow && cursor !== null) {
      const row = modelRows.find((entry) => entry.id === cursor)
      if (row && hasSubRow(row.original)) {
        const open = isExpanded(row.id, row.original)
        if (event.key === 'ArrowRight' && !open) setExpanded(row.id, true)
        else if (event.key === 'ArrowLeft' && open) setExpanded(row.id, false)
        event.preventDefault()
      }
      return
    }
    if (event.key === 'Enter' && cursor !== null) {
      event.preventDefault()
      const row = modelRows.find((entry) => entry.id === cursor)
      if (row) open(row.original)
      return
    }
    if (action === 'contextMenu') {
      event.preventDefault()
      const target = (cursor !== null ? document.getElementById(rowDomId(cursor)) : null) ?? event.currentTarget
      const box = target.getBoundingClientRect()
      keyboardMenu.current = true
      target.dispatchEvent(
        new globalThis.MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: box.left + 24,
          clientY: box.bottom,
        }),
      )
      return
    }
    // 右键菜单开着时 Esc 归菜单：弹层拿到焦点比弹层出现晚一拍，这一拍里的 Esc 落在表上，不能被「清选择」截走（#1839）。
    if (event.key === 'Escape' && selection.selected.size > 0 && !menuOpen) {
      event.stopPropagation()
      setSelection({ ...selection, selected: new Set() })
    }
  }
  const onRowClick = (event: MouseEvent, row: { id: string; original: Row }) => {
    if (!interactive || !selectable) return
    const range = event.shiftKey
    const toggle = event.ctrlKey || event.metaKey
    setSelection(clickSelection(order, selection, row.id, { range, toggle }))
    if (!range && !toggle) open(row.original)
  }
  const onMenu = (event: MouseEvent<HTMLElement>) => {
    const fromKeyboard = keyboardMenu.current
    keyboardMenu.current = false
    // 只有表头出列菜单：表体的格子也带 data-col（给样式与测试用），不能算。
    const colKey = (event.target as HTMLElement).closest<HTMLElement>('[role="columnheader"][data-col]')?.dataset.col
    const rowKey = (event.target as HTMLElement).closest<HTMLElement>('[data-row]')?.dataset.row
    if (colKey !== undefined && (onLayoutChange || onSortChange)) {
      setMenuOn('column')
      setMenuColumn(colKey)
    } else if (rowKey !== undefined) {
      setMenuOn('rows')
      if (!selection.selected.has(rowKey)) setSelection({ selected: new Set([rowKey]), anchor: rowKey, cursor: rowKey })
    } else setMenuOn(fromKeyboard && targetRows().length ? 'rows' : 'panel')
  }

  const standard = (hasRows: boolean): GridMenuEntry[] => {
    const { copy: copyLabel, save: saveLabel, resetColumns: resetLabel } = texts
    if (copyLabel === undefined || saveLabel === undefined || resetLabel === undefined) return []
    return [
      { type: 'item', label: copyLabel, keys: host?.keysOf?.('copy'), disabled: !hasRows, onSelect: copy },
      ...(onExport ? [{ type: 'item', label: saveLabel, keys: host?.keysOf?.('save'), onSelect: save } as const] : []),
      ...(onResetColumns
        ? [{ type: 'item', label: resetLabel, keys: host?.keysOf?.('resetColumns'), onSelect: resetColumns } as const]
        : []),
    ]
  }
  const askEntry = (target: Row[]): GridMenuEntry[] =>
    canAsk && texts.askAgent
      ? [{ type: 'item', label: texts.askAgent, keys: host?.keysOf?.('askAgent'), onSelect: () => ask(target) }]
      : []
  const SEP = { type: 'separator' } as const
  const columnEntries = (columnId: string): readonly GridMenuEntry[] => {
    const t = texts.columnMenu
    const at = layout.find((column) => column.id === columnId)
    if (!at) return []
    const sortable = onSortChange !== undefined
    const shown = layout.filter((column) => column.visible)
    const first = shown[0]?.id === columnId
    const last = shown.at(-1)?.id === columnId
    const sorted = sort?.id === columnId ? (sort.desc ? 'desc' : 'asc') : null
    const reset: GridMenuEntry | undefined =
      onResetColumns && texts.resetColumns !== undefined
        ? { type: 'item', label: texts.resetColumns, keys: host?.keysOf?.('resetColumns'), onSelect: resetColumns }
        : undefined
    return [
      ...(sortable
        ? ([
            {
              type: 'item',
              label: t.sortAsc,
              checked: sorted === 'asc',
              onSelect: () => onSortChange({ id: columnId, desc: false }),
            },
            {
              type: 'item',
              label: t.sortDesc,
              checked: sorted === 'desc',
              onSelect: () => onSortChange({ id: columnId, desc: true }),
            },
            ...(sorted && sortRemovable
              ? [{ type: 'item', label: t.clearSort, onSelect: () => onSortChange(null) } as const]
              : []),
          ] as const)
        : []),
      ...(sortable && onLayoutChange ? [SEP] : []),
      ...(onLayoutChange
        ? ([
            {
              type: 'item',
              label: at.fixed ? t.unpin : t.pin,
              onSelect: () => onLayoutChange(setColumnFixed(layout, columnId, !at.fixed)),
            },
            {
              type: 'item',
              label: t.hide,
              disabled: shown.length <= 1,
              onSelect: () => onLayoutChange(setColumnVisible(layout, columnId, false)),
            },
            SEP,
            {
              type: 'item',
              label: t.moveLeft,
              disabled: first,
              onSelect: () => onLayoutChange(moveColumn(layout, columnId, -1)),
            },
            {
              type: 'item',
              label: t.moveRight,
              disabled: last,
              onSelect: () => onLayoutChange(moveColumn(layout, columnId, 1)),
            },
          ] as const)
        : []),
      ...(reset ? [SEP, reset] : []),
    ]
  }
  const entries = (): readonly GridMenuEntry[] => {
    if (menuOn === 'column' && menuColumn !== null) return columnEntries(menuColumn)
    const tail = extrasFirst ? (menuTail?.() ?? []) : []
    const withTail = (list: readonly GridMenuEntry[]): readonly GridMenuEntry[] => [
      ...list,
      ...(tail.length ? [SEP, ...tail] : []),
    ]
    if (menuOn === 'panel' || targetRows().length === 0) {
      const extra = panelMenu?.() ?? []
      if (extrasFirst) return withTail([...extra, ...(extra.length ? [SEP] : []), ...standard(false)])
      return [...standard(false), ...(extra.length ? [SEP, ...extra] : [])]
    }
    const target = targetRows()
    const lead: GridMenuEntry[] =
      rowActions && target.length === 1
        ? rowActions(target[0]).flatMap((action): GridMenuEntry[] => [
            {
              type: 'item',
              label: action.label,
              icon: action.icon,
              keys: action.shortcut,
              disabled: action.disabled,
              onSelect: action.onSelect,
            },
          ])
        : []
    const extra = [...(menu?.(target) ?? []), ...askEntry(target)]
    const info = target.length === 1 ? rowInfo?.(target[0]) : undefined
    const base = standard(true)
    const body: readonly GridMenuEntry[] = extrasFirst
      ? withTail([...extra, ...(extra.length && base.length ? [SEP] : []), ...base])
      : [...base, ...(extra.length && base.length ? [SEP] : []), ...extra]
    return [
      ...lead,
      ...(lead.length && body.length ? [SEP] : []),
      ...body,
      ...(info ? [SEP, { type: 'item', label: info, disabled: true, onSelect: () => {} } as const] : []),
    ]
  }

  const startResize = (event: PointerEvent<HTMLElement>, columnId: string, width: number) => {
    event.preventDefault()
    event.stopPropagation()
    resizing.current = true
    const startX = event.clientX
    const target = event.currentTarget
    target.setPointerCapture(event.pointerId)
    let latest = width
    const move = (next: globalThis.PointerEvent) => {
      latest = Math.max(MIN_WIDTH, Math.round(width + next.clientX - startX))
      setDrag({ id: columnId, width: latest })
    }
    const finish = () => {
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', finish)
      target.removeEventListener('pointercancel', finish)
      setDrag(null)
      resizing.current = false
      if (latest !== width) onResize?.(columnId, latest)
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', finish)
    target.addEventListener('pointercancel', finish)
  }

  // 行变少时选择里不在的行去掉：由 props 推导，在渲染时调整。
  const present = new Set(order)
  if ([...selection.selected].some((key) => !present.has(key)))
    setSelection({
      ...selection,
      selected: new Set([...selection.selected].filter((key) => present.has(key))),
    })

  const hasRowActions = rowActions !== undefined
  useEffect(() => {
    const node = scroller.current
    if (!node || !hasRowActions) return
    keepActionsInView(node)
    const watch = new ResizeObserver(() => keepActionsInView(node))
    watch.observe(node)
    return () => watch.disconnect()
  }, [hasRowActions, totalWidth])

  useEffect(() => {
    if (restoreRow != null && cursor === restoreRow) scroller.current?.parentElement?.focus({ preventScroll: true })
    // 只在挂上来时：之后键盘和鼠标自己带着焦点走
    // oxlint-disable-next-line react/exhaustive-deps
  }, [])

  // 第一次有行时不用滚；之后只在键盘所在的行变了才跟着，行情每秒重画不能把用户滚开的表拉回来。
  useEffect(() => {
    if (cursor !== null) virtualizer.scrollToIndex(itemIndexOf(cursor), { align: 'auto' })
    // oxlint-disable-next-line react/exhaustive-deps
  }, [cursor])

  const menuEntries = interactive ? entries() : []
  const withMenu =
    interactive &&
    (host !== undefined ||
      menu !== undefined ||
      panelMenu !== undefined ||
      rowActions !== undefined ||
      onLayoutChange !== undefined)
  const tabular = rowTree || (renderSubRow && interactive) ? 'treegrid' : interactive ? 'grid' : 'table'
  const cellRole = interactive ? 'gridcell' : 'cell'

  const body = (
    <div
      tabIndex={interactive ? 0 : undefined}
      role={tabular}
      aria-multiselectable={interactive && selectable ? 'true' : undefined}
      aria-rowcount={items.length + 1}
      aria-label={interactive ? texts.gridLabel(label) : label}
      aria-activedescendant={cursor !== null ? rowDomId(cursor) : undefined}
      data-slot="data-grid-body"
      className={cn('k-grid-body', classNames.grid)}
      onKeyDown={onKeyDown}
      onContextMenu={withMenu ? onMenu : undefined}
    >
      <div
        ref={scroller}
        className={cn('k-grid-scroll', classNames.scroll)}
        style={fit && maxHeight !== undefined ? { maxHeight } : undefined}
        // 横向滚开了才给固定列不透明的底和右边的分隔线（样式在 data-grid.css）；直接改属性，不为它重画整张表。
        onScroll={(event) => {
          event.currentTarget.toggleAttribute('data-scrolled', event.currentTarget.scrollLeft > 0)
          keepActionsInView(event.currentTarget)
        }}
      >
        <div className={cn('k-grid-inner', classNames.inner)} style={{ width: totalWidth, minWidth: '100%' }}>
          {!noHeader &&
            table.getHeaderGroups().map((group) => (
              <div
                key={group.id}
                role="row"
                aria-rowindex={1}
                className={cn('k-grid-head', classNames.head)}
                style={{ gridTemplateColumns: template, height: headHeight }}
              >
                {group.headers.map((head) => {
                  const column = head.column
                  const state = column.getIsSorted()
                  const name = labelOf(column.id)
                  return (
                    <div
                      key={head.id}
                      role="columnheader"
                      data-col={column.id}
                      draggable={interactive && onLayoutChange ? true : undefined}
                      onDragStart={(event) => {
                        if (resizing.current) return event.preventDefault()
                        event.dataTransfer.effectAllowed = 'move'
                        event.dataTransfer.setData('text/plain', column.id)
                        setDragFrom(column.id)
                      }}
                      onDragOver={(event) => {
                        if (dragFrom === null) return
                        event.preventDefault()
                        if (dropOn !== column.id) setDropOn(column.id)
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        if (dragFrom !== null && dragFrom !== column.id)
                          onLayoutChange?.(reorderColumn(layout, dragFrom, column.id))
                        setDragFrom(null)
                        setDropOn(null)
                      }}
                      onDragEnd={() => {
                        setDragFrom(null)
                        setDropOn(null)
                      }}
                      aria-sort={
                        onSortChange ? (state ? (state === 'desc' ? 'descending' : 'ascending') : 'none') : undefined
                      }
                      className={cn(
                        'k-grid-col',
                        alignOf(column.id) === 'end' && 'is-end',
                        dragFrom === column.id && 'is-dragging',
                        dropOn === column.id && dragFrom !== null && dragFrom !== column.id && 'is-drop',
                        stickClass(column.id),
                        classNames.col,
                      )}
                      style={stickStyle(column.id)}
                    >
                      {interactive && onSortChange ? (
                        <button
                          type="button"
                          className={state ? 'is-sorted' : undefined}
                          title={texts.sortTitle({ id: column.id, label: name })}
                          onClick={() => column.toggleSorting()}
                        >
                          {state && (
                            <span className="k-grid-sort" aria-hidden="true">
                              {state === 'desc' ? '▼' : '▲'}
                            </span>
                          )}
                          <span className="k-grid-head-name">
                            <span>{name}</span>
                            {layoutOf.get(column.id)?.sub ? (
                              <small className="k-grid-head-sub">{layoutOf.get(column.id)?.sub}</small>
                            ) : null}
                          </span>
                        </button>
                      ) : (
                        <span className="k-grid-head-text">
                          <span className="k-grid-head-name">
                            <span>{name}</span>
                            {layoutOf.get(column.id)?.sub ? (
                              <small className="k-grid-head-sub">{layoutOf.get(column.id)?.sub}</small>
                            ) : null}
                          </span>
                        </span>
                      )}
                      {headExtra?.(column.id)}
                      {onResize && (
                        <span
                          className="k-grid-resize"
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={texts.resizeLabel({ id: column.id, label: name })}
                          onPointerDown={(event) => startResize(event, column.id, column.getSize())}
                        />
                      )}
                    </div>
                  )
                })}
                {headEnd ? (
                  <div className="k-grid-head-end" role="columnheader" data-slot="grid-head-end">
                    {headEnd}
                  </div>
                ) : null}
              </div>
            ))}
          <div
            className={cn('k-grid-rows', classNames.rows)}
            role="rowgroup"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((item) => {
              const { row, sub } = items[item.index]
              const tree = rowTree?.(row.original)
              const level = tree?.level ?? 1
              const measure = autoRowHeight || sub
              if (sub)
                return (
                  <div
                    key={`${row.id}-sub`}
                    id={`${rowDomId(row.id)}-sub`}
                    ref={virtualizer.measureElement}
                    data-index={item.index}
                    data-subrow={row.id}
                    role="row"
                    aria-rowindex={item.index + 2 - (noHeader ? 1 : 0)}
                    aria-level={level + 1}
                    className={cn('k-grid-subrow', classNames.subrow)}
                    style={{ top: item.start }}
                  >
                    <div role={cellRole} aria-colspan={visibleColumns.length} className="k-grid-subcell">
                      {renderSubRow?.(row.original)}
                    </div>
                  </div>
                )
              const selected = selection.selected.has(row.id)
              const extra = rowProps?.(row.original)
              const { className: extraClass, ...attributes } = extra ?? {}
              const expandable = renderSubRow !== undefined && hasSubRow(row.original)
              return (
                <div
                  {...attributes}
                  key={row.id}
                  id={rowDomId(row.id)}
                  ref={measure ? virtualizer.measureElement : undefined}
                  data-index={measure ? item.index : undefined}
                  data-row={row.id}
                  role="row"
                  aria-rowindex={item.index + 2 - (noHeader ? 1 : 0)}
                  aria-selected={interactive && selectable ? selected : undefined}
                  aria-level={tree || renderSubRow ? level : undefined}
                  aria-expanded={tree ? tree.expanded : expandable ? isExpanded(row.id, row.original) : undefined}
                  className={cn(
                    'k-grid-row',
                    interactive && selectable && 'is-interactive',
                    autoRowHeight && 'is-auto',
                    selected && 'is-selected',
                    row.id === cursor && 'is-cursor',
                    isOpened?.(row.original) && 'is-opened',
                    rowClass?.(row.original),
                    extraClass,
                    classNames.row,
                  )}
                  style={{
                    top: item.start,
                    ...(autoRowHeight ? { minHeight: rowHeight } : { height: rowHeight }),
                    gridTemplateColumns: template,
                  }}
                  onClick={interactive ? (event) => onRowClick(event, row) : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const column = byId.get(cell.column.id)!
                    const resolved = resolveCell(column, row.original, env)
                    const fill = column.fill?.(row.original)
                    const heat = resolveHeat(column, row.original)
                    return (
                      <div
                        key={cell.id}
                        role={column.rowHeader ? 'rowheader' : cellRole}
                        data-col={column.id}
                        data-type={column.type ?? 'text'}
                        data-heat={heat?.tone}
                        className={cn(
                          'k-grid-cell',
                          alignOf(column.id) === 'end' && 'is-end',
                          resolved.tone && `is-${resolved.tone}`,
                          fill && `fill-${fill}`,
                          heat?.rank !== undefined && 'has-rank',
                          stickClass(column.id),
                          classNames.cell,
                        )}
                        style={{
                          ...stickStyle(column.id),
                          ...(heat ? ({ '--heat': heat.level } as CSSProperties) : undefined),
                          ...(autoRowHeight ? undefined : { lineHeight: `${rowHeight}px` }),
                        }}
                        title={column.title?.(row.original)}
                      >
                        {column.cell ? (
                          column.cell(row.original)
                        ) : column.render ? (
                          column.render(row.original)
                        ) : (
                          <CellBody
                            resolved={resolved}
                            extent={extents.get(column.id) ?? 0}
                            maxPills={
                              (typeof column.format === 'function' ? column.format(row.original) : column.format)
                                ?.maxPills
                            }
                          />
                        )}
                        {heat?.rank !== undefined && (
                          <span className="k-grid-rank" data-slot="grid-rank">
                            {heat.rank}
                          </span>
                        )}
                      </div>
                    )
                  })}
                  {rowActions && interactive && (
                    <RowActions
                      items={rowActions(row.original)}
                      label={texts.rowActions}
                      role={cellRole}
                      focusable={false}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <ContextMenu onOpenChange={setMenuOpen}>
      <div
        className={cn('k-grid', fit && 'is-fit', ruled && 'is-ruled', autoRowHeight && 'is-auto', classNames.root)}
        data-slot="data-grid"
        data-density={density}
        data-emphasis={emphasis}
        data-interactive={interactive}
      >
        {withMenu ? <ContextMenuTrigger asChild>{body}</ContextMenuTrigger> : body}
        {hiddenRows > 0 && (
          <div className="k-grid-more" data-slot="grid-more">
            {texts.moreRows(hiddenRows)}
          </div>
        )}
        {foot && <div className={cn('k-grid-foot', classNames.foot)}>{foot}</div>}
      </div>
      {withMenu && menuEntries.length > 0 && (
        <ContextMenuContent
          aria-label={
            menuOn === 'column' && menuColumn !== null
              ? texts.columnMenu.label({ id: menuColumn, label: labelOf(menuColumn) })
              : texts.menuLabel(label)
          }
        >
          {host?.renderMenu ? host.renderMenu(menuEntries) : <DefaultMenu entries={menuEntries} />}
        </ContextMenuContent>
      )}
      <span className="sr-only" role="status">
        {selection.selected.size > 1 ? texts.selectedRows(selection.selected) : ''}
      </span>
    </ContextMenu>
  )
}

/** 一格里的内容：品种拆成代码加场所，有方向的类型（盈亏、涨跌幅、买卖）用 ToneText 跟 data-updown，别的直接写字。 */
function CellBody({
  resolved,
  extent,
  maxPills,
}: {
  resolved: ReturnType<typeof resolveCell>
  extent: number
  maxPills?: number
}) {
  if (resolved.pills) return <PillCell pills={resolved.pills} max={maxPills} />
  if (resolved.streak) {
    const { value, form, labels } = resolved.streak
    return <StreakBadge streak={value} form={form} labels={labels} />
  }
  if (resolved.limitStatus) {
    return <LimitStatus status={resolved.limitStatus.value} labels={resolved.limitStatus.labels} />
  }
  if (resolved.progress) {
    const { done, total, ratio } = resolved.progress
    return (
      <>
        <span className="k-grid-progress-text">
          {done}/{total}
        </span>
        <span className="k-grid-progress" data-slot="grid-progress" aria-hidden="true">
          {ratio !== undefined && <i style={{ width: `${ratio * 100}%` }} />}
        </span>
      </>
    )
  }
  if (resolved.bar !== undefined) {
    const ratio = barRatio(resolved.bar, extent)
    return (
      <>
        <span className="k-grid-bar" data-slot="grid-bar" data-dir={ratio > 0 ? 'up' : ratio < 0 ? 'down' : 'flat'}>
          <i style={{ width: `${Math.abs(ratio) * 50}%`, [ratio < 0 ? 'right' : 'left']: '50%' }} />
        </span>
        <span className="k-grid-bar-text">{resolved.text}</span>
      </>
    )
  }
  if (resolved.symbol) {
    return (
      <>
        {resolved.symbol.icon && (
          <SymbolMark
            code={resolved.symbol.code}
            name={resolved.symbol.name}
            src={resolved.symbol.icon.src}
            size={16}
          />
        )}
        <span className="k-grid-name">{resolved.symbol.code}</span>
        {resolved.symbol.venue && <span className="k-grid-tag">{resolved.symbol.venue}</span>}
      </>
    )
  }
  if (resolved.direction !== undefined) return <ToneText tone={resolved.direction}>{resolved.text}</ToneText>
  return resolved.text
}

/** 宿主没给 renderMenu 时的菜单：item、二级、分隔线；快捷键写成右边的字。 */
function DefaultMenu({ entries }: { entries: readonly GridMenuEntry[] }) {
  const Menu = useMenuParts()
  return (
    <>
      {entries.map((entry, index) => {
        if (entry.type === 'separator') return <Menu.Separator key={index} />
        if (entry.type === 'submenu')
          return (
            <Menu.Sub key={index}>
              <Menu.SubTrigger onClick={entry.onSelect}>
                <MenuItemLabel>{entry.label}</MenuItemLabel>
                {entry.keys && <MenuItemHint>{entry.keys}</MenuItemHint>}
              </Menu.SubTrigger>
              <Menu.SubContent aria-label={entry.label}>
                <DefaultMenu entries={entry.entries} />
              </Menu.SubContent>
            </Menu.Sub>
          )
        if (entry.checked !== undefined)
          return (
            <Menu.CheckboxItem
              key={index}
              checked={entry.checked}
              disabled={entry.disabled}
              onCheckedChange={() => entry.onSelect()}
            >
              <MenuItemLabel>{entry.label}</MenuItemLabel>
              {entry.keys && <MenuItemHint>{entry.keys}</MenuItemHint>}
            </Menu.CheckboxItem>
          )
        return (
          <Menu.Item key={index} disabled={entry.disabled} onSelect={entry.onSelect}>
            <MenuItemLabel>
              {entry.icon}
              {entry.label}
            </MenuItemLabel>
            {(entry.hint ?? entry.keys) && <MenuItemHint>{entry.hint ?? entry.keys}</MenuItemHint>}
          </Menu.Item>
        )
      })}
    </>
  )
}

/** 胶囊的「+n」预留的宽度（px）与胶囊之间的间距，跟 data-grid.css 的 .k-grid-pill 一致。 */
const PILL_MORE_WIDTH = 32
const PILL_GAP = 4

/**
 * pill 列的一格：多枚短标签排成一行，装不下的收成「+n」（悬停的 title 写全部）。
 * 先按 maxPills 截（服务端渲染与首帧就是这个数），挂载后量每枚的宽，按格子宽度再往下收；格子变宽变窄时重算。
 */
function PillCell({ pills, max }: { pills: NonNullable<ReturnType<typeof resolveCell>['pills']>; max?: number }) {
  const box = useRef<HTMLSpanElement | null>(null)
  const cap = Math.min(pills.length, max ?? pills.length)
  const [fit, setFit] = useState(cap)
  const key = pills.map((pill) => pill.label).join('\u0000')
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => {
      const nodes = Array.from(el.querySelectorAll<HTMLElement>('[data-pill]'))
      const widths = nodes.map((node) => {
        const was = node.hidden
        node.hidden = false
        const width = node.offsetWidth
        node.hidden = was
        return width
      })
      const room = el.clientWidth
      const total = widths.length
      let count = 0
      for (let k = Math.min(cap, total); k >= 0; k--) {
        const used = widths.slice(0, k).reduce((sum, width) => sum + width, 0) + Math.max(0, k - 1) * PILL_GAP
        const more = k < total ? (k > 0 ? PILL_GAP : 0) + PILL_MORE_WIDTH : 0
        if (used + more <= room) {
          count = k
          break
        }
      }
      setFit(room > 0 ? count : cap)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [key, cap])
  const shown = Math.min(fit, cap)
  const rest = pills.length - shown
  return (
    <span ref={box} className="k-grid-pills" data-slot="grid-pills">
      {pills.map((pill, i) => (
        <span key={`${i}-${pill.label}`} className="k-grid-pill" data-pill="" data-tone={pill.tone} hidden={i >= shown}>
          {pill.label}
        </span>
      ))}
      {rest > 0 && (
        <span
          className="k-grid-pill k-grid-pill-more"
          data-slot="grid-pill-more"
          title={pills.map((pill) => pill.label).join(' · ')}
        >
          +{rest}
        </span>
      )}
    </span>
  )
}

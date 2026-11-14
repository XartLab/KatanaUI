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
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/cn.ts'
import { SymbolMark } from '../../katana/symbol-mark.tsx'
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '../../primitives/context-menu.tsx'
import { useMenuParts } from '../../primitives/menu-any.tsx'
import { MenuItemHint, MenuItemLabel } from '../../primitives/menu-parts.tsx'
import { ToneText } from '../../quant/tone-text.tsx'
import { defaultAlign, resolveCell, sortComparator, type GridColumn } from './columns.ts'
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
}

/** 行高档：compact 20、default 24、relaxed 32（像素）。 */
export type GridDensity = 'compact' | 'default' | 'relaxed'
export const ROW_HEIGHTS: Readonly<Record<GridDensity, number>> = { compact: 20, default: 24, relaxed: 32 }
const HEAD_HEIGHTS: Readonly<Record<GridDensity, number>> = { compact: 22, default: 26, relaxed: 30 }
const MIN_WIDTH = 24

/** 外层各部分额外挂的类名（宿主给自己的样式与测试留钩子）。 */
export type GridSlot = 'root' | 'grid' | 'scroll' | 'inner' | 'head' | 'col' | 'rows' | 'row' | 'cell' | 'foot'

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnVisibilityFeature,
  columnSizingFeature,
  columnOrderingFeature,
})

export type DataGridProps<Row extends object> = {
  /** 列的定义，模块级常量（表里的列对象要稳定）。 */
  columns: readonly GridColumn<Row>[]
  /** 列怎么摆：次序、显隐、宽度、表头的字。调用方存。 */
  layout: readonly GridColumnLayout[]
  rows: readonly Row[]
  rowId: (row: Row) => string
  /** 屏幕阅读器念的表名。 */
  label: string
  sort: SortSpec | null
  onSortChange: (next: SortSpec | null) => void
  /** 点到第三下回到不排；false 时回到正序（有默认排序的表不允许「不排」）。 */
  sortRemovable?: boolean
  /** 拖完列宽。 */
  onResize?: (id: string, width: number) => void
  /** 重置列（菜单项与快捷键）：调用方把次序、显隐、宽度、排序放回默认。 */
  onResetColumns?: () => void
  /** 点一行（不带修饰键）做的事。 */
  onOpen?: (row: Row) => void
  /** 从详情返回时把键盘所在的行放回它（WCAG 2.4.3）；只在挂上来那一刻管用。 */
  restoreRow?: string | null
  /** 正开着的那一行（左边一道强调色）。 */
  isOpened?: (row: Row) => boolean
  rowClass?: (row: Row) => string | undefined
  /** 右键菜单里标准项之后追加的项，对选中的行生效。 */
  menu?: (rows: Row[]) => readonly GridMenuEntry[]
  /** 默认标准项（复制、导出、重置列）在前，menu 的项在后；设 true 反过来（照 TradingView：表自己的操作在前、表格工具垫底）。 */
  extrasFirst?: boolean
  /** extrasFirst 时垫在标准项后面的项。 */
  menuTail?: () => readonly GridMenuEntry[]
  /** 点在空白处时菜单里追加的项。 */
  panelMenu?: () => readonly GridMenuEntry[]
  /** 右键菜单底部的灰字（交易表的 Id、Exec id）。 */
  rowInfo?: (row: Row) => string
  /** 「问 Agent」：把选中的行写成摘要文字（没有可写的返回 null）。要宿主提供 askAgent 才有这一项。 */
  askText?: (rows: Row[]) => string | null
  /** 导出的文件名（不含扩展名）；宿主的 download 能力不在包里，导出由 onExport 接手。 */
  exportName?: string
  /** 导出 CSV：包里算好文字与文件名，交给宿主存。没给就没有导出。 */
  onExport?: (csv: string, fileName: string) => void
  /** 表下面的一行说明。 */
  foot?: ReactNode
  /** 行已经由调用方排好（分组行带子行）：表照样画表头的标记，但不再自己排。 */
  presorted?: boolean
  /** 树形行：表按 ARIA treegrid 读，行带 aria-level 与 aria-expanded。 */
  rowTree?: (row: Row) => { level: number; expanded?: boolean }
  /** time 列的时区：'local'（默认）、'utc'、IANA 名。 */
  timeZone?: string
  /** 文字列排序的语言（Intl.Collator）；省略跟运行环境。 */
  sortLocale?: string
  density?: GridDensity
  /** 不画表头（两列的指标表之类）。 */
  hideHeader?: boolean
  /**
   * 可交互（默认 true）：能点行、选行、键盘移动、右键菜单。false 是只读的展示表：语义是 ARIA table，行不响应点击。
   */
  interactive?: boolean
  /** 列宽当比例：容器比列宽之和宽时按 width 的比例把多出来的撑给各列（对话框里的小表）；默认列宽是定死的像素。 */
  stretch?: boolean
  /** 高度跟着内容走（对话框里的小表）：不撑满父级；maxHeight（像素）以内不出滚动条。省略时撑满父级。 */
  fit?: boolean
  maxHeight?: number
  classNames?: Partial<Record<GridSlot, string>>
}

export function DataGrid<Row extends object>({
  columns,
  layout,
  rows,
  rowId,
  label,
  sort,
  onSortChange,
  sortRemovable = true,
  onResize,
  onResetColumns,
  onOpen,
  restoreRow,
  isOpened,
  rowClass,
  menu,
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
  interactive = true,
  fit,
  stretch,
  maxHeight,
  classNames = {},
}: DataGridProps<Row>) {
  const host = useDataGridHost()
  const texts = { ...DEFAULT_TEXTS, ...host?.texts }
  const id = useId()
  const rowHeight = ROW_HEIGHTS[density]
  const headHeight = HEAD_HEIGHTS[density]
  const byId = useMemo(() => new Map(columns.map((column) => [column.id, column])), [columns])
  const layoutOf = useMemo(() => new Map(layout.map((entry) => [entry.id, entry])), [layout])
  const labelOf = (column: string) => layoutOf.get(column)?.label ?? column
  const alignOf = (column: string) => layoutOf.get(column)?.align ?? defaultAlign(byId.get(column)?.type)
  const env = { timeZone }

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
      onSortChange(next[0] ? { id: next[0].id, desc: next[0].desc } : null)
    },
  })

  const modelRows = table.getRowModel().rows
  const order = modelRows.map((row) => row.id)
  const [selection, setSelection] = useState<Selection>(() =>
    restoreRow != null && rows.some((row) => rowId(row) === restoreRow)
      ? { selected: new Set([restoreRow]), anchor: restoreRow, cursor: restoreRow }
      : EMPTY_SELECTION,
  )
  const [menuOn, setMenuOn] = useState<'rows' | 'panel'>('panel')
  const keyboardMenu = useRef(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)
  const cursor = selection.cursor !== null && order.includes(selection.cursor) ? selection.cursor : null
  const rowDomId = (rowKey: string) => `${id}-${order.indexOf(rowKey)}`

  // initialRect：没量到滚动区之前（第一帧、服务端渲染）按 20 行高估，量到以后以真实高度为准。
  // 返回的函数不能被 React Compiler 记忆化，只在这个组件里用，不传给别的记忆化组件。
  const virtualizer = useVirtualizer({
    count: modelRows.length,
    getScrollElement: () => scroller.current,
    estimateSize: () => rowHeight,
    overscan: 8,
    initialRect: { width: 0, height: maxHeight ?? rowHeight * 20 },
    getItemKey: (index) => modelRows[index].id,
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
    const action = host?.matchKey?.(event) ?? null
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
      setSelection({ selected: new Set([next]), anchor: next, cursor: next })
      virtualizer.scrollToIndex(order.indexOf(next), { align: 'auto' })
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
    if (!interactive) return
    const range = event.shiftKey
    const toggle = event.ctrlKey || event.metaKey
    setSelection(clickSelection(order, selection, row.id, { range, toggle }))
    if (!range && !toggle) open(row.original)
  }
  const onMenu = (event: MouseEvent<HTMLElement>) => {
    const fromKeyboard = keyboardMenu.current
    keyboardMenu.current = false
    const rowKey = (event.target as HTMLElement).closest<HTMLElement>('[data-row]')?.dataset.row
    if (rowKey !== undefined) {
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
  const entries = (): readonly GridMenuEntry[] => {
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
    const extra = [...(menu?.(target) ?? []), ...askEntry(target)]
    const info = target.length === 1 ? rowInfo?.(target[0]) : undefined
    const base = standard(true)
    const body: readonly GridMenuEntry[] = extrasFirst
      ? withTail([...extra, ...(extra.length && base.length ? [SEP] : []), ...base])
      : [...base, ...(extra.length && base.length ? [SEP] : []), ...extra]
    return [...body, ...(info ? [SEP, { type: 'item', label: info, disabled: true, onSelect: () => {} } as const] : [])]
  }

  const startResize = (event: PointerEvent<HTMLElement>, columnId: string, width: number) => {
    event.preventDefault()
    event.stopPropagation()
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

  useEffect(() => {
    if (restoreRow != null && cursor === restoreRow) scroller.current?.parentElement?.focus({ preventScroll: true })
    // 只在挂上来时：之后键盘和鼠标自己带着焦点走
    // oxlint-disable-next-line react/exhaustive-deps
  }, [])

  // 第一次有行时不用滚；之后只在键盘所在的行变了才跟着，行情每秒重画不能把用户滚开的表拉回来。
  useEffect(() => {
    if (cursor !== null) virtualizer.scrollToIndex(order.indexOf(cursor), { align: 'auto' })
    // oxlint-disable-next-line react/exhaustive-deps
  }, [cursor])

  const menuEntries = interactive ? entries() : []
  const withMenu = interactive && (host !== undefined || menu !== undefined || panelMenu !== undefined)
  const tabular = rowTree ? 'treegrid' : interactive ? 'grid' : 'table'
  const cellRole = interactive ? 'gridcell' : 'cell'

  const body = (
    <div
      tabIndex={interactive ? 0 : undefined}
      role={tabular}
      aria-multiselectable={interactive ? 'true' : undefined}
      aria-rowcount={modelRows.length + 1}
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
        onScroll={(event) => event.currentTarget.toggleAttribute('data-scrolled', event.currentTarget.scrollLeft > 0)}
      >
        <div className={cn('k-grid-inner', classNames.inner)} style={{ width: totalWidth, minWidth: '100%' }}>
          {!hideHeader &&
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
                      aria-sort={state ? (state === 'desc' ? 'descending' : 'ascending') : 'none'}
                      className={cn(
                        'k-grid-col',
                        alignOf(column.id) === 'end' && 'is-end',
                        stickClass(column.id),
                        classNames.col,
                      )}
                      style={stickStyle(column.id)}
                    >
                      {interactive ? (
                        <button
                          type="button"
                          className={state ? 'is-sorted' : undefined}
                          title={texts.sortTitle({ id: column.id, label: name })}
                          onClick={() => column.toggleSorting()}
                        >
                          {name}
                          {state && (
                            <span className="k-grid-sort" aria-hidden="true">
                              {state === 'desc' ? '▼' : '▲'}
                            </span>
                          )}
                        </button>
                      ) : (
                        <span className="k-grid-head-text">{name}</span>
                      )}
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
              </div>
            ))}
          <div
            className={cn('k-grid-rows', classNames.rows)}
            role="rowgroup"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((item) => {
              const row = modelRows[item.index]
              const selected = selection.selected.has(row.id)
              const tree = rowTree?.(row.original)
              return (
                <div
                  key={row.id}
                  id={rowDomId(row.id)}
                  data-row={row.id}
                  role="row"
                  aria-rowindex={item.index + 2 - (hideHeader ? 1 : 0)}
                  aria-selected={interactive ? selected : undefined}
                  aria-level={tree?.level}
                  aria-expanded={tree?.expanded}
                  className={cn(
                    'k-grid-row',
                    interactive && 'is-interactive',
                    selected && 'is-selected',
                    row.id === cursor && 'is-cursor',
                    isOpened?.(row.original) && 'is-opened',
                    rowClass?.(row.original),
                    classNames.row,
                  )}
                  style={{ top: item.start, height: rowHeight, gridTemplateColumns: template }}
                  onClick={interactive ? (event) => onRowClick(event, row) : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const column = byId.get(cell.column.id)!
                    const resolved = resolveCell(column, row.original, env)
                    const fill = column.fill?.(row.original)
                    return (
                      <div
                        key={cell.id}
                        role={cellRole}
                        data-col={column.id}
                        data-type={column.type ?? 'text'}
                        className={cn(
                          'k-grid-cell',
                          alignOf(column.id) === 'end' && 'is-end',
                          resolved.tone && `is-${resolved.tone}`,
                          fill && `fill-${fill}`,
                          stickClass(column.id),
                          classNames.cell,
                        )}
                        style={{ ...stickStyle(column.id), lineHeight: `${rowHeight}px` }}
                        title={column.title?.(row.original)}
                      >
                        {column.render ? column.render(row.original) : <CellBody resolved={resolved} />}
                      </div>
                    )
                  })}
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
        className={cn('k-grid', fit && 'is-fit', classNames.root)}
        data-slot="data-grid"
        data-density={density}
        data-interactive={interactive}
      >
        {withMenu ? <ContextMenuTrigger asChild>{body}</ContextMenuTrigger> : body}
        {foot && <div className={cn('k-grid-foot', classNames.foot)}>{foot}</div>}
      </div>
      {withMenu && menuEntries.length > 0 && (
        <ContextMenuContent aria-label={texts.menuLabel(label)}>
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
function CellBody({ resolved }: { resolved: ReturnType<typeof resolveCell> }) {
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
            <MenuItemLabel>{entry.label}</MenuItemLabel>
            {(entry.hint ?? entry.keys) && <MenuItemHint>{entry.hint ?? entry.keys}</MenuItemHint>}
          </Menu.Item>
        )
      })}
    </>
  )
}

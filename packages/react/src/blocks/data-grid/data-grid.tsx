// SPDX-License-Identifier: MIT
/**
 * Data table with sorting, column layout, virtual rows, keyboard selection and a context menu.
 * 数据表；类型在 data-grid-props.ts，表头 grid-head.tsx，格子 grid-cells.tsx，右键菜单 grid-menu.tsx，列宽 use-column-sizing.ts（体检 §7 拆分）。
 */
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
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { useEnterMarks, useFlipList } from '../../lib/live.ts'
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '../../primitives/context-menu.tsx'
import { RowActions } from '../../quotes/row-actions.tsx'
import { defaultAlign, resolveCell, sortComparator } from './columns.ts'
import { HEAD_HEIGHTS, HEAD_SUB_EXTRA, ROW_HEIGHTS, type DataGridProps } from './data-grid-props.ts'
import { CellBody, FLASH_TYPES, FlashCell, keepActionsInView } from './grid-cells.tsx'
import { GridHead } from './grid-head.tsx'
import { DefaultMenu, gridMenuEntries, type GridMenuOn } from './grid-menu.tsx'
import { resolveLabels, useDataGridHost } from './host.tsx'
import { EMPTY_SELECTION, clickSelection, moveCursor, tableCsv, tableTsv, type Selection } from './model.ts'
import { useColumnSizing } from './use-column-sizing.ts'

export type { DataGridProps, GridColumnLayout, GridDensity, GridRowProps, GridSlot } from './data-grid-props.ts'

// 数据表：账户、仓位、订单、交易这几张表共用的表格，从应用的 panels/kit/DataTable 拆出（#1869）。包里这一份不认识应用：
// 列的排序、显隐、宽度、顺序是受控的（调用方存），行为交给 @tanstack/react-table（v9 的 headless 表），行多时只画看得见的那一段
// （@tanstack/react-virtual，行高固定）；应用的能力（快捷键、文案、右键菜单怎么画、问 Agent）经 DataGridHost 注入。
// 行为出处：ATAS X 8.0.15 Tables 四张表，2026-10-11 实测（#232）：列可排序、可调宽、可隐藏；行右键 Copy (Ctrl+C)、
// Save to file… (Ctrl+S)、Reset (Ctrl+R)。键盘与多选照自选表：↑↓ 移一行、Home / End、Enter 打开、Shift / Ctrl 点选多行、Esc 清掉选择、
// 菜单键 / Shift+F10 开右键菜单。语义是 ARIA grid：焦点停在表上，aria-activedescendant 指着键盘所在的那一行。

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
  locale,
  hideHeader,
  headExtra,
  headEnd,
  autoRowHeight,
  ruled = density === 'comfortable',
  selectable = true,
  interactive = true,
  fit,
  stretch,
  maxHeight,
  live = false,
  classNames = {},
}: DataGridProps<Row>) {
  const host = useDataGridHost()
  const texts = resolveLabels(host)
  const id = useId()
  const rowHeight = ROW_HEIGHTS[density]
  const headHeight = layout.some((column) => column.visible && column.sub)
    ? HEAD_HEIGHTS[density] + HEAD_SUB_EXTRA[density]
    : HEAD_HEIGHTS[density]
  const byId = useMemo(() => new Map(columns.map((column) => [column.id, column])), [columns])
  const layoutOf = useMemo(() => new Map(layout.map((entry) => [entry.id, entry])), [layout])
  const labelOf = (column: string) => layoutOf.get(column)?.label ?? column
  const alignOf = (column: string) => layoutOf.get(column)?.align ?? defaultAlign(byId.get(column)?.type)
  const env = { timeZone, locale }

  const defs = useMemo(() => {
    const helper = createColumnHelper<typeof features, Row>()
    return helper.columns(
      columns.map((column) => {
        const compare = sortComparator(column.type, sortLocale)
        return helper.accessor((row) => resolveCell(column, row, { timeZone, locale }).sort, {
          id: column.id,
          header: column.id,
          sortUndefined: 'last',
          sortDescFirst: false,
          sortFn: (a, b, columnId) => compare(a.getValue(columnId), b.getValue(columnId)),
        })
      }),
    )
  }, [columns, sortLocale, timeZone, locale])

  const sorting: SortingState = sort ? [{ id: sort.id, desc: sort.desc }] : []
  const visibility: ColumnVisibilityState = Object.fromEntries(layout.map((column) => [column.id, column.visible]))
  const scroller = useRef<HTMLDivElement>(null)
  const { drag, resizing, canFit, fitRows, startResize } = useColumnSizing<Row>({
    scroller,
    layout,
    byId,
    layoutOf,
    env,
    sortable: interactive && onSortChange !== undefined,
    onResize,
    onLayoutChange,
  })
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

  const modelRows = table.getRowModel().rows
  // 适应内容按排好序的前若干行量。
  const fitColumns = (ids: readonly string[]) =>
    fitRows(
      ids,
      modelRows.map((row) => row.original),
    )
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
  const [menuOn, setMenuOn] = useState<GridMenuOn>('panel')
  const [menuColumn, setMenuColumn] = useState<string | null>(null)
  const keyboardMenu = useRef(false)
  const [menuOpen, setMenuOpen] = useState(false)
  // 实时模式：新增的行高亮、顺序变了行换位；hooks 一直在跑（只是比较一遍 id），只有 live 时才往行上挂类名与 data-live-id。
  const enterMarks = useEnterMarks(order)
  useFlipList(scroller, order)
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

  const menuEntries = interactive
    ? gridMenuEntries<Row>({
        labels: texts,
        host,
        layout,
        sort,
        sortRemovable,
        on: menuOn,
        column: menuColumn,
        target: targetRows,
        copy,
        save,
        ask,
        canAsk,
        canFit,
        fitColumns,
        onSortChange,
        onLayoutChange,
        onResetColumns,
        onExport,
        rowActions,
        menu,
        extrasFirst,
        menuTail,
        panelMenu,
        rowInfo,
      })
    : []
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
          {!hideHeader && (
            <GridHead
              columns={visibleColumns.map((column) => ({
                id: column.id,
                size: column.getSize(),
                sorted: column.getIsSorted(),
                toggleSorting: () => column.toggleSorting(),
              }))}
              layout={layout}
              layoutOf={layoutOf}
              labels={texts}
              template={template}
              height={headHeight}
              interactive={interactive}
              sortable={onSortChange !== undefined}
              alignOf={alignOf}
              stickClass={stickClass}
              stickStyle={stickStyle}
              resizing={resizing}
              headExtra={headExtra}
              headEnd={headEnd}
              onLayoutChange={onLayoutChange}
              onResize={onResize}
              startResize={startResize}
              fitColumns={fitColumns}
              className={classNames.head}
              colClassName={classNames.col}
            />
          )}
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
                    aria-rowindex={item.index + 2 - (hideHeader ? 1 : 0)}
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
                  data-live-id={live ? row.id : undefined}
                  role="row"
                  aria-rowindex={item.index + 2 - (hideHeader ? 1 : 0)}
                  aria-selected={interactive && selectable ? selected : undefined}
                  aria-level={tree || renderSubRow ? level : undefined}
                  aria-expanded={tree ? tree.expanded : expandable ? isExpanded(row.id, row.original) : undefined}
                  className={cn(
                    'k-grid-row',
                    interactive && selectable && 'is-interactive',
                    autoRowHeight && 'is-auto',
                    selected && 'is-selected',
                    row.id === cursor && 'is-cursor',
                    live && enterMarks.has(row.id) && 'k-live-enter',
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
                    const body = column.cell ? (
                      column.cell(row.original)
                    ) : column.render ? (
                      column.render(row.original)
                    ) : (
                      <CellBody resolved={resolved} />
                    )
                    const box = {
                      role: column.rowHeader ? 'rowheader' : cellRole,
                      'data-col': column.id,
                      'data-type': column.type ?? 'text',
                      className: cn(
                        'k-grid-cell',
                        alignOf(column.id) === 'end' && 'is-end',
                        resolved.tone && `is-${resolved.tone}`,
                        fill && `fill-${fill}`,
                        stickClass(column.id),
                        classNames.cell,
                      ),
                      style: {
                        ...stickStyle(column.id),
                        ...(autoRowHeight ? undefined : { lineHeight: `${rowHeight}px` }),
                      },
                      title: column.title?.(row.original),
                    }
                    if (live && FLASH_TYPES.has(column.type ?? 'text')) {
                      const number = resolved.sort === undefined ? null : Number(resolved.sort)
                      return (
                        <FlashCell key={cell.id} value={number} {...box}>
                          {body}
                        </FlashCell>
                      )
                    }
                    return (
                      <div key={cell.id} {...box}>
                        {body}
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
        data-interactive={interactive}
      >
        {withMenu ? <ContextMenuTrigger asChild>{body}</ContextMenuTrigger> : body}
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

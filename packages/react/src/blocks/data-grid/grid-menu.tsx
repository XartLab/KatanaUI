// SPDX-License-Identifier: MIT
/**
 * Context menu entries of DataGrid and the default way to draw them.
 * DataGrid 的右键菜单（体检 §7 从 data-grid.tsx 拆出）：按右键落点（列头、行、空白）拼菜单项，宿主没给 renderMenu 时的默认画法。
 */
import { useMenuParts } from '../../primitives/menu-any.tsx'
import { MenuItemHint, MenuItemLabel } from '../../primitives/menu-parts.tsx'
import type { RowAction } from '../../quotes/row-actions.tsx'
import type { GridColumnLayout } from './data-grid-props.ts'
import type { DataGridHost, GridMenuEntry, ResolvedGridLabels } from './host.tsx'
import { moveColumn, setColumnFixed, setColumnVisible } from './layout-model.ts'
import type { SortSpec } from './model.ts'

/** 右键落在哪：列头、行、空白。 */
export type GridMenuOn = 'rows' | 'panel' | 'column'

/** 拼菜单要的东西：表的状态、动作与调用方给的追加项。 */
export type GridMenuContext<Row> = {
  labels: ResolvedGridLabels
  host: DataGridHost | undefined
  layout: readonly GridColumnLayout[]
  sort: SortSpec | null
  sortRemovable: boolean
  on: GridMenuOn
  column: string | null
  /** 右键作用的行：选中的行，没选就是键盘所在的那一行。 */
  target: () => Row[]
  copy: () => void
  save: () => void
  ask: (rows: Row[]) => void
  canAsk: boolean
  canFit: boolean
  fitColumns: (ids: readonly string[]) => void
  onSortChange?: (next: SortSpec | null) => void
  onLayoutChange?: (next: GridColumnLayout[]) => void
  onResetColumns?: () => void
  onExport?: (csv: string, fileName: string) => void
  rowActions?: (row: Row) => readonly RowAction[]
  menu?: (rows: Row[]) => readonly GridMenuEntry[]
  extrasFirst?: boolean
  menuTail?: () => readonly GridMenuEntry[]
  panelMenu?: () => readonly GridMenuEntry[]
  rowInfo?: (row: Row) => string
  /** 挪行（#77 G7）：给了它，行菜单里多「上移 / 下移 / 移到顶 / 移到底」；canMove 为 false（按列排序时）四项灰掉并带原因。 */
  rowOrder?: { canMove: boolean; move: (to: RowMoveTo) => void }
}

/** 右键菜单里挪行的去处。 */
export type RowMoveTo = 'up' | 'down' | 'top' | 'bottom'

const SEP = { type: 'separator' } as const

/** 标准项（复制、导出、重置列）：三项文案都给了才有。 */
function standard<Row>(c: GridMenuContext<Row>, hasRows: boolean): GridMenuEntry[] {
  const { copy: copyLabel, save: saveLabel, resetColumns: resetLabel } = c.labels
  if (copyLabel === undefined || saveLabel === undefined || resetLabel === undefined) return []
  const keys = c.host?.keysOf
  return [
    { type: 'item', label: copyLabel, keys: keys?.('copy'), disabled: !hasRows, onSelect: c.copy },
    ...(c.onExport ? [{ type: 'item', label: saveLabel, keys: keys?.('save'), onSelect: c.save } as const] : []),
    ...(c.onResetColumns
      ? [{ type: 'item', label: resetLabel, keys: keys?.('resetColumns'), onSelect: c.onResetColumns } as const]
      : []),
  ]
}

/** 列头菜单：排序、固定 / 隐藏 / 左右移、适应内容、重置列。 */
function columnEntries<Row>(c: GridMenuContext<Row>, columnId: string): readonly GridMenuEntry[] {
  const t = c.labels.columnMenu
  const { layout, onSortChange, onLayoutChange, onResetColumns, sort } = c
  const at = layout.find((column) => column.id === columnId)
  if (!at) return []
  const shown = layout.filter((column) => column.visible)
  const first = shown[0]?.id === columnId
  const last = shown.at(-1)?.id === columnId
  const sorted = sort?.id === columnId ? (sort.desc ? 'desc' : 'asc') : null
  const reset: GridMenuEntry | undefined =
    onResetColumns && c.labels.resetColumns !== undefined
      ? { type: 'item', label: c.labels.resetColumns, keys: c.host?.keysOf?.('resetColumns'), onSelect: onResetColumns }
      : undefined
  return [
    ...(onSortChange
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
          ...(sorted && c.sortRemovable
            ? [{ type: 'item', label: t.clearSort, onSelect: () => onSortChange(null) } as const]
            : []),
        ] as const)
      : []),
    ...(onSortChange && onLayoutChange ? [SEP] : []),
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
    ...(c.canFit
      ? [
          SEP,
          { type: 'item', label: t.fitContent, onSelect: () => c.fitColumns([columnId]) } as const,
          { type: 'item', label: t.fitAll, onSelect: () => c.fitColumns(shown.map((column) => column.id)) } as const,
        ]
      : []),
    ...(reset ? [SEP, reset] : []),
  ]
}

/** 这次右键该出的整份菜单。 */
export function gridMenuEntries<Row>(c: GridMenuContext<Row>): readonly GridMenuEntry[] {
  if (c.on === 'column' && c.column !== null) return columnEntries(c, c.column)
  const tail = c.extrasFirst ? (c.menuTail?.() ?? []) : []
  const withTail = (list: readonly GridMenuEntry[]): readonly GridMenuEntry[] => [
    ...list,
    ...(tail.length ? [SEP, ...tail] : []),
  ]
  const target = c.target()
  if (c.on === 'panel' || target.length === 0) {
    const extra = c.panelMenu?.() ?? []
    if (c.extrasFirst) return withTail([...extra, ...(extra.length ? [SEP] : []), ...standard(c, false)])
    return [...standard(c, false), ...(extra.length ? [SEP, ...extra] : [])]
  }
  const lead: GridMenuEntry[] =
    c.rowActions && target.length === 1
      ? c.rowActions(target[0]).map((action): GridMenuEntry => ({
          type: 'item',
          label: action.label,
          icon: action.icon,
          keys: action.shortcut,
          disabled: action.disabled,
          onSelect: action.onSelect,
        }))
      : []
  const ask: GridMenuEntry[] =
    c.canAsk && c.labels.askAgent
      ? [{ type: 'item', label: c.labels.askAgent, keys: c.host?.keysOf?.('askAgent'), onSelect: () => c.ask(target) }]
      : []
  const order = c.rowOrder
  const moves: GridMenuEntry[] = order
    ? (['up', 'down', 'top', 'bottom'] as const).map((to) => ({
        type: 'item',
        label: {
          up: c.labels.rowOrder.moveUp,
          down: c.labels.rowOrder.moveDown,
          top: c.labels.rowOrder.moveTop,
          bottom: c.labels.rowOrder.moveBottom,
        }[to],
        keys: to === 'up' ? 'Alt+↑' : to === 'down' ? 'Alt+↓' : undefined,
        hint: order.canMove ? undefined : c.labels.rowOrder.sorted,
        disabled: !order.canMove,
        onSelect: () => order.move(to),
      }))
    : []
  const extra = [...moves, ...(moves.length && c.menu ? [SEP] : []), ...(c.menu?.(target) ?? []), ...ask]
  const info = target.length === 1 ? c.rowInfo?.(target[0]) : undefined
  const base = standard(c, true)
  const body: readonly GridMenuEntry[] = c.extrasFirst
    ? withTail([...extra, ...(extra.length && base.length ? [SEP] : []), ...base])
    : [...base, ...(extra.length && base.length ? [SEP] : []), ...extra]
  return [
    ...lead,
    ...(lead.length && body.length ? [SEP] : []),
    ...body,
    ...(info ? [SEP, { type: 'item', label: info, disabled: true, onSelect: () => {} } as const] : []),
  ]
}

/** 宿主没给 renderMenu 时的菜单：item、二级、分隔线；快捷键写成右边的字。 */
export function DefaultMenu({ entries }: { entries: readonly GridMenuEntry[] }) {
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

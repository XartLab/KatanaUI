// SPDX-License-Identifier: MIT
/**
 * GroupedTable: DataGrid with rows grouped by a key. Each group has a collapsible header with the count and a summary (k/n, totals);
 * groups are ordered by a summary number; rows without a group go to a trailing "Other" group.
 * 分组表（#260，KATANAview#2164 的「分组表」原型件：连板梯队、新高按板块、龙虎榜按概念、竞价龙头分组）：就是 DataGrid 加上分组，不另造表。
 * 底下用 DataGrid 的分节：组头可收起（点三角或键盘 ← → / Enter）、写行数与汇总、按列的组内汇总（sectionAggregates）对齐在各列下面；
 * 按列排序时组头不动、行在组内排；表尾合计只算数据行。分组表只多做三件事：按 groupBy 分组、按汇总数给组排序、没分进组的放最后。
 * 标题行是合成的：调用方的列函数与回调从来拿不到它们（这里把列与回调包了一层，只把数据行交出去）。
 * 功能参照 TradingView 自选表的分节与自选「高级视图」的分组汇总（DataGrid 的分节页写明了出处）；组怎么排序、「其他」放最后是我们的取舍。
 */
import { useMemo, type ReactNode } from 'react'
import type { ColumnFormat, GridColumn, GridHeat } from './columns.ts'
import { DataGrid } from './data-grid.tsx'
import type { DataGridProps } from './data-grid-props.ts'
import type { GridSummary, SummaryColumn } from './grid-summary-row.tsx'
import {
  buildGroups,
  flattenGroups,
  groupItemId,
  groupKeyOfId,
  type GroupedItem,
  type GroupInfo,
  type GroupOptions,
} from './grouped-model.ts'

type RowProps =
  | 'columns'
  | 'rows'
  | 'rowId'
  | 'onOpen'
  | 'restoreRow'
  | 'isOpened'
  | 'rowClass'
  | 'rowProps'
  | 'rowActions'
  | 'renderSubRow'
  | 'menu'
  | 'askText'
  | 'rowInfo'
  | 'summary'
  | 'sectionAggregates'
  | 'expanded'
  | 'onExpandedChange'
  | 'defaultExpanded'
  | 'rowTree'
  | 'rowOrder'
  | 'onRowOrderChange'
  | 'presorted'
  | 'rowSection'
  | 'sectionSummary'
  | 'collapsedSections'
  | 'defaultCollapsedSections'
  | 'onSectionCollapsedChange'

export type GroupedTableProps<Row extends object> = Omit<DataGridProps<Item<Row>>, RowProps> & {
  /** Column definitions, a module-level constant (same as DataGrid). 列的定义，模块级常量。 */
  columns: readonly GridColumn<Row>[]
  /** The rows (no header rows: the table makes them). 行（不含组头：组头由表合成）。 */
  rows: readonly Row[]
  /** Returns the stable id of a row. */
  rowId: (row: Row) => string
  /**
   * Which group a row belongs to: the group key. null, undefined or an empty string puts the row in the trailing "Other" group.
   * 行属于哪一组：返回组键；null、undefined、空串进尾部的「其他」组。
   */
  groupBy: (row: Row) => string | null | undefined
  /**
   * Heading of a group (what the header row shows next to the triangle); defaults to the group key. Not called for the "Other" group: see otherLabel.
   * 组的标题（组头上三角旁边的字）；默认就是组键。「其他」组不走它，见 otherLabel。
   */
  groupHeading?: (info: GroupInfo<Row>) => ReactNode
  /** Heading of the trailing group of rows without a group key; defaults to "Other". 没有组键的行那一组的标题，默认「Other」。 */
  otherLabel?: ReactNode
  /**
   * The number groups are ordered by (total amount, promotion rate…); defaults to the row count. null sorts after the others.
   * 组的排序数：汇总里最该看的那个（合计金额、晋级率……）；默认是行数。null 排在有数的后面。
   */
  groupMetric?: GroupOptions<Row>['metric']
  /** desc (default): the larger first. asc: the smaller first. The "Other" group is always last. 默认大的在前；「其他」永远在最后。 */
  groupOrder?: GroupOptions<Row>['order']
  /**
   * Summary at the right end of a group header (k/n promoted, a total…); the row count is always shown by the header itself.
   * 组头右端的汇总（晋级 k/n、合计金额……）；行数组头自己就写了。
   */
  groupSummary?: (info: GroupInfo<Row>) => ReactNode
  /**
   * Per-group aggregates drawn in the header row under their columns (same aggregates as summary: sum, avg, min, max, median, count or a function); the first visible column keeps the heading.
   * 每组的按列汇总（写在组头里、对齐到各列下面；聚合同 summary），第一个看得见的列留给组头。
   */
  groupAggregates?: GridSummary<Row>['columns']
  /** Foot summary rows over the data rows (headers excluded). 表尾合计 / 均值行，只算数据行。 */
  summary?: readonly GridSummary<Row>[]
  /** What a plain click on a row does (never called for a group header). 点一行做的事（组头不会触发）。 */
  onOpen?: (row: Row) => void
  /** Whether a row is the one currently open. */
  isOpened?: (row: Row) => boolean
  /** Extra class name for a row. */
  rowClass?: (row: Row) => string | undefined
  /** Extra attributes for a row. */
  rowProps?: DataGridProps<Row>['rowProps']
  /** Row quick actions (see DataGrid.rowActions). */
  rowActions?: DataGridProps<Row>['rowActions']
  /** Expandable detail row of a data row (see DataGrid.renderSubRow). */
  renderSubRow?: (row: Row) => ReactNode
  /** Items appended to the context menu, acting on the selected data rows (group headers are left out). */
  menu?: (rows: Row[]) => ReturnType<NonNullable<DataGridProps<Row>['menu']>>
  /** Summary text of the selected data rows for "Ask the agent". */
  askText?: (rows: Row[]) => string | null
  /** Gray text at the bottom of a row's context menu. */
  rowInfo?: (row: Row) => string
  /**
   * Collapsed group keys (controlled); the "Other" group has key null written as the empty string "". With it, toggling only notifies through onCollapsedChange.
   * 收起的组（受控，组键；「其他」组的键写成空串 ""）。给了它，收起展开只经 onCollapsedChange 通知调用方。
   */
  collapsed?: ReadonlySet<string>
  /** Uncontrolled: group keys collapsed at first. 不受控时一开始就收起的组。 */
  defaultCollapsed?: readonly string[]
  /** Called when a group is collapsed or expanded; key is "" for the "Other" group. 收起或展开一组（「其他」的键是 ""）。 */
  onCollapsedChange?: (key: string, collapsed: boolean) => void
}

/** The row type inside the DataGrid: a data row or a synthetic group header. */
type Item<Row> = GroupedItem<Row>

const DEFAULT_OTHER = 'Other'
/** 受控的「其他」组键：组键本身不会是空串（空串归「其他」），所以空串可以代表它。 */
const OTHER_KEY = ''

const keyToId = (key: string): string => groupItemId(key === OTHER_KEY ? null : key)

/** 包一个列函数：数据行交给原函数，组头给 none。 */
function lift<Row, Out, None>(
  fn: ((row: Row) => Out) | undefined,
  none: None,
): ((item: Item<Row>) => Out | None) | undefined {
  return fn ? (item) => (item.kind === 'row' ? fn(item.row) : none) : undefined
}

/** 把调用方的列包成 DataGrid<Item> 的列：组头上所有列函数都当没有值，调用方的函数只会看到数据行。 */
function liftColumns<Row>(columns: readonly GridColumn<Row>[]): GridColumn<Item<Row>>[] {
  return columns.map((column) => {
    const { value, format, text, sort, tone, fill, heat, title, cell, render, csv, ...rest } = column
    const lifted: GridColumn<Item<Row>> = { ...rest }
    if (value) lifted.value = lift(value, undefined)
    if (format !== undefined) {
      lifted.format =
        typeof format === 'function'
          ? (item: Item<Row>): ColumnFormat => (item.kind === 'row' ? format(item.row) : {})
          : format
    }
    if (text) lifted.text = lift(text, '')
    if (sort) lifted.sort = lift(sort, undefined)
    if (tone) lifted.tone = lift(tone, undefined)
    if (fill) lifted.fill = lift(fill, undefined)
    if (heat) {
      const lifted_heat: GridHeat<Item<Row>> = { domain: heat.domain }
      if (heat.rank) lifted_heat.rank = lift(heat.rank, undefined)
      lifted.heat = lifted_heat
    }
    if (title) lifted.title = lift(title, undefined)
    if (cell) lifted.cell = lift(cell, null)
    if (render) lifted.render = lift(render, null)
    if (csv) lifted.csv = lift(csv, '')
    return lifted
  })
}

const dataRows = <Row,>(items: readonly Item<Row>[]): Row[] =>
  items.flatMap((item) => (item.kind === 'row' ? [item.row] : []))

/** 汇总的列配置：内置聚合原样给；函数聚合拿到的 rows 换回调用方的行。 */
function liftAggregates<Row>(
  columns: GridSummary<Row>['columns'] | undefined,
): GridSummary<Item<Row>>['columns'] | undefined {
  if (!columns) return undefined
  const lifted = (config: SummaryColumn<Row>): SummaryColumn<Item<Row>> => {
    const lift = (aggregate: Extract<SummaryColumn<Row>, { aggregate: unknown }>['aggregate']) =>
      typeof aggregate === 'function'
        ? (values: readonly number[], rows: readonly Item<Row>[]) => aggregate(values, dataRows(rows))
        : aggregate
    return typeof config === 'object' ? { ...config, aggregate: lift(config.aggregate) } : lift(config)
  }
  return Object.fromEntries(Object.entries(columns).map(([id, config]) => [id, config && lifted(config)]))
}

export function GroupedTable<Row extends object>({
  columns,
  rows,
  rowId,
  groupBy,
  groupHeading,
  otherLabel = DEFAULT_OTHER,
  groupMetric,
  groupOrder,
  groupSummary,
  groupAggregates,
  summary,
  onOpen,
  isOpened,
  rowClass,
  rowProps,
  rowActions,
  renderSubRow,
  menu,
  askText,
  rowInfo,
  collapsed,
  defaultCollapsed,
  onCollapsedChange,
  ...grid
}: GroupedTableProps<Row>) {
  const items = useMemo(
    () => flattenGroups(buildGroups(rows, { groupBy, metric: groupMetric, order: groupOrder })),
    [rows, groupBy, groupMetric, groupOrder],
  )
  const lifted = useMemo(() => liftColumns(columns), [columns])
  const liftedSummary = useMemo(
    () => summary?.map((entry) => ({ ...entry, columns: liftAggregates(entry.columns) ?? {} })),
    [summary],
  )
  const liftedGroupAggregates = useMemo(() => liftAggregates(groupAggregates), [groupAggregates])

  return (
    <DataGrid<Item<Row>>
      {...grid}
      columns={lifted}
      rows={items}
      rowId={(item) => (item.kind === 'row' ? rowId(item.row) : item.id)}
      rowSection={(item) =>
        item.kind === 'group' ? (item.group.other ? otherLabel : (groupHeading?.(item.group) ?? item.group.key)) : null
      }
      sectionSummary={(members, header) =>
        header.kind === 'group' && groupSummary
          ? groupSummary({ ...header.group, rows: dataRows(members), count: members.length })
          : null
      }
      sectionAggregates={liftedGroupAggregates}
      summary={liftedSummary}
      collapsedSections={collapsed ? new Set([...collapsed].map(keyToId)) : undefined}
      defaultCollapsedSections={defaultCollapsed?.map(keyToId)}
      onSectionCollapsedChange={
        onCollapsedChange
          ? (id, next) => {
              const key = groupKeyOfId(id)
              if (key !== undefined) onCollapsedChange(key ?? OTHER_KEY, next)
            }
          : undefined
      }
      onOpen={onOpen ? (item) => item.kind === 'row' && onOpen(item.row) : undefined}
      isOpened={isOpened ? (item) => item.kind === 'row' && isOpened(item.row) : undefined}
      rowClass={rowClass ? (item) => (item.kind === 'row' ? rowClass(item.row) : undefined) : undefined}
      rowProps={rowProps ? (item) => (item.kind === 'row' ? rowProps(item.row) : undefined) : undefined}
      rowActions={rowActions ? (item) => (item.kind === 'row' ? rowActions(item.row) : []) : undefined}
      renderSubRow={renderSubRow ? (item) => (item.kind === 'row' ? renderSubRow(item.row) : null) : undefined}
      menu={menu ? (selected) => menu(dataRows(selected)) : undefined}
      askText={askText ? (selected) => askText(dataRows(selected)) : undefined}
      rowInfo={rowInfo ? (item) => (item.kind === 'row' ? rowInfo(item.row) : '') : undefined}
    />
  )
}

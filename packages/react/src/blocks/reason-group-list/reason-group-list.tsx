// SPDX-License-Identifier: MIT
/**
 * Limit-up stocks grouped by reason: a reason filter (ChipGroup) over a DataGrid of collapsible group heads and their stocks.
 * 涨停原因分组（#11，复盘啦「涨停原因」对照）：顶上一排原因芯片（ChipGroup，可多选，不选是全部，芯片上写家数）；下面是 DataGrid：
 * 组头一行（展开箭头、原因、家数、最高板），展开时跟着组内个股（徽标与代码、连板、涨跌幅、首封、封单、成交额、别的原因标签）。
 * 组头点一下（或 Enter）收起 / 展开；个股行点一下（或 Enter）交给 onSelect。分组、次序、哪只票归哪个原因都照调用方给的，件不归类、不排序。
 * 表格手感照 TradingView 的列表（DataGrid 的紧凑行、tabular-nums、右对齐数字），组头取 Arc 的分组头（粗体加次要灰的计数）；涨跌色走 ChangeText 的 tone（跟 data-updown）。
 */
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/cn.ts'
import { formatPercentChange, formatVolume } from '../../lib/chart/format/index.ts'
import { ChangeText } from '../../quotes/change-text.tsx'
import { ChipGroup } from '../../patterns/chip-group.tsx'
import { SymbolMark } from '../../quotes/symbol-mark.tsx'
import { Tag } from '../../katana/tag.tsx'
import { DataGrid } from '../data-grid/data-grid.tsx'
import type { GridColumn } from '../data-grid/columns.ts'
import type { GridColumnLayout } from '../data-grid/data-grid-props.ts'
import { reasonRows, type ReasonGroup, type ReasonRow, type ReasonStock } from './reason-group-model.ts'

export type { ReasonGroup, ReasonStock } from './reason-group-model.ts'

/** Texts of ReasonGroupList (the package ships no text). */
export type ReasonGroupListLabels = {
  /** Accessible name of the table. 表的读屏名。 */
  list: string
  /** Accessible name of the reason chips. 原因芯片组的读屏名。 */
  filter: string
  /** Clear button of the chips; no button without it. 芯片清除钮的读屏名。 */
  clear?: string
  /** Stock count in a group head (「6 家」). 组头的家数。 */
  count: (n: number) => string
  /** Highest board in a group head (「最高 4 板」). 组头的最高板。 */
  highest: (board: number) => string
  /** Board cell (「3 板」, 「首板」). 连板列的写法。 */
  board: (board: number) => string
  /** Column headers. 列头。 */
  columns: {
    name: string
    board: string
    change: string
    firstSeal: string
    sealAmount: string
    turnover: string
    tags: string
  }
  /** Text when no group is left. 没有分组时的字。 */
  empty: string
}

export type ReasonGroupListProps = {
  /** Groups in the caller's order. 分组，按调用方的次序。 */
  groups: readonly ReasonGroup[]
  /** Texts. */
  labels: ReasonGroupListLabels
  /** How an amount (seal, turnover) is written; defaults to the short volume form (520.00 M). 金额的写法。 */
  formatAmount?: (value: number) => string
  /** Reason ids kept by the chips (controlled); empty keeps all. 芯片选中的原因（受控），空是全部。 */
  filter?: readonly string[]
  /** Called when the chips change. */
  onFilterChange?: (filter: string[]) => void
  /** Group ids that start collapsed. 一开始收起的组。 */
  defaultCollapsed?: readonly string[]
  /** Open a stock row (click or Enter). 点个股行。 */
  onSelect?: (stock: ReasonStock, group: ReasonGroup) => void
  /** Extra class name on the root. */
  className?: string
}

/** 表里的一行：组头或个股，连同调用方写法算好的字（列定义是模块级常量，字从行上读）。 */
type Line = {
  id: string
  row: ReasonRow
  head?: { count: string; highest: string }
  board?: string
  seal?: string
  turnover?: string
}

const DASH = '—'

const COLUMNS: readonly GridColumn<Line>[] = [
  {
    id: 'name',
    type: 'custom',
    rowHeader: true,
    text: (line) =>
      line.row.kind === 'group' ? line.row.group.reason : `${line.row.stock.code} ${line.row.stock.name}`,
    cell: (line) =>
      line.row.kind === 'group' ? (
        <span className="k-reason-head" data-slot="reason-head">
          <ChevronRight className="k-reason-chevron" size={12} aria-hidden="true" />
          <span className="k-reason-name">{line.row.group.reason}</span>
          <span className="k-reason-count">{line.head?.count}</span>
          <span className="k-reason-highest">{line.head?.highest}</span>
        </span>
      ) : (
        <span className="k-reason-stock">
          <SymbolMark symbol={line.row.stock.code} name={line.row.stock.name} src={line.row.stock.logo} size="sm" />
          <span className="k-reason-code">{line.row.stock.code}</span>
          <span className="k-reason-sub">{line.row.stock.name}</span>
        </span>
      ),
  },
  { id: 'board', type: 'custom', text: (line) => line.board ?? '', cell: (line) => line.board ?? null },
  {
    id: 'change',
    type: 'custom',
    text: (line) => (line.row.kind === 'stock' ? formatPercentChange(line.row.stock.change) : ''),
    cell: (line) => (line.row.kind === 'stock' ? <ChangeText value={line.row.stock.change} /> : null),
  },
  {
    id: 'firstSeal',
    type: 'text',
    value: (line) => (line.row.kind === 'stock' ? (line.row.stock.firstSeal ?? DASH) : ''),
  },
  { id: 'sealAmount', type: 'custom', text: (line) => line.seal ?? '', cell: (line) => line.seal ?? null },
  { id: 'turnover', type: 'custom', text: (line) => line.turnover ?? '', cell: (line) => line.turnover ?? null },
  {
    id: 'tags',
    type: 'custom',
    text: (line) => (line.row.kind === 'stock' ? (line.row.stock.tags ?? []).join(' ') : ''),
    cell: (line) =>
      line.row.kind === 'stock' && line.row.stock.tags?.length ? (
        <span className="k-reason-tags">
          {line.row.stock.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </span>
      ) : null,
  },
]

export function ReasonGroupList({
  groups,
  labels,
  formatAmount = formatVolume,
  filter: controlled,
  onFilterChange,
  defaultCollapsed = [],
  onSelect,
  className,
}: ReasonGroupListProps) {
  const [own, setOwn] = useState<readonly string[]>([])
  const filter = controlled ?? own
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set(defaultCollapsed))
  const amount = (value: number | undefined) => (value === undefined || !value ? DASH : formatAmount(value))
  const lines: Line[] = reasonRows(groups, filter, collapsed).map((row) =>
    row.kind === 'group'
      ? {
          id: row.id,
          row,
          head: { count: labels.count(row.group.items.length), highest: labels.highest(row.highest) },
        }
      : {
          id: row.id,
          row,
          board: labels.board(row.stock.board),
          seal: amount(row.stock.sealAmount),
          turnover: amount(row.stock.turnover),
        },
  )
  const layout: GridColumnLayout[] = [
    { id: 'name', label: labels.columns.name, width: 200, visible: true },
    { id: 'board', label: labels.columns.board, width: 56, visible: true, align: 'end' },
    { id: 'change', label: labels.columns.change, width: 72, visible: true },
    { id: 'firstSeal', label: labels.columns.firstSeal, width: 56, visible: true, align: 'end' },
    { id: 'sealAmount', label: labels.columns.sealAmount, width: 80, visible: true, align: 'end' },
    { id: 'turnover', label: labels.columns.turnover, width: 80, visible: true, align: 'end' },
    { id: 'tags', label: labels.columns.tags, width: 120, visible: true },
  ]
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const setFilter = (next: string[]) => {
    if (controlled === undefined) setOwn(next)
    onFilterChange?.(next)
  }

  return (
    <div className={cn('k-reason', className)} data-slot="reason-group-list">
      <ChipGroup
        className="k-reason-chips"
        items={groups.map((group) => ({ value: group.id, label: group.reason, count: group.items.length }))}
        value={filter}
        onValueChange={setFilter}
        label={labels.filter}
        labels={{ clear: labels.clear }}
      />
      {lines.length === 0 ? (
        <p className="k-reason-empty" role="status">
          {labels.empty}
        </p>
      ) : (
        <DataGrid
          classNames={{ root: 'k-reason-grid' }}
          columns={COLUMNS}
          layout={layout}
          rows={lines}
          rowId={(line) => line.id}
          label={labels.list}
          presorted
          rowTree={(line) => (line.row.kind === 'group' ? { level: 1, expanded: !line.row.collapsed } : { level: 2 })}
          rowProps={(line) => ({
            'data-kind': line.row.kind,
            'data-group': line.row.group.id,
            'data-code': line.row.kind === 'stock' ? line.row.stock.code : undefined,
          })}
          onOpen={(line) => {
            if (line.row.kind === 'group') toggle(line.row.group.id)
            else onSelect?.(line.row.stock, line.row.group)
          }}
          density="default"
          selectable
          stretch
          fit
          maxHeight={560}
        />
      )}
    </div>
  )
}

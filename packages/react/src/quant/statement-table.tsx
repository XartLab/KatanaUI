// SPDX-License-Identifier: MIT
// 财务报表表（KATANAview #2395）：科目成树（缩进与字重分层级，小计加粗，合计上方一条细线，父科目能折叠），期间做列（从早到晚），
// 工具条切原值 / 同比 / 环比，给了频率就再切季 / 年 / TTM（数据由调用方换，件不聚合）。更正过的格（revision > 1）右上一个小点，悬停写说明。
// 功能参照 TradingView 品种页 Financials 与 Koyfin FA（只取有哪些部分），表本身是 DataGrid：横向滚动时科目列粘在左边，复制、导出仍是全部列，
// 折叠只影响显示（导出的是看得见的行，跟 DataGrid 一致）。不画格子线，块与块靠细线与留白（KATANAview invariants「版式」）。文字全由 props 传。
import { ChevronRightIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '../lib/cn.ts'
import { formatCompactNumber, formatPercentChange } from '../lib/chart/format/index.ts'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import type { GridColumn } from '../blocks/data-grid/columns.ts'
import { DataGrid } from '../blocks/data-grid/data-grid.tsx'
import type { GridColumnLayout } from '../blocks/data-grid/data-grid-props.ts'
import {
  changeAt,
  revisionOf,
  statementRows,
  valueOf,
  type StatementItem,
  type StatementMode,
  type StatementPeriod,
  type StatementRow,
  type StatementValue,
  type StatementValues,
} from './statement-model.ts'

export type {
  StatementItem,
  StatementItemKind,
  StatementMode,
  StatementPeriod,
  StatementValue,
  StatementValues,
} from './statement-model.ts'

export type StatementTableLabels = {
  /** 表的读屏名。 */
  table: string
  /** 科目列的列头。 */
  item: string
  /** 原值 / 同比 / 环比开关的读屏名与三个字。 */
  modeGroup: string
  value: string
  yoy: string
  qoq: string
  /** 频率开关的读屏名（给了 frequencies 才画）。 */
  frequencyGroup?: string
  /** 折叠钮的读屏名（「收起 营业收入」）。 */
  collapse: (item: StatementItem) => string
  expand: (item: StatementItem) => string
  /** 更正标记的提示（第几版）。 */
  revised: (revision: number, note?: string) => string
  /** 没有科目时写什么。 */
  empty: string
}

export type StatementTableProps<F extends string = string> = {
  items: readonly StatementItem[]
  /** 期间，从早到晚。 */
  periods: readonly StatementPeriod[]
  values: StatementValues
  labels: StatementTableLabels
  /** 一年几期：季报 4、年报 1；同比往前比这么多列。默认 4。 */
  periodsPerYear?: number
  /** 原值怎么写；默认 compact（K / M / B）。 */
  formatValue?: (value: number, item: StatementItem) => string
  /** 显示哪种数；不给用内部状态（默认原值）。 */
  mode?: StatementMode
  onModeChange?: (mode: StatementMode) => void
  /** 频率开关（季 / 年 / TTM）：给了就画，选中哪个由调用方控制并换 periods 与 values。 */
  frequencies?: readonly { id: F; label: string }[]
  frequency?: F
  onFrequencyChange?: (frequency: F) => void
  /** 一开始收起的科目。 */
  defaultCollapsed?: readonly string[]
  /** 来源一行。 */
  source?: string
  maxHeight?: number
  className?: string
}

type Line = {
  row: StatementRow
  values: Readonly<Record<string, StatementValue>> | undefined
  ctx: Ctx
}

type Ctx = {
  mode: StatementMode
  periods: readonly StatementPeriod[]
  perYear: number
  format: (value: number, item: StatementItem) => string
  labels: StatementTableLabels
  toggle: (id: string) => void
}

const DASH = '—'
const ITEM_W = 220
const PERIOD_W = 104

function cellText(line: Line, index: number): string {
  const { ctx } = line
  const period = ctx.periods[index]
  if (!period) return DASH
  if (ctx.mode === 'value') {
    const value = valueOf(line.values?.[period.id])
    return value === null || !Number.isFinite(value) ? DASH : ctx.format(value, line.row.item)
  }
  const change = changeAt(line.values, ctx.periods, index, ctx.mode, ctx.perYear)
  return change === null ? DASH : formatPercentChange(change * 100)
}

function itemColumn(): GridColumn<Line> {
  return {
    id: 'item',
    type: 'custom',
    rowHeader: true,
    priority: 1,
    text: (line) => line.row.item.label,
    cell: (line) => {
      const { row, ctx } = line
      return (
        <span className="k-st-item" style={{ paddingInlineStart: (row.level - 1) * 16 }}>
          {row.hasChildren ? (
            <button
              type="button"
              className="k-st-toggle"
              data-slot="statement-toggle"
              aria-label={row.expanded ? ctx.labels.collapse(row.item) : ctx.labels.expand(row.item)}
              aria-expanded={row.expanded}
              onClick={(event) => {
                event.stopPropagation()
                ctx.toggle(row.item.id)
              }}
            >
              <ChevronRightIcon size={12} aria-hidden="true" />
            </button>
          ) : (
            <span className="k-st-toggle-space" aria-hidden="true" />
          )}
          <span className="k-st-label">{row.item.label}</span>
        </span>
      )
    },
  }
}

/** 期间列的优先级：最新的一期最先保留（容器放不下时先收起最早的几期，表头右端写「+N 列」）。 */
function periodColumn(period: StatementPeriod, index: number, count: number): GridColumn<Line> {
  return {
    id: `p:${period.id}`,
    type: 'custom',
    priority: count - index + 1,
    text: (line) => cellText(line, index),
    csv: (line) => {
      if (line.ctx.mode !== 'value') {
        const change = changeAt(line.values, line.ctx.periods, index, line.ctx.mode, line.ctx.perYear)
        return change === null ? '' : String(change)
      }
      const value = valueOf(line.values?.[period.id])
      return value === null ? '' : String(value)
    },
    cell: (line) => {
      const text = cellText(line, index)
      const revision = revisionOf(line.values?.[period.id])
      const cell = line.values?.[period.id]
      const note = cell !== null && typeof cell === 'object' ? cell.note : undefined
      const change =
        line.ctx.mode === 'value'
          ? null
          : changeAt(line.values, line.ctx.periods, index, line.ctx.mode, line.ctx.perYear)
      return (
        <span
          className="k-st-num"
          data-slot="statement-cell"
          data-tone={change === null ? undefined : change > 0 ? 'up' : change < 0 ? 'down' : undefined}
        >
          {text}
          {revision !== undefined && revision > 1 && (
            <i
              className="k-st-revised"
              data-slot="statement-revised"
              title={line.ctx.labels.revised(revision, note)}
              aria-label={line.ctx.labels.revised(revision, note)}
              role="img"
            />
          )}
        </span>
      )
    },
  }
}

export function StatementTable<F extends string = string>({
  items,
  periods,
  values,
  labels,
  periodsPerYear = 4,
  formatValue,
  mode: modeProp,
  onModeChange,
  frequencies,
  frequency,
  onFrequencyChange,
  defaultCollapsed,
  source,
  maxHeight = 560,
  className,
}: StatementTableProps<F>) {
  const [modeState, setMode] = useState<StatementMode>('value')
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set(defaultCollapsed ?? []))
  const mode = modeProp ?? modeState
  const columns = useMemo(
    () => [itemColumn(), ...periods.map((period, index) => periodColumn(period, index, periods.length))],
    [periods],
  )
  const layout: GridColumnLayout[] = [
    { id: 'item', label: labels.item, width: ITEM_W, visible: true, fixed: true },
    ...periods.map((period) => ({
      id: `p:${period.id}`,
      label: period.label,
      width: PERIOD_W,
      visible: true,
      align: 'end' as const,
    })),
  ]
  const ctx: Ctx = {
    mode,
    periods,
    perYear: Math.max(1, Math.round(periodsPerYear)),
    format: formatValue ?? ((value) => formatCompactNumber(value)),
    labels,
    toggle: (id) => {
      const next = new Set(collapsed)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      setCollapsed(next)
    },
  }
  const lines: Line[] = statementRows(items, collapsed).map((row) => ({ row, values: values[row.item.id], ctx }))

  return (
    <figure className={cn('k-st', className)} data-slot="statement-table" data-mode={mode}>
      <div className="k-st-head">
        <ToggleGroup
          size="sm"
          aria-label={labels.modeGroup}
          value={mode}
          onValueChange={(next) => {
            if (next !== 'value' && next !== 'yoy' && next !== 'qoq') return
            setMode(next)
            onModeChange?.(next)
          }}
        >
          <ToggleGroupItem value="value">{labels.value}</ToggleGroupItem>
          <ToggleGroupItem value="yoy">{labels.yoy}</ToggleGroupItem>
          <ToggleGroupItem value="qoq">{labels.qoq}</ToggleGroupItem>
        </ToggleGroup>
        {frequencies && frequencies.length > 1 && (
          <ToggleGroup
            size="sm"
            aria-label={labels.frequencyGroup ?? labels.table}
            value={frequency ?? frequencies[0]!.id}
            onValueChange={(next) => {
              const hit = frequencies.find((item) => item.id === next)
              if (hit) onFrequencyChange?.(hit.id)
            }}
          >
            {frequencies.map((item) => (
              <ToggleGroupItem key={item.id} value={item.id}>
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </div>
      {lines.length === 0 ? (
        <p className="k-st-empty" data-slot="statement-empty" role="status">
          {labels.empty}
        </p>
      ) : (
        <DataGrid
          classNames={{ root: 'k-st-grid' }}
          columns={columns}
          layout={layout}
          rows={lines}
          rowId={(line) => line.row.item.id}
          label={labels.table}
          presorted
          rowTree={(line) => ({
            level: line.row.level,
            expanded: line.row.hasChildren ? line.row.expanded : undefined,
          })}
          rowProps={(line) => ({ 'data-kind': line.row.item.kind ?? 'line', 'data-level': String(line.row.level) })}
          rowClass={(line) => cn('k-st-row', `is-${line.row.item.kind ?? 'line'}`)}
          density="default"
          selectable={false}
          fit
          maxHeight={maxHeight}
        />
      )}
      {source === undefined ? null : <p className="k-st-source">{source}</p>}
    </figure>
  )
}

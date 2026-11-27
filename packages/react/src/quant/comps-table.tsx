// SPDX-License-Identifier: MIT
// 同业对比表（KATANAview #2395）：一行一家公司、一列一个指标；本公司置顶并高亮、不参与排序；表尾中位数、均值两行（对全部行算）；
// 每格按「相对中位数好多少」着强度底色（方向由指标的 better 定，没写就只写数不着色）；指标分组（估值 / 增长 / 盈利）用表上方的列集页签切换。
// 功能参照 Koyfin Comps、Bloomberg RV（只取有哪些部分）；表本身是 DataGrid（列优先级、横向滚动、复制导出都是它的），页签是 ColumnSetTabs。
// 颜色只由 token 给，底色是 DataGrid 的 heat（涨色 = 好于中位，跌色 = 差于中位），每格仍写原数，颜色只是辅助。文字全由 props 传。
import { useState } from 'react'
import { cn } from '../lib/cn.ts'
import type { GridColumn } from '../blocks/data-grid/columns.ts'
import { ColumnSetTabs } from '../blocks/data-grid/column-set-tabs.tsx'
import { DataGrid } from '../blocks/data-grid/data-grid.tsx'
import type { GridColumnLayout } from '../blocks/data-grid/data-grid-props.ts'
import type { GridSummary } from '../blocks/data-grid/grid-summary-row.tsx'
import type { SortSpec } from '../blocks/data-grid/model.ts'
import {
  columnMedian,
  finite,
  goodness,
  goodnessLimit,
  orderComps,
  type CompsBetter,
  type CompsRow,
} from './comps-model.ts'

export type { CompsBetter, CompsRow } from './comps-model.ts'

/** 一个指标列。format 写原数（倍数、百分比由调用方定）；better 不写不着色；group 是列集页签的 id。 */
export type CompsMetric = {
  id: string
  label: string
  /** 表头第二行的小字（口径：TTM、FY2026E）。 */
  sub?: string
  group?: string
  better?: CompsBetter
  format: (value: number) => string
  width?: number
}

export type CompsTableLabels = {
  table: string
  /** 公司那一列的列头。 */
  symbol: string
  /** 列集页签那一行的读屏名。 */
  groups: string
  /** 表尾两行的行名。 */
  median: string
  mean: string
  /** 本公司那一行的标记字（「本公司」），读屏也念。 */
  subject: string
  empty: string
}

export type CompsTableProps = {
  rows: readonly CompsRow[]
  metrics: readonly CompsMetric[]
  /** 列集页签：给了就画，一组一个；第一组默认选中。 */
  groups?: readonly { id: string; label: string }[]
  labels: CompsTableLabels
  source?: string
  maxHeight?: number
  className?: string
}

type Line = { row: CompsRow; labels: CompsTableLabels }

const SYMBOL_W = 180
const METRIC_W = 96

function symbolColumn(): GridColumn<Line> {
  return {
    id: 'symbol',
    type: 'custom',
    rowHeader: true,
    priority: 1,
    text: (line) => line.row.symbol,
    sort: (line) => line.row.symbol,
    cell: (line) => (
      <span className="k-cp-symbol">
        <span className="k-cp-code">{line.row.symbol}</span>
        {line.row.name && <span className="k-cp-name">{line.row.name}</span>}
        {line.row.subject && (
          <span className="k-cp-subject" data-slot="comps-subject">
            {line.labels.subject}
          </span>
        )}
      </span>
    ),
  }
}

function metricColumn(metric: CompsMetric, rows: readonly CompsRow[]): GridColumn<Line> {
  const mid = columnMedian(rows, metric.id)
  const limit = goodnessLimit(rows, metric.id, metric.better)
  return {
    id: metric.id,
    type: 'number',
    // value 给 heat 用（好于中位多少）；屏幕上的字、排序、导出都是原数。
    value: (line) => goodness(line.row.values[metric.id], mid, metric.better) ?? undefined,
    text: (line) => {
      const value = line.row.values[metric.id]
      return finite(value) ? metric.format(value) : '—'
    },
    sort: (line) => {
      const value = line.row.values[metric.id]
      return finite(value) ? value : undefined
    },
    csv: (line) => {
      const value = line.row.values[metric.id]
      return finite(value) ? String(value) : ''
    },
    heat: limit === null ? undefined : { domain: [-limit, limit] },
  }
}

/** 表尾的聚合直接读行上的原数（列的 value 是给底色用的偏离，不能拿来求中位数）。 */
function rawAggregate(metric: CompsMetric, kind: 'median' | 'mean') {
  return {
    aggregate: (_values: readonly number[], lines: readonly Line[]) => {
      const nums = lines.flatMap((line) =>
        finite(line.row.values[metric.id]) ? [line.row.values[metric.id] as number] : [],
      )
      if (nums.length === 0) return null
      if (kind === 'mean') return nums.reduce((sum, value) => sum + value, 0) / nums.length
      const sorted = nums.toSorted((a, b) => a - b)
      const half = sorted.length >> 1
      return sorted.length % 2 === 1 ? sorted[half]! : (sorted[half - 1]! + sorted[half]!) / 2
    },
    text: (value: number) => metric.format(value),
  }
}

export function CompsTable({ rows, metrics, groups, labels, source, maxHeight = 520, className }: CompsTableProps) {
  const [sort, setSort] = useState<SortSpec | null>(null)
  const initial: GridColumnLayout[] = [
    { id: 'symbol', label: labels.symbol, width: SYMBOL_W, visible: true, fixed: true },
    ...metrics.map((metric) => ({
      id: metric.id,
      label: metric.label,
      sub: metric.sub,
      width: metric.width ?? METRIC_W,
      visible: groups && groups.length > 0 ? metric.group === groups[0]!.id : true,
      align: 'end' as const,
    })),
  ]
  const [layout, setLayout] = useState<GridColumnLayout[]>(initial)
  const columns = [symbolColumn(), ...metrics.map((metric) => metricColumn(metric, rows))]
  const lines: Line[] = orderComps(rows, sort).map((row) => ({ row, labels }))
  const summary: GridSummary<Line>[] = [
    {
      id: 'median',
      label: labels.median,
      columns: Object.fromEntries(metrics.map((m) => [m.id, rawAggregate(m, 'median')])),
    },
    {
      id: 'mean',
      label: labels.mean,
      columns: Object.fromEntries(metrics.map((m) => [m.id, rawAggregate(m, 'mean')])),
    },
  ]
  const sets = (groups ?? []).map((group) => ({
    id: group.id,
    label: group.label,
    columns: ['symbol', ...metrics.filter((metric) => metric.group === group.id).map((metric) => metric.id)],
  }))

  return (
    <figure className={cn('k-cp', className)} data-slot="comps-table">
      {sets.length > 1 && (
        <ColumnSetTabs layout={layout} onLayoutChange={setLayout} sets={sets} label={labels.groups} />
      )}
      {lines.length === 0 ? (
        <p className="k-cp-empty" data-slot="comps-empty" role="status">
          {labels.empty}
        </p>
      ) : (
        <DataGrid
          classNames={{ root: 'k-cp-grid' }}
          columns={columns}
          layout={layout}
          onLayoutChange={setLayout}
          rows={lines}
          rowId={(line) => line.row.id}
          label={labels.table}
          sort={sort}
          onSortChange={setSort}
          presorted
          summary={summary}
          rowProps={(line) => ({ 'data-subject': line.row.subject ? 'true' : undefined })}
          rowClass={(line) => (line.row.subject ? 'is-subject' : undefined)}
          density="default"
          selectable={false}
          fit
          maxHeight={maxHeight}
        />
      )}
      {source === undefined ? null : <p className="k-cp-source">{source}</p>}
    </figure>
  )
}

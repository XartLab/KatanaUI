// SPDX-License-Identifier: MIT
// SeriesExplorer 的公开类型：明细表的列、文案、属性。从 series-explorer.tsx 拆出（G5），名字与形状不变。
import type { BrushLabels } from '../../quant/brush-chart.tsx'
import type { ChartActionsLabels } from '../../lib/chart/chart-kit/chart-actions.tsx'
import type { KpiDef, RangeDef, SeriesDef, SeriesPoint } from './series-explorer-model.ts'

export type SeriesExplorerColumn = {
  key: string
  label: string
  /** 这一行这一格写什么字。 */
  text: (point: SeriesPoint) => string
  /** 给了就按正负着涨跌色（盈亏列）；不给中性色。费税列别给：成本不是亏损。 */
  tone?: (point: SeriesPoint) => number | null
}

export type SeriesExplorerLabels = {
  /** 图的读屏名。 */
  chart: string
  /** 区间按钮那一组的读屏名。 */
  ranges: string
  /** 指标页签那一组的读屏名。 */
  metrics: string
  /** 「对比上一期」开关的字。 */
  compare: string
  /** 悬停框里上一期那一行的名字。 */
  previous: string
  /** 明细表的读屏名。 */
  table: string
  /** 明细表第一列（时间）的表头。 */
  time: string
  /** 一个点都没有时写的字。 */
  empty: string
  /** 迷你线的读屏名（整句，拿到指标名）。 */
  spark: (metric: string) => string
  /** 限额线的名字（悬停框里与读屏）。 */
  limit: string
  /** 页脚来源行（例「来源 / 账户服务日结 · 09-30 收盘」）；不给不画。 */
  source?: string
  /** 图右上三件。 */
  actions: ChartActionsLabels
  brush: BrushLabels
  /** 对账顶行的字；不给 reconcile 时用不到。 */
  reconcile?: { open: string; close: string; diff: string; ok: string; warn: string; unit?: string }
}

export type SeriesExplorerProps = {
  points: readonly SeriesPoint[]
  series: readonly SeriesDef[]
  ranges: readonly RangeDef[]
  /** 不给取 ranges 的最后一个。 */
  defaultRange?: string
  /** 指标：每个是一张瓦片、一个页签。 */
  kpis: readonly KpiDef[]
  columns: readonly SeriesExplorerColumn[]
  labels: SeriesExplorerLabels
  /** 时间戳写成什么：横轴、悬停框、明细表第一列都用它（ISO 次序）；时区与语言由调用方定。 */
  formatAt: (at: number) => string
  /** 图上的数写成什么：纵轴刻度与悬停框。 */
  formatValue: (value: number) => string
  /** 相对上一期的变化（比例，0.12 是涨 12%）写成什么。 */
  formatChange: (ratio: number) => string
  /** 对账：权益序列、净盈亏序列（可选出入金序列）的键，与区间前的期初权益。期末 − 期初 = Σ净盈亏 + 出入金，对不上就亮 warn 灯并写差额。 */
  reconcile?: {
    net: string
    equity: string
    cashflow?: string
    openingEquity: number
    format: (value: number) => string
  }
  /** 标题下一行的元信息（等宽大写小字，例「RUN 2C91 · 2025-01 → 2026-12 · CNY」）；不给不画。 */
  meta?: string
  /** 图上的事件点：按时间落在序列的点上，画编号引线（01、02……按给的次序编号）。 */
  events?: readonly { at: number; label: string }[]
  /** 导出与全屏回调不给就不画那个按钮。 */
  onExport?: () => void
  onFullscreen?: () => void
  /** 初始展开哪个指标；null 是收起。不给展开第一个。 */
  defaultMetric?: string | null
  /** 图高（px）。 */
  chartHeight?: number
  className?: string
}

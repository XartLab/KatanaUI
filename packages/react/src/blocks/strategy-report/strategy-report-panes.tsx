// SPDX-License-Identifier: MIT
/**
 * Pieces of StrategyReport: metric values and tables, histograms and the analysis, trades and properties panes.
 * StrategyReport 的零件与各页签（体检 §7 从 strategy-report.tsx 拆出）。
 */
import { useMemo, useState } from 'react'
import { ToneText } from '../../quotes/tone-text.tsx'
import { DataGrid, type GridColumnLayout } from '../data-grid/data-grid.tsx'
import type { GridColumn } from '../data-grid/columns.ts'
import type { SortSpec } from '../data-grid/model.ts'
import {
  ANALYSIS_FACTS,
  METRICS,
  SIDES,
  formatMetric,
  toneOf,
  type Metric,
  type MetricKey,
} from './strategy-report-metrics.ts'
import {
  cumulativeById,
  histogram,
  resultSequence,
  type Histogram,
  type ReportStats,
  type ReportTrade,
  type SideFilter,
} from './strategy-report-model.ts'
import type {
  StrategyReportFormat,
  StrategyReportLabels,
  StrategyReportPropertyGroup,
} from './strategy-report-types.ts'

export function Value({
  metric,
  value,
  format,
}: {
  metric: Metric
  value: number | null
  format: StrategyReportFormat
}) {
  const text = formatMetric(metric, value, format)
  // 胜率这类不是盈亏的比例：不带正负号、不着涨跌色（percent 的写法由调用方定，带符号的写法在这里去掉）。
  if (metric.plain) return <span>{text.replace(/^[+-]/, '')}</span>
  return metric.signed && value !== null ? <ToneText tone={toneOf(value)}>{text}</ToneText> : <span>{text}</span>
}

/** 多空与全部三列并排的指标表。 */
export function MetricTable({
  rows,
  columns,
  active,
  labels,
  format,
  caption,
}: {
  rows: readonly Exclude<MetricKey, 'buyHold'>[]
  columns: Record<SideFilter, ReportStats>
  active: SideFilter
  labels: StrategyReportLabels
  format: StrategyReportFormat
  caption: string
}) {
  return (
    <table className="k-sr-table k-table-comfortable" data-slot="strategy-report-table">
      <caption className="k-sr-sr">{caption}</caption>
      <thead>
        <tr>
          <th scope="col" />
          {SIDES.map((side) => (
            <th key={side} scope="col" data-side={side} data-active={side === active ? '' : undefined}>
              {labels.side[side]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((key) => (
          <tr key={key} data-metric={key}>
            <th scope="row">{labels.metrics[key]}</th>
            {SIDES.map((side) => (
              <td key={side} data-side={side} data-active={side === active ? '' : undefined}>
                <Value metric={METRICS[key]} value={METRICS[key].get(columns[side])} format={format} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const HIST = { width: 320, height: 150, left: 28, right: 8, top: 8, bottom: 22 }

/** 直方图：柱高是笔数；颜色用语义（盈亏分布里 0 以上是涨色面、以下是跌色面），读数在提示与读屏名里。 */
export function Bars({
  data,
  label,
  fmtEdge,
  bar,
  signed,
  slot,
}: {
  data: Histogram
  label: string
  fmtEdge: (value: number) => string
  bar: (from: string, to: string, count: number) => string
  signed: boolean
  slot: string
}) {
  const { edges, counts } = data
  if (counts.length === 0) return null
  const max = Math.max(...counts, 1)
  const plotW = HIST.width - HIST.left - HIST.right
  const plotH = HIST.height - HIST.top - HIST.bottom
  const w = plotW / counts.length
  const every = Math.max(1, Math.ceil(edges.length / 6))
  return (
    <svg
      className="k-sr-bars"
      data-slot={slot}
      viewBox={`0 0 ${HIST.width} ${HIST.height}`}
      role="group"
      aria-label={label}
    >
      {[0, 0.5, 1].map((t) => (
        <g key={t} className="k-sr-gridline">
          <line
            x1={HIST.left}
            x2={HIST.width - HIST.right}
            y1={HIST.top + plotH * (1 - t)}
            y2={HIST.top + plotH * (1 - t)}
          />
          <text x={HIST.left - 4} y={HIST.top + plotH * (1 - t)} dy="0.35em" textAnchor="end">
            {Math.round(max * t)}
          </text>
        </g>
      ))}
      {counts.map((count, i) => {
        const h = (count / max) * plotH
        const from = edges[i]!
        const to = edges[i + 1]!
        const tone = !signed ? 'flat' : (from + to) / 2 >= 0 ? 'up' : 'down'
        return (
          <rect
            key={i}
            className="k-sr-bar"
            data-tone={tone}
            data-count={count}
            x={HIST.left + i * w + 1}
            y={HIST.top + plotH - h}
            width={Math.max(0, w - 2)}
            height={h}
            role="img"
            aria-label={bar(fmtEdge(from), fmtEdge(to), count)}
          >
            <title>{bar(fmtEdge(from), fmtEdge(to), count)}</title>
          </rect>
        )
      })}
      {edges.map((edge, i) =>
        i % every === 0 ? (
          <text
            key={i}
            className="k-sr-edge"
            x={HIST.left + i * w}
            y={HIST.height - 6}
            textAnchor={i === edges.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'}
          >
            {fmtEdge(edge)}
          </text>
        ) : null,
      )}
    </svg>
  )
}

type PaneProps = { shown: readonly ReportTrade[]; labels: StrategyReportLabels; format: StrategyReportFormat }

/** 交易分析：盈亏分布、持仓时长分布、连续盈亏、几项事实。 */
export function AnalysisPane({ shown, current, labels, format }: PaneProps & { current: ReportStats }) {
  const sequence = useMemo(() => resultSequence(shown), [shown])
  const pnlHist = useMemo(
    () =>
      histogram(
        shown.map((t) => t.pnl),
        10,
      ),
    [shown],
  )
  const durationHist = useMemo(
    () =>
      histogram(
        shown.map((t) => t.exitTime - t.entryTime),
        8,
      ),
    [shown],
  )
  return shown.length === 0 ? (
    <div className="k-sr-empty">{labels.empty}</div>
  ) : (
    <>
      <div className="k-sr-charts">
        <figure className="k-sr-figure">
          <figcaption>{labels.analysis.pnlDistribution}</figcaption>
          <Bars
            data={pnlHist}
            label={labels.analysis.pnlDistribution}
            fmtEdge={(v) => format.money(v)}
            bar={labels.analysis.bar}
            signed
            slot="strategy-report-pnl-hist"
          />
        </figure>
        <figure className="k-sr-figure">
          <figcaption>{labels.analysis.durationDistribution}</figcaption>
          <Bars
            data={durationHist}
            label={labels.analysis.durationDistribution}
            fmtEdge={(v) => format.duration(v)}
            bar={labels.analysis.bar}
            signed={false}
            slot="strategy-report-duration-hist"
          />
        </figure>
      </div>
      <figure className="k-sr-figure">
        <figcaption>{labels.analysis.streaks}</figcaption>
        <ol className="k-sr-streaks" data-slot="strategy-report-streaks" aria-label={labels.analysis.streaks}>
          {sequence.map((result, i) => (
            <li key={i} className="k-sr-streak" data-result={result} title={labels.analysis.streakItem(i + 1, result)}>
              <span className="k-sr-sr">{labels.analysis.streakItem(i + 1, result)}</span>
            </li>
          ))}
        </ol>
        <p className="k-sr-legend">
          <span data-result="win">{labels.analysis.win}</span>
          <span data-result="loss">{labels.analysis.loss}</span>
          <span data-result="flat">{labels.analysis.flat}</span>
        </p>
      </figure>
      <dl className="k-sr-facts" aria-label={labels.analysis.facts} data-slot="strategy-report-facts">
        {ANALYSIS_FACTS.map((key) => (
          <div key={key} data-metric={key}>
            <dt>{labels.metrics[key]}</dt>
            <dd>
              <Value metric={METRICS[key]} value={METRICS[key].get(current)} format={format} />
            </dd>
          </div>
        ))}
      </dl>
    </>
  )
}

/** 交易列表的排序与展开：状态放在 StrategyReport 里，切页签（内容卸载）回来不丢。 */
export function useTradesState() {
  const [sort, setSort] = useState<SortSpec | null>(null)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())
  const setOpen = (id: string, open: boolean) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (open) next.add(id)
      else next.delete(id)
      return next
    })
  return { sort, setSort, expanded, setOpen }
}

/** 交易列表：每笔进出场，点行展开信号与收益率。 */
export function TradesPane({
  shown,
  labels,
  format,
  onExport,
  state: { sort, setSort, expanded, setOpen },
}: PaneProps & {
  onExport?: (csv: string, fileName: string) => void
  state: ReturnType<typeof useTradesState>
}) {
  const gridColumns = useMemo<readonly GridColumn<ReportTrade & { index: number; cumulative: number }>[]>(
    () => [
      { id: 'index', type: 'number', value: (t) => t.index },
      {
        id: 'side',
        type: 'text',
        value: (t) => (t.side === 'long' ? labels.list.sides.long : labels.list.sides.short),
      },
      {
        id: 'entryTime',
        type: 'text',
        value: (t) => t.entryTime,
        text: (t) => format.time(t.entryTime),
        sort: (t) => t.entryTime,
      },
      {
        id: 'exitTime',
        type: 'text',
        value: (t) => t.exitTime,
        text: (t) => format.time(t.exitTime),
        sort: (t) => t.exitTime,
      },
      { id: 'entryPrice', type: 'number', value: (t) => t.entryPrice, text: (t) => format.price(t.entryPrice) },
      { id: 'exitPrice', type: 'number', value: (t) => t.exitPrice, text: (t) => format.price(t.exitPrice) },
      { id: 'quantity', type: 'number', value: (t) => t.quantity, text: (t) => format.quantity(t.quantity) },
      { id: 'pnl', type: 'pnl', value: (t) => t.pnl, text: (t) => format.money(t.pnl) },
      { id: 'cumulative', type: 'pnl', value: (t) => t.cumulative, text: (t) => format.money(t.cumulative) },
      { id: 'runup', type: 'pnl', value: (t) => t.maxRunup, text: (t) => format.money(t.maxRunup) },
      { id: 'drawdown', type: 'pnl', value: (t) => t.maxDrawdown, text: (t) => format.money(t.maxDrawdown) },
    ],
    [format, labels.list.sides],
  )
  const gridLayout = useMemo<readonly GridColumnLayout[]>(() => {
    const c = labels.list.columns
    const widths: [string, string, number][] = [
      ['index', c.index, 48],
      ['side', c.side, 56],
      ['entryTime', c.entryTime, 172],
      ['exitTime', c.exitTime, 172],
      ['entryPrice', c.entryPrice, 100],
      ['exitPrice', c.exitPrice, 100],
      ['quantity', c.quantity, 88],
      ['pnl', c.pnl, 112],
      ['cumulative', c.cumulative, 120],
      ['runup', c.runup, 112],
      ['drawdown', c.drawdown, 112],
    ]
    return widths.map(([id, label, width]) => ({ id, label, width, visible: true }))
  }, [labels.list.columns])
  const rows = useMemo(() => {
    const cumulative = cumulativeById(shown)
    // js/copying-array-methods：toSorted 替代「展开复制再 sort」。
    return shown
      .toSorted((a, b) => b.exitTime - a.exitTime)
      .map((trade) => ({ ...trade, index: 0, cumulative: cumulative.get(trade.id) ?? 0 }))
      .map((trade, i, all) => ({ ...trade, index: all.length - i }))
  }, [shown])

  return rows.length === 0 ? (
    <div className="k-sr-empty">{labels.empty}</div>
  ) : (
    <DataGrid
      columns={gridColumns}
      layout={gridLayout}
      rows={rows}
      rowId={(row) => row.id}
      label={labels.list.label}
      sort={sort}
      onSortChange={setSort}
      onResetColumns={() => setSort(null)}
      onExport={onExport}
      exportName="trades"
      timeZone="utc"
      // 整页的报告表（#92）：comfortable 档，行 40、正文 14px、默认行间线；列宽随 14px 的字加宽一档。
      density="comfortable"
      expanded={expanded}
      onExpandedChange={setOpen}
      // 点行展开 / 收起（键盘 → ← 同样）：每笔的信号与收益率在展开行里。
      onOpen={(row) => setOpen(row.id, !expanded.has(row.id))}
      renderSubRow={(row) => (
        <dl className="k-sr-detail" data-slot="strategy-report-detail">
          <div>
            <dt>{labels.list.detail.entrySignal}</dt>
            <dd>{row.entrySignal ?? '—'}</dd>
          </div>
          <div>
            <dt>{labels.list.detail.exitSignal}</dt>
            <dd>{row.exitSignal ?? '—'}</dd>
          </div>
          <div>
            <dt>{labels.list.detail.duration}</dt>
            <dd>{format.duration(row.exitTime - row.entryTime)}</dd>
          </div>
          <div>
            <dt>{labels.list.detail.return}</dt>
            <dd>
              {row.entryPrice * row.quantity === 0 ? (
                '—'
              ) : (
                <ToneText tone={toneOf(row.pnl)}>{format.percent(row.pnl / (row.entryPrice * row.quantity))}</ToneText>
              )}
            </dd>
          </div>
        </dl>
      )}
    />
  )
}

/** 属性页：参数与回测设置，分组的键值。 */
export function PropertiesPane({ properties }: { properties: readonly StrategyReportPropertyGroup[] }) {
  return (
    <div className="k-sr-props" data-slot="strategy-report-properties">
      {properties.map((group) => (
        <section key={group.id} className="k-sr-prop-group" aria-label={group.title}>
          <h4>{group.title}</h4>
          <dl>
            {group.rows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}

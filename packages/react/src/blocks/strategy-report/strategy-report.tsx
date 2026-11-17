// SPDX-License-Identifier: MIT
import { useMemo, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { MeasuredSkeleton } from '../../katana/measured-skeleton.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../primitives/tabs.tsx'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group.tsx'
import { ToneText } from '../../quant/tone-text.tsx'
import type { Tone } from '../../quant/format/index.ts'
import { EquityCurve, type EquityCurveLabels } from '../../quant/equity-curve.tsx'
import { DataGrid, type GridColumnLayout } from '../data-grid/data-grid.tsx'
import type { GridColumn } from '../data-grid/columns.ts'
import type { SortSpec } from '../data-grid/model.ts'
import {
  computeReport,
  cumulativeById,
  filterTrades,
  histogram,
  resultSequence,
  type Histogram,
  type ReportStats,
  type ReportTrade,
  type SideFilter,
} from './strategy-report-model.ts'

// 策略报告（#35）：回测结果的一整页——概览（关键读数、权益曲线与回撤、同期买入持有）、绩效（全部 / 多 / 空三列的指标表）、交易分析
// （盈亏分布、持仓时长分布、连续盈亏）、风险比率、交易列表（每笔进出场，行可展开）、属性（参数与回测设置）。页签切换，顶上「全部 / 多 / 空」。
// 页签结构照 TradingView 策略测试器（https://www.tradingview.com/support/solutions/43000681733-strategy-tester/ ，2026-11-15 读到概览页；
// 其余页签没读到页面，按 issue 的结构做，待核对）。指标全由逐笔平仓算（strategy-report-model.ts），件不认识任何应用或交易所；
// 数据、数字格式与全部文字由调用方传，包里没有语言。「多 / 空」只管概览、交易分析与交易列表；绩效与风险比率的表三列并排，当前那列加亮。

export type MetricKey =
  | 'netProfit'
  | 'grossProfit'
  | 'grossLoss'
  | 'profitFactor'
  | 'totalReturn'
  | 'maxDrawdown'
  | 'maxDrawdownPct'
  | 'winRate'
  | 'payoffRatio'
  | 'tradeCount'
  | 'wins'
  | 'losses'
  | 'breakeven'
  | 'expectancy'
  | 'avgWin'
  | 'avgLoss'
  | 'largestWin'
  | 'largestLoss'
  | 'avgDuration'
  | 'avgWinDuration'
  | 'avgLossDuration'
  | 'maxConsecWins'
  | 'maxConsecLosses'
  | 'sharpe'
  | 'sortino'
  | 'calmar'
  | 'cagr'
  | 'recoveryFactor'
  | 'maxRunup'
  | 'avgDrawdown'
  | 'longestDrawdown'
  | 'finalEquity'
  | 'buyHold'

type Kind = 'money' | 'percent' | 'count' | 'ratio' | 'duration'
type Metric = { kind: Kind; get: (stats: ReportStats) => number | null; signed?: boolean; plain?: boolean }

const METRICS: Record<Exclude<MetricKey, 'buyHold'>, Metric> = {
  netProfit: { kind: 'money', get: (s) => s.netProfit, signed: true },
  grossProfit: { kind: 'money', get: (s) => s.grossProfit, signed: true },
  grossLoss: { kind: 'money', get: (s) => s.grossLoss, signed: true },
  profitFactor: { kind: 'ratio', get: (s) => s.profitFactor },
  totalReturn: { kind: 'percent', get: (s) => s.totalReturn, signed: true },
  maxDrawdown: { kind: 'money', get: (s) => s.maxDrawdown, signed: true },
  maxDrawdownPct: { kind: 'percent', get: (s) => s.maxDrawdownPct, signed: true },
  winRate: { kind: 'percent', get: (s) => s.winRate, plain: true },
  payoffRatio: { kind: 'ratio', get: (s) => s.payoffRatio },
  tradeCount: { kind: 'count', get: (s) => s.count },
  wins: { kind: 'count', get: (s) => s.wins },
  losses: { kind: 'count', get: (s) => s.losses },
  breakeven: { kind: 'count', get: (s) => s.breakeven },
  expectancy: { kind: 'money', get: (s) => s.expectancy, signed: true },
  avgWin: { kind: 'money', get: (s) => s.avgWin, signed: true },
  avgLoss: { kind: 'money', get: (s) => s.avgLoss, signed: true },
  largestWin: { kind: 'money', get: (s) => s.largestWin, signed: true },
  largestLoss: { kind: 'money', get: (s) => s.largestLoss, signed: true },
  avgDuration: { kind: 'duration', get: (s) => s.avgDuration },
  avgWinDuration: { kind: 'duration', get: (s) => s.avgWinDuration },
  avgLossDuration: { kind: 'duration', get: (s) => s.avgLossDuration },
  maxConsecWins: { kind: 'count', get: (s) => s.maxConsecWins },
  maxConsecLosses: { kind: 'count', get: (s) => s.maxConsecLosses },
  sharpe: { kind: 'ratio', get: (s) => s.sharpe },
  sortino: { kind: 'ratio', get: (s) => s.sortino },
  calmar: { kind: 'ratio', get: (s) => s.calmar },
  cagr: { kind: 'percent', get: (s) => s.cagr, signed: true },
  recoveryFactor: { kind: 'ratio', get: (s) => s.recoveryFactor },
  maxRunup: { kind: 'money', get: (s) => s.maxRunup },
  avgDrawdown: { kind: 'money', get: (s) => s.avgDrawdown, signed: true },
  longestDrawdown: { kind: 'duration', get: (s) => s.longestDrawdown },
  finalEquity: { kind: 'money', get: (s) => s.finalEquity },
}

const KPI: readonly Exclude<MetricKey, 'buyHold'>[] = [
  'netProfit',
  'totalReturn',
  'maxDrawdown',
  'winRate',
  'payoffRatio',
  'tradeCount',
  'sharpe',
]
const PERFORMANCE: readonly Exclude<MetricKey, 'buyHold'>[] = [
  'netProfit',
  'grossProfit',
  'grossLoss',
  'profitFactor',
  'totalReturn',
  'tradeCount',
  'wins',
  'losses',
  'breakeven',
  'winRate',
  'payoffRatio',
  'expectancy',
  'avgWin',
  'avgLoss',
  'largestWin',
  'largestLoss',
  'avgDuration',
  'avgWinDuration',
  'avgLossDuration',
  'maxConsecWins',
  'maxConsecLosses',
]
const RATIOS: readonly Exclude<MetricKey, 'buyHold'>[] = [
  'sharpe',
  'sortino',
  'calmar',
  'cagr',
  'profitFactor',
  'recoveryFactor',
  'maxDrawdown',
  'maxDrawdownPct',
  'avgDrawdown',
  'longestDrawdown',
  'maxRunup',
]
const ANALYSIS_FACTS: readonly Exclude<MetricKey, 'buyHold'>[] = [
  'wins',
  'losses',
  'breakeven',
  'avgWin',
  'avgLoss',
  'largestWin',
  'largestLoss',
  'avgDuration',
  'maxConsecWins',
  'maxConsecLosses',
]

export type StrategyReportFormat = {
  /** 账户币种的金额，带符号与单位由调用方定（如 +1,234.50）。 */
  money: (value: number) => string
  /** 小数的百分数：0.123 → 12.30%。 */
  percent: (value: number) => string
  /** 成交价。 */
  price: (value: number) => string
  /** 数量。 */
  quantity: (value: number) => string
  /** 时刻（毫秒）。 */
  time: (value: number) => string
  /** 时长（毫秒）。 */
  duration: (value: number) => string
  /** 比率；不给写两位小数。 */
  ratio?: (value: number) => string
  /** 图表横轴刻度的短时刻；不给用 time。 */
  axisTime?: (value: number) => string
}

export type StrategyReportLabels = {
  /** 整个件的读屏名。 */
  report: string
  /** 概览加载中读屏读的话；不给就读 report。 */
  loading?: string
  tabs: {
    group: string
    overview: string
    performance: string
    analysis: string
    ratios: string
    trades: string
    properties: string
  }
  side: { group: string; all: string; long: string; short: string }
  metrics: Record<MetricKey, string>
  /** 权益曲线：标题、口径、线名、读屏名与图自带的文字。 */
  equity: EquityCurveLabels & { title: string; hint?: string; name: string; label: string; axisName: string }
  analysis: {
    pnlDistribution: string
    durationDistribution: string
    streaks: string
    win: string
    loss: string
    flat: string
    /** 直方图每根柱的整句，如「-100 到 0：12 笔」。 */
    bar: (from: string, to: string, count: number) => string
    /** 连续盈亏条里一笔的整句，如「第 5 笔：盈利」。 */
    streakItem: (index: number, result: 'win' | 'loss' | 'flat') => string
    facts: string
  }
  list: {
    label: string
    columns: {
      index: string
      side: string
      entryTime: string
      exitTime: string
      entryPrice: string
      exitPrice: string
      quantity: string
      pnl: string
      cumulative: string
      runup: string
      drawdown: string
    }
    sides: { long: string; short: string }
    detail: { entrySignal: string; exitSignal: string; duration: string; return: string }
    resetColumns?: string
  }
  /** 没有交易（或筛选后没有）。 */
  empty: ReactNode
}

export type StrategyReportProperty = { label: string; value: string }
export type StrategyReportPropertyGroup = { id: string; title: string; rows: readonly StrategyReportProperty[] }

export type StrategyReportProps = {
  trades: readonly ReportTrade[]
  /**
   * 概览在加载：给了（含 false）概览页的指标卡就走量出来的骨架（用 format.money(0) 的宽度占位排一次版），false 时骨架退场、真指标淡入；不传和以前一样。
   * 权益曲线、指标表、交易列表是图与表，不在这里画骨架（加载时 trades 给空数组，它们本来就按空画）。
   */
  loading?: boolean
  initialCapital: number
  /** 一年几个交易日，夏普与索提诺按它年化。A 股、美股 252，加密 365；默认 252。 */
  periodsPerYear?: number
  /** 年化无风险利率（小数），默认 0。 */
  riskFree?: number
  /** 同期买入持有：给一个时刻，返回那时的买入持有权益（起点是初始资金）。不给就不画那条线与那行读数。 */
  benchmark?: { name: string; at: (time: number) => number }
  /** 属性页：参数与回测设置，分组的键值。 */
  properties: readonly StrategyReportPropertyGroup[]
  format: StrategyReportFormat
  labels: StrategyReportLabels
  /** 标在页签行右端的小标（如「演示数据」）。 */
  badge?: string
  defaultTab?: StrategyReportTab
  defaultSide?: SideFilter
  onTabChange?: (tab: StrategyReportTab) => void
  onSideChange?: (side: SideFilter) => void
  /** 给了，交易列表的行右键与表头菜单里出「导出 CSV」；回调收到文本与文件名。 */
  onExport?: (csv: string, fileName: string) => void
  className?: string
}

export type StrategyReportTab = 'overview' | 'performance' | 'analysis' | 'ratios' | 'trades' | 'properties'
const TABS: readonly StrategyReportTab[] = ['overview', 'performance', 'analysis', 'ratios', 'trades', 'properties']
const SIDES: readonly SideFilter[] = ['all', 'long', 'short']

const toneOf = (value: number | null): Tone => (value === null || value === 0 ? 'flat' : value > 0 ? 'up' : 'down')

function formatMetric(metric: Metric, value: number | null, format: StrategyReportFormat): string {
  if (value === null || !Number.isFinite(value)) return '—'
  switch (metric.kind) {
    case 'money':
      return format.money(value)
    case 'percent':
      return format.percent(value)
    case 'count':
      return String(value)
    case 'duration':
      return format.duration(value)
    case 'ratio':
      return format.ratio ? format.ratio(value) : value.toFixed(2)
  }
}

function Value({ metric, value, format }: { metric: Metric; value: number | null; format: StrategyReportFormat }) {
  const text = formatMetric(metric, value, format)
  // 胜率这类不是盈亏的比例：不带正负号、不着涨跌色（percent 的写法由调用方定，带符号的写法在这里去掉）。
  if (metric.plain) return <span>{text.replace(/^[+-]/, '')}</span>
  return metric.signed && value !== null ? <ToneText tone={toneOf(value)}>{text}</ToneText> : <span>{text}</span>
}

/** 多空与全部三列并排的指标表。 */
function MetricTable({
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
    <table className="k-sr-table" data-slot="strategy-report-table">
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
function Bars({
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

export function StrategyReport({
  trades,
  loading,
  initialCapital,
  periodsPerYear,
  riskFree,
  benchmark,
  properties,
  format,
  labels,
  badge,
  defaultTab = 'overview',
  defaultSide = 'all',
  onTabChange,
  onSideChange,
  onExport,
  className,
}: StrategyReportProps) {
  const [tab, setTab] = useState<StrategyReportTab>(defaultTab)
  const [side, setSide] = useState<SideFilter>(defaultSide)
  const [sort, setSort] = useState<SortSpec | null>(null)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())
  const setOpen = (id: string, open: boolean) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (open) next.add(id)
      else next.delete(id)
      return next
    })
  const options = { initialCapital, periodsPerYear, riskFree }
  const stats = useMemo(
    () => ({
      all: computeReport(trades, options),
      long: computeReport(filterTrades(trades, 'long'), options),
      short: computeReport(filterTrades(trades, 'short'), options),
    }),
    // options 是三个原始值的集合，按值依赖。
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [trades, initialCapital, periodsPerYear, riskFree],
  )
  const current = stats[side]
  const shown = useMemo(() => filterTrades(trades, side), [trades, side])

  const changeTab = (next: string) => {
    setTab(next as StrategyReportTab)
    onTabChange?.(next as StrategyReportTab)
  }
  const changeSide = (next: string) => {
    if (!next) return
    setSide(next as SideFilter)
    onSideChange?.(next as SideFilter)
  }

  const equityPoints = useMemo(
    () =>
      current.curve.map((point) => ({
        time: point.time,
        equity: point.cumulative,
        drawdown: point.drawdown,
        title: `${point.trade === 0 ? labels.equity.axisName : `#${point.trade}`} · ${format.time(point.time)}`,
        equityText: format.money(point.cumulative),
        drawdownText: format.money(point.drawdown),
      })),
    [current.curve, format, labels.equity.axisName],
  )
  const buyHold =
    benchmark && current.curve.length > 0 ? benchmark.at(current.curve.at(-1)!.time) - initialCapital : null

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
      ['entryTime', c.entryTime, 150],
      ['exitTime', c.exitTime, 150],
      ['entryPrice', c.entryPrice, 92],
      ['exitPrice', c.exitPrice, 92],
      ['quantity', c.quantity, 80],
      ['pnl', c.pnl, 100],
      ['cumulative', c.cumulative, 110],
      ['runup', c.runup, 100],
      ['drawdown', c.drawdown, 100],
    ]
    return widths.map(([id, label, width]) => ({ id, label, width, visible: true }))
  }, [labels.list.columns])
  const rows = useMemo(() => {
    const cumulative = cumulativeById(shown)
    return [...shown]
      .sort((a, b) => b.exitTime - a.exitTime)
      .map((trade) => ({ ...trade, index: 0, cumulative: cumulative.get(trade.id) ?? 0 }))
      .map((trade, i, all) => ({ ...trade, index: all.length - i }))
  }, [shown])

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
  const empty = trades.length === 0

  // 概览页真内容；加载态的骨架包在它外面（量出来的骨架要在同一个位置把它换出来）。
  const overview = empty ? (
    <div className="k-sr-empty">{labels.empty}</div>
  ) : (
    <>
      <div className="k-sr-kpis" data-slot="strategy-report-kpis">
        {KPI.map((key) => (
          <div key={key} className="k-sr-kpi" data-metric={key}>
            <span className="k-sr-kpi-label">{labels.metrics[key]}</span>
            <strong className="k-sr-kpi-value">
              <Value metric={METRICS[key]} value={METRICS[key].get(current)} format={format} />
            </strong>
            {key === 'netProfit' && buyHold !== null ? (
              <small className="k-sr-kpi-sub" data-slot="strategy-report-buyhold">
                {labels.metrics.buyHold} {format.money(buyHold)}
              </small>
            ) : null}
          </div>
        ))}
      </div>
      {current.curve.length > 1 ? (
        <EquityCurve
          points={equityPoints}
          title={labels.equity.title}
          hint={labels.equity.hint}
          name={labels.equity.name}
          label={labels.equity.label}
          benchmark={
            benchmark
              ? {
                  name: benchmark.name,
                  values: current.curve.map((p) => benchmark.at(p.time) - initialCapital),
                }
              : undefined
          }
          axis={(v) => format.money(v)}
          formatTime={format.axisTime ?? format.time}
          labels={labels.equity}
        />
      ) : null}
    </>
  )
  // 加载时的指标卡：标签是真的，数值用 format.money(0) 占位（只为排版，骨架里看不到字）。
  const kpiSample = (
    <div className="k-sr-kpis" data-slot="strategy-report-kpis">
      {KPI.map((key) => (
        <div key={key} className="k-sr-kpi" data-metric={key}>
          <span className="k-sr-kpi-label">{labels.metrics[key]}</span>
          <strong className="k-sr-kpi-value">
            <span>{format.money(0)}</span>
          </strong>
          {key === 'netProfit' && benchmark ? (
            <small className="k-sr-kpi-sub">
              {labels.metrics.buyHold} {format.money(0)}
            </small>
          ) : null}
        </div>
      ))}
    </div>
  )
  return (
    <section
      className={cn('k-sr', className)}
      data-slot="strategy-report"
      data-side={side}
      data-tab={tab}
      aria-label={labels.report}
    >
      <Tabs value={tab} onValueChange={changeTab} className="k-sr-tabs">
        <div className="k-sr-top">
          <TabsList variant="line" aria-label={labels.tabs.group}>
            {TABS.map((key) => (
              <TabsTrigger key={key} value={key}>
                {labels.tabs[key]}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="k-sr-top-end">
            {badge === undefined ? null : <span className="k-sr-badge">{badge}</span>}
            <ToggleGroup variant="sm" aria-label={labels.side.group} value={side} onValueChange={changeSide}>
              {SIDES.map((key) => (
                <ToggleGroupItem key={key} value={key}>
                  {labels.side[key]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <div className="k-sr-body">
          <TabsContent value="overview" className="k-sr-pane">
            {loading === undefined ? (
              overview
            ) : (
              <MeasuredSkeleton loading={loading} label={labels.loading ?? labels.report}>
                <div className="k-sr-overview">{loading ? kpiSample : overview}</div>
              </MeasuredSkeleton>
            )}
          </TabsContent>

          <TabsContent value="performance" className="k-sr-pane">
            <MetricTable
              rows={PERFORMANCE}
              columns={stats}
              active={side}
              labels={labels}
              format={format}
              caption={labels.tabs.performance}
            />
          </TabsContent>

          <TabsContent value="analysis" className="k-sr-pane">
            {shown.length === 0 ? (
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
                      <li
                        key={i}
                        className="k-sr-streak"
                        data-result={result}
                        title={labels.analysis.streakItem(i + 1, result)}
                      >
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
            )}
          </TabsContent>

          <TabsContent value="ratios" className="k-sr-pane">
            <MetricTable
              rows={RATIOS}
              columns={stats}
              active={side}
              labels={labels}
              format={format}
              caption={labels.tabs.ratios}
            />
          </TabsContent>

          <TabsContent value="trades" className="k-sr-pane k-sr-pane-grid">
            {rows.length === 0 ? (
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
                density="default"
                ruled
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
                          <ToneText tone={toneOf(row.pnl)}>
                            {format.percent(row.pnl / (row.entryPrice * row.quantity))}
                          </ToneText>
                        )}
                      </dd>
                    </div>
                  </dl>
                )}
              />
            )}
          </TabsContent>

          <TabsContent value="properties" className="k-sr-pane">
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
          </TabsContent>
        </div>
      </Tabs>
    </section>
  )
}

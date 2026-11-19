// SPDX-License-Identifier: MIT
/**
 * Props, labels and number formats of StrategyReport.
 * StrategyReport 的 props、文案与数字格式（体检 §7 从 strategy-report.tsx 拆出）。
 */
import type { ReactNode } from 'react'
import type { EquityCurveLabels } from '../../quant/equity-curve.tsx'
import type { MetricKey, StrategyReportTab } from './strategy-report-metrics.ts'
import type { ReportTrade, SideFilter } from './strategy-report-model.ts'

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

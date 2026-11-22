// SPDX-License-Identifier: MIT
/**
 * Metric table of StrategyReport: which numbers each tab shows and how each one is written.
 * StrategyReport 的指标定义（体检 §7 从 strategy-report.tsx 拆出，纯数据与纯函数）。
 */
import type { Tone } from '../../lib/tone.ts'
import type { ReportStats, SideFilter } from './strategy-report-model.ts'

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

export type MetricKind = 'money' | 'percent' | 'count' | 'ratio' | 'duration'
export type Metric = { kind: MetricKind; get: (stats: ReportStats) => number | null; signed?: boolean; plain?: boolean }

export const METRICS: Record<Exclude<MetricKey, 'buyHold'>, Metric> = {
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

export const KPI: readonly Exclude<MetricKey, 'buyHold'>[] = [
  'netProfit',
  'totalReturn',
  'maxDrawdown',
  'winRate',
  'payoffRatio',
  'tradeCount',
  'sharpe',
]
export const PERFORMANCE: readonly Exclude<MetricKey, 'buyHold'>[] = [
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
export const RATIOS: readonly Exclude<MetricKey, 'buyHold'>[] = [
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
export const ANALYSIS_FACTS: readonly Exclude<MetricKey, 'buyHold'>[] = [
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

export type StrategyReportTab = 'overview' | 'performance' | 'analysis' | 'ratios' | 'trades' | 'properties'
export const TABS: readonly StrategyReportTab[] = [
  'overview',
  'performance',
  'analysis',
  'ratios',
  'trades',
  'properties',
]
export const SIDES: readonly SideFilter[] = ['all', 'long', 'short']

/** 数的方向：0、空是 flat。 */
export const toneOf = (value: number | null): Tone =>
  value === null || value === 0 ? 'flat' : value > 0 ? 'up' : 'down'

/** 读数写法要的格式函数（StrategyReportFormat 的子集）。 */
export type MetricFormat = {
  money: (value: number) => string
  percent: (value: number) => string
  duration: (value: number) => string
  ratio?: (value: number) => string
}

/** 一个指标的字：空与非有限数写「—」。 */
export function formatMetric(metric: Metric, value: number | null, format: MetricFormat): string {
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

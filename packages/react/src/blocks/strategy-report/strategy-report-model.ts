// SPDX-License-Identifier: MIT
// 策略报告的纯逻辑：从逐笔平仓算出概览、绩效、风险比率与分布。不带 React 与 DOM。
// 结构参照 TradingView 策略测试器（Strategy Report）的概览页（https://www.tradingview.com/support/solutions/43000681733-strategy-tester/ ，
// 2026-11-15 读到：绩效图以平仓笔为点、可叠买入持有、可切绝对值与百分比；回报明细含净盈亏、总盈利、总亏损、盈亏因子、预期收益、夏普、索提诺；
// 交易分析含 ROI 分布直方图、盈亏笔数、平均持仓 K 线数；回撤与上冲；资金效率含 CAGR）。其余页签（绩效摘要多空列、交易列表、属性）没读到页面，
// 只按用户给的 issue 结构做，指标口径是通用做法，写在各函数注释里。
import { niceTicks } from '../../lib/chart/chart-scale.ts'

export type ReportSide = 'long' | 'short'
export type SideFilter = 'all' | ReportSide

export type ReportTrade = {
  id: string
  side: ReportSide
  entryTime: number
  exitTime: number
  entryPrice: number
  exitPrice: number
  quantity: number
  /** 这笔的净盈亏（已扣手续费），账户币种。 */
  pnl: number
  /** 持仓期间的最大浮盈（≥ 0）与最大浮亏（≤ 0），账户币种。 */
  maxRunup: number
  maxDrawdown: number
  entrySignal?: string
  exitSignal?: string
}

export type ReportOptions = {
  initialCapital: number
  /** 一年有几个交易日：A 股与美股 252，加密 365。夏普与索提诺按它年化。默认 252。 */
  periodsPerYear?: number
  /** 年化无风险利率（小数），默认 0。 */
  riskFree?: number
}

export type CurvePoint = { time: number; equity: number; cumulative: number; drawdown: number; trade: number }

export type ReportStats = {
  count: number
  wins: number
  losses: number
  breakeven: number
  netProfit: number
  grossProfit: number
  /** ≤ 0。 */
  grossLoss: number
  /** 总盈利 / |总亏损|；没有亏损是 null。 */
  profitFactor: number | null
  /** 净盈亏 / 初始资金。 */
  totalReturn: number
  /** 盈利笔数 / 总笔数，没有交易是 0。 */
  winRate: number
  avgWin: number
  /** ≤ 0。 */
  avgLoss: number
  /** 平均盈利 / |平均亏损|；没有亏损笔是 null。 */
  payoffRatio: number | null
  /** 每笔平均净盈亏。 */
  expectancy: number
  largestWin: number
  largestLoss: number
  avgDuration: number
  avgWinDuration: number
  avgLossDuration: number
  maxConsecWins: number
  maxConsecLosses: number
  currentStreak: { kind: 'win' | 'loss'; count: number } | null
  finalEquity: number
  /** ≤ 0，权益从前高回落的最大金额与占前高的比例。 */
  maxDrawdown: number
  maxDrawdownPct: number
  maxRunup: number
  /** 每段回撤（从前高到收复前高，没收复的算到末笔）的平均深度，≤ 0。 */
  avgDrawdown: number
  /** 最长一段回撤的时长（毫秒）。 */
  longestDrawdown: number
  sharpe: number | null
  sortino: number | null
  /** 年化收益 / |最大回撤比例|。 */
  calmar: number | null
  cagr: number | null
  /** 净盈亏 / |最大回撤|。 */
  recoveryFactor: number | null
  curve: CurvePoint[]
}

const DAY = 86_400_000
const YEAR = 365.25 * DAY

export function filterTrades(trades: readonly ReportTrade[], side: SideFilter): ReportTrade[] {
  return trades.filter((trade) => side === 'all' || trade.side === side)
}

/** 平仓时间升序，同刻按原顺序。 */
const byExit = (trades: readonly ReportTrade[]) =>
  trades
    .map((trade, index) => ({ trade, index }))
    .sort((a, b) => a.trade.exitTime - b.trade.exitTime || a.index - b.index)
    .map((entry) => entry.trade)

/** 日收益：从第一笔入场到最后一笔平仓之间按 UTC 日取日末权益，没有交易的日子收益为 0。 */
function dailyReturns(curve: readonly CurvePoint[]): number[] {
  if (curve.length < 2) return []
  const first = Math.floor(curve[0]!.time / DAY)
  const last = Math.floor(curve.at(-1)!.time / DAY)
  const endOfDay = new Map<number, number>()
  for (const point of curve) endOfDay.set(Math.floor(point.time / DAY), point.equity)
  const returns: number[] = []
  let previous = curve[0]!.equity
  for (let day = first; day <= last; day++) {
    const equity = endOfDay.get(day) ?? previous
    returns.push(previous === 0 ? 0 : equity / previous - 1)
    previous = equity
  }
  return returns
}

const mean = (values: readonly number[]) => values.reduce((sum, v) => sum + v, 0) / (values.length || 1)

function streaks(trades: readonly ReportTrade[]) {
  let wins = 0
  let losses = 0
  let run = 0
  let kind: 'win' | 'loss' | null = null
  for (const trade of trades) {
    const now = trade.pnl > 0 ? 'win' : trade.pnl < 0 ? 'loss' : null
    run = now !== null && now === kind ? run + 1 : now === null ? 0 : 1
    kind = now
    if (now === 'win') wins = Math.max(wins, run)
    if (now === 'loss') losses = Math.max(losses, run)
  }
  return { wins, losses, current: kind === null || run === 0 ? null : { kind, count: run } }
}

export function computeReport(input: readonly ReportTrade[], options: ReportOptions): ReportStats {
  const { initialCapital } = options
  const trades = byExit(input)
  const winners = trades.filter((t) => t.pnl > 0)
  const losers = trades.filter((t) => t.pnl < 0)
  const grossProfit = winners.reduce((sum, t) => sum + t.pnl, 0)
  const grossLoss = losers.reduce((sum, t) => sum + t.pnl, 0)
  const netProfit = grossProfit + grossLoss
  const duration = (t: ReportTrade) => t.exitTime - t.entryTime
  const avgWin = winners.length === 0 ? 0 : grossProfit / winners.length
  const avgLoss = losers.length === 0 ? 0 : grossLoss / losers.length

  // 权益曲线：第一笔入场处是初始资金，之后每平一笔一个点（照 TradingView 的绩效图，一笔一个点）。
  const curve: CurvePoint[] = []
  if (trades.length > 0) {
    let equity = initialCapital
    let peak = equity
    curve.push({ time: Math.min(...trades.map((t) => t.entryTime)), equity, cumulative: 0, drawdown: 0, trade: 0 })
    trades.forEach((trade, index) => {
      equity += trade.pnl
      peak = Math.max(peak, equity)
      curve.push({
        time: trade.exitTime,
        equity,
        cumulative: equity - initialCapital,
        drawdown: equity - peak,
        trade: index + 1,
      })
    })
  }

  let maxDrawdown = 0
  let maxDrawdownPct = 0
  let maxRunup = 0
  const episodes: { depth: number; from: number; to: number }[] = []
  let peak = curve[0]?.equity ?? initialCapital
  let peakTime = curve[0]?.time ?? 0
  let trough = peak
  let low = peak
  let lowTime = peakTime
  for (const point of curve) {
    if (point.equity >= peak) {
      if (trough < peak) episodes.push({ depth: trough - peak, from: peakTime, to: point.time })
      peak = point.equity
      peakTime = point.time
      trough = peak
    } else trough = Math.min(trough, point.equity)
    maxDrawdown = Math.min(maxDrawdown, point.equity - peak)
    maxDrawdownPct = Math.min(maxDrawdownPct, peak === 0 ? 0 : (point.equity - peak) / peak)
    // 上冲：从此前低点涨上来的最大幅度。
    if (point.equity < low) {
      low = point.equity
      lowTime = point.time
    }
    if (lowTime <= point.time) maxRunup = Math.max(maxRunup, point.equity - low)
  }
  if (trough < peak && curve.length > 0) episodes.push({ depth: trough - peak, from: peakTime, to: curve.at(-1)!.time })

  const finalEquity = curve.at(-1)?.equity ?? initialCapital
  const span = curve.length < 2 ? 0 : curve.at(-1)!.time - curve[0]!.time
  const years = span / YEAR
  const cagr =
    years > 0 && finalEquity > 0 && initialCapital > 0 ? (finalEquity / initialCapital) ** (1 / years) - 1 : null

  const returns = dailyReturns(curve)
  const perYear = options.periodsPerYear ?? 252
  const riskFreeDaily = (options.riskFree ?? 0) / perYear
  const excess = returns.map((r) => r - riskFreeDaily)
  const avg = mean(excess)
  const variance = returns.length < 2 ? 0 : excess.reduce((s, r) => s + (r - avg) ** 2, 0) / (returns.length - 1)
  const downside = Math.sqrt(mean(excess.map((r) => Math.min(r, 0) ** 2)))
  const sharpe = variance > 0 ? (avg / Math.sqrt(variance)) * Math.sqrt(perYear) : null
  const sortino = downside > 0 ? (avg / downside) * Math.sqrt(perYear) : null

  const run = streaks(trades)
  return {
    count: trades.length,
    wins: winners.length,
    losses: losers.length,
    breakeven: trades.length - winners.length - losers.length,
    netProfit,
    grossProfit,
    grossLoss,
    profitFactor: grossLoss < 0 ? grossProfit / -grossLoss : null,
    totalReturn: initialCapital === 0 ? 0 : netProfit / initialCapital,
    winRate: trades.length === 0 ? 0 : winners.length / trades.length,
    avgWin,
    avgLoss,
    payoffRatio: avgLoss < 0 ? avgWin / -avgLoss : null,
    expectancy: trades.length === 0 ? 0 : netProfit / trades.length,
    largestWin: winners.length === 0 ? 0 : Math.max(...winners.map((t) => t.pnl)),
    largestLoss: losers.length === 0 ? 0 : Math.min(...losers.map((t) => t.pnl)),
    avgDuration: mean(trades.map(duration)),
    avgWinDuration: mean(winners.map(duration)),
    avgLossDuration: mean(losers.map(duration)),
    maxConsecWins: run.wins,
    maxConsecLosses: run.losses,
    currentStreak: run.current,
    finalEquity,
    maxDrawdown,
    maxDrawdownPct,
    maxRunup,
    avgDrawdown: episodes.length === 0 ? 0 : mean(episodes.map((e) => e.depth)),
    longestDrawdown: episodes.reduce((max, e) => Math.max(max, e.to - e.from), 0),
    sharpe,
    sortino,
    calmar: cagr !== null && maxDrawdownPct < 0 ? cagr / -maxDrawdownPct : null,
    cagr,
    recoveryFactor: maxDrawdown < 0 ? netProfit / -maxDrawdown : null,
    curve,
  }
}

export type Histogram = { edges: number[]; counts: number[] }

/**
 * 直方图：箱宽取 1、2、5 乘 10 的幂（同刻度的好数），边界落在箱宽的整数倍上，所以只要数据跨过 0，0 一定是一条边界
 * （盈亏分布里亏与盈分在两侧）。目标箱数只是个大概。没有数据返回空；全相等给一个箱。
 */
export function histogram(values: readonly number[], target = 10): Histogram {
  const finite = values.filter((v) => Number.isFinite(v))
  if (finite.length === 0) return { edges: [], counts: [] }
  const lo = Math.min(...finite)
  const hi = Math.max(...finite)
  const ticks = lo === hi ? [] : niceTicks(lo, hi, target)
  const step = ticks.length >= 2 ? ticks[1]! - ticks[0]! : Math.max(Math.abs(lo) * 0.1, 1)
  const from = Math.floor(lo / step + 1e-9)
  const to = Math.max(from + 1, Math.ceil(hi / step - 1e-9))
  const edges = Array.from({ length: to - from + 1 }, (_, i) => Number(((from + i) * step).toPrecision(12)))
  const counts = new Array<number>(edges.length - 1).fill(0)
  for (const value of finite) {
    const at = Math.min(counts.length - 1, Math.max(0, Math.floor((value - edges[0]!) / step + 1e-9)))
    counts[at]!++
  }
  return { edges, counts }
}

/** 一串笔的输赢序列（给连续盈亏条）：按平仓时间。 */
export function resultSequence(trades: readonly ReportTrade[]): ('win' | 'loss' | 'flat')[] {
  return byExit(trades).map((t) => (t.pnl > 0 ? 'win' : t.pnl < 0 ? 'loss' : 'flat'))
}

/** 交易列表的累计盈亏：按平仓时间累加。 */
export function cumulativeById(trades: readonly ReportTrade[]): Map<string, number> {
  const map = new Map<string, number>()
  let sum = 0
  for (const trade of byExit(trades)) {
    sum += trade.pnl
    map.set(trade.id, sum)
  }
  return map
}

// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import {
  computeReport,
  cumulativeById,
  filterTrades,
  histogram,
  resultSequence,
  type ReportTrade,
} from './strategy-report-model.ts'

const D = 86_400_000
const T0 = Date.UTC(2026, 0, 5)
const trade = (id: string, day: number, pnl: number, side: 'long' | 'short' = 'long'): ReportTrade => ({
  id,
  side,
  entryTime: T0 + day * D,
  exitTime: T0 + day * D + 3_600_000,
  entryPrice: 100,
  exitPrice: 100,
  quantity: 1,
  pnl,
  maxRunup: Math.max(pnl, 0),
  maxDrawdown: Math.min(pnl, 0),
})

// 盈 100、亏 50、亏 50、盈 200：初始 1000。
const TRADES = [trade('a', 0, 100), trade('b', 1, -50, 'short'), trade('c', 2, -50), trade('d', 3, 200, 'short')]

describe('computeReport', () => {
  const stats = computeReport(TRADES, { initialCapital: 1000 })
  it('基本读数', () => {
    expect(stats.count).toBe(4)
    expect(stats.netProfit).toBe(200)
    expect(stats.grossProfit).toBe(300)
    expect(stats.grossLoss).toBe(-100)
    expect(stats.profitFactor).toBe(3)
    expect(stats.totalReturn).toBeCloseTo(0.2)
    expect(stats.winRate).toBe(0.5)
    expect(stats.avgWin).toBe(150)
    expect(stats.avgLoss).toBe(-50)
    expect(stats.payoffRatio).toBe(3)
    expect(stats.expectancy).toBe(50)
    expect(stats.largestWin).toBe(200)
    expect(stats.largestLoss).toBe(-50)
    expect(stats.maxConsecLosses).toBe(2)
    expect(stats.maxConsecWins).toBe(1)
    expect(stats.currentStreak).toEqual({ kind: 'win', count: 1 })
  })
  it('权益曲线、回撤与上冲', () => {
    expect(stats.curve.map((p) => p.equity)).toEqual([1000, 1100, 1050, 1000, 1200])
    expect(stats.maxDrawdown).toBe(-100)
    expect(stats.maxDrawdownPct).toBeCloseTo(-100 / 1100)
    expect(stats.maxRunup).toBe(200)
    expect(stats.avgDrawdown).toBe(-100)
    expect(stats.longestDrawdown).toBe(3 * D)
    expect(stats.recoveryFactor).toBe(2)
  })
  it('没有亏损时盈亏因子、盈亏比是 null；没有交易全是 0', () => {
    const win = computeReport([trade('a', 0, 10), trade('b', 1, 20)], { initialCapital: 100 })
    expect(win.profitFactor).toBeNull()
    expect(win.payoffRatio).toBeNull()
    expect(win.recoveryFactor).toBeNull()
    const none = computeReport([], { initialCapital: 100 })
    expect(none).toMatchObject({ count: 0, netProfit: 0, winRate: 0, finalEquity: 100, sharpe: null })
    expect(none.curve).toEqual([])
  })
  it('夏普按日收益年化：日收益全相同时标准差为 0，给 null', () => {
    const flat = computeReport([trade('a', 0, 10), trade('b', 1, 10.1), trade('c', 2, 10.201)], {
      initialCapital: 1000,
    })
    expect(flat.sharpe).toBeNull()
    expect(stats.sharpe).not.toBeNull()
    expect(stats.sharpe!).toBeGreaterThan(0)
    expect(stats.sortino!).toBeGreaterThan(0)
    expect(stats.cagr!).toBeGreaterThan(0)
  })
  it('输入顺序不影响结果（按平仓时间）', () => {
    const shuffled = computeReport([TRADES[3]!, TRADES[0]!, TRADES[2]!, TRADES[1]!], { initialCapital: 1000 })
    expect(shuffled.curve.map((p) => p.equity)).toEqual([1000, 1100, 1050, 1000, 1200])
  })
})

describe('其余纯函数', () => {
  it('filterTrades 按多空', () => {
    expect(filterTrades(TRADES, 'short').map((t) => t.id)).toEqual(['b', 'd'])
    expect(filterTrades(TRADES, 'all')).toHaveLength(4)
  })
  it('histogram：跨过 0 时 0 是边界，计数总和等于样本数', () => {
    const h = histogram([-50, -50, 100, 200, 30], 6)
    expect(h.edges).toContain(0)
    expect(h.counts.reduce((a, b) => a + b, 0)).toBe(5)
    expect(h.edges.length).toBe(h.counts.length + 1)
    expect(histogram([], 5)).toEqual({ edges: [], counts: [] })
    expect(histogram([3, 3], 5).counts).toEqual([2])
  })
  it('resultSequence 与 cumulativeById', () => {
    expect(resultSequence(TRADES)).toEqual(['win', 'loss', 'loss', 'win'])
    expect(cumulativeById(TRADES).get('d')).toBe(200)
  })
})

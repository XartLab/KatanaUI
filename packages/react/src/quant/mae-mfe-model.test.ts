// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  excursionPoints,
  kindOf,
  nearestPoint,
  outwardDomain,
  stepPoint,
  summarizeExcursions,
  type ExcursionTrade,
} from './mae-mfe-model.ts'

const trade = (id: string, pnl: number, mae: number, mfe: number): ExcursionTrade => ({
  id,
  pnl,
  pnlPct: pnl / 1000,
  mae,
  maePct: mae / 1000,
  mfe,
  mfePct: mfe / 1000,
})
const TRADES = [
  trade('a', 300, -50, 400),
  trade('b', -200, -260, 80),
  trade('c', 0, -10, 10),
  trade('d', 120, -90, 150),
]

describe('MAE / MFE 散点', () => {
  it('赢亏按最终盈亏的正负分，零是持平', () => {
    expect(kindOf(1)).toBe('win')
    expect(kindOf(-1)).toBe('loss')
    expect(kindOf(0)).toBe('flat')
  })

  it('横轴取偏移的绝对值，纵轴是最终盈亏；金额与百分比各取各的字段', () => {
    const mae = excursionPoints(TRADES, 'mae', 'amount')
    expect(mae.map((p) => p.x)).toEqual([50, 260, 10, 90])
    expect(mae.map((p) => p.y)).toEqual([300, -200, 0, 120])
    const mfePct = excursionPoints(TRADES, 'mfe', 'percent')
    expect(mfePct.map((p) => p.x)).toEqual([0.4, 0.08, 0.01, 0.15])
    expect(mfePct.map((p) => p.y)).toEqual([0.3, -0.2, 0, 0.12])
  })

  it('不是有限数的那笔跳过，下标仍指回原数组', () => {
    const points = excursionPoints([TRADES[0]!, { ...TRADES[1]!, mae: Number.NaN }, TRADES[3]!], 'mae', 'amount')
    expect(points.map((p) => p.id)).toEqual(['a', 'd'])
    expect(points.map((p) => p.index)).toEqual([0, 2])
  })

  it('汇总：赢亏单数与两侧平均偏移，那一侧没有单是 null', () => {
    const summary = summarizeExcursions(excursionPoints(TRADES, 'mae', 'amount'))
    expect(summary).toMatchObject({ count: 4, wins: 2, losses: 1, flats: 1, meanWinX: 70, meanLossX: 260 })
    expect(summarizeExcursions(excursionPoints([TRADES[0]!], 'mae', 'amount')).meanLossX).toBeNull()
    expect(summarizeExcursions([]).meanWinX).toBeNull()
  })

  it('最近点：在半径内取最近，超出是 -1', () => {
    const xy = [
      { x: 10, y: 10 },
      { x: 50, y: 50 },
    ]
    expect(nearestPoint(xy, { x: 48, y: 52 }, 10)).toBe(1)
    expect(nearestPoint(xy, { x: 200, y: 200 }, 10)).toBe(-1)
    expect(nearestPoint([], { x: 0, y: 0 }, 10)).toBe(-1)
  })

  it('键盘：沿给定顺序走，到头不绕回，Home / End 去两端', () => {
    const order = [2, 0, 1]
    expect(stepPoint(order, -1, 'ArrowRight')).toBe(2)
    expect(stepPoint(order, 2, 'ArrowRight')).toBe(0)
    expect(stepPoint(order, 1, 'ArrowRight')).toBe(1)
    expect(stepPoint(order, 2, 'ArrowLeft')).toBe(2)
    expect(stepPoint(order, 0, 'End')).toBe(1)
    expect(stepPoint(order, 0, 'Home')).toBe(2)
    expect(stepPoint(order, 0, 'x')).toBeNull()
    expect(stepPoint([], -1, 'Home')).toBeNull()
  })
})

describe('outwardDomain', () => {
  it('定义域包住极值并留边，刻度全在域内、首尾就是域端', () => {
    const { domain, ticks } = outwardDomain(-0.043, 0.0496)
    expect(domain[0]).toBeLessThan(-0.043)
    expect(domain[1]).toBeGreaterThan(0.0496)
    expect(ticks[0]).toBeCloseTo(domain[0], 9)
    expect(ticks.at(-1)).toBeCloseTo(domain[1], 9)
    for (const t of ticks) expect(t >= domain[0] - 1e-9 && t <= domain[1] + 1e-9).toBe(true)
  })

  it('极值正好落在刻度上也要留边；全正、全负、单值都不退化', () => {
    const a = outwardDomain(0, 100)
    expect(a.domain[1]).toBeGreaterThan(100)
    const b = outwardDomain(-80, -10)
    expect(b.domain[0]).toBeLessThan(-80)
    expect(b.domain[1]).toBeGreaterThan(-10)
    const c = outwardDomain(3, 3)
    expect(c.domain[0]).toBeLessThan(3)
    expect(c.domain[1]).toBeGreaterThan(3)
  })
})

// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  liquidationDistance,
  liquidationFill,
  liquidationRisk,
  positionTotals,
  unrealizedPercent,
  type Position,
} from './positions-model.ts'

const base: Position = {
  id: 'p',
  symbol: 'X',
  side: 'long',
  quantity: 2,
  entryPrice: 100,
  markPrice: 100,
  liquidationPrice: 90,
  unrealizedPnl: 10,
  margin: 20,
  leverage: 10,
}

describe('liquidationDistance', () => {
  it('多头：标记价在强平价上方，距离占标记价的百分比', () => {
    expect(liquidationDistance('long', 100, 90)).toBeCloseTo(10)
    expect(liquidationDistance('long', 200, 150)).toBeCloseTo(25)
  })
  it('空头：强平价在标记价上方', () => {
    expect(liquidationDistance('short', 100, 108)).toBeCloseTo(8)
  })
  it('已越过强平价给 0 或负数', () => {
    expect(liquidationDistance('long', 90, 90)).toBe(0)
    expect(liquidationDistance('long', 85, 90)).toBeLessThan(0)
    expect(liquidationDistance('short', 110, 108)).toBeLessThan(0)
  })
  it('没有强平价或标记价不可用是 null', () => {
    expect(liquidationDistance('long', 100, null)).toBeNull()
    expect(liquidationDistance('long', 100, 0)).toBeNull()
    expect(liquidationDistance('long', 0, 90)).toBeNull()
    expect(liquidationDistance('long', Number.NaN, 90)).toBeNull()
  })
})

describe('liquidationRisk', () => {
  it('阈值上的值算到更危险的一档', () => {
    expect(liquidationRisk(10.01, 10)).toBe('safe')
    expect(liquidationRisk(10, 10)).toBe('warn')
    expect(liquidationRisk(5, 10)).toBe('danger')
    expect(liquidationRisk(4.9, 10)).toBe('danger')
  })
  it('danger 可单独给', () => {
    expect(liquidationRisk(7, 10, 8)).toBe('danger')
    expect(liquidationRisk(9, 10, 8)).toBe('warn')
  })
  it('越过强平价算危险，没有距离是 none', () => {
    expect(liquidationRisk(-2, 10)).toBe('danger')
    expect(liquidationRisk(null, 10)).toBe('none')
  })
})

describe('liquidationFill', () => {
  it('按刻度上限归一并夹在 0 到 1', () => {
    expect(liquidationFill(15, 30)).toBeCloseTo(0.5)
    expect(liquidationFill(60, 30)).toBe(1)
    expect(liquidationFill(-3, 30)).toBe(0)
    expect(liquidationFill(null, 30)).toBe(0)
    expect(liquidationFill(5, 0)).toBe(0)
  })
})

describe('unrealizedPercent', () => {
  it('有保证金按保证金算', () => {
    expect(unrealizedPercent(base)).toBeCloseTo(50)
    expect(unrealizedPercent({ ...base, unrealizedPnl: -5 })).toBeCloseTo(-25)
  })
  it('没有保证金退到成本', () => {
    expect(unrealizedPercent({ ...base, margin: null })).toBeCloseTo(5)
  })
  it('都没有是 null', () => {
    expect(unrealizedPercent({ ...base, margin: null, quantity: 0 })).toBeNull()
  })
})

describe('positionTotals', () => {
  it('合计盈亏、保证金，并数出临近强平的行', () => {
    const near: Position = { ...base, id: 'q', markPrice: 100, liquidationPrice: 96, unrealizedPnl: -4, margin: 10 }
    const none: Position = { ...base, id: 'r', liquidationPrice: null, unrealizedPnl: 2, margin: null }
    const totals = positionTotals([base, near, none], 10)
    expect(totals.count).toBe(3)
    expect(totals.unrealizedPnl).toBeCloseTo(8)
    expect(totals.margin).toBeCloseTo(30)
    expect(totals.percent).toBeCloseTo((8 / 30) * 100)
    // base 距强平正好 10%，落在阈值上算警告；near 是 4%。
    expect(totals.atRisk).toBe(2)
  })
  it('空表', () => {
    expect(positionTotals([], 10)).toEqual({ count: 0, unrealizedPnl: 0, margin: 0, percent: null, atRisk: 0 })
  })
})

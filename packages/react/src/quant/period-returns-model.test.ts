// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { aggregateReturns, compound, isoWeek, padRows, periodLimit, periodSlot } from './period-returns-model.ts'
import { divergingColor, divergingShare, NEUTRAL_SHARE } from './research-color.ts'

const at = (y: number, m: number, d: number, h = 12) => Date.UTC(y, m - 1, d, h)

describe('周期收益表的聚合', () => {
  it('复利：(1+r)(1+s)-1，空串是 0', () => {
    expect(compound([0.1, 0.1])).toBeCloseTo(0.21, 12)
    expect(compound([])).toBe(0)
    expect(compound([0.1, -0.1])).toBeCloseTo(-0.01, 12)
  })

  it('月视图：同一个月的样本复利，年度合计是全年样本复利，没有样本的月是 null', () => {
    const rows = aggregateReturns(
      [
        { time: at(2025, 1, 3), value: 0.1 },
        { time: at(2025, 1, 20), value: 0.1 },
        { time: at(2025, 3, 5), value: -0.05 },
        { time: at(2026, 2, 1), value: 0.02 },
      ],
      'month',
    )
    expect(rows.map((row) => row.year)).toEqual([2025, 2026])
    const y25 = rows[0]!
    expect(y25.cells).toHaveLength(12)
    expect(y25.cells[0]!.value).toBeCloseTo(0.21, 12)
    expect(y25.cells[0]!.count).toBe(2)
    expect(y25.cells[1]).toBeNull()
    expect(y25.cells[2]!.value).toBeCloseTo(-0.05, 12)
    expect(y25.total).toBeCloseTo(1.1 * 1.1 * 0.95 - 1, 12)
    expect(rows[1]!.cells[1]!.value).toBeCloseTo(0.02, 12)
  })

  it('季视图：3 个月并成一格', () => {
    const rows = aggregateReturns(
      [
        { time: at(2025, 1, 10), value: 0.01 },
        { time: at(2025, 3, 31), value: 0.01 },
        { time: at(2025, 4, 1), value: 0.03 },
        { time: at(2025, 12, 31), value: -0.02 },
      ],
      'quarter',
    )
    const cells = rows[0]!.cells
    expect(cells).toHaveLength(4)
    expect(cells[0]!.value).toBeCloseTo(1.01 * 1.01 - 1, 12)
    expect(cells[1]!.value).toBeCloseTo(0.03, 12)
    expect(cells[2]).toBeNull()
    expect(cells[3]!.value).toBeCloseTo(-0.02, 12)
  })

  it('时区：UTC 12 月 31 日 20:00 在东八区已经是次年 1 月 1 日', () => {
    const time = Date.UTC(2025, 11, 31, 20)
    expect(periodSlot(time, 'month', 0)).toEqual({ year: 2025, column: 11 })
    expect(periodSlot(time, 'month', 480)).toEqual({ year: 2026, column: 0 })
  })

  it('ISO 周：2026-01-01 是周四属于第 1 周；2027-01-01（周五）属于 2026 年第 53 周；周一是一周之首', () => {
    expect(isoWeek(at(2026, 1, 1))).toEqual({ year: 2026, week: 1 })
    expect(isoWeek(at(2027, 1, 1))).toEqual({ year: 2026, week: 53 })
    expect(isoWeek(at(2025, 12, 29))).toEqual({ year: 2026, week: 1 })
    expect(isoWeek(at(2026, 1, 4))).toEqual({ year: 2026, week: 1 })
    expect(isoWeek(at(2026, 1, 5))).toEqual({ year: 2026, week: 2 })
  })

  it('周视图：行按 ISO 年，列数至少 52，可补齐到同宽', () => {
    const rows = aggregateReturns(
      [
        { time: at(2026, 1, 5), value: 0.01 },
        { time: at(2027, 1, 1), value: 0.02 },
      ],
      'week',
    )
    expect(rows.map((row) => row.year)).toEqual([2026])
    expect(rows[0]!.cells[1]!.value).toBeCloseTo(0.01, 12)
    expect(rows[0]!.cells[52]!.value).toBeCloseTo(0.02, 12)
    const padded = padRows(aggregateReturns([{ time: at(2025, 6, 2), value: 0.01 }], 'week'), 53)
    expect(padded[0]!.cells).toHaveLength(53)
  })

  it('跳过非有限数；着色上限只看格子不看年度合计', () => {
    const rows = aggregateReturns(
      [
        { time: at(2025, 1, 3), value: 0.04 },
        { time: at(2025, 2, 3), value: -0.06 },
        { time: at(2025, 3, 3), value: Number.NaN },
      ],
      'month',
    )
    expect(rows[0]!.cells[2]).toBeNull()
    expect(periodLimit(rows)).toBeCloseTo(0.06, 12)
    expect(periodLimit([])).toBe(0)
  })
})

describe('涨跌发散色', () => {
  it('位置夹在 -1..1，上限不是正数时是 0', () => {
    expect(divergingShare(0.5, 0.25)).toBe(1)
    expect(divergingShare(-0.05, 0.1)).toBeCloseTo(-0.5, 12)
    expect(divergingShare(0.05, 0)).toBe(0)
    expect(divergingShare(Number.NaN, 1)).toBe(0)
  })
  it('零附近是中性灰，往两端分别混入涨与跌的端点色', () => {
    expect(divergingColor(0)).toBe('var(--div-mid)')
    expect(divergingColor(NEUTRAL_SHARE / 2)).toBe('var(--div-mid)')
    expect(divergingColor(1)).toContain('--div-pos-200')
    expect(divergingColor(-1)).toContain('--div-neg-200')
    expect(divergingColor(0.5)).toContain('35%')
  })
})

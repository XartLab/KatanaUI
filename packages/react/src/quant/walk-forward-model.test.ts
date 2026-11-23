// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  annualize,
  barBox,
  paramNames,
  summarizeWindows,
  windowSpan,
  YEAR_MS,
  type WalkForwardWindow,
} from './walk-forward-model.ts'

const win = (id: string, over: Partial<WalkForwardWindow> = {}): WalkForwardWindow => ({
  id,
  inStart: 0,
  inEnd: YEAR_MS,
  outStart: YEAR_MS,
  outEnd: YEAR_MS * 1.25,
  params: { fast: '10' },
  inReturn: 0.2,
  outReturn: 0.05,
  passed: true,
  ...over,
})

describe('步进窗口：年化与效率', () => {
  it('年化：一年的区间原样，半年的区间按 (1+r)^2 放大，非法输入是 null', () => {
    expect(annualize(0.1, YEAR_MS)).toBeCloseTo(0.1, 12)
    expect(annualize(0.1, YEAR_MS / 2)).toBeCloseTo(1.1 ** 2 - 1, 12)
    expect(annualize(0.1, 0)).toBeNull()
    expect(annualize(-1, YEAR_MS)).toBeNull()
    expect(annualize(Number.NaN, YEAR_MS)).toBeNull()
  })

  it('步进效率 = 样本外年化 / 样本内年化：样本内一年 +20%，样本外一季 +5%，年化 21.55% / 20%', () => {
    const summary = summarizeWindows([win('a')])
    expect(summary.inAnnualized).toBeCloseTo(0.2, 12)
    expect(summary.outAnnualized).toBeCloseTo(1.05 ** 4 - 1, 12)
    expect(summary.efficiency).toBeCloseTo((1.05 ** 4 - 1) / 0.2, 12)
  })

  it('多个窗口取各窗口年化的平均，通过数与样本外盈利占比分开算', () => {
    const summary = summarizeWindows([
      win('a'),
      win('b', { inReturn: 0.4, outReturn: -0.02, passed: false }),
      win('c', { outReturn: 0.0, passed: false }),
      win('d', { passed: true }),
    ])
    expect(summary.windows).toBe(4)
    expect(summary.passed).toBe(2)
    expect(summary.profitableShare).toBe(0.5)
    expect(summary.inAnnualized).toBeCloseTo((0.2 + 0.4 + 0.2 + 0.2) / 4, 12)
  })

  it('样本内年化不为正时效率没有意义；没有窗口全是 null', () => {
    expect(summarizeWindows([win('a', { inReturn: -0.1 })]).efficiency).toBeNull()
    expect(summarizeWindows([win('a', { inReturn: 0 })]).efficiency).toBeNull()
    const empty = summarizeWindows([])
    expect(empty).toMatchObject({ windows: 0, passed: 0, profitableShare: null, efficiency: null })
  })
})

describe('步进窗口：时间轴与参数名', () => {
  it('覆盖范围与条位置（百分比）', () => {
    const windows = [win('a'), win('b', { inStart: YEAR_MS * 0.25, outEnd: YEAR_MS * 1.5 })]
    const span = windowSpan(windows)!
    expect(span).toEqual({ start: 0, end: YEAR_MS * 1.5 })
    const box = barBox(YEAR_MS * 0.75, YEAR_MS * 1.5, span)
    expect(box.left).toBeCloseTo(50, 10)
    expect(box.width).toBeCloseTo(50, 10)
    expect(windowSpan([])).toBeNull()
    expect(barBox(0, 10, { start: 5, end: 5 })).toEqual({ left: 0, width: 100 })
  })

  it('参数名按首次出现的顺序去重', () => {
    expect(
      paramNames([win('a', { params: { fast: '1', slow: '2' } }), win('b', { params: { stop: '3', fast: '1' } })]),
    ).toEqual(['fast', 'slow', 'stop'])
  })
})

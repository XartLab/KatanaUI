// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { evaluateCheck, gateBar, summarizeGate, type GateCheck } from './robustness-gate-model.ts'

const check = (id: string, value: number | null, threshold: number, op: GateCheck['op'] = 'gte'): GateCheck => ({
  id,
  name: id,
  value,
  threshold,
  op,
})

describe('稳健性门', () => {
  it('四种比较：含等号与不含等号在边界上不同', () => {
    expect(evaluateCheck(check('a', 0.5, 0.5, 'gte'))).toBe('pass')
    expect(evaluateCheck(check('a', 0.5, 0.5, 'gt'))).toBe('fail')
    expect(evaluateCheck(check('a', 0.5, 0.5, 'lte'))).toBe('pass')
    expect(evaluateCheck(check('a', 0.5, 0.5, 'lt'))).toBe('fail')
    expect(evaluateCheck(check('a', 0.4, 0.5, 'gte'))).toBe('fail')
    expect(evaluateCheck(check('a', 0.4, 0.5, 'lt'))).toBe('pass')
  })

  it('没有实测值是未知，不算通过也不算失败', () => {
    expect(evaluateCheck(check('a', null, 0.5))).toBe('unknown')
    expect(evaluateCheck(check('a', Number.NaN, 0.5))).toBe('unknown')
    expect(evaluateCheck(check('a', 1, Number.NaN))).toBe('unknown')
  })

  it('汇总：全部通过才开门；有失败或未知都不开；没有判定条不开', () => {
    expect(summarizeGate([check('a', 1, 0.5), check('b', 0.2, 0.5, 'lte')])).toMatchObject({
      total: 2,
      passed: 2,
      open: true,
    })
    expect(summarizeGate([check('a', 1, 0.5), check('b', 0.9, 0.5, 'lte')])).toMatchObject({ failed: 1, open: false })
    expect(summarizeGate([check('a', 1, 0.5), check('b', null, 0.5)])).toMatchObject({ unknown: 1, open: false })
    expect(summarizeGate([])).toMatchObject({ total: 0, open: false })
  })

  it('条位置：上限是实测与阈值较大者的 1.25 倍，刻线与实测都在 0..1 内', () => {
    const bar = gateBar({ value: 0.4, threshold: 0.8 })
    expect(bar.threshold).toBeCloseTo(0.8, 12)
    expect(bar.value).toBeCloseTo(0.4, 12)
    expect(gateBar({ value: 2, threshold: 1 }).value).toBeCloseTo(0.8, 12)
    expect(gateBar({ value: null, threshold: 1 }).value).toBeNull()
    expect(gateBar({ value: 0, threshold: 0 })).toEqual({ value: 0, threshold: 0 })
  })
})

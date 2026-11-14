// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { HOLD_MS, RELEASE_MS, stepProgress } from './hold-model'

describe('stepProgress', () => {
  it('按着：按 holdMs 线性填满，封顶 1', () => {
    expect(stepProgress(0, HOLD_MS / 2, true)).toBeCloseTo(0.5)
    expect(stepProgress(0.9, HOLD_MS, true)).toBe(1)
    expect(stepProgress(0, 500, true, 1000)).toBeCloseTo(0.5)
  })
  it('松着：按 releaseMs 从满格退回，封底 0；退得比填得快', () => {
    expect(stepProgress(1, RELEASE_MS / 2, false)).toBeCloseTo(0.5)
    expect(stepProgress(0.1, RELEASE_MS, false)).toBe(0)
    expect(RELEASE_MS).toBeLessThan(HOLD_MS)
  })
  it('没过时间就不变', () => {
    expect(stepProgress(0.3, 0, true)).toBe(0.3)
    expect(stepProgress(0.3, 0, false)).toBe(0.3)
  })
})

// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { timeX } from './equity-curve-model.ts'
import { maxDrawdownSegment, underwaterDomain, underwaterShare, type UnderwaterPoint } from './underwater-model.ts'

const DAY = 86_400_000
const series = (drawdowns: number[]): UnderwaterPoint[] =>
  drawdowns.map((drawdown, index) => ({ time: index * DAY, drawdown }))

describe('最大回撤段', () => {
  it('找前高、谷底、恢复点，并算两段时长', () => {
    const segment = maxDrawdownSegment(series([0, -0.02, 0, -0.05, -0.12, -0.08, -0.03, 0, -0.01]))!
    expect(segment.peakIndex).toBe(2)
    expect(segment.troughIndex).toBe(4)
    expect(segment.recoveryIndex).toBe(7)
    expect(segment.depth).toBe(-0.12)
    expect(segment.fallMs).toBe(2 * DAY)
    expect(segment.recoveryMs).toBe(3 * DAY)
    expect(segment.endIndex).toBe(7)
  })

  it('到末点还没回到前高：恢复是 null，段画到末点', () => {
    const segment = maxDrawdownSegment(series([0, -0.1, -0.2, -0.15]))!
    expect(segment.recoveryIndex).toBeNull()
    expect(segment.recoveryMs).toBeNull()
    expect(segment.endIndex).toBe(3)
  })

  it('序列一上来就在水下：前高取第 0 点', () => {
    const segment = maxDrawdownSegment(series([-0.05, -0.1, 0]))!
    expect(segment.peakIndex).toBe(0)
    expect(segment.recoveryIndex).toBe(2)
  })

  it('最深的并列取最早的；没有回撤返回 null', () => {
    expect(maxDrawdownSegment(series([0, -0.1, 0, -0.1, 0]))!.troughIndex).toBe(1)
    expect(maxDrawdownSegment(series([0, 0, 0]))).toBeNull()
    expect(maxDrawdownSegment([])).toBeNull()
  })

  it('水下占比与纵轴区间', () => {
    expect(underwaterShare(series([0, -0.1, -0.2, 0]))).toBe(0.5)
    expect(underwaterShare([])).toBe(0)
    expect(underwaterDomain(series([0, -0.3, -0.1]))).toEqual([-0.3, 0])
    expect(underwaterDomain(series([0, 0]))).toEqual([-1, 0])
  })

  it('与权益曲线共用横轴：同一个时刻、同一个定义域落在同一个位置', () => {
    expect(timeX(5 * DAY, 0, 10 * DAY)).toBe(500)
    expect(timeX(0, 0, 10 * DAY)).toBe(0)
  })
})

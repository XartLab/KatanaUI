// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { netBar, netScale, seatShare } from './net-buy-model.ts'

describe('龙虎榜净买的几何', () => {
  it('对称刻度照 AttributionBars：最大 |净买| 向上取到一位有效数字', () => {
    expect(
      netScale([
        { code: 'a', name: 'A', net: 1.86e8 },
        { code: 'b', name: 'B', net: -9.3e7 },
      ]),
    ).toBe(2e8)
  })
  it('净买从零轴往右、净卖往左', () => {
    expect(netBar(1e8, 2e8)).toEqual({ left: 0.5, width: 0.25 })
    expect(netBar(-1e8, 2e8)).toEqual({ left: 0.25, width: 0.25 })
  })
  it('席位条按这只票的席位最大额', () => {
    const seats = { buy: [{ name: 'x', amount: 4 }], sell: [{ name: 'y', amount: 2 }] }
    expect(seatShare(2, seats)).toBe(0.5)
  })
})

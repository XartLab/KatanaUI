// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { buildDepth, depthAt, depthPrices, formatDepthOffset, stepAreaPath, stepLinePath } from './depth-chart-model.ts'

const P = { priceDecimals: 2, sizeDecimals: 3 }
const bids = [
  { price: 99.98, size: 2 },
  { price: 99.99, size: 1 },
  { price: 99.9, size: 0.1 },
  { price: 99.8, size: 0.2 },
]
const asks = [
  { price: 100.01, size: 1 },
  { price: 100.03, size: 2 },
  { price: 100.2, size: 0.1 },
]

describe('深度模型', () => {
  it('累计量沿最优价往外递增（十进制精确），中间价取最优买卖价的中点', () => {
    const model = buildDepth(bids, asks, P)
    expect(model.bids.map((r) => r.price)).toEqual([99.99, 99.98, 99.9, 99.8])
    expect(model.bids.map((r) => r.total)).toEqual([1, 3, 3.1, 3.3])
    expect(model.asks.map((r) => r.total)).toEqual([1, 3, 3.1])
    expect(model.mid).toBe(100)
    expect(model.maxTotal).toBe(3.3)
  })

  it('rangePct 限制定义域：只留中间价上下 x% 以内的档，纵轴最大值跟着变', () => {
    const model = buildDepth(bids, asks, { ...P, rangePct: 0.1 })
    expect(model.domain[0]).toBeCloseTo(99.9, 10)
    expect(model.domain[1]).toBeCloseTo(100.1, 10)
    expect(model.bids.map((r) => r.price)).toEqual([99.99, 99.98, 99.9])
    expect(model.asks.map((r) => r.price)).toEqual([100.01, 100.03])
    expect(model.maxTotal).toBe(3.1)
  })

  it('没有 rangePct 时定义域是最远一档到最远一档', () => {
    expect(buildDepth(bids, asks, P).domain).toEqual([99.8, 100.2])
  })

  it('只有一侧：中间价是那侧最优价，定义域不为零宽', () => {
    const model = buildDepth([{ price: 10, size: 1 }], [], P)
    expect(model.mid).toBe(10)
    expect(model.domain[1]).toBeGreaterThan(model.domain[0])
    expect(buildDepth([], [], P).mid).toBeNull()
  })

  it('悬停读数：买盘看价格不低于它的累计，卖盘看不高于它的累计，距中间价百分比带符号', () => {
    const model = buildDepth(bids, asks, P)
    expect(depthAt(model, 99.98)!.total).toBe(3)
    expect(depthAt(model, 99.98)!.side).toBe('bid')
    expect(depthAt(model, 99.98)!.offsetPct).toBeCloseTo(-0.02, 10)
    expect(depthAt(model, 99.95)!.total).toBe(3)
    expect(depthAt(model, 99.85)!.total).toBe(3.1)
    expect(depthAt(model, 100.02)!.total).toBe(1)
    expect(depthAt(model, 100.03)!.total).toBe(3)
    expect(depthAt(model, 100.03)!.offsetPct).toBeCloseTo(0.03, 10)
    // 价差里：买盘最优价之上的价位累计是 0（还没有买量覆盖到）。
    expect(depthAt(model, 100)).toMatchObject({ side: 'bid', total: 0 })
    expect(depthAt(buildDepth([], [], P), 1)).toBeNull()
  })

  it('阶梯路径：每档跳一级、档间水平，走到边缘再落回底', () => {
    const steps = [
      { price: 10, size: 1, total: 1 },
      { price: 9, size: 2, total: 3 },
    ]
    const x = (p: number) => p * 10
    const y = (t: number) => 100 - t * 10
    expect(stepAreaPath(steps, 8, x, y, 100)).toBe('M100 100 V90 H90 V70 H80 V100 Z')
    expect(stepLinePath(steps, 8, x, y)).toBe('M100 90 H90 V70 H80')
    expect(stepAreaPath([], 8, x, y, 100)).toBe('')
  })

  it('键盘用的价位表：从低到高', () => {
    expect(depthPrices(buildDepth(bids, asks, P))).toEqual([99.8, 99.9, 99.98, 99.99, 100.01, 100.03, 100.2])
  })
})

describe('距中间价百分比', () => {
  it.each([
    [-0.005, '0.00%'],
    [-0.006, '-0.01%'],
    [0.004, '0.00%'],
    [0.4, '+0.40%'],
  ])('偏差 %s 显示为 %s', (offset, expected) => {
    expect(formatDepthOffset(offset)).toBe(expected)
  })

  it('中间价为 100.005 时，最优买价 100 的偏差显示为 0.00%', () => {
    const model = buildDepth([{ price: 100, size: 1 }], [{ price: 100.01, size: 1 }], P)
    expect(formatDepthOffset(depthAt(model, 100)!.offsetPct)).toBe('0.00%')
  })
})

// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { buildOrderBook, depthRatio, mergeLevels, type BookLevel } from './order-book-model.ts'

const P = { priceDecimals: 2, sizeDecimals: 3 }

describe('档位合并', () => {
  it('买盘向下、卖盘向上取到档位，同档的量十进制精确相加', () => {
    // 0.1 + 0.2 在浮点里是 0.30000000000000004；整数算出来必须恰好 0.3。
    expect(0.1 + 0.2).not.toBe(0.3)
    const bids: BookLevel[] = [
      { price: 100.04, size: 0.1 },
      { price: 100.03, size: 0.2 },
      { price: 99.99, size: 1 },
    ]
    expect(mergeLevels(bids, 'bid', 0.05, P)).toEqual([
      { price: 100, size: 0.3, total: 0.3 },
      { price: 99.95, size: 1, total: 1.3 },
    ])
    const asks: BookLevel[] = [
      { price: 100.06, size: 0.1 },
      { price: 100.1, size: 0.2 },
      { price: 100.11, size: 1 },
    ]
    expect(mergeLevels(asks, 'ask', 0.1, P)).toEqual([
      { price: 100.1, size: 0.3, total: 0.3 },
      { price: 100.2, size: 1, total: 1.3 },
    ])
  })

  it('档位的小数位比价格位数多时也不丢（价格 2 位、档位 0.005）', () => {
    const rows = mergeLevels([{ price: 10.01, size: 1 }], 'ask', 0.005, P)
    expect(rows[0]!.price).toBe(10.01)
  })

  it('价格是 0.1 * 3 这类带浮点误差的数，也落在整档上', () => {
    const rows = mergeLevels([{ price: 0.1 * 3, size: 1 }], 'bid', 0.1, { priceDecimals: 1, sizeDecimals: 0 })
    expect(rows).toEqual([{ price: 0.3, size: 1, total: 1 }])
  })

  it('整数档位 10：不论输入顺序，都从最优价往外排', () => {
    const asks: BookLevel[] = [
      { price: 125, size: 2 },
      { price: 101, size: 1 },
      { price: 109, size: 3 },
    ]
    const rows = mergeLevels(asks, 'ask', 10, { priceDecimals: 0, sizeDecimals: 0 })
    expect(rows.map((r) => r.price)).toEqual([110, 130])
    expect(rows.map((r) => r.total)).toEqual([4, 6])
  })

  it('量为 0、负数、非有限数的档不进簿；tick 非法按价格最小位', () => {
    const rows = mergeLevels(
      [
        { price: 1.01, size: 0 },
        { price: 1.02, size: -1 },
        { price: Number.NaN, size: 1 },
        { price: 1.03, size: 2 },
      ],
      'bid',
      0,
      P,
    )
    expect(rows).toEqual([{ price: 1.03, size: 2, total: 2 }])
  })
})

describe('订单簿模型', () => {
  const bids: BookLevel[] = [
    { price: 99.99, size: 3 },
    { price: 99.98, size: 1 },
    { price: 99.97, size: 2 },
  ]
  const asks: BookLevel[] = [
    { price: 100.01, size: 1 },
    { price: 100.02, size: 1 },
    { price: 100.03, size: 2 },
  ]

  it('合并后的行、价差与最优价（价差用原始档位）', () => {
    const model = buildOrderBook(bids, asks, { ...P, tick: 0.05, rows: 5 })
    // 99.99 / 99.98 / 99.97 向下取整都落在 99.95 档。
    expect(model.bids).toEqual([{ price: 99.95, size: 6, total: 6 }])
    expect(model.asks.map((r) => r.price)).toEqual([100.05])
    expect(model.bestBid).toBe(99.99)
    expect(model.bestAsk).toBe(100.01)
    expect(model.spread).toBe(0.02)
    expect(model.spreadPct).toBeCloseTo(0.02, 3)
  })

  it('累计量沿最优价往外递增', () => {
    const model = buildOrderBook(bids, asks, { ...P, rows: 5 })
    expect(model.bids.map((r) => r.total)).toEqual([3, 4, 6])
    expect(model.asks.map((r) => r.total)).toEqual([1, 2, 4])
  })

  it('买卖占比：买量 / (买 + 卖)，保留一位小数，两个数相加恒为 100', () => {
    const model = buildOrderBook(bids, asks, { ...P, rows: 5 })
    expect(model.bidVolume).toBe(6)
    expect(model.askVolume).toBe(4)
    expect(model.bidPct).toBe(60)
    expect(model.askPct).toBe(40)
    const odd = buildOrderBook([{ price: 1, size: 1 }], [{ price: 2, size: 2 }], { ...P, rows: 5 })
    expect(odd.bidPct).toBe(33.3)
    expect(odd.askPct).toBe(66.7)
    expect(odd.bidPct! + odd.askPct!).toBeCloseTo(100, 10)
  })

  it('占比只数每侧前 shareRows 行', () => {
    const model = buildOrderBook(bids, asks, { ...P, rows: 5, shareRows: 1 })
    expect(model.bidVolume).toBe(3)
    expect(model.askVolume).toBe(1)
    expect(model.bidPct).toBe(75)
  })

  it('缺一侧：价差与占比都不瞎编', () => {
    const empty = buildOrderBook([], [], { ...P, rows: 5 })
    expect(empty.spread).toBeNull()
    expect(empty.bidPct).toBeNull()
    const oneSide = buildOrderBook(bids, [], { ...P, rows: 5 })
    expect(oneSide.spread).toBeNull()
    expect(oneSide.bidPct).toBe(100)
    expect(oneSide.askPct).toBe(0)
  })

  it('rows 截断；深度条比例', () => {
    expect(buildOrderBook(bids, asks, { ...P, rows: 2 }).bids).toHaveLength(2)
    expect(depthRatio(3, 6)).toBe(0.5)
    expect(depthRatio(1, 0)).toBe(0)
    expect(depthRatio(9, 6)).toBe(1)
  })
})

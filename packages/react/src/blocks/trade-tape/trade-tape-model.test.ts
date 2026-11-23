// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { clockText, tapeRows, type Trade } from './trade-tape-model.ts'

const t = (
  id: number,
  price: number,
  size: number,
  side: Trade['side'],
  time = 1_700_000_000_000 - id * 1000,
): Trade => ({
  id,
  time,
  price,
  size,
  side,
})

describe('成交明细行', () => {
  it('不聚合：一笔一行，次序不变，不改量', () => {
    const rows = tapeRows([t(3, 10, 1, 'buy'), t(2, 10, 2, 'buy')], { sizeDecimals: 3 })
    expect(rows.map((r) => [r.key, r.size, r.count])).toEqual([
      ['3', 1, 1],
      ['2', 2, 1],
    ])
  })

  it('聚合只并紧挨着、同价、同方向的成交，量十进制精确相加', () => {
    const rows = tapeRows(
      [
        t(6, 10, 0.1, 'buy'),
        t(5, 10, 0.2, 'buy'),
        t(4, 10, 1, 'sell'),
        t(3, 10, 1, 'buy'),
        t(2, 11, 1, 'buy'),
        t(1, 10, 1, 'buy'),
      ],
      { sizeDecimals: 3, aggregate: true },
    )
    expect(rows.map((r) => [r.price, r.side, r.size, r.count])).toEqual([
      [10, 'buy', 0.3, 2],
      [10, 'sell', 1, 1],
      [10, 'buy', 1, 1],
      [11, 'buy', 1, 1],
      [10, 'buy', 1, 1],
    ])
    // 聚合行的标识取最老那笔：新成交并进来时标识不变。
    expect(rows[0]!.key).toBe('5')
    expect(rows[0]!.time).toBe(1_700_000_000_000 - 6 * 1000)
  })

  it('新成交并进最上面的聚合行：标识不变，笔数加一', () => {
    const before = tapeRows([t(5, 10, 1, 'buy'), t(4, 10, 1, 'buy')], { sizeDecimals: 0, aggregate: true })
    const after = tapeRows([t(6, 10, 1, 'buy'), t(5, 10, 1, 'buy'), t(4, 10, 1, 'buy')], {
      sizeDecimals: 0,
      aggregate: true,
    })
    expect(before[0]!.key).toBe(after[0]!.key)
    expect(after[0]!.count).toBe(3)
  })

  it('大单：量不小于阈值（聚合行按合计量），阈值比较走整数', () => {
    const rows = tapeRows([t(3, 10, 0.3, 'buy'), t(2, 10, 0.1, 'buy'), t(1, 11, 0.1, 'sell')], {
      sizeDecimals: 3,
      aggregate: true,
      largeSize: 0.4,
    })
    expect(rows.map((r) => r.large)).toEqual([true, false])
    // 0.1 + 0.2 = 0.30000000000000004：阈值 0.3 时仍应判大单。
    const sum = tapeRows([t(2, 10, 0.1, 'buy'), t(1, 10, 0.2, 'buy')], {
      sizeDecimals: 3,
      aggregate: true,
      largeSize: 0.3,
    })
    expect(sum[0]!.large).toBe(true)
    expect(tapeRows([t(1, 10, 99, 'buy')], { sizeDecimals: 0 })[0]!.large).toBe(false)
  })

  it('maxRows 在聚合之后截；量非正的成交丢掉', () => {
    const rows = tapeRows([t(4, 1, 1, 'buy'), t(3, 2, 0, 'buy'), t(2, 3, 1, 'sell'), t(1, 4, 1, 'sell')], {
      sizeDecimals: 0,
      maxRows: 2,
    })
    expect(rows.map((r) => r.price)).toEqual([1, 3])
  })

  it('时间写成 UTC 的 HH:MM:SS', () => {
    expect(clockText(Date.UTC(2026, 10, 22, 9, 5, 7))).toBe('09:05:07')
  })
})

// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { rankSeats, seatNet, seatTotal, type Seat } from './seat-model.ts'
import { SeatTable } from './seat-table.tsx'

// #110 第 2 批第 1 项：龙虎榜席位。示例数据，席位与金额都是虚构的。
const BUY: Seat[] = [
  { name: '示例营业部 A', tag: '示例游资甲', buy: 1.2e8, sell: 2e6 },
  { name: '机构专用', tag: '机构', buy: 9.5e7, sell: 0 },
  { name: '示例营业部 B', buy: 8e7, sell: 3e7 },
  { name: '示例营业部 C', buy: 6e7, sell: null },
  { name: '示例营业部 D', buy: 4e7, sell: 1e6 },
  { name: '示例营业部 E', buy: 2e7, sell: 5e6 },
  { name: '示例营业部 F', buy: null, sell: 1e6 },
]

describe('席位的纯函数', () => {
  it('rankSeats：买入侧按买入额从大到小取前 5，取不到的排最后，不当 0', () => {
    const top = rankSeats([...BUY].reverse(), 'buy')
    expect(top.map((seat) => seat.name)).toEqual([
      '示例营业部 A',
      '机构专用',
      '示例营业部 B',
      '示例营业部 C',
      '示例营业部 D',
    ])
    expect(rankSeats(BUY, 'buy', 7).at(-1)!.name).toBe('示例营业部 F')
    expect(rankSeats(BUY, 'sell', 2).map((seat) => seat.name)).toEqual(['示例营业部 B', '示例营业部 E'])
    expect(rankSeats(BUY, 'buy', 0)).toEqual([])
  })

  it('seatNet：买入 − 卖出，任一方取不到就是 null', () => {
    expect(seatNet(BUY[0]!)).toBe(1.18e8)
    expect(seatNet(BUY[3]!)).toBeNull()
    expect(seatNet(BUY[6]!)).toBeNull()
  })

  it('seatTotal：只加有的，全取不到是 null', () => {
    expect(seatTotal(BUY.slice(0, 2), 'buy')).toBe(2.15e8)
    expect(seatTotal(BUY.slice(0, 4), 'net')).toBe(1.18e8 + 9.5e7 + 5e7)
    expect(seatTotal([{ name: 'x' }], 'buy')).toBeNull()
  })
})

describe('SeatTable', () => {
  it('每侧只画前五行，写名次、标签、万 / 亿金额与带正负号的净额', () => {
    const html = renderToStaticMarkup(<SeatTable buy={BUY} sell={BUY} />)
    expect(html.match(/data-slot="seat-row"/g)).toHaveLength(10)
    expect(html).toContain('买入前五')
    expect(html).toContain('卖出前五')
    expect(html).toContain('data-slot="seat-tag">机构<')
    expect(html).toContain('1.20亿')
    expect(html).toContain('+1.18亿')
    // 买入取不到的席位，买入列与净额都写「—」，不写 0。
    expect(renderToStaticMarkup(<SeatTable buy={[{ name: '缺额', buy: null, sell: 1e6 }]} sell={[]} />)).toContain(
      '>—<',
    )
  })

  it('净额带涨跌方向：正为 up、负为 down', () => {
    const html = renderToStaticMarkup(
      <SeatTable buy={[{ name: '甲', buy: 5e7, sell: 1e7 }]} sell={[{ name: '乙', buy: 1e6, sell: 9e7 }]} />,
    )
    expect(html).toContain('data-slot="seat-net" data-tone="up">+4,000万<')
    expect(html).toContain('data-slot="seat-net" data-tone="down">-8,900万<')
  })

  it('没有席位：写空态，不画表', () => {
    const html = renderToStaticMarkup(<SeatTable buy={[]} sell={[]} />)
    expect(html).toContain('暂无席位')
    expect(html).not.toContain('<table')
  })
})

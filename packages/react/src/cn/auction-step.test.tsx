// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import {
  auctionSteps,
  auctionSummary,
  auctionX,
  priceDomain,
  stepPath,
  volumeBars,
  type AuctionPoint,
} from './auction-model.ts'
import { AuctionStep, AuctionStepSpark } from './auction-step.tsx'

// #110 第 2 批第 2 项：竞价台阶。示例数据，价格与量都是虚构的。
const POINTS: AuctionPoint[] = [
  { time: '09:25', price: 10.4, volume: 9000 },
  { time: '09:15', price: 10.0, volume: 100 },
  { time: '09:18:30', price: 10.2, volume: 1500 },
  { time: '09:21', price: 10.3, volume: 6000 },
  { time: '09:10', price: 99, volume: 1 }, // 不在竞价内：丢掉
  { time: '09:22', price: null, volume: 1 }, // 价取不到：丢掉
  { time: '乱写', price: 1 },
]

describe('竞价台阶的纯函数', () => {
  it('auctionSteps：丢掉不在 09:15–09:25、价取不到、时刻写不对的点，按时刻排序', () => {
    const steps = auctionSteps(POINTS)
    expect(steps.map((step) => step.price)).toEqual([10.0, 10.2, 10.3, 10.4])
    expect(steps[0]!.x).toBe(0)
    expect(steps.at(-1)!.x).toBe(1)
    expect(auctionX(9 * 60 + 20)).toBe(0.5)
    expect(auctionSteps(null)).toEqual([])
  })

  it('stepPath：先横后竖，价格在两个时刻之间不变（台阶，不是斜线）', () => {
    const steps = auctionSteps([
      { time: '09:15', price: 10 },
      { time: '09:20', price: 11 },
      { time: '09:25', price: 10.5 },
    ])
    const d = stepPath(steps, [10, 11], 100, 50)
    // 起点在低位，09:20 处 H 到 50 再 V 到高位，不出现 L（斜线）。
    expect(d).toBe('M0.00 50.00H50.00V0.00H100.00V25.00')
    expect(d).not.toContain('L')
  })

  it('volumeBars：按最大量归一，宽度是到下一个点的间隔；一个量都没有不画', () => {
    const bars = volumeBars(auctionSteps(POINTS))
    expect(bars).toHaveLength(4)
    expect(Math.max(...bars.map((bar) => bar.ratio))).toBe(1)
    expect(bars[0]!.width).toBeCloseTo(0.35)
    expect(volumeBars(auctionSteps([{ time: '09:16', price: 10 }]))).toEqual([])
  })

  it('priceDomain 把昨收也圈进去；auctionSummary 没有昨收不着色', () => {
    const steps = auctionSteps(POINTS)
    const [lo, hi] = priceDomain(steps, 9)!
    expect(lo).toBeLessThan(9)
    expect(hi).toBeGreaterThan(10.4)
    expect(auctionSummary(steps, 10).tone).toBe('up')
    expect(auctionSummary(steps, 11).tone).toBe('down')
    expect(auctionSummary(steps).tone).toBe('flat')
    expect(auctionSummary(steps, 10).change).toBeCloseTo(4)
  })
})

describe('AuctionStep', () => {
  it('画台阶线、昨收参考线、09:20 分界与量柱，读数是最新撮合价与涨跌幅', () => {
    const html = renderToStaticMarkup(<AuctionStep points={POINTS} prevClose={10} />)
    expect(html).toContain('data-slot="auction-line"')
    expect(html).toContain('data-slot="auction-ref"')
    expect(html).toContain('09:20 起不可撤单')
    expect(html.match(/k-auction-bar/g)).toHaveLength(4)
    expect(html).toContain('data-slot="auction-price">10.40<')
    expect(html).toContain('data-slot="auction-change">+4.00%<')
    expect(html).toContain('data-tone="up"')
  })

  it('没有昨收：不画参考线、涨跌幅写「—」；没有点：写空态', () => {
    const html = renderToStaticMarkup(<AuctionStep points={POINTS} />)
    expect(html).not.toContain('data-slot="auction-ref"')
    expect(html).toContain('data-slot="auction-change">—<')
    expect(renderToStaticMarkup(<AuctionStep points={[]} />)).toContain('暂无竞价数据')
  })

  it('迷你台阶：画一条线；没点写「—」', () => {
    expect(renderToStaticMarkup(<AuctionStepSpark points={POINTS} prevClose={11} />)).toContain('data-tone="down"')
    expect(renderToStaticMarkup(<AuctionStepSpark points={[]} />)).toContain('data-empty')
  })
})

// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { AuctionBarCell } from './auction-bar-cell.tsx'
import { auctionBarShares, auctionPending, auctionRatio } from './auction-bar-model.ts'

// KatanaUI #11 第 5 项：竞价量比条。示例金额，都是编的。

describe('竞价量比条的纯函数', () => {
  it('auctionRatio：今日 ÷ 昨日同期；任一方取不到、昨日不是正数返回 null', () => {
    expect(auctionRatio(3e7, 1.2e7)).toBeCloseTo(2.5)
    expect(auctionRatio(0, 1e7)).toBe(0)
    expect(auctionRatio(3e7, 0)).toBeNull()
    expect(auctionRatio(null, 1e7)).toBeNull()
    expect(auctionRatio(3e7, undefined)).toBeNull()
    expect(auctionRatio(Number.NaN, 1e7)).toBeNull()
  })

  it('auctionPending：09:25 之前是虚拟匹配，没出结果；没给时刻按已出', () => {
    expect(auctionPending('09:18')).toBe(true)
    expect(auctionPending('09:24:59')).toBe(true)
    expect(auctionPending('09:25')).toBe(false)
    expect(auctionPending('10:00')).toBe(false)
    expect(auctionPending(undefined)).toBe(false)
    expect(auctionPending('bad')).toBe(false)
  })

  it('auctionBarShares：给了 max 一列共用一把，不给取这一格里最大的；负数与取不到的不画', () => {
    expect(auctionBarShares(3e7, 1.5e7, null, 6e7)).toEqual({ amount: 0.5, previous: 0.25, limitBid: null })
    expect(auctionBarShares(3e7, 1.5e7, 6e7)).toEqual({ amount: 0.5, previous: 0.25, limitBid: 1 })
    expect(auctionBarShares(9e7, 1e7, null, 6e7).amount).toBe(1)
    expect(auctionBarShares(-1, null, undefined)).toEqual({ amount: null, previous: null, limitBid: null })
  })
})

describe('AuctionBarCell 渲染', () => {
  it('结果出了：写两位小数的量比，≥ 1 加亮；刻度落在昨日同期', () => {
    const html = renderToStaticMarkup(
      <AuctionBarCell amount={3e7} previous={1.2e7} limitBid={8e6} max={6e7} time="09:25" />,
    )
    expect(html).toContain('>2.50<')
    expect(html).toContain('data-above="true"')
    expect(html).toMatch(/data-slot="auction-bar-fill" style="width:50%"/)
    expect(html).toMatch(/data-slot="auction-bar-mark" style="left:20%"/)
    expect(html).toContain('data-slot="auction-bar-bid"')
    expect(html).toContain('aria-label="竞价额 3,000万，昨日同期 1,200万，量比 2.50，涨停委买 800万"')
    expect(html).not.toContain('未出结果')
  })

  it('09:25 之前：整格标 pending，字写「未出结果」，不加亮', () => {
    const html = renderToStaticMarkup(<AuctionBarCell amount={3e7} previous={1.2e7} time="09:21" />)
    expect(html).toContain('data-pending="true"')
    expect(html).toContain('>未出结果<')
    expect(html).not.toContain('data-above')
    expect(html).toContain('竞价未出结果，')
  })

  it('比昨天少不加亮；昨日取不到写「—」、不画刻度，也没有涨停委买线', () => {
    const lower = renderToStaticMarkup(<AuctionBarCell amount={1e7} previous={2e7} />)
    expect(lower).toContain('>0.50<')
    expect(lower).not.toContain('data-above')
    const missing = renderToStaticMarkup(<AuctionBarCell amount={1e7} />)
    expect(missing).toContain('>—<')
    expect(missing).not.toContain('auction-bar-mark')
    expect(missing).not.toContain('auction-bar-bid')
  })
})

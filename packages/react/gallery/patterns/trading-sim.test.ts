// SPDX-License-Identifier: MIT
// 交易三个模式页（#103）：假网关、API 信息解析、强平提醒的纯函数，以及三页都收进了模式目录、用到的件都有页、示例渲染得出来。
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import type { OrderDraft } from '../../src/blocks'
import { pageById } from '../registry'
import { POSITIONS } from '../usage/PositionsTableUsage'
import { patternById } from './index'
import {
  apiAccess,
  closePosition,
  missingFields,
  nearestLiquidation,
  parseApiPaste,
  parseCloseQuantity,
  replyNotice,
  submitToGateway,
} from './trading-sim'

const CONTEXT = { id: 'demo-1', time: Date.UTC(2026, 10, 23), symbol: 'BTC-USDT-SWAP', pricePrecision: 1 }
const draft = (patch: Partial<OrderDraft> = {}): OrderDraft =>
  ({
    side: 'buy',
    type: 'limit',
    price: 60000,
    contracts: 1.51,
    leverage: 100,
    reduceOnly: false,
    ...patch,
  }) as OrderDraft

describe('submitToGateway', () => {
  it('交易锁开着：单不出网关，交易所拒不拒都一样', () => {
    expect(submitToGateway(draft(), { locked: true, reject: null }, CONTEXT)).toEqual({ kind: 'locked' })
    expect(submitToGateway(draft(), { locked: true, reject: '保证金不足' }, CONTEXT)).toEqual({ kind: 'locked' })
  })

  it('交易所拒单：带原因', () => {
    expect(submitToGateway(draft(), { locked: false, reject: '保证金不足' }, CONTEXT)).toEqual({
      kind: 'rejected',
      reason: '保证金不足',
    })
  })

  it('限价单回一张挂单（进委托表），市价单当场成交（不进委托表）', () => {
    const accepted = submitToGateway(draft(), { locked: false, reject: null }, CONTEXT)
    expect(accepted).toMatchObject({
      kind: 'accepted',
      order: { id: 'demo-1', side: 'buy', type: 'limit', price: 60000, quantity: 1.51, filled: 0, status: 'open' },
    })
    const market = submitToGateway(
      draft({ type: 'market', price: undefined }),
      { locked: false, reject: null },
      CONTEXT,
    )
    expect(market).toEqual({ kind: 'filled', contracts: 1.51 })
  })

  it('弹出提示：挡下 warn、被拒 danger、成功 ok，标题写结果', () => {
    const symbol = CONTEXT.symbol
    expect(replyNotice({ kind: 'locked' }, draft(), symbol)).toMatchObject({
      tone: 'warn',
      title: '没有发出：交易锁开着',
    })
    expect(replyNotice({ kind: 'rejected', reason: '保证金不足' }, draft(), symbol)).toMatchObject({
      tone: 'danger',
      title: '下单被拒',
    })
    const filled = replyNotice({ kind: 'filled', contracts: 2 }, draft({ side: 'sell', contracts: 2 }), symbol)
    expect(filled).toMatchObject({ tone: 'ok', title: '市价单已成交' })
    expect(filled.description).toContain('开空 2 张')
  })
})

describe('parseApiPaste 与 apiAccess', () => {
  it('认出 OKX 那一段里的 Key、Secret、备注名与权限', () => {
    const parsed = parseApiPaste('apikey = "k-1" secretkey = "s-1" IP = "" 备注名 = "我的模拟盘" 权限 = "读取, 交易"')
    expect(parsed).toEqual({
      recognized: true,
      apiKey: 'k-1',
      secretKey: 's-1',
      name: '我的模拟盘',
      permissions: ['读取', '交易'],
    })
    expect(apiAccess(parsed.permissions)).toBe('trade')
  })

  it('认不出的文字：recognized 为 false，什么都不填', () => {
    expect(parseApiPaste('随便一段字')).toEqual({ recognized: false, permissions: [] })
  })

  it('权限三档：只读、可交易、带提现（提现最高）', () => {
    expect(apiAccess(['读取'])).toBe('read')
    expect(apiAccess(['读取', '交易'])).toBe('trade')
    expect(apiAccess(['读取', '交易', '提现'])).toBe('withdraw')
  })

  it('空框各自报在自己旁边', () => {
    expect(missingFields({ apiKey: 'k', secretKey: ' ', passphrase: '' })).toEqual({
      secretKey: '没填 Secret',
      passphrase: expect.stringContaining('没填 Passphrase'),
    })
    expect(missingFields({ apiKey: 'k', secretKey: 's', passphrase: 'p' })).toEqual({})
  })
})

describe('平仓数量与部分平仓', () => {
  it('数量要大于 0、不超过持有', () => {
    expect(parseCloseQuantity('120', 120)).toBe(120)
    expect(parseCloseQuantity(' 30 ', 120)).toBe(30)
    for (const text of ['', '0', '-1', '121', 'abc']) expect(parseCloseQuantity(text, 120), text).toBe(null)
  })

  it('平满移走这一行；部分平仓按剩下的比例缩数量、盈亏与保证金', () => {
    const sol = POSITIONS.find((item) => item.id === 'sol-long')!
    expect(closePosition(POSITIONS, 'sol-long', 120).map((item) => item.id)).not.toContain('sol-long')
    const partial = closePosition(POSITIONS, 'sol-long', 30).find((item) => item.id === 'sol-long')!
    expect(partial.quantity).toBe(90)
    expect(partial.unrealizedPnl).toBeCloseTo(sol.unrealizedPnl * 0.75)
    expect(partial.margin).toBeCloseTo(sol.margin! * 0.75)
    expect(closePosition(POSITIONS, 'sol-long', 30)).toHaveLength(POSITIONS.length)
  })
})

describe('nearestLiquidation', () => {
  it('挑离强平最近的那一个；平掉它换下一个；全都安全就没有', () => {
    // 演示持仓：SOL 多离强平约 3.5%（危险），ETH 空约 7.3%（警告），BTC 多约 18.6%（安全），XAU 没有强平价。
    const first = nearestLiquidation(POSITIONS, 10)
    expect(first?.position.id).toBe('sol-long')
    expect(first?.risk).toBe('danger')
    const second = nearestLiquidation(
      POSITIONS.filter((item) => item.id !== 'sol-long'),
      10,
    )
    expect(second?.position.id).toBe('eth-short')
    expect(second?.risk).toBe('warn')
    expect(
      nearestLiquidation(
        POSITIONS.filter((item) => item.id === 'btc-long' || item.id === 'xau-long'),
        10,
      ),
    ).toBe(null)
  })
})

describe('交易三个模式页', () => {
  const ids = ['order-to-confirmation', 'position-monitoring', 'account-connection'] as const
  const expected: Record<(typeof ids)[number], readonly string[]> = {
    'order-to-confirmation': ['交易锁', '一键下单（不弹确认）', '开多', '没有委托'],
    'position-monitoring': ['持仓 4', '委托 4', 'data-testid="liquidation-alert"', 'data-risk="danger"'],
    'account-connection': ['示例交易所 · 要 API', '还没有连接', '网络代理（所有连接共用一份）', '跟随系统'],
  }

  for (const id of ids) {
    it(`${id}：收进了模式目录，用到的件都有页，示例渲染得出来`, () => {
      const pattern = patternById(id)
      expect(pattern).toBeDefined()
      for (const part of pattern!.parts) expect(pageById(part.page), part.page).toBeDefined()
      const html = renderToString(createElement(pattern!.Demo))
      for (const text of expected[id]) expect(html).toContain(text)
    })
  }
})

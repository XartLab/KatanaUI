// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { inferChinaVenue, normalizeSymbol, normalizeVenue, splitCryptoPair } from './normalize.ts'

const pick = (input: string, hint?: Parameters<typeof normalizeSymbol>[1]) => {
  const { code, venue, assetClass, key } = normalizeSymbol(input, hint)
  return { code, venue, assetClass, key }
}

describe('代码规范化', () => {
  it('加密币：各家写法都收成基础币', () => {
    for (const s of [
      'BTCUSDT',
      'BTC-USDT',
      'BTC/USDT',
      'BTC_USDT',
      'BTC-PERP',
      'BTCUSDT.P',
      'btcusdt',
      'BTC-USDT-SWAP',
    ])
      expect(pick(s), s).toMatchObject({ code: 'BTC', assetClass: 'crypto', key: 'BTC' })
    expect(normalizeSymbol('ETHBTC').quote).toBe('BTC')
    expect(pick('ETHBTC').code).toBe('ETH')
    expect(pick('1000PEPEUSDT').code).toBe('PEPE')
    expect(pick('BTCFDUSD').code).toBe('BTC')
  })

  it('加密币：TradingView 的「场所:代码」，场所是交易所名', () => {
    expect(pick('BINANCE:BTCUSDT')).toEqual({ code: 'BTC', venue: 'BINANCE', assetClass: 'crypto', key: 'BTC' })
    expect(pick('OKEX:ETH-USDT-SWAP')).toMatchObject({ code: 'ETH', venue: 'OKX' })
    // 带了交易所的裸代码也认成加密币。
    expect(pick('SOL', { venue: 'Bybit' })).toMatchObject({ code: 'SOL', assetClass: 'crypto' })
  })

  it('A 股：600519.XSHG、600519.SH、sh600519 → 600519 + XSHG', () => {
    for (const s of ['600519.XSHG', '600519.SH', '600519.SS', 'sh600519', 'SH600519', '600519'])
      expect(pick(s), s).toEqual({ code: '600519', venue: 'XSHG', assetClass: 'stock', key: '600519.XSHG' })
    expect(pick('000001.SZ')).toMatchObject({ code: '000001', venue: 'XSHE', key: '000001.XSHE' })
    expect(pick('sz300750')).toMatchObject({ venue: 'XSHE' })
    expect(pick('430047.BJ')).toMatchObject({ venue: 'BJSE' })
  })

  it('港股：00700.XHKG、0700.HK、hk700 → 00700 + XHKG', () => {
    for (const s of ['00700.XHKG', '00700.HK', '0700.HK', 'hk00700', 'HK700', '00700'])
      expect(pick(s), s).toEqual({ code: '00700', venue: 'XHKG', assetClass: 'stock', key: '00700.XHKG' })
  })

  it('美股：AAPL.XNAS、AAPL.O、NASDAQ:AAPL → AAPL + XNAS；AAPL 不带场所', () => {
    for (const s of ['AAPL.XNAS', 'AAPL.O', 'NASDAQ:AAPL', 'aapl.oq'])
      expect(pick(s), s).toEqual({ code: 'AAPL', venue: 'XNAS', assetClass: 'stock', key: 'AAPL.XNAS' })
    expect(pick('AAPL')).toEqual({ code: 'AAPL', venue: undefined, assetClass: 'unknown', key: 'AAPL' })
    expect(pick('IBM.N')).toMatchObject({ venue: 'XNYS', key: 'IBM.XNYS' })
    // BRK.B 的 .B 是股份类别，不是场所。
    expect(pick('BRK.B')).toMatchObject({ code: 'BRK.B', assetClass: 'unknown' })
    // 股票场所上不拆计价币后缀（不会把 XXUSD 当币对）。
    expect(pick('ABCUSD.XNYS')).toMatchObject({ code: 'ABCUSD', assetClass: 'stock' })
  })

  it('提示优先：hint 的类别与场所压过从写法里猜的', () => {
    expect(pick('META', { assetClass: 'stock' })).toMatchObject({ code: 'META', assetClass: 'stock' })
    expect(pick('META', { assetClass: 'crypto' })).toMatchObject({ code: 'META', assetClass: 'crypto' })
    expect(pick('AAPL', { venue: 'NASDAQ' })).toMatchObject({ key: 'AAPL.XNAS', assetClass: 'stock' })
  })

  it('场所与号段', () => {
    expect(normalizeVenue('sh')).toBe('XSHG')
    expect(normalizeVenue('Gate.io')).toBe('GATEIO')
    expect(normalizeVenue('crypto.com')).toBe('CRYPTOCOM')
    expect(normalizeVenue('XLON')).toBe('XLON')
    expect(inferChinaVenue('688981')).toBe('XSHG')
    expect(inferChinaVenue('300750')).toBe('XSHE')
    expect(inferChinaVenue('920001')).toBe('BJSE')
    expect(inferChinaVenue('7203')).toBeUndefined()
    expect(splitCryptoPair('WBTC')).toEqual({ base: 'WBTC', perp: false })
  })
})

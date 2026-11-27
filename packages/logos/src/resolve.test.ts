// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { LogoCache, svgDataUrl } from './cache.ts'
import { fillTemplate, type LogoCandidate, resolveLogo, selfHosted, selfHostedPath, urlTemplate } from './resolve.ts'
import { WEB3ICONS_COUNTS, hasWeb3Token, web3ExchangeId, web3icons } from './web3icons.ts'

const urls = (c: LogoCandidate[]) => c.map((x) => (typeof x.source === 'string' ? x.source : `<load ${x.key}>`))

describe('解析', () => {
  const providers = [
    web3icons(),
    selfHosted({ baseUrl: '/logos/' }),
    urlTemplate({
      template: 'https://img.logo.dev/ticker/{code}?token={token}',
      params: { token: 'pk_x' },
      assetClasses: ['stock'],
    }),
  ]

  it('加密币：web3icons 在前（载入函数），再自托管的 crypto/ 目录', () => {
    expect(urls(resolveLogo({ symbol: 'BTCUSDT' }, providers))).toEqual([
      '<load web3icons:symbol:BTC>',
      '/logos/crypto/BTC.svg',
    ])
  })

  it('A 股：按「代码.场所」自托管，再退到只有代码；徽标服务只收 stock', () => {
    expect(urls(resolveLogo({ symbol: 'sh600519' }, providers))).toEqual([
      '/logos/600519.XSHG.svg',
      '/logos/600519.svg',
      'https://img.logo.dev/ticker/600519?token=pk_x',
    ])
    // 不带场所的 AAPL 类别是 unknown：web3icons 不拿币标配它，徽标服务也不收（它只收 stock）。
    expect(urls(resolveLogo({ symbol: 'AAPL' }, providers))).toEqual(['/logos/AAPL.svg'])
    expect(urls(resolveLogo({ symbol: 'META' }, providers))).toEqual(['/logos/META.svg'])
  })

  it('交易所：kind venue 走 web3icons 的交易所标与自托管的 venues/', () => {
    expect(urls(resolveLogo({ kind: 'venue', venue: 'OKEx' }, providers))).toEqual([
      '<load web3icons:venue:OKX>',
      '/logos/venues/okx.svg',
    ])
    expect(web3ExchangeId('GATEIO')).toBe('gate-io')
    expect(web3ExchangeId('XNAS')).toBeUndefined()
  })

  it('没代码就没候选；同一个地址只出现一次', () => {
    expect(resolveLogo({ symbol: ' ' }, providers)).toEqual([])
    const twice = [selfHosted({ baseUrl: '/a' }), selfHosted({ baseUrl: '/a/', id: 'again' })]
    expect(urls(resolveLogo({ symbol: 'AAPL' }, twice))).toEqual(['/a/AAPL.svg'])
  })

  it('模板：缺值的候选不成立；值按 URL 编码', () => {
    expect(fillTemplate('https://x/{domain}.png', { code: 'A' })).toBeUndefined()
    expect(fillTemplate('https://x/{name}', { name: '贵州 茅台' })).toBe(
      'https://x/%E8%B4%B5%E5%B7%9E%20%E8%8C%85%E5%8F%B0',
    )
    const byDomain = urlTemplate({ template: 'https://img.logo.dev/{domain}?token={token}', params: { token: 'k' } })
    expect(urls(resolveLogo({ symbol: 'AAPL', domain: 'apple.com' }, [byDomain]))).toEqual([
      'https://img.logo.dev/apple.com?token=k',
    ])
    expect(selfHostedPath({ symbol: '00700.HK' })).toBe('00700.XHKG.svg')
    expect(selfHostedPath({ symbol: 'ETH-PERP' })).toBe('crypto/ETH.svg')
  })

  it('web3icons 的覆盖：上千个币、几十个交易所，常见币都在', () => {
    expect(WEB3ICONS_COUNTS.tokens).toBeGreaterThan(1500)
    expect(WEB3ICONS_COUNTS.exchanges).toBeGreaterThan(20)
    for (const c of ['BTC', 'ETH', 'SOL', 'USDT', 'BNB', 'XRP', 'DOGE']) expect(hasWeb3Token(c), c).toBe(true)
  })

  it('载入函数给出 SVG 的 data URL', async () => {
    const [btc] = resolveLogo({ symbol: 'BTCUSDT' }, [web3icons()])
    const cache = new LogoCache()
    const url = await cache.load(btc)
    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true)
    expect(decodeURIComponent(url)).toContain('<svg')
    expect(cache.url(btc)).toBe(url)
  })
})

describe('缓存', () => {
  const a: LogoCandidate = { key: '/a.svg', provider: 'p', source: '/a.svg' }
  const b: LogoCandidate = { key: '/b.svg', provider: 'p', source: '/b.svg' }

  it('失败的跳过、成功过的优先、都失败返回 undefined', () => {
    const cache = new LogoCache()
    expect(cache.pick([a, b])).toBe(a)
    cache.markFailed(a.key)
    expect(cache.pick([a, b])).toBe(b)
    cache.markFailed(b.key)
    expect(cache.pick([a, b])).toBeUndefined()
    const other = new LogoCache()
    other.markOk(b.key)
    expect(other.pick([a, b])).toBe(b)
  })

  it('载入函数并发只调一次；失败记进失败缓存，不再调', async () => {
    let calls = 0
    const ok: LogoCandidate = { key: 'k', provider: 'p', source: async () => (calls++, svgDataUrl('<svg/>')) }
    const cache = new LogoCache()
    const [x, y] = await Promise.all([cache.load(ok), cache.load(ok)])
    expect(x).toBe(y)
    expect(calls).toBe(1)
    let bad = 0
    const broken: LogoCandidate = { key: 'bad', provider: 'p', source: () => (bad++, Promise.reject(new Error('no'))) }
    await expect(cache.load(broken)).rejects.toThrow('no')
    await expect(cache.load(broken)).rejects.toThrow()
    expect(bad).toBe(1)
    expect(cache.status('bad')).toBe('failed')
  })
})

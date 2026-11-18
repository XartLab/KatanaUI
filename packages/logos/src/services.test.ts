// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { LogoCache } from './cache.ts'
import { type LogoCandidate, logoContext, resolveLogo } from './resolve.ts'
import {
  byDomain,
  companiesLogo,
  companiesLogoApiUrl,
  companiesLogoSymbol,
  logoDev,
  pickCompaniesLogoImage,
} from './services.ts'

const ctx = (symbol: string, extra: Parameters<typeof logoContext>[0] = {}, domainMap?: Record<string, string>) =>
  logoContext({ symbol, ...extra }, domainMap ? { domainMap } : {})!
const urls = (c: LogoCandidate[]) => c.map((x) => (typeof x.source === 'string' ? x.source : `<load ${x.key}>`))

describe('companieslogo.com', () => {
  it('代码写法：沪 .SS、深 .SZ、港股 4 位 .HK、美股裸代码；北交所与加密币不支持', () => {
    expect(companiesLogoSymbol(ctx('600519.XSHG'))).toBe('600519.SS')
    expect(companiesLogoSymbol(ctx('sz000001'))).toBe('000001.SZ')
    expect(companiesLogoSymbol(ctx('00700.HK'))).toBe('0700.HK')
    expect(companiesLogoSymbol(ctx('01299.HK'))).toBe('1299.HK')
    expect(companiesLogoSymbol(ctx('AAPL.O'))).toBe('AAPL')
    expect(companiesLogoSymbol(ctx('AAPL', { assetClass: 'stock' }))).toBe('AAPL')
    expect(companiesLogoSymbol(ctx('AAPL'))).toBeUndefined()
    expect(companiesLogoSymbol(ctx('430047.BJ'))).toBeUndefined()
    expect(companiesLogoSymbol(ctx('BTCUSDT'))).toBeUndefined()
  })

  it('API 地址：有代码按代码，没有按官网域名；key 由调用方给', () => {
    expect(companiesLogoApiUrl(ctx('600519.SH'), 'k 1')).toBe(
      'https://companieslogo.com/api/1.0/?symbol=600519.SS&api_key=k%201',
    )
    expect(companiesLogoApiUrl(ctx('430047.BJ', {}, { '430047.BJSE': 'example.cn' }), 'k')).toBe(
      'https://companieslogo.com/api/1.0/?website_domain=example.cn&api_key=k',
    )
    expect(companiesLogoApiUrl(ctx('430047.BJ'), 'k')).toBeUndefined()
  })

  it('挑图：svg 优先、icon 优先、深色底优先；相对地址补全', () => {
    const json = {
      png: { icon: { for_dark_background: { 128: '/img/png/X-icon-dark-128.png' } } },
      svg: {
        big: { for_dark_background: { orig: '/img/svg/X-big-dark.svg' } },
        icon: {
          for_bright_background: { orig: '/img/svg/X-icon-bright.svg' },
          for_dark_background: { orig: '/img/svg/X-icon-dark.svg' },
        },
      },
    }
    expect(pickCompaniesLogoImage(json)).toBe('https://companieslogo.com/img/svg/X-icon-dark.svg')
    expect(pickCompaniesLogoImage(json, 'bright')).toBe('https://companieslogo.com/img/svg/X-icon-bright.svg')
    expect(pickCompaniesLogoImage([json])).toBe('https://companieslogo.com/img/svg/X-icon-dark.svg')
    expect(pickCompaniesLogoImage([])).toBeUndefined()
    expect(pickCompaniesLogoImage({ png: { icon: 'https://cdn.example.com/a.png' } })).toBe(
      'https://cdn.example.com/a.png',
    )
  })

  it('来源是载入函数：请求 API、取图片地址；API 失败进失败缓存', async () => {
    const asked: string[] = []
    const fakeFetch = (async (url: string) => {
      asked.push(url)
      return url.includes('600519')
        ? Response.json({ svg: { icon: { for_dark_background: { orig: '/img/svg/600519.svg' } } } })
        : new Response('[]', { status: 404 })
    }) as typeof fetch
    const provider = companiesLogo({ token: 'k', fetch: fakeFetch })
    const cache = new LogoCache()
    const [a] = resolveLogo({ symbol: '600519.SH' }, [provider])
    expect(await cache.load(a!)).toBe('https://companieslogo.com/img/svg/600519.svg')
    const [b] = resolveLogo({ symbol: '000001.SZ' }, [provider])
    await expect(cache.load(b!)).rejects.toThrow('HTTP 404')
    expect(cache.status(b!.key)).toBe('failed')
    expect(asked).toEqual([
      'https://companieslogo.com/api/1.0/?symbol=600519.SS&api_key=k',
      'https://companieslogo.com/api/1.0/?symbol=000001.SZ&api_key=k',
    ])
  })
})

describe('Logo.dev 与按域名', () => {
  const domains = { '600519.XSHG': 'moutaichina.com', AAPL: 'apple.com' }

  it('有域名走域名接口（全球，A 股也行）；美股再加按代码的接口；别的市场没域名就没候选', () => {
    const p = [logoDev({ token: 'pk', query: { size: '64' } })]
    expect(urls(resolveLogo({ symbol: '600519.SH' }, p, { domainMap: domains }))).toEqual([
      'https://img.logo.dev/moutaichina.com?token=pk&size=64',
    ])
    expect(urls(resolveLogo({ symbol: '600519.SH' }, p))).toEqual([])
    expect(urls(resolveLogo({ symbol: 'AAPL.O' }, p, { domainMap: domains }))).toEqual([
      'https://img.logo.dev/apple.com?token=pk&size=64',
      'https://img.logo.dev/ticker/AAPL?token=pk&size=64',
    ])
    expect(urls(resolveLogo({ symbol: 'IBM', assetClass: 'stock' }, p))).toEqual([
      'https://img.logo.dev/ticker/IBM?token=pk&size=64',
    ])
    expect(urls(resolveLogo({ symbol: 'BTCUSDT' }, p, { domainMap: { BTC: 'bitcoin.org' } }))).toEqual([])
  })

  it('domainMap：键认「代码.场所」、原样输入、裸代码；查询自带的 domain 优先', () => {
    const p = [byDomain('https://logos.example.com/{domain}.png')]
    expect(urls(resolveLogo({ symbol: 'sh600519' }, p, { domainMap: domains }))).toEqual([
      'https://logos.example.com/moutaichina.com.png',
    ])
    expect(urls(resolveLogo({ symbol: 'AAPL.O' }, p, { domainMap: domains }))).toEqual([
      'https://logos.example.com/apple.com.png',
    ])
    expect(urls(resolveLogo({ symbol: 'AAPL.O', domain: 'x.com' }, p, { domainMap: domains }))).toEqual([
      'https://logos.example.com/x.com.png',
    ])
    expect(() => byDomain('https://x/{code}.png')).toThrow('{domain}')
  })
})

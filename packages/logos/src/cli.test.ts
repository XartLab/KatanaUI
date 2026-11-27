// SPDX-License-Identifier: MIT
// 命令行只用假的 fetch 测（这台机器不出网，也不该在单测里真下载）；web3icons 来源读本地包，不联网。
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { main, parseList, runFetch } from './cli.ts'

let out = ''
beforeEach(async () => {
  out = await mkdtemp(join(tmpdir(), 'katana-logos-'))
})
afterEach(async () => {
  await rm(out, { recursive: true, force: true })
})

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
const quiet = () => {}

describe('katana-logos fetch', () => {
  it('读清单：逗号分列、# 注释、JSON 数组', () => {
    expect(parseList('# 自选\nAAPL,XNAS,stock,Apple,apple.com\n\n600519.SH\n')).toEqual([
      { symbol: 'AAPL', venue: 'XNAS', assetClass: 'stock', name: 'Apple', domain: 'apple.com' },
      { symbol: '600519.SH' },
    ])
    expect(parseList('[{"symbol":"BTCUSDT"}]')).toEqual([{ symbol: 'BTCUSDT' }])
  })

  it('url 来源：按模板下载、按「代码.场所」命名；失败的不中断、汇总；manifest 里不写 key', async () => {
    const asked: string[] = []
    const fakeFetch = (async (input: string) => {
      const url = input
      asked.push(url)
      if (url.includes('600519')) return new Response(png, { headers: { 'content-type': 'image/png' } })
      if (url.includes('00700')) throw new TypeError('fetch failed')
      if (url.includes('MSFT')) return new Response('<html>', { headers: { 'content-type': 'text/html' } })
      return new Response('nope', { status: 404 })
    }) as typeof fetch
    const report = await runFetch(
      {
        queries: parseList('600519.SH\n00700.HK\nAAPL.O\nMSFT.O'),
        provider: 'url',
        template: 'https://img.logo.dev/ticker/{code}?token={token}&format=png',
        params: { token: 'pk_secret' },
        ext: 'png',
        out,
      },
      { fetch: fakeFetch, log: quiet },
    )
    expect(asked).toHaveLength(4)
    expect(report.ok.map((e) => e.file)).toEqual(['600519.XSHG.png'])
    expect(report.failed.map((f) => [f.query.symbol, f.reason]).toSorted((a, b) => a[0]!.localeCompare(b[0]!))).toEqual(
      [
        ['00700.HK', 'fetch failed'],
        ['AAPL.O', 'HTTP 404'],
        ['MSFT.O', '不是图片：text/html'],
      ],
    )
    expect(await readFile(join(out, '600519.XSHG.png'))).toEqual(Buffer.from(png))
    const manifest = await readFile(report.manifest, 'utf8')
    expect(manifest).not.toContain('pk_secret')
    expect(JSON.parse(manifest).entries[0]).toMatchObject({
      key: '600519.XSHG',
      file: '600519.XSHG.png',
      source: 'https://img.logo.dev/ticker/600519?token=*&format=png',
      bytes: 4,
      contentType: 'image/png',
    })
  })

  it('web3icons 来源：从本地包导出 SVG 到 crypto/，不联网；没有的币记失败', async () => {
    const noNetwork = (() => {
      throw new Error('不该联网')
    }) as typeof fetch
    const report = await runFetch(
      { queries: parseList('BTCUSDT\nETH-PERP\nNOSUCHCOINZZ-USDT'), provider: 'web3icons', out },
      { fetch: noNetwork, log: quiet },
    )
    expect(report.ok.map((e) => e.file).toSorted()).toEqual(['crypto/BTC.svg', 'crypto/ETH.svg'])
    expect(report.failed.map((f) => f.reason)).toEqual(['web3icons 里没有 NOSUCHCOINZZ'])
    expect(await readFile(join(out, 'crypto/BTC.svg'), 'utf8')).toContain('<svg')
  })

  it('manifest 跟目录里已有的合并；--strict 有失败返回 1，默认 0', async () => {
    const list = join(out, 'list.txt')
    const { writeFile } = await import('node:fs/promises')
    await writeFile(list, 'BTCUSDT\nZZZZZZZZ-USDT\n')
    const deps = { fetch: (() => Promise.reject(new Error('x'))) as typeof fetch, log: quiet }
    expect(await main(['fetch', '--symbols', list, '--provider', 'web3icons', '--out', out], deps)).toBe(0)
    await writeFile(list, 'SOLUSDT\n')
    expect(await main(['fetch', '--symbols', list, '--provider', 'web3icons', '--out', out, '--strict'], deps)).toBe(0)
    const entries = JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8')).entries as { file: string }[]
    expect(entries.map((e) => e.file)).toEqual(['crypto/BTC.svg', 'crypto/SOL.svg'])
    await writeFile(list, 'ZZZZZZZZ-USDT\n')
    expect(await main(['fetch', '--symbols', list, '--provider', 'web3icons', '--out', out, '--strict'], deps)).toBe(1)
    expect(await main(['nope'], deps)).toBe(2)
  })
})

describe('katana-logos fetch：A 股的三条路（#95）', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>'

  it('companieslogo：请求 API（.SS / .SZ）再下图，按「代码.场所」命名、按 content-type 定扩展名；北交所记失败', async () => {
    const asked: string[] = []
    const fakeFetch = (async (url: string) => {
      asked.push(url)
      if (url.includes('api/1.0') && url.includes('600519.SS'))
        return Response.json({ svg: { icon: { for_dark_background: { orig: '/img/svg/600519.SS-icon.svg' } } } })
      if (url.includes('api/1.0') && url.includes('000001.SZ'))
        return Response.json({ png: { icon: { for_dark_background: { 128: '/img/png/000001.SZ.png' } } } })
      if (url.endsWith('.svg'))
        return new Response(svg, { headers: { 'content-type': 'image/svg+xml; charset=utf-8' } })
      if (url.endsWith('.png')) return new Response(png, { headers: { 'content-type': 'image/png' } })
      return new Response('x', { status: 500 })
    }) as typeof fetch
    const report = await runFetch(
      {
        queries: parseList('600519.SH\nsz000001\n430047.BJ'),
        provider: 'companieslogo',
        params: { token: 'secret-key' },
        out,
      },
      { fetch: fakeFetch, log: quiet },
    )
    expect(report.ok.map((e) => e.file).toSorted()).toEqual(['000001.XSHE.png', '600519.XSHG.svg'])
    expect(report.failed.map((f) => f.reason)).toEqual(['companieslogo 不支持这个品种（430047.BJSE；北交所暂不支持）'])
    expect(asked.some((u) => u.includes('api_key=secret-key'))).toBe(true)
    expect(await readFile(join(out, '600519.XSHG.svg'), 'utf8')).toBe(svg)
    expect(await readFile(report.manifest, 'utf8')).not.toContain('secret-key')
  })

  it('logodev + --domains：A 股按官网域名取，没域名的记失败；--token 进 params、不进 manifest', async () => {
    const { writeFile } = await import('node:fs/promises')
    const list = join(out, 'a.txt')
    const domains = join(out, 'domains.json')
    await writeFile(list, '600519.SH\n000001.SZ\n')
    await writeFile(domains, JSON.stringify({ '600519.XSHG': 'moutaichina.com' }))
    const asked: string[] = []
    const fakeFetch = (async (url: string) => {
      asked.push(url)
      return new Response(png, { headers: { 'content-type': 'image/jpeg' } })
    }) as typeof fetch
    const code = await main(
      ['fetch', '--symbols', list, '--provider', 'logodev', '--token', 'pk_live', '--domains', domains, '--out', out],
      { fetch: fakeFetch, log: quiet },
    )
    expect(code).toBe(0)
    expect(asked).toEqual(['https://img.logo.dev/moutaichina.com?token=pk_live'])
    const manifest = await readFile(join(out, 'manifest.json'), 'utf8')
    expect(JSON.parse(manifest).entries.map((e: { file: string }) => e.file)).toEqual(['600519.XSHG.jpg'])
    expect(manifest).not.toContain('pk_live')
  })

  it('domain：通用模板按域名取；多个候选按序试', async () => {
    const fakeFetch = (async () => new Response(png, { headers: { 'content-type': 'image/png' } })) as typeof fetch
    const report = await runFetch(
      {
        queries: [{ symbol: '00700.HK', domain: 'tencent.com' }],
        provider: 'domain',
        template: 'https://logos.example.com/{domain}.png',
        out,
      },
      { fetch: fakeFetch, log: quiet },
    )
    expect(report.ok.map((e) => [e.file, e.source])).toEqual([
      ['00700.XHKG.png', 'https://logos.example.com/tencent.com.png'],
    ])
  })
})

describe('katana-logos fetch 拒绝 logokit', () => {
  it('条款只许热链：返回 2 并说明原因，不发请求', async () => {
    const lines: string[] = []
    const noFetch = (() => {
      throw new Error('不该请求')
    }) as typeof fetch
    expect(
      await main(['fetch', '--symbols', 'x.txt', '--provider', 'logokit', '--out', out], {
        fetch: noFetch,
        log: (l) => lines.push(l),
      }),
    ).toBe(2)
    expect(lines.join('\n')).toContain('只许热链')
  })
})

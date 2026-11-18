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

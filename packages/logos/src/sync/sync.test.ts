// SPDX-License-Identifier: MIT
// katana-logos sync 的流水线：全部用假的网络（这台机器出网受限，也不该在单测里真请求）。
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { main } from '../cli.ts'
import { encodePng } from './image.ts'
import { parseMarketList } from './list.ts'
import {
  buildCoverage,
  coverageMarkdown,
  DEFAULT_SYNC_CONFIG,
  runSync,
  type SyncConfig,
  type SyncDeps,
} from './sync.ts'

let out = ''
beforeEach(async () => {
  out = await mkdtemp(join(tmpdir(), 'katana-sync-'))
})
afterEach(async () => {
  await rm(out, { recursive: true, force: true })
})

const disc = (w: number, h: number, color = [214, 165, 72]) => {
  const px = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if ((x - w / 2) ** 2 + (y - h / 2) ** 2 < (Math.min(w, h) / 3) ** 2) px.set([...color, 255], (y * w + x) * 4)
  return encodePng(w, h, px)
}
const flat = (w: number) => encodePng(w, w, new Uint8Array(w * w * 4).fill(250))
const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12"/></svg>'

const LIST = `symbol,venue,name,domain
600519,XSHG,贵州茅台,moutaichina.com
AAPL,XNAS,Apple,apple.com
00700,XHKG,腾讯控股,
000001,XSHE,平安银行,bank.pingan.com
430047,XBSE,示例北交所,
BTCUSDT,,,
`

type Route = (url: string, init?: RequestInit) => Response | Promise<Response>

/** 假网络：按地址分派，记下请求与同时在途的最大数。 */
async function fakeWeb() {
  const png = (b: Uint8Array<ArrayBuffer>) => new Response(b, { headers: { 'content-type': 'image/png' } })
  const [m64, a180, a16, wide, f64, g16, p64] = await Promise.all([
    Promise.resolve(new TextEncoder().encode(SVG)),
    disc(180, 180),
    disc(16, 16),
    disc(300, 100),
    flat(64),
    disc(16, 16, [120, 120, 120]),
    disc(64, 64, [95, 174, 140]),
  ])
  const hits: string[] = []
  let flight = 0
  let maxFlight = 0
  let pinganTries = 0
  const routes: Record<string, Route> = {
    'https://query.wikidata.org/sparql': () =>
      Response.json({
        results: {
          bindings: [
            {
              mic: { value: 'XNAS' },
              ticker: { value: 'AAPL' },
              item: { value: 'Q312' },
              logo: { value: 'http://commons.wikimedia.org/wiki/Special:FilePath/Apple_wordmark.png' },
            },
            {
              mic: { value: 'XHKG' },
              ticker: { value: '00700' },
              item: { value: 'Q860580' },
              website: { value: 'https://www.tencent.com/' },
            },
          ],
        },
      }),
    'https://moutaichina.com/': () =>
      new Response('<link rel="icon" href="/m.svg"><link rel="apple-touch-icon" href="/a.png">', {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }),
    'https://moutaichina.com/m.svg': () => new Response(m64, { headers: { 'content-type': 'image/svg+xml' } }),
    'https://apple.com/': () =>
      new Response('<link rel="icon" sizes="16x16" href="/fav16.png">', { headers: { 'content-type': 'text/html' } }),
    'https://apple.com/fav16.png': () => png(a16),
    'https://apple.com/apple-touch-icon.png': () => png(a180),
    'https://www.tencent.com/': () => Promise.reject(new TypeError('fetch failed')),
    'https://www.tencent.com/favicon.ico': () => png(f64),
    'https://www.google.com/s2/favicons?domain=tencent.com&sz=64': () => png(g16),
    'https://commons.wikimedia.org/wiki/Special:FilePath/Apple_wordmark.png?width=256': () => png(wide),
    'https://bank.pingan.com/': () => new Response('down', { status: 500 }),
    'https://bank.pingan.com/apple-touch-icon.png': () =>
      ++pinganTries < 2 ? new Response('busy', { status: 503 }) : png(p64),
  }
  const fetchImpl = (async (input: string, init?: RequestInit) => {
    hits.push(input)
    flight++
    maxFlight = Math.max(maxFlight, flight)
    try {
      await new Promise((r) => setTimeout(r, 1))
      const route = routes[input]
      return route ? await route(input, init) : new Response('nope', { status: 404 })
    } finally {
      flight--
    }
  }) as typeof fetch
  return { fetch: fetchImpl, hits, maxFlight: () => maxFlight }
}

const deps = (f: typeof fetch, at = '2026-11-19T00:00:00Z', env: Record<string, string> = {}): SyncDeps => ({
  fetch: f,
  log: () => {},
  now: () => new Date(at),
  sleep: async () => {},
  env,
})

describe('katana-logos sync', () => {
  it('免费路线：官网图标为主、质量过滤、Wikidata 补域名、web3icons 管币；manifest 与 coverage', async () => {
    const web = await fakeWeb()
    const report = await runSync({ items: parseMarketList(LIST), out, concurrency: 2 }, deps(web.fetch))
    const e = report.manifest.entries

    // 茅台：首页里的 SVG 图标（SVG 优先于 apple-touch-icon）。
    expect(e['600519.XSHG']).toMatchObject({ status: 'ok', source: 'website', file: '600519.XSHG.svg', format: 'svg' })
    // Apple：首页的 16px 图标丢（too-small），/apple-touch-icon.png 180px 留。
    expect(e['AAPL.XNAS']).toMatchObject({ status: 'ok', source: 'website', file: 'AAPL.XNAS.png', width: 180 })
    expect(e['AAPL.XNAS']!.rejected).toEqual([
      { source: 'website', url: 'https://apple.com/fav16.png', reason: 'too-small' },
    ])
    // 腾讯：清单没域名，用 Wikidata 的官网；首页挂了、favicon 是一整块单色、Google 是 16px 占位 → 缺失，原因都记下。
    expect(e['00700.XHKG']).toMatchObject({ status: 'missing', domain: 'https://www.tencent.com/' })
    expect(e['00700.XHKG']!.rejected.map((r) => r.reason)).toEqual(['fetch: HTTP 404', 'flat', 'google-placeholder'])
    // 平安：首页 500（重试后放弃），apple-touch-icon 先 503 再成功（重试）。
    expect(e['000001.XSHE']).toMatchObject({ status: 'ok', file: '000001.XSHE.png', width: 64 })
    expect(web.hits.filter((u) => u === 'https://bank.pingan.com/')).toHaveLength(3)
    // 北交所：XBSE 规整成 BJSE；没域名、没 Wikidata → 缺失（界面画字母）。
    expect(e['430047.BJSE']).toMatchObject({ status: 'missing', market: 'BJSE', rejected: [] })
    // 加密币：web3icons，本地包，不联网。
    expect(e.BTC).toMatchObject({ status: 'ok', source: 'web3icons', file: 'crypto/BTC.svg', market: 'crypto' })
    expect(web.hits.some((u) => u.includes('BTC'))).toBe(false)
    // Wikidata：一批 POST。
    expect(web.hits.filter((u) => u.includes('wikidata'))).toHaveLength(1)
    expect(web.maxFlight()).toBeLessThanOrEqual(2)

    expect((await stat(join(out, '600519.XSHG.svg'))).size).toBe(SVG.length)
    const coverage = JSON.parse(await readFile(join(out, 'coverage.json'), 'utf8'))
    expect(coverage.total).toMatchObject({
      total: 6,
      hit: 4,
      hotlink: 0,
      missing: 2,
      bySource: { website: 3, web3icons: 1 },
    })
    expect(coverage.total.byReason).toEqual({ 'too-small': 1, 'fetch-failed': 1, flat: 1, 'google-placeholder': 1 })
    expect(Object.keys(coverage.markets)).toEqual(['XSHG', 'XSHE', 'BJSE', 'US', 'XHKG', 'crypto'])
    expect(coverage.markets.XHKG.missingList).toEqual(['00700.XHKG'])
    const md = await readFile(join(out, 'coverage.md'), 'utf8')
    expect(md).toContain('| 美股 XNAS + XNYS | 1 | 1 | 0 | 0 | 100.0% | website 1（100.0%） | too-small 1（100.0%） |')
    expect(md).toContain('- 港股 XHKG（1）：00700.XHKG')
  })

  it('Wikidata 徽标作后备：官网没有合格的图时用 P154；横向字标照样丢', async () => {
    const web = await fakeWeb()
    const config: SyncConfig = { sources: [{ type: 'wikidata' }, { type: 'website', google: false }] }
    const report = await runSync({ items: parseMarketList('symbol,venue\nAAPL,XNAS\n'), out, config }, deps(web.fetch))
    const apple = report.manifest.entries['AAPL.XNAS']!
    expect(apple.rejected[0]).toMatchObject({ source: 'wikidata', reason: 'wordmark' })
    // 清单没给域名、Wikidata 也没有官网 → website 来源没候选。
    expect(apple.status).toBe('missing')
  })

  it('增量：来源没变的跳过；--refresh 过期重拉；改了来源顺序重拉；换来源后旧文件删掉', async () => {
    const web = await fakeWeb()
    const items = parseMarketList(LIST)
    await runSync({ items, out }, deps(web.fetch))
    const before = web.hits.length
    const again = await runSync({ items, out }, deps(web.fetch, '2026-11-20T00:00:00Z'))
    expect([again.processed, again.skipped]).toEqual([0, 6])
    expect(web.hits.length).toBe(before)
    // 覆盖率仍按全清单算（跳过的沿用 manifest）。
    expect(again.coverage.total.total).toBe(6)

    const stale = await runSync({ items, out, refreshDays: 0.5 }, deps(web.fetch, '2026-11-20T00:00:00Z'))
    expect(stale.processed).toBe(6)
    const reordered = await runSync(
      { items, out, config: { sources: [{ type: 'web3icons' }, { type: 'website' }] } },
      deps(web.fetch, '2026-11-20T00:00:00Z'),
    )
    expect(reordered.processed).toBe(6)

    // 文件被删了也重拉。
    await rm(join(out, '600519.XSHG.svg'))
    const missingFile = await runSync(
      { items, out, config: { sources: [{ type: 'web3icons' }, { type: 'website' }] } },
      deps(web.fetch, '2026-11-20T00:00:00Z'),
    )
    expect(missingFile.processed).toBe(1)
  })

  it('可选的付费 / 热链源：companieslogo 的 key 从环境变量读、不进 manifest；LogoKit 只登记热链，不下载', async () => {
    const asked: string[] = []
    const svg = new TextEncoder().encode(SVG)
    const f = (async (url: string) => {
      asked.push(url)
      if (url.startsWith('https://companieslogo.com/api/1.0/?symbol=600519.SS'))
        return Response.json({ svg: { icon: { for_dark_background: { orig: '/img/svg/600519.svg' } } } })
      if (url === 'https://companieslogo.com/img/svg/600519.svg')
        return new Response(svg, { headers: { 'content-type': 'image/svg+xml' } })
      return new Response('[]', { status: 404 })
    }) as typeof fetch
    const config: SyncConfig = {
      sources: [
        { type: 'companieslogo', token: 'env:CL_KEY' },
        { type: 'logokit', token: 'env:LK_KEY' },
      ],
    }
    const report = await runSync(
      { items: parseMarketList('symbol,venue\n600519,XSHG\n000001,XSHE\n'), out, config },
      deps(f, undefined, { CL_KEY: 'cl-secret', LK_KEY: 'lk-secret' }),
    )
    const e = report.manifest.entries
    expect(e['600519.XSHG']).toMatchObject({ status: 'ok', source: 'companieslogo', file: '600519.XSHG.svg' })
    expect(e['000001.XSHE']).toMatchObject({
      status: 'hotlink',
      hotlink: 'https://img.logokit.com/ticker/000001.SZ?token={token}&fallback=404',
    })
    expect(asked.some((u) => u.includes('logokit'))).toBe(false)
    const manifest = await readFile(join(out, 'manifest.json'), 'utf8')
    expect(manifest).not.toContain('cl-secret')
    expect(manifest).not.toContain('lk-secret')
    expect(report.coverage.total.bySource).toEqual({ companieslogo: 1, 'logokit（热链）': 1 })
  })

  it('一个品种整个出错不影响别的；默认配置只有免费源', async () => {
    expect(DEFAULT_SYNC_CONFIG.sources.map((s) => s.type)).toEqual(['website', 'wikidata', 'web3icons'])
    const f = (() => Promise.reject(new TypeError('offline'))) as typeof fetch
    const report = await runSync({ items: parseMarketList(LIST), out }, deps(f))
    expect(report.manifest.entries.BTC!.status).toBe('ok')
    expect(report.coverage.total).toMatchObject({ total: 6, hit: 1, missing: 5 })
  })

  it('命令行：katana-logos sync --list --out --config --domains', async () => {
    const { writeFile } = await import('node:fs/promises')
    const web = await fakeWeb()
    await writeFile(join(out, 'list.csv'), 'symbol,venue,name\n00700,XHKG,腾讯控股\n')
    await writeFile(join(out, 'domains.json'), JSON.stringify({ '00700.XHKG': 'moutaichina.com' }))
    await writeFile(join(out, 'cfg.json'), JSON.stringify({ sources: [{ type: 'website' }] }))
    const code = await main(
      [
        'sync',
        '--list',
        join(out, 'list.csv'),
        '--out',
        join(out, 'logos'),
        '--config',
        join(out, 'cfg.json'),
        '--domains',
        join(out, 'domains.json'),
      ],
      { fetch: web.fetch, log: () => {}, now: () => new Date('2026-11-19T00:00:00Z'), sleep: async () => {} },
    )
    expect(code).toBe(0)
    const m = JSON.parse(await readFile(join(out, 'logos/manifest.json'), 'utf8'))
    expect(m.entries['00700.XHKG']).toMatchObject({ status: 'ok', file: '00700.XHKG.svg', domain: 'moutaichina.com' })
    expect(await main(['sync'], { fetch: web.fetch, log: () => {} })).toBe(2)
  })

  it('覆盖率纯函数：空清单不出错', () => {
    const c = buildCoverage([], new Date('2026-11-19T00:00:00Z'))
    expect(c.total).toMatchObject({ total: 0, hit: 0 })
    expect(coverageMarkdown(c)).toContain('| 合计 | 0 | 0 | 0 | 0 | — |')
  })
})

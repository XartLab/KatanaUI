// SPDX-License-Identifier: MIT
// katana-logos sync：把全市场的徽标一次铺满到应用自己的目录（#95，2026-11-19）。
// 默认走免费路线：官网图标（主力）→ Wikidata 徽标（P154）→ 加密币 web3icons → 都没有就留空，界面上画字母。
// 付费源（companieslogo、自托管付费包）与只许热链的 LogoKit 是可选项，写进配置才用。
// 每张图过质量过滤（image.ts），被丢的记原因、接着试下一个；manifest.json 记来源、尺寸、时间、被丢原因；
// coverage.json / coverage.md 按市场统计命中、来源占比、被丢原因、缺失清单。
// 增量：已有、配置的来源没变、没过期（--refresh 天）的跳过；并发默认 6，失败重试 2 次，一个品种出错不影响别的。
// 明确不做：任何平台（TradingView、东方财富、雪球、富途等）的徽标 CDN——平台自有资产，条款不允许。
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import {
  logoContext,
  type LogoContext,
  type LogoQuery,
  selfHostedPath,
  templateValues,
  fillTemplate,
} from '../resolve.ts'
import { companiesLogoApiUrl, logoKit, pickCompaniesLogoImage } from '../services.ts'
import { web3TokenSvg } from '../web3icons.ts'
import { assessImage, type ImageFormat } from './image.ts'
import type { MarketItem } from './list.ts'
import {
  chunk,
  commonsFileUrl,
  parseWikidata,
  WIKIDATA_BATCH,
  WIKIDATA_SPARQL,
  type WikidataHit,
  type WikidataOptions,
  wikidataQuery,
} from './wikidata.ts'
import { websiteCandidates } from './website.ts'

export type SourceConfig =
  | { type: 'website'; google?: boolean }
  | ({ type: 'wikidata' } & WikidataOptions)
  | { type: 'web3icons' }
  | { type: 'companieslogo'; token: string }
  | { type: 'pack'; id?: string; dir: string; pattern?: string | string[] }
  | { type: 'logokit'; token: string; suffix?: Record<string, string> }

export type SyncConfig = {
  sources: SourceConfig[]
  concurrency?: number
  retries?: number
  refreshDays?: number
  /** Wikidata 查询的设置（website 来源也靠它补官网域名）。 */
  wikidata?: WikidataOptions & { domains?: boolean }
}

/** 默认配置：只用免费源。 */
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  sources: [{ type: 'website' }, { type: 'wikidata' }, { type: 'web3icons' }],
  concurrency: 6,
  retries: 2,
}

export type Rejected = { source: string; url: string; reason: string }

export type SyncEntry = {
  symbol: string
  key: string
  market: string
  status: 'ok' | 'hotlink' | 'missing'
  file?: string
  source?: string
  url?: string
  format?: ImageFormat
  width?: number
  height?: number
  bytes?: number
  /** 只许热链的来源（LogoKit）登记的地址；key 换成 {token}，由应用自己的 key 填。 */
  hotlink?: string
  domain?: string
  fetchedAt?: string
  checkedAt: string
  /** 当时配置的来源顺序；变了就重拉。 */
  sources: string
  rejected: Rejected[]
  error?: string
}

export type SyncManifest = { generator: 'katana-logos sync'; updatedAt: string; entries: Record<string, SyncEntry> }

export type SyncDeps = {
  fetch: typeof fetch
  log: (line: string) => void
  now: () => Date
  sleep?: (ms: number) => Promise<void>
  env?: Readonly<Record<string, string | undefined>>
}

export type SyncOptions = {
  items: readonly MarketItem[]
  out: string
  config?: SyncConfig
  /** 「代码.场所」→ 官网域名（清单里没写 domain 的补上）。 */
  domainMap?: Readonly<Record<string, string>>
  /** 超过这么多天的重拉（盖过配置）。 */
  refreshDays?: number
  concurrency?: number
}

export type SyncReport = { manifest: SyncManifest; coverage: Coverage; processed: number; skipped: number }

const EXT: Record<ImageFormat, string> = { png: 'png', jpeg: 'jpg', gif: 'gif', webp: 'webp', ico: 'ico', svg: 'svg' }
const US = new Set(['XNAS', 'XNYS', 'ARCX', 'XASE'])

/** 统计用的市场分组。 */
export function marketOf(ctx: LogoContext): string {
  const { assetClass, venue } = ctx.ref
  if (assetClass === 'crypto') return 'crypto'
  if (venue === 'XSHG' || venue === 'XSHE' || venue === 'XHKG') return venue
  if (venue === 'BJSE') return 'BJSE'
  if (venue && US.has(venue)) return 'US'
  return 'other'
}

const sourceId = (s: SourceConfig) => (s.type === 'pack' ? `pack:${s.id ?? s.dir}` : s.type)

/** 配置里的 "env:NAME" 换成环境变量。 */
export function resolveSecrets(config: SyncConfig, env: Readonly<Record<string, string | undefined>>): SyncConfig {
  const fix = (v: string) => (v.startsWith('env:') ? (env[v.slice(4)] ?? '') : v)
  return {
    ...config,
    sources: config.sources.map((s) => ('token' in s ? { ...s, token: fix(s.token) } : s)),
  }
}

function secretsOf(config: SyncConfig): string[] {
  return config.sources.flatMap((s) => ('token' in s && s.token ? [s.token] : []))
}

function redact(url: string, secrets: readonly string[]): string {
  let out = url
  for (const v of secrets) out = out.replaceAll(encodeURIComponent(v), '*').replaceAll(v, '*')
  return out
}

type Http = { status: number; ok: boolean; type: string; bytes: Uint8Array; text: () => string }

/** 请求，网络错误 / 5xx / 429 重试 retries 次（指数退避）；4xx 不重试。 */
async function request(url: string, init: RequestInit, deps: SyncDeps, retries: number): Promise<Http> {
  let last: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt) await (deps.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms))))(250 * 2 ** (attempt - 1))
    try {
      const res = await deps.fetch(url, { ...init, signal: AbortSignal.timeout(15_000) })
      if ((res.status >= 500 || res.status === 429) && attempt < retries) {
        last = new Error(`HTTP ${res.status}`)
        continue
      }
      const bytes = new Uint8Array(await res.arrayBuffer())
      return {
        status: res.status,
        ok: res.ok,
        type: (res.headers.get('content-type') ?? '').split(';')[0]!.trim(),
        bytes,
        text: () => new TextDecoder().decode(bytes),
      }
    } catch (error) {
      last = error
    }
  }
  throw last instanceof Error ? last : new Error(String(last))
}

const UA = { 'user-agent': 'katana-logos (logo sync; +https://github.com/XartLab/KatanaUI)' }

/** Wikidata 批量预取：「代码.MIC」→ 命中。每批 ≤200；一批失败只记日志。 */
async function prefetchWikidata(
  ctxs: readonly LogoContext[],
  options: WikidataOptions,
  deps: SyncDeps,
  retries: number,
): Promise<Map<string, WikidataHit>> {
  const pairs = [
    ...new Map(
      ctxs
        .filter((c) => c.ref.assetClass !== 'crypto' && c.ref.venue && /^[A-Z]{4}$/.test(c.ref.venue))
        .map((c) => [c.ref.key, [c.ref.code, c.ref.venue!] as const]),
    ).values(),
  ]
  const hits = new Map<string, WikidataHit>()
  for (const batch of chunk(pairs, WIKIDATA_BATCH)) {
    try {
      const res = await request(
        WIKIDATA_SPARQL,
        {
          method: 'POST',
          headers: {
            ...UA,
            accept: 'application/sparql-results+json',
            'content-type': 'application/x-www-form-urlencoded',
          },
          body: `query=${encodeURIComponent(wikidataQuery(batch, options))}`,
        },
        deps,
        retries,
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      for (const [k, v] of parseWikidata(JSON.parse(res.text()), options)) hits.set(k, v)
    } catch (error) {
      deps.log(`! Wikidata 一批 ${batch.length} 个查询失败：${error instanceof Error ? error.message : String(error)}`)
    }
  }
  return hits
}

type Got = { bytes: Uint8Array; url: string }

/** 一个来源给出的东西：按序试的下载候选，或热链地址。 */
async function sourceCandidates(
  source: SourceConfig,
  ctx: LogoContext,
  wd: WikidataHit | undefined,
  domain: string | undefined,
  deps: SyncDeps,
  retries: number,
): Promise<{ downloads: (() => Promise<Got>)[]; hotlink?: string }> {
  const get = (url: string) => async (): Promise<Got> => {
    const res = await request(url, { headers: UA }, deps, retries)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (res.type.startsWith('text/html')) throw new Error(`不是图片：${res.type}`)
    return { bytes: res.bytes, url }
  }
  switch (source.type) {
    case 'web3icons': {
      if (ctx.ref.assetClass !== 'crypto') return { downloads: [] }
      return {
        downloads: [
          async () => {
            const svg = await web3TokenSvg(ctx.ref.code)
            if (svg === undefined) throw new Error(`web3icons 里没有 ${ctx.ref.code}`)
            return { bytes: new TextEncoder().encode(svg), url: `package:@web3icons/core/${ctx.ref.code}` }
          },
        ],
      }
    }
    case 'wikidata':
      return { downloads: wd?.logo ? [get(commonsFileUrl(wd.logo))] : [] }
    case 'website': {
      if (!domain || ctx.ref.assetClass === 'crypto') return { downloads: [] }
      let html: string | undefined
      try {
        const res = await request(
          new URL(domain.includes('://') ? domain : `https://${domain}`).href,
          { headers: UA },
          deps,
          retries,
        )
        if (res.ok && res.type.includes('html')) html = res.text()
      } catch {
        html = undefined
      }
      const urls = websiteCandidates(html, domain).filter((u) => source.google !== false || !u.includes('google.com'))
      return { downloads: urls.map(get) }
    }
    case 'companieslogo': {
      const api = companiesLogoApiUrl(ctx, source.token)
      if (!api || !source.token) return { downloads: [] }
      return {
        downloads: [
          async () => {
            const res = await request(api, { headers: UA }, deps, retries)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const image = pickCompaniesLogoImage(JSON.parse(res.text()))
            if (!image) throw new Error('companieslogo 没有这家的图')
            return get(image)()
          },
        ],
      }
    }
    case 'pack': {
      const patterns = source.pattern
        ? typeof source.pattern === 'string'
          ? [source.pattern]
          : source.pattern
        : ['{code}.{mic}.svg', '{code}.{mic}.png', '{code}.svg', '{code}.png']
      const values = templateValues(ctx)
      return {
        downloads: patterns
          .map((p) => fillTemplate(p, values))
          .filter((p): p is string => p !== undefined)
          .map((p) => async () => {
            const path = join(source.dir, decodeURIComponent(p))
            return { bytes: new Uint8Array(await readFile(path)), url: `file:${path}` }
          }),
      }
    }
    case 'logokit': {
      if (!source.token) return { downloads: [] }
      const [url] = logoKit({ token: source.token, ...(source.suffix ? { suffix: source.suffix } : {}) }).candidates(
        ctx,
      )
      return {
        downloads: [],
        ...(typeof url === 'string' ? { hotlink: url.replace(encodeURIComponent(source.token), '{token}') } : {}),
      }
    }
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

/** 跑一遍流水线。 */
export async function runSync(options: SyncOptions, deps: SyncDeps): Promise<SyncReport> {
  const config = resolveSecrets(options.config ?? DEFAULT_SYNC_CONFIG, deps.env ?? process.env)
  const secrets = secretsOf(config)
  const retries = config.retries ?? 2
  const refreshDays = options.refreshDays ?? config.refreshDays
  const concurrency = Math.max(1, options.concurrency ?? config.concurrency ?? 6)
  const sig = config.sources.map(sourceId).join('>')
  const now = deps.now()
  const manifestPath = join(options.out, 'manifest.json')

  let previous: Record<string, SyncEntry> = {}
  try {
    const old = JSON.parse(await readFile(manifestPath, 'utf8')) as Partial<SyncManifest>
    if (old.generator === 'katana-logos sync' && old.entries) previous = old.entries
  } catch {
    previous = {}
  }

  const work: { item: MarketItem; query: LogoQuery; ctx: LogoContext }[] = []
  const entries: Record<string, SyncEntry> = { ...previous }
  let skipped = 0
  for (const item of options.items) {
    const query: LogoQuery = {
      symbol: item.symbol,
      ...(item.venue ? { venue: item.venue } : {}),
      ...(item.assetClass ? { assetClass: item.assetClass } : {}),
      ...(item.name ? { name: item.name } : {}),
      ...(item.domain ? { domain: item.domain } : {}),
    }
    const ctx = logoContext(query, options.domainMap ? { domainMap: options.domainMap } : {})
    if (!ctx) continue
    const prev = previous[ctx.ref.key]
    const age = prev ? (now.getTime() - Date.parse(prev.checkedAt)) / 86_400_000 : Infinity
    const fresh =
      prev &&
      prev.sources === sig &&
      (refreshDays === undefined || age < refreshDays) &&
      (prev.status !== 'ok' || (prev.file !== undefined && (await exists(join(options.out, prev.file)))))
    if (fresh) {
      skipped++
      continue
    }
    work.push({ item, query, ctx })
  }

  const wantsWikidata =
    config.sources.some((s) => s.type === 'wikidata') ||
    (config.sources.some((s) => s.type === 'website') && config.wikidata?.domains !== false)
  const wdOptions: WikidataOptions = {
    ...config.wikidata,
    ...(config.sources.find((s) => s.type === 'wikidata') as WikidataOptions | undefined),
  }
  const wikidata = wantsWikidata
    ? await prefetchWikidata(
        work.map((w) => w.ctx),
        wdOptions,
        deps,
        retries,
      )
    : new Map<string, WikidataHit>()

  const queue = [...work]
  const one = async ({ item, query, ctx }: (typeof work)[number]) => {
    const key = ctx.ref.key
    const prev = previous[key]
    const wd = wikidata.get(key)
    const domain = ctx.query.domain ?? wd?.website
    const entry: SyncEntry = {
      symbol: item.symbol,
      key,
      market: marketOf(ctx),
      status: 'missing',
      checkedAt: now.toISOString(),
      sources: sig,
      rejected: [],
      ...(domain ? { domain } : {}),
    }
    try {
      for (const source of config.sources) {
        const id = sourceId(source)
        const { downloads, hotlink } = await sourceCandidates(source, ctx, wd, domain, deps, retries)
        if (hotlink && !entry.hotlink) entry.hotlink = hotlink
        let saved = false
        for (const download of downloads) {
          let got: Got
          try {
            got = await download()
          } catch (error) {
            entry.rejected.push({
              source: id,
              url: '',
              reason: `fetch: ${error instanceof Error ? error.message : String(error)}`,
            })
            continue
          }
          const verdict = assessImage(got.bytes, { url: got.url })
          if (!verdict.ok) {
            entry.rejected.push({ source: id, url: redact(got.url, secrets), reason: verdict.reason })
            continue
          }
          const path = selfHostedPath(query)!
          const file = path.replace(/\.svg$/, `.${EXT[verdict.format]}`)
          const target = join(options.out, file)
          await mkdir(dirname(target), { recursive: true })
          await writeFile(target, got.bytes)
          if (prev?.file && prev.file !== file) await rm(join(options.out, prev.file), { force: true })
          Object.assign(entry, {
            status: 'ok',
            file,
            source: id,
            url: redact(got.url, secrets),
            format: verdict.format,
            width: verdict.width,
            height: verdict.height,
            bytes: got.bytes.byteLength,
            fetchedAt: now.toISOString(),
          })
          saved = true
          break
        }
        if (saved) break
      }
      if (entry.status !== 'ok' && entry.hotlink) entry.status = 'hotlink'
      if (entry.status !== 'ok' && prev?.file) await rm(join(options.out, prev.file), { force: true })
    } catch (error) {
      entry.error = error instanceof Error ? error.message : String(error)
    }
    entries[key] = entry
    deps.log(
      `${entry.status === 'ok' ? '✓' : entry.status === 'hotlink' ? '~' : '·'} ${key}${entry.source ? ` ← ${entry.source}` : ''}`,
    )
  }
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      for (let w = queue.shift(); w; w = queue.shift()) await one(w)
    }),
  )

  // 只统计这次清单里的品种（manifest 里留着以前的，coverage 按清单算）。
  const listed = new Set(
    options.items.flatMap((it) => {
      const c = logoContext({
        symbol: it.symbol,
        ...(it.venue ? { venue: it.venue } : {}),
        ...(it.assetClass ? { assetClass: it.assetClass } : {}),
      })
      return c ? [c.ref.key] : []
    }),
  )
  const manifest: SyncManifest = {
    generator: 'katana-logos sync',
    updatedAt: now.toISOString(),
    entries: Object.fromEntries(Object.entries(entries).toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
  }
  const coverage = buildCoverage(
    Object.values(manifest.entries).filter((e) => listed.has(e.key)),
    now,
  )
  await mkdir(options.out, { recursive: true })
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  await writeFile(join(options.out, 'coverage.json'), `${JSON.stringify(coverage, null, 2)}\n`)
  await writeFile(join(options.out, 'coverage.md'), coverageMarkdown(coverage))
  deps.log(
    `\n处理 ${work.length} 个、跳过 ${skipped} 个；命中 ${coverage.total.hit} / ${coverage.total.total}（热链 ${coverage.total.hotlink}）`,
  )
  return { manifest, coverage, processed: work.length, skipped }
}

export type MarketCoverage = {
  total: number
  /** 有本地文件的。 */
  hit: number
  /** 只有热链地址的。 */
  hotlink: number
  missing: number
  /** 命中来源 → 个数。 */
  bySource: Record<string, number>
  /** 被丢原因 → 次数（一个品种可能被丢多次）。 */
  byReason: Record<string, number>
  missingList: string[]
}

export type Coverage = { generatedAt: string; total: MarketCoverage; markets: Record<string, MarketCoverage> }

export const MARKET_ORDER = ['XSHG', 'XSHE', 'BJSE', 'US', 'XHKG', 'crypto', 'other'] as const
export const MARKET_LABEL: Readonly<Record<string, string>> = {
  XSHG: '沪市 XSHG',
  XSHE: '深市 XSHE',
  BJSE: '北交所 BJSE（XBSE）',
  US: '美股 XNAS + XNYS',
  XHKG: '港股 XHKG',
  crypto: '加密币',
  other: '其他',
}

const empty = (): MarketCoverage => ({
  total: 0,
  hit: 0,
  hotlink: 0,
  missing: 0,
  bySource: {},
  byReason: {},
  missingList: [],
})

/** 按市场统计（纯函数）。 */
export function buildCoverage(entries: readonly SyncEntry[], now: Date): Coverage {
  const total = empty()
  const markets: Record<string, MarketCoverage> = {}
  for (const e of entries) {
    const m = (markets[e.market] ??= empty())
    for (const c of [m, total]) {
      c.total++
      if (e.status === 'ok') {
        c.hit++
        c.bySource[e.source!] = (c.bySource[e.source!] ?? 0) + 1
      } else if (e.status === 'hotlink') {
        c.hotlink++
        c.bySource['logokit（热链）'] = (c.bySource['logokit（热链）'] ?? 0) + 1
      } else {
        c.missing++
        c.missingList.push(e.key)
      }
      for (const r of e.rejected) {
        const reason = r.reason.startsWith('fetch:') ? 'fetch-failed' : r.reason
        c.byReason[reason] = (c.byReason[reason] ?? 0) + 1
      }
    }
  }
  for (const c of [total, ...Object.values(markets)]) c.missingList.sort()
  const ordered = Object.fromEntries(
    Object.entries(markets).toSorted(([a], [b]) => MARKET_ORDER.indexOf(a as never) - MARKET_ORDER.indexOf(b as never)),
  )
  return { generatedAt: now.toISOString(), total, markets: ordered }
}

const pct = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(1)}%` : '—')
const list = (r: Record<string, number>, d: number) =>
  Object.entries(r)
    .toSorted((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v}（${pct(v, d)}）`)
    .join('、') || '—'

/** coverage.md（纯函数）。 */
export function coverageMarkdown(c: Coverage): string {
  const rows = [...Object.entries(c.markets), ['合计', c.total] as const]
  const lines = [
    '# 徽标覆盖',
    '',
    `生成于 ${c.generatedAt}（katana-logos sync）。命中 = 有本地文件；热链 = 只登记了 LogoKit 地址。`,
    '',
    '| 市场 | 总数 | 命中 | 热链 | 缺失 | 命中率 | 来源占比 | 被丢原因 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map(
      ([k, m]) =>
        `| ${MARKET_LABEL[k] ?? k} | ${m.total} | ${m.hit} | ${m.hotlink} | ${m.missing} | ${pct(m.hit, m.total)} | ${list(m.bySource, m.total)} | ${list(m.byReason, m.total)} |`,
    ),
    '',
    '## 缺失清单',
    '',
    ...Object.entries(c.markets).flatMap(([k, m]) =>
      m.missingList.length ? [`- ${MARKET_LABEL[k] ?? k}（${m.missingList.length}）：${m.missingList.join('、')}`] : [],
    ),
    '',
  ]
  return lines.join('\n')
}

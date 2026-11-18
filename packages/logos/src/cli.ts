// SPDX-License-Identifier: MIT
// 命令行 katana-logos fetch：按清单把徽标下载到应用自己的目录（自托管，图归应用，不进本仓库），写一份 manifest.json。
// 一个品种下载失败（网络、404、超时）不中断，最后汇总；文件名与 selfHosted 的默认命名一致（600519.XSHG.svg、AAPL.svg、crypto/BTC.svg）。
//
//   katana-logos fetch --symbols list.txt --provider web3icons --out public/logos
//   katana-logos fetch --symbols list.txt --provider url --template 'https://img.logo.dev/ticker/{code}?token={token}&format=png' \
//     --param token=$LOGO_DEV_KEY --ext png --out public/logos
//
//   katana-logos fetch --symbols a-shares.txt --provider companieslogo --token $COMPANIESLOGO_KEY --out public/logos
//   katana-logos fetch --symbols a-shares.txt --provider logodev --token $LOGO_DEV_KEY --domains domains.json --out public/logos
//
// 清单：一行一个，`代码[,场所[,类别[,名称[,域名]]]]`，# 开头是注释；或 JSON 数组（LogoQuery）。
// --domains：JSON 对象，「代码.场所」→ 官网域名（{"600519.XSHG": "moutaichina.com"}），清单行没写域名时从这里补。
// 来源：web3icons（本地包里的 SVG，不联网）、cryptocurrency-icons（jsDelivr 上的 CC0 SVG）、url（--template 给模板）、
// companieslogo（companieslogo.com，A 股 .SS / .SZ、港股、美股；付费，条款允许下载后自托管）、
// logodev（Logo.dev：有域名按域名，美股按代码）、domain（--template 带 {domain} 的通用模板）。key 用 --token 或 --param token=…。
// 文件扩展名默认按返回的 content-type（svg、png、jpg、webp），--ext 可强制。
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { AssetClass } from './normalize.ts'
import {
  type DomainMap,
  fillTemplate,
  type LogoContext,
  logoContext,
  type LogoQuery,
  selfHostedPath,
  templateValues,
} from './resolve.ts'
import { byDomain, companiesLogoApiUrl, logoDev, pickCompaniesLogoImage } from './services.ts'
import { web3ExchangeSvg, web3TokenSvg } from './web3icons.ts'

export const CRYPTOCURRENCY_ICONS_TEMPLATE =
  'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/{code_lower}.svg'

export const CLI_PROVIDERS = ['web3icons', 'cryptocurrency-icons', 'url', 'companieslogo', 'logodev', 'domain'] as const

export type FetchOptions = {
  queries: readonly LogoQuery[]
  provider: (typeof CLI_PROVIDERS)[number]
  out: string
  /** 「代码.场所」→ 官网域名。 */
  domainMap?: DomainMap
  template?: string
  params?: Readonly<Record<string, string>>
  /** 强制文件扩展名；不给就按返回的 content-type。 */
  ext?: string
  concurrency?: number
  timeoutMs?: number
}

export type ManifestEntry = {
  query: LogoQuery
  key: string
  file: string
  provider: string
  /** 下载地址（模板参数的值替换成 *，不把 key 写进文件）。本地来源写 package:版本。 */
  source: string
  bytes: number
  contentType: string
}

export type FetchFailure = { query: LogoQuery; reason: string }

export type FetchReport = { ok: ManifestEntry[]; failed: FetchFailure[]; manifest: string }

type Deps = { fetch: typeof fetch; log: (line: string) => void }

/** 读清单文本。 */
export function parseList(text: string): LogoQuery[] {
  const trimmed = text.trim()
  if (trimmed.startsWith('[')) return JSON.parse(trimmed) as LogoQuery[]
  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [symbol = '', venue, assetClass, name, domain] = line.split(',').map((c) => c.trim())
      const q: LogoQuery = { symbol }
      if (venue) q.venue = venue
      if (assetClass) q.assetClass = assetClass as AssetClass
      if (name) q.name = name
      if (domain) q.domain = domain
      return q
    })
}

function redact(url: string, params: Readonly<Record<string, string>>): string {
  let out = url
  for (const v of Object.values(params)) if (v) out = out.replaceAll(encodeURIComponent(v), '*').replaceAll(v, '*')
  return out
}

const EXT: Readonly<Record<string, string>> = {
  'image/svg+xml': 'svg',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
}

type Got = { body: Uint8Array; contentType: string; source: string }

async function fetchImage(url: string, options: FetchOptions, deps: Deps): Promise<Got> {
  const res = await deps.fetch(url, { signal: AbortSignal.timeout(options.timeoutMs ?? 15_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const contentType = (res.headers.get('content-type') ?? 'application/octet-stream').split(';')[0]!.trim()
  if (!contentType.startsWith('image/')) throw new Error(`不是图片：${contentType}`)
  return { body: new Uint8Array(await res.arrayBuffer()), contentType, source: redact(url, options.params ?? {}) }
}

/** 地址类来源给出的候选地址（按序试）。 */
function candidateUrls(ctx: LogoContext, options: FetchOptions): string[] {
  const params = options.params ?? {}
  switch (options.provider) {
    case 'logodev': {
      if (!params.token) throw new Error('--provider logodev 要给 --token')
      return logoDev({ token: params.token }).candidates(ctx) as string[]
    }
    case 'domain': {
      if (!options.template) throw new Error('--provider domain 要给带 {domain} 的 --template')
      return byDomain(options.template, { params }).candidates(ctx) as string[]
    }
    case 'url':
    case 'cryptocurrency-icons': {
      const template = options.provider === 'url' ? options.template : CRYPTOCURRENCY_ICONS_TEMPLATE
      if (!template) throw new Error('--provider url 要给 --template')
      const url = fillTemplate(template, templateValues(ctx, params))
      return url ? [url] : []
    }
    default:
      return []
  }
}

async function download(ctx: LogoContext, options: FetchOptions, deps: Deps): Promise<Got> {
  if (options.provider === 'web3icons') {
    const svg = ctx.kind === 'venue' ? await web3ExchangeSvg(ctx.ref.code) : await web3TokenSvg(ctx.ref.code)
    if (svg === undefined) throw new Error(`web3icons 里没有 ${ctx.ref.code}`)
    return { body: new TextEncoder().encode(svg), contentType: 'image/svg+xml', source: 'package:@web3icons/core' }
  }
  if (options.provider === 'companieslogo') {
    const token = options.params?.token
    if (!token) throw new Error('--provider companieslogo 要给 --token')
    const api = companiesLogoApiUrl(ctx, token)
    if (!api) throw new Error(`companieslogo 不支持这个品种（${ctx.ref.key}；北交所暂不支持）`)
    const res = await deps.fetch(api, { signal: AbortSignal.timeout(options.timeoutMs ?? 15_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const image = pickCompaniesLogoImage(await res.json())
    if (!image) throw new Error('companieslogo 没有这家的图')
    return fetchImage(image, options, deps)
  }
  const urls = candidateUrls(ctx, options)
  if (!urls.length)
    throw new Error(
      options.provider === 'domain' || options.provider === 'logodev'
        ? '没有可用的地址（缺官网域名？）'
        : '模板里有占位没有值',
    )
  let last: unknown
  for (const url of urls) {
    try {
      return await fetchImage(url, options, deps)
    } catch (error) {
      last = error
    }
  }
  throw last
}

/** 下载清单里的每一项；失败的记下原因，不中断。 */
export async function runFetch(options: FetchOptions, deps: Deps = { fetch, log: console.log }): Promise<FetchReport> {
  const ok: ManifestEntry[] = []
  const failed: FetchFailure[] = []
  const queue = [...options.queries]
  const worker = async () => {
    for (let q = queue.shift(); q; q = queue.shift()) {
      const query = q
      try {
        const ctx = logoContext(query, options.domainMap ? { domainMap: options.domainMap } : {})
        const path = selfHostedPath(query)
        if (!ctx || !path) throw new Error('清单里这一行没有代码')
        const got = await download(ctx, options, deps)
        const ext = options.ext ?? EXT[got.contentType] ?? 'img'
        const file = path.replace(/\.svg$/, `.${ext}`)
        const target = join(options.out, file)
        await mkdir(dirname(target), { recursive: true })
        await writeFile(target, got.body)
        ok.push({
          query,
          key: ctx.ref.key,
          file,
          provider: options.provider,
          source: got.source,
          bytes: got.body.byteLength,
          contentType: got.contentType,
        })
        deps.log(`✓ ${query.symbol ?? query.venue} → ${file}`)
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        failed.push({ query, reason })
        deps.log(`✗ ${query.symbol ?? query.venue}：${reason}`)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, options.concurrency ?? 4) }, worker))

  // manifest：跟目录里已有的合并（按 file），多次 fetch 不互相覆盖；按文件名排序，便于看差异。
  const manifest = join(options.out, 'manifest.json')
  let previous: ManifestEntry[] = []
  try {
    previous = (JSON.parse(await readFile(manifest, 'utf8')) as { entries: ManifestEntry[] }).entries
  } catch {
    previous = []
  }
  const byFile = new Map(previous.map((e) => [e.file, e]))
  for (const e of ok) byFile.set(e.file, e)
  const entries = [...byFile.values()].toSorted((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0))
  await mkdir(options.out, { recursive: true })
  await writeFile(manifest, `${JSON.stringify({ generator: 'katana-logos', entries }, null, 2)}\n`)
  deps.log(`\n下载 ${ok.length} 个，失败 ${failed.length} 个；清单 ${manifest}`)
  for (const f of failed) deps.log(`  ✗ ${f.query.symbol ?? f.query.venue}：${f.reason}`)
  return { ok, failed, manifest }
}

const USAGE = `用法：katana-logos fetch --symbols <清单> --provider <${CLI_PROVIDERS.join('|')}> --out <目录>
  [--token <key>] [--domains <代码.场所→域名.json>] [--template <地址模板>] [--param 名=值 ...] [--ext svg|png] [--concurrency 4] [--strict]
  模板占位：{code} {code_lower} {mic} {venue} {key} {quote} {symbol} {name} {domain}，加 --param 给的。`

/** 命令行入口；返回退出码。--strict 时有失败就返回 1，默认只汇报。 */
export async function main(argv: readonly string[], deps?: Deps): Promise<number> {
  const log = deps?.log ?? console.log
  const [command, ...rest] = argv
  if (command !== 'fetch') {
    log(USAGE)
    return command === undefined || command === '--help' ? 0 : 2
  }
  const flags = new Map<string, string[]>()
  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i]
    if (!flag.startsWith('--')) continue
    const value = rest[i + 1] !== undefined && !rest[i + 1].startsWith('--') ? rest[++i] : 'true'
    flags.set(flag.slice(2), [...(flags.get(flag.slice(2)) ?? []), value])
  }
  const one = (name: string) => flags.get(name)?.at(-1)
  const symbols = one('symbols')
  const provider = one('provider') as FetchOptions['provider'] | undefined
  const out = one('out')
  if (one('provider') === 'logokit') {
    log(
      'katana-logos fetch 不支持 logokit：LogoKit 的条款只许热链，不许缓存或把图存到本地。在界面里用 logoKit({ token }) 来源直接热链。',
    )
    return 2
  }
  if (!symbols || !out || !provider || !(CLI_PROVIDERS as readonly string[]).includes(provider)) {
    log(USAGE)
    return 2
  }
  const params: Record<string, string> = Object.fromEntries(
    (flags.get('param') ?? []).map((p) => [p.slice(0, p.indexOf('=')), p.slice(p.indexOf('=') + 1)]),
  )
  const token = one('token')
  if (token) params.token = token
  const domains = one('domains')
  const domainMap = domains ? (JSON.parse(await readFile(domains, 'utf8')) as DomainMap) : undefined
  const template = one('template')
  const ext = one('ext')
  const concurrency = one('concurrency')
  const report = await runFetch(
    {
      queries: parseList(await readFile(symbols, 'utf8')),
      provider,
      out,
      params,
      ...(template ? { template } : {}),
      ...(domainMap ? { domainMap } : {}),
      ...(ext ? { ext } : {}),
      ...(concurrency ? { concurrency: Number(concurrency) } : {}),
    },
    deps ?? { fetch, log },
  )
  return flags.has('strict') && report.failed.length > 0 ? 1 : 0
}

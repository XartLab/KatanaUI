// SPDX-License-Identifier: MIT
// 徽标解析：按调用方配置的来源（provider）顺序，给一个品种列出候选（地址，或按需载入的函数）。
// 包里不写死任何 key、不带企业商标图片：股票走应用自托管（selfHosted）或调用方给的地址模板（urlTemplate，key 由应用传）。
import { type AssetClass, normalizeSymbol, normalizeVenue, type SymbolRef } from './normalize.ts'

/** 要徽标的东西：一个品种（symbol），或一个交易所 / 场所（kind: 'venue'，用 venue）。 */
export type LogoQuery = {
  symbol?: string
  venue?: string
  assetClass?: AssetClass
  /** 名称：模板里的 {name}。 */
  name?: string
  /** 公司域名（apple.com）：模板里的 {domain}，徽标服务按域名取时用。 */
  domain?: string
  kind?: 'symbol' | 'venue'
}

/** 一个候选：现成的地址，或返回地址的载入函数（按需 import 的 SVG 走这条）。 */
export type LogoSource = string | (() => Promise<string>)

export type LogoCandidate = {
  /** 缓存键：同一个键只请求一次、失败一次就不再试。 */
  key: string
  provider: string
  source: LogoSource
}

/** 规整后交给来源的上下文。venue 查询时 ref 的 code 是规整后的场所名。 */
export type LogoContext = { query: LogoQuery; ref: SymbolRef; kind: 'symbol' | 'venue' }

export type LogoProvider = {
  id: string
  /** 给出这个来源的候选，没有就返回空数组。 */
  candidates(ctx: LogoContext): LogoSource[]
}

/** 规整查询：venue 查询时 ref.code 是规整后的场所名（XNAS、BINANCE）。 */
export function logoContext(query: LogoQuery): LogoContext | undefined {
  const kind = query.kind ?? (query.symbol ? 'symbol' : 'venue')
  if (kind === 'venue') {
    if (!query.venue) return undefined
    const v = normalizeVenue(query.venue)
    return { query, kind, ref: { input: query.venue, code: v, venue: v, assetClass: 'unknown', key: v } }
  }
  if (!query.symbol?.trim()) return undefined
  const hint = {
    ...(query.venue ? { venue: query.venue } : {}),
    ...(query.assetClass ? { assetClass: query.assetClass } : {}),
  }
  return { query, kind, ref: normalizeSymbol(query.symbol, hint) }
}

/** 按来源顺序列出候选；同一个地址只出现一次。 */
export function resolveLogo(query: LogoQuery, providers: readonly LogoProvider[]): LogoCandidate[] {
  const ctx = logoContext(query)
  if (!ctx) return []
  const seen = new Set<string>()
  const out: LogoCandidate[] = []
  for (const provider of providers) {
    for (const source of provider.candidates(ctx)) {
      const key = typeof source === 'string' ? source : `${provider.id}:${ctx.kind}:${ctx.ref.key}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ key, provider: provider.id, source })
    }
  }
  return out
}

/** 模板里能用的占位：{code} {code_lower} {mic} {venue} {venue_lower} {key} {quote} {symbol} {name} {domain} {assetClass}，加调用方给的 params。 */
export function templateValues(
  ctx: LogoContext,
  params: Readonly<Record<string, string>> = {},
): Record<string, string> {
  const { ref, query } = ctx
  const values: Record<string, string> = {
    ...params,
    code: ref.code,
    code_lower: ref.code.toLowerCase(),
    key: ref.key,
    symbol: ref.input,
    assetClass: ref.assetClass,
  }
  if (ref.venue) {
    values.venue = ref.venue
    values.venue_lower = ref.venue.toLowerCase()
    if (/^[A-Z]{4}$/.test(ref.venue) && ref.assetClass !== 'crypto') values.mic = ref.venue
  }
  if (ref.quote) values.quote = ref.quote
  if (query.name) values.name = query.name
  if (query.domain) values.domain = query.domain
  return values
}

/** 填模板；有占位没有值就返回 undefined（这个候选不成立）。值按 URL 组件编码，{base} 例外。 */
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string | undefined {
  let missing = false
  const out = template.replaceAll(/\{(\w+)\}/g, (_, name: string) => {
    const v = values[name]
    if (v === undefined || (v === '' && name !== 'base')) {
      missing = true
      return ''
    }
    return name === 'base' ? v : encodeURIComponent(v)
  })
  return missing ? undefined : out
}

type Filter = { assetClasses?: readonly AssetClass[]; kinds?: readonly ('symbol' | 'venue')[] }

function accepts(ctx: LogoContext, filter: Filter, defaultKinds: readonly ('symbol' | 'venue')[]): boolean {
  if (!(filter.kinds ?? defaultKinds).includes(ctx.kind)) return false
  return !filter.assetClasses || ctx.kind === 'venue' || filter.assetClasses.includes(ctx.ref.assetClass)
}

export type UrlTemplateOptions = Filter & {
  id?: string
  /** 一条或几条模板，按序成为候选，如 `https://img.logo.dev/ticker/{code}?token={token}`。 */
  template: string | readonly string[]
  /** 模板里额外的占位（如 token）。key 由应用传，包里不写死。 */
  params?: Readonly<Record<string, string>>
}

/** 地址模板来源：徽标服务（Logo.dev 这类）或任何按代码拼地址的 CDN。 */
export function urlTemplate(options: UrlTemplateOptions): LogoProvider {
  const templates = typeof options.template === 'string' ? [options.template] : options.template
  return {
    id: options.id ?? 'url-template',
    candidates(ctx) {
      if (!accepts(ctx, options, ['symbol'])) return []
      const values = templateValues(ctx, options.params)
      return templates.map((t) => fillTemplate(t, values)).filter((u): u is string => u !== undefined)
    },
  }
}

export type SelfHostedOptions = Filter & {
  id?: string
  /** 应用放徽标的目录地址（/logos、https://cdn.example.com/logos），末尾斜杠可有可无。 */
  baseUrl: string
  /**
   * 文件名模板，相对 baseUrl，按序成为候选。默认按「代码.场所」：`{code}.{mic}.svg`，再试 `{code}.svg`
   * （没场所的 AAPL 只有后一条）；加密币默认 `crypto/{code}.svg`。
   */
  pattern?: string | readonly string[]
}

export const SELF_HOSTED_DEFAULT_PATTERN = ['{code}.{mic}.svg', '{code}.svg'] as const
export const SELF_HOSTED_CRYPTO_PATTERN = ['crypto/{code}.svg'] as const
export const SELF_HOSTED_VENUE_PATTERN = ['venues/{venue_lower}.svg'] as const

/** 应用自托管：A 股、港股、美股都走它（徽标归应用，不进本仓库）；`katana-logos fetch` 按同样的命名下载。 */
export function selfHosted(options: SelfHostedOptions): LogoProvider {
  const base = options.baseUrl.replace(/\/+$/, '')
  return {
    id: options.id ?? `self-hosted:${base}`,
    candidates(ctx) {
      if (!accepts(ctx, options, ['symbol', 'venue'])) return []
      const patterns =
        options.pattern === undefined
          ? ctx.kind === 'venue'
            ? SELF_HOSTED_VENUE_PATTERN
            : ctx.ref.assetClass === 'crypto'
              ? SELF_HOSTED_CRYPTO_PATTERN
              : SELF_HOSTED_DEFAULT_PATTERN
          : typeof options.pattern === 'string'
            ? [options.pattern]
            : options.pattern
      const values = { ...templateValues(ctx), base }
      return patterns.map((p) => fillTemplate(`{base}/${p}`, values)).filter((u): u is string => u !== undefined)
    },
  }
}

/** 自托管的文件名（不含 baseUrl），命令行下载与 selfHosted 用同一套命名。 */
export function selfHostedPath(query: LogoQuery, pattern?: string | readonly string[]): string | undefined {
  const ctx = logoContext(query)
  if (!ctx) return undefined
  const [url] = selfHosted({ baseUrl: '', ...(pattern ? { pattern } : {}) }).candidates(ctx)
  return typeof url === 'string' ? url.replace(/^\//, '') : undefined
}

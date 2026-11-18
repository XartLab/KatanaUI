// SPDX-License-Identifier: MIT
// 徽标服务的预设来源（#95）：只拼地址或请求，key 一律由应用给，包里不写死、不带任何图片。
// - companiesLogo：companieslogo.com 的 API（付费；条款允许下载后自托管，A 股、港股、美股都有）。
//   代码写法照它的指南（https://companieslogo.com/api-doc-ticker-guide ，2026-11-19 读）：沪市 `600519.SS`、深市 `000001.SZ`、
//   港股 `0700.HK`、美股裸代码；北交所指南里没有，先不支持。API 返回 JSON（里面是图片地址），所以候选是载入函数，不是直接的图片地址。
//   API 形如 `https://companieslogo.com/api/1.0/?symbol=…&api_key=…`，也可按 `website_domain=` 查（https://companieslogo.com/api-doc/ ，2026-11-19 读）。
// - logoDev：Logo.dev（https://www.logo.dev）。按代码的接口 `img.logo.dev/ticker/{代码}` 只收 NYSE / NASDAQ；
//   按域名的接口 `img.logo.dev/{域名}` 全球通用，A 股给了官网域名就走它。
// - byDomain：通用的「按公司官网域名取标」模板。
// 不要用 TradingView 等平台自己的 CDN（如它的 moutai.svg）：那是它的私有资源，没有授权。
import { fillTemplate, type LogoContext, type LogoProvider, templateValues, urlTemplate } from './resolve.ts'

const US_MICS = new Set(['XNAS', 'XNYS', 'ARCX', 'XASE'])

function isUsStock(ctx: LogoContext): boolean {
  const { venue, assetClass } = ctx.ref
  if (assetClass === 'crypto') return false
  return venue ? US_MICS.has(venue) : assetClass === 'stock' || assetClass === 'fund'
}

/** companieslogo.com 的代码写法；不支持的场所（北交所、加密币、别的市场）返回 undefined。 */
export function companiesLogoSymbol(ctx: LogoContext): string | undefined {
  if (ctx.kind !== 'symbol') return undefined
  const { code, venue, assetClass } = ctx.ref
  if (assetClass === 'crypto') return undefined
  if (venue === 'XSHG') return `${code}.SS`
  if (venue === 'XSHE') return `${code}.SZ`
  if (venue === 'XHKG') return `${String(Number(code)).padStart(4, '0')}.HK`
  if (venue === 'BJSE') return undefined
  return isUsStock(ctx) ? code : undefined
}

/** companieslogo.com 的 API 地址：有代码按代码，没有而有域名按域名。 */
export function companiesLogoApiUrl(ctx: LogoContext, token: string): string | undefined {
  const symbol = companiesLogoSymbol(ctx)
  const key = `&api_key=${encodeURIComponent(token)}`
  if (symbol) return `https://companieslogo.com/api/1.0/?symbol=${encodeURIComponent(symbol)}${key}`
  if (ctx.query.domain)
    return `https://companieslogo.com/api/1.0/?website_domain=${encodeURIComponent(ctx.query.domain)}${key}`
  return undefined
}

/**
 * 从 companieslogo.com 的 JSON 里挑一张图：先 svg 后 png，先 icon（方形小标）后 big，深色底先挑 for_dark_background。
 * 返回结构按文档写的字段名（png / svg → icon / big → for_bright_background / for_dark_background → 尺寸），
 * 但不死认层级：把所有像图片地址的字符串收出来按上面的偏好排序，结构小改也取得到。相对地址按 companieslogo.com 补全。
 */
export function pickCompaniesLogoImage(json: unknown, background: 'dark' | 'bright' = 'dark'): string | undefined {
  const found: { url: string; path: string }[] = []
  const walk = (node: unknown, path: string) => {
    if (typeof node === 'string') {
      if (/\.(svg|png|jpe?g|webp)(\?|$)/i.test(node)) found.push({ url: node, path: `${path}/${node}`.toLowerCase() })
    } else if (Array.isArray(node)) node.forEach((n, i) => walk(n, `${path}/${i}`))
    else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) walk(v, `${path}/${k}`)
  }
  walk(json, '')
  if (!found.length) return undefined
  const other = background === 'dark' ? 'bright' : 'dark'
  const score = ({ path }: { path: string }) =>
    (path.includes('svg') ? 0 : 100) +
    (path.includes('icon') ? 0 : 10) +
    (path.includes(`for_${background}`) ? 0 : path.includes(`for_${other}`) ? 2 : 1) +
    (path.includes('/128') || path.includes('orig') ? 0 : 0.5)
  const best = found.toSorted((a, b) => score(a) - score(b))[0]!.url
  return new URL(best, 'https://companieslogo.com/').href
}

export type CompaniesLogoOptions = {
  id?: string
  /** companieslogo.com 的 API key（应用给）。 */
  token: string
  /** 界面底色：深色底先挑 for_dark_background。默认 dark（Graphite 与 Console 都是深色）。 */
  background?: 'dark' | 'bright'
  /** 换掉全局 fetch（测试、代理）。 */
  fetch?: typeof fetch
}

/**
 * companieslogo.com：A 股（沪 .SS、深 .SZ）、港股、美股。候选是载入函数：先请求 API 拿 JSON，再挑图片地址。
 * 浏览器里直接用会把 key 带到前端；它的条款允许下载后自托管，建议用命令行 `katana-logos fetch --provider companieslogo` 下载到应用目录，再用 selfHosted。
 */
export function companiesLogo(options: CompaniesLogoOptions): LogoProvider {
  return {
    id: options.id ?? 'companieslogo',
    candidates(ctx) {
      const api = companiesLogoApiUrl(ctx, options.token)
      if (!api) return []
      return [
        async () => {
          const res = await (options.fetch ?? fetch)(api)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const url = pickCompaniesLogoImage(await res.json(), options.background)
          if (!url) throw new Error('companieslogo: no image')
          return url
        },
      ]
    },
  }
}

export type LogoDevOptions = {
  id?: string
  /** Logo.dev 的可公开 key（publishable key，应用给）。 */
  token: string
  /** 额外的查询参数（size、format、theme 等，照 Logo.dev 文档）。 */
  query?: Readonly<Record<string, string>>
}

/** Logo.dev：有官网域名走 `img.logo.dev/{domain}`（全球），否则美股（NYSE / NASDAQ）走 `img.logo.dev/ticker/{代码}`。 */
export function logoDev(options: LogoDevOptions): LogoProvider {
  const extra = Object.entries(options.query ?? {})
    .map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('')
  return {
    id: options.id ?? 'logo.dev',
    candidates(ctx) {
      if (ctx.kind !== 'symbol' || ctx.ref.assetClass === 'crypto') return []
      const values = templateValues(ctx, { token: options.token })
      const out: string[] = []
      const byDomain = fillTemplate(`https://img.logo.dev/{domain}?token={token}${extra}`, values)
      if (byDomain) out.push(byDomain)
      if (isUsStock(ctx)) {
        const byTicker = fillTemplate(`https://img.logo.dev/ticker/{code}?token={token}${extra}`, values)
        if (byTicker) out.push(byTicker)
      }
      return out
    },
  }
}

export type ByDomainOptions = {
  id?: string
  /** 模板里额外的占位（如 token），由应用给。 */
  params?: Readonly<Record<string, string>>
}

/** 通用的「按官网域名取标」：模板要带 {domain}，没有域名的品种跳过。如 `byDomain('https://img.logo.dev/{domain}?token={token}', { params: { token } })`。 */
export function byDomain(template: string, options: ByDomainOptions = {}): LogoProvider {
  if (!template.includes('{domain}')) throw new Error('byDomain: template needs {domain}')
  return urlTemplate({
    id: options.id ?? 'by-domain',
    template,
    ...(options.params ? { params: options.params } : {}),
  })
}

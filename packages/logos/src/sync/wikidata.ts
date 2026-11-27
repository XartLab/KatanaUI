// SPDX-License-Identifier: MIT
// Wikidata 来源：按「交易所（P414）+ 代码（P414 声明上的限定 P249）」批量查公司，取徽标（P154，Commons 上的文件）与官网（P856）。
// 交易所用 MIC 认：交易所条目上的「MIC 市场代码」属性（默认 P7534，待核对，可在配置里改），不写死各交易所的 Q 号。
// 每批最多 200 个品种（#95）；徽标文件经 Special:FilePath 取，SVG 原样、位图按 width 缩到 256。
// 图片许可：Commons 上的企业徽标多为「不受版权保护（字形简单）」或合理使用，商标权仍归企业；下载到应用目录自用，不进本仓库。

export const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql'
export const WIKIDATA_BATCH = 200

export type WikidataHit = { item: string; logo?: string; website?: string }

export type WikidataOptions = {
  /** 交易所条目上 MIC 的属性号，默认 P7534（待核对）。 */
  micProperty?: string
  /** 规整后的 MIC → Wikidata 上写的 MIC（北交所规整成 BJSE，Wikidata 上可能写 XBSE 之类，在这里对上）。 */
  micAliases?: Readonly<Record<string, string>>
}

const esc = (s: string) => s.replaceAll('\\', '\\\\').replaceAll('"', '\\"')

/** 一批「代码.场所」的 SPARQL。pairs 是 [代码, MIC]。 */
export function wikidataQuery(pairs: readonly (readonly [string, string])[], options: WikidataOptions = {}): string {
  const prop = options.micProperty ?? 'P7534'
  const values = pairs.map(([code, mic]) => `("${esc(options.micAliases?.[mic] ?? mic)}" "${esc(code)}")`).join(' ')
  return `SELECT ?mic ?ticker ?item ?logo ?website WHERE {
  VALUES (?mic ?ticker) { ${values} }
  ?exchange wdt:${prop} ?mic .
  ?item p:P414 ?listing .
  ?listing ps:P414 ?exchange ; pq:P249 ?ticker .
  OPTIONAL { ?item wdt:P154 ?logo }
  OPTIONAL { ?item wdt:P856 ?website }
}`
}

type Binding = Record<string, { value: string } | undefined>

/** 解析 SPARQL JSON：「代码.MIC」→ 命中（同一个品种多行时取第一个有徽标的）。MIC 按 micAliases 反查回规整后的。 */
export function parseWikidata(json: unknown, options: WikidataOptions = {}): Map<string, WikidataHit> {
  const back = new Map(Object.entries(options.micAliases ?? {}).map(([k, v]) => [v, k]))
  const out = new Map<string, WikidataHit>()
  const rows = (json as { results?: { bindings?: Binding[] } }).results?.bindings ?? []
  for (const row of rows) {
    const mic = row.mic?.value
    const ticker = row.ticker?.value
    if (!mic || !ticker || !row.item) continue
    const key = `${ticker}.${back.get(mic) ?? mic}`
    const prev = out.get(key)
    if (prev?.logo) continue
    const hit: WikidataHit = { item: row.item.value }
    const logo = row.logo?.value ?? prev?.logo
    const website = row.website?.value ?? prev?.website
    if (logo) hit.logo = logo.replace(/^http:/, 'https:')
    if (website) hit.website = website
    out.set(key, hit)
  }
  return out
}

/** Commons 文件地址：位图加 width=256，SVG 原样。 */
export function commonsFileUrl(logo: string): string {
  return /\.svg$/i.test(decodeURIComponent(logo)) ? logo : `${logo}${logo.includes('?') ? '&' : '?'}width=256`
}

/** 切批。 */
export function chunk<T>(list: readonly T[], size = WIKIDATA_BATCH): T[][] {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

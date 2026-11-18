// SPDX-License-Identifier: MIT
// 加密币与交易所的内置来源：@web3icons/core（MIT，https://github.com/0xa3k5/web3icons ，见 NOTICE）的 branded SVG。
// 单独一个出口（@katana-ui/logos/web3icons）：不引它就不带这张表。引了也只带表（名字 → 动态 import），
// 每个 SVG 是打包器拆出的单独小块，界面上用到哪个币才载入哪个（约 1–3 KB 一个）。
import { svgDataUrl } from './cache.ts'
import type { AssetClass } from './normalize.ts'
import type { LogoProvider } from './resolve.ts'
import { EXCHANGES, TOKENS, WEB3ICONS_VERSION } from './web3icons-map.ts'

export { WEB3ICONS_VERSION }

/** 规整后的交易所名 → web3icons 的交易所 id（名字不一样的才列；其余按小写、去空白与点后直接找）。 */
const EXCHANGE_IDS: Readonly<Record<string, string>> = {
  GATEIO: 'gate-io',
  CRYPTOCOM: 'crypto-com',
  PANCAKESWAP: 'pancake-swap',
  PARASWAP: 'para-swap',
}

/** web3icons 里有没有这个币（代码大写）。 */
export function hasWeb3Token(code: string): boolean {
  return Object.hasOwn(TOKENS, code.toUpperCase())
}

/** 交易所名（规整过的 BINANCE、GATEIO）→ web3icons 的 id；没有就 undefined。 */
export function web3ExchangeId(venue: string): string | undefined {
  const v = venue.toUpperCase()
  const id = EXCHANGE_IDS[v] ?? v.toLowerCase().replaceAll(/[\s.]/g, '')
  return Object.hasOwn(EXCHANGES, id) ? id : undefined
}

/** 载入一个币的 SVG 文本（命令行导出用）；没有这个币返回 undefined。 */
export async function web3TokenSvg(code: string): Promise<string | undefined> {
  const load = TOKENS[code.toUpperCase()]
  return load ? (await load()).default : undefined
}

/** 载入一个交易所的 SVG 文本；没有返回 undefined。 */
export async function web3ExchangeSvg(venue: string): Promise<string | undefined> {
  const id = web3ExchangeId(venue)
  const load = id ? EXCHANGES[id] : undefined
  return load ? (await load()).default : undefined
}

export type Web3IconsOptions = {
  id?: string
  /**
   * 哪些类别取币标，默认只 crypto：不带类别、不带场所的 META、COMP 这类代码可能是股票，不能拿币标去配。
   * 规整时 BTCUSDT、BTC-PERP、BINANCE:BTC 这类写法会自动认成 crypto。
   */
  assetClasses?: readonly AssetClass[]
}

/** 内置来源：加密币（symbol）与交易所（kind: 'venue'）的标。 */
export function web3icons(options: Web3IconsOptions = {}): LogoProvider {
  const classes = options.assetClasses ?? ['crypto']
  return {
    id: options.id ?? 'web3icons',
    candidates({ kind, ref }) {
      if (kind === 'venue') {
        const id = web3ExchangeId(ref.code)
        const load = id ? EXCHANGES[id] : undefined
        return load ? [async () => svgDataUrl((await load()).default)] : []
      }
      if (!classes.includes(ref.assetClass)) return []
      const load = TOKENS[ref.code]
      return load ? [async () => svgDataUrl((await load()).default)] : []
    },
  }
}

/** 收了多少个（文档站与汇报用）。 */
export const WEB3ICONS_COUNTS = {
  tokens: Object.keys(TOKENS).length,
  exchanges: Object.keys(EXCHANGES).length,
} as const

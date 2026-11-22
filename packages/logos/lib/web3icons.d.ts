import type { AssetClass } from './normalize.ts';
import type { LogoProvider } from './resolve.ts';
import { WEB3ICONS_VERSION } from './web3icons-map.ts';
export { WEB3ICONS_VERSION };
/** web3icons 里有没有这个币（代码大写）。 */
export declare function hasWeb3Token(code: string): boolean;
/** 交易所名（规整过的 BINANCE、GATEIO）→ web3icons 的 id；没有就 undefined。 */
export declare function web3ExchangeId(venue: string): string | undefined;
/** 载入一个币的 SVG 文本（命令行导出用）；没有这个币返回 undefined。 */
export declare function web3TokenSvg(code: string): Promise<string | undefined>;
/** 载入一个交易所的 SVG 文本；没有返回 undefined。 */
export declare function web3ExchangeSvg(venue: string): Promise<string | undefined>;
export type Web3IconsOptions = {
    id?: string;
    /**
     * 哪些类别取币标，默认只 crypto：不带类别、不带场所的 META、COMP 这类代码可能是股票，不能拿币标去配。
     * 规整时 BTCUSDT、BTC-PERP、BINANCE:BTC 这类写法会自动认成 crypto。
     */
    assetClasses?: readonly AssetClass[];
};
/** 内置来源：加密币（symbol）与交易所（kind: 'venue'）的标。 */
export declare function web3icons(options?: Web3IconsOptions): LogoProvider;
/** 收了多少个（文档站与汇报用）。 */
export declare const WEB3ICONS_COUNTS: {
    readonly tokens: number;
    readonly exchanges: number;
};

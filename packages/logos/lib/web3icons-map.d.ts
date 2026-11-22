type SvgModule = () => Promise<{
    default: string;
}>;
export declare const WEB3ICONS_VERSION = "4.0.60";
/** 币种代码（大写）→ SVG 模块。 */
export declare const TOKENS: Readonly<Record<string, SvgModule>>;
/** 交易所 id（web3icons 的短横线小写名）→ SVG 模块。 */
export declare const EXCHANGES: Readonly<Record<string, SvgModule>>;
export {};

import { type AssetClass, type SymbolRef } from './normalize.ts';
/** 要徽标的东西：一个品种（symbol），或一个交易所 / 场所（kind: 'venue'，用 venue）。 */
export type LogoQuery = {
    symbol?: string;
    venue?: string;
    assetClass?: AssetClass;
    /** 名称：模板里的 {name}。 */
    name?: string;
    /** 公司域名（apple.com）：模板里的 {domain}，徽标服务按域名取时用。 */
    domain?: string;
    kind?: 'symbol' | 'venue';
};
/** 一个候选：现成的地址，或返回地址的载入函数（按需 import 的 SVG 走这条）。 */
export type LogoSource = string | (() => Promise<string>);
export type LogoCandidate = {
    /** 缓存键：同一个键只请求一次、失败一次就不再试。 */
    key: string;
    provider: string;
    source: LogoSource;
};
/** 规整后交给来源的上下文。venue 查询时 ref 的 code 是规整后的场所名。 */
export type LogoContext = {
    query: LogoQuery;
    ref: SymbolRef;
    kind: 'symbol' | 'venue';
};
export type LogoProvider = {
    id: string;
    /** 给出这个来源的候选，没有就返回空数组。 */
    candidates(ctx: LogoContext): LogoSource[];
};
/**
 * 代码 → 公司官网域名（调用方给，比如 katana 数据层从公司资料里拿）：键写「代码.场所」（600519.XSHG），也认原样代码与裸代码。
 * 查询没带 domain 时从这里补，byDomain、logoDev、companiesLogo 按域名取标用。
 */
export type DomainMap = Readonly<Record<string, string>>;
/** 从域名表里找这个品种的官网域名：先「代码.场所」，再原样输入，再裸代码。 */
export declare function domainFor(ref: SymbolRef, domainMap: DomainMap | undefined): string | undefined;
export type ResolveOptions = {
    domainMap?: DomainMap;
};
/** 规整查询：venue 查询时 ref.code 是规整后的场所名（XNAS、BINANCE）。查询没带 domain 时按 domainMap 补。 */
export declare function logoContext(query: LogoQuery, options?: ResolveOptions): LogoContext | undefined;
/** 按来源顺序列出候选；同一个地址只出现一次。 */
export declare function resolveLogo(query: LogoQuery, providers: readonly LogoProvider[], options?: ResolveOptions): LogoCandidate[];
/** 模板里能用的占位：{code} {code_lower} {mic} {venue} {venue_lower} {key} {quote} {symbol} {name} {domain} {assetClass}，加调用方给的 params。 */
export declare function templateValues(ctx: LogoContext, params?: Readonly<Record<string, string>>): Record<string, string>;
/** 填模板；有占位没有值就返回 undefined（这个候选不成立）。值按 URL 组件编码，{base} 例外。 */
export declare function fillTemplate(template: string, values: Readonly<Record<string, string>>): string | undefined;
type Filter = {
    assetClasses?: readonly AssetClass[];
    kinds?: readonly ('symbol' | 'venue')[];
};
export type UrlTemplateOptions = Filter & {
    id?: string;
    /** 一条或几条模板，按序成为候选，如 `https://img.logo.dev/ticker/{code}?token={token}`。 */
    template: string | readonly string[];
    /** 模板里额外的占位（如 token）。key 由应用传，包里不写死。 */
    params?: Readonly<Record<string, string>>;
};
/** 地址模板来源：徽标服务（Logo.dev 这类）或任何按代码拼地址的 CDN。 */
export declare function urlTemplate(options: UrlTemplateOptions): LogoProvider;
export type SelfHostedOptions = Filter & {
    id?: string;
    /** 应用放徽标的目录地址（/logos、https://cdn.example.com/logos），末尾斜杠可有可无。 */
    baseUrl: string;
    /**
     * 文件名模板，相对 baseUrl，按序成为候选。默认按「代码.场所」：`{code}.{mic}.svg`，再试 `{code}.svg`
     * （没场所的 AAPL 只有后一条）；加密币默认 `crypto/{code}.svg`。
     */
    pattern?: string | readonly string[];
};
export declare const SELF_HOSTED_DEFAULT_PATTERN: readonly ['{code}.{mic}.svg', '{code}.svg'];
export declare const SELF_HOSTED_CRYPTO_PATTERN: readonly ['crypto/{code}.svg'];
export declare const SELF_HOSTED_VENUE_PATTERN: readonly ['venues/{venue_lower}.svg'];
/** 应用自托管：A 股、港股、美股都走它（徽标归应用，不进本仓库）；`katana-logos fetch` 按同样的命名下载。 */
export declare function selfHosted(options: SelfHostedOptions): LogoProvider;
/** 自托管的文件名（不含 baseUrl），命令行下载与 selfHosted 用同一套命名。 */
export declare function selfHostedPath(query: LogoQuery, pattern?: string | readonly string[]): string | undefined;
export {};

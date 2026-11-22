import { type LogoContext, type LogoProvider } from './resolve.ts';
/** companieslogo.com 的代码写法；不支持的场所（北交所、加密币、别的市场）返回 undefined。 */
export declare function companiesLogoSymbol(ctx: LogoContext): string | undefined;
/** companieslogo.com 的 API 地址：有代码按代码，没有而有域名按域名。 */
export declare function companiesLogoApiUrl(ctx: LogoContext, token: string): string | undefined;
/**
 * 从 companieslogo.com 的 JSON 里挑一张图：先 svg 后 png，先 icon（方形小标）后 big，深色底先挑 for_dark_background。
 * 返回结构按文档写的字段名（png / svg → icon / big → for_bright_background / for_dark_background → 尺寸），
 * 但不死认层级：把所有像图片地址的字符串收出来按上面的偏好排序，结构小改也取得到。相对地址按 companieslogo.com 补全。
 */
export declare function pickCompaniesLogoImage(json: unknown, background?: 'dark' | 'bright'): string | undefined;
export type CompaniesLogoOptions = {
    id?: string;
    /** companieslogo.com 的 API key（应用给）。 */
    token: string;
    /** 界面底色：深色底先挑 for_dark_background。默认 dark（Graphite 与 Console 都是深色）。 */
    background?: 'dark' | 'bright';
    /** 换掉全局 fetch（测试、代理）。 */
    fetch?: typeof fetch;
};
/**
 * companieslogo.com：A 股（沪 .SS、深 .SZ）、港股、美股。候选是载入函数：先请求 API 拿 JSON，再挑图片地址。
 * 浏览器里直接用会把 key 带到前端；它的条款允许下载后自托管，建议用命令行 `katana-logos fetch --provider companieslogo` 下载到应用目录，再用 selfHosted。
 */
export declare function companiesLogo(options: CompaniesLogoOptions): LogoProvider;
export type LogoDevOptions = {
    id?: string;
    /** Logo.dev 的可公开 key（publishable key，应用给）。 */
    token: string;
    /** 额外的查询参数（size、format、theme 等，照 Logo.dev 文档）。 */
    query?: Readonly<Record<string, string>>;
};
/** Logo.dev：有官网域名走 `img.logo.dev/{domain}`（全球），否则美股（NYSE / NASDAQ）走 `img.logo.dev/ticker/{代码}`。 */
export declare function logoDev(options: LogoDevOptions): LogoProvider;
export type ByDomainOptions = {
    id?: string;
    /** 模板里额外的占位（如 token），由应用给。 */
    params?: Readonly<Record<string, string>>;
};
/** 通用的「按官网域名取标」：模板要带 {domain}，没有域名的品种跳过。如 `byDomain('https://img.logo.dev/{domain}?token={token}', { params: { token } })`。 */
export declare function byDomain(template: string, options?: ByDomainOptions): LogoProvider;
/** LogoKit 的 A 股 / 港股后缀表（MIC → 后缀）。默认值是猜的：LogoKit 文档没写 A 股后缀，要拿 key 实测后再定。北交所不映射。 */
export declare const LOGOKIT_DEFAULT_SUFFIX: Readonly<Record<string, string>>;
export type LogoKitOptions = {
    id?: string;
    /** LogoKit 的 publishable key（每个应用 / 用户用自己的，应用给）。 */
    token: string;
    /** MIC → 代码后缀，盖过默认表（默认 XSHE → .SZ、XSHG → .SS，待实测）。 */
    suffix?: Readonly<Record<string, string>>;
};
/**
 * LogoKit（https://logokit.com）：`img.logokit.com/ticker/{代码}?token=…&fallback=404`。
 * fallback=404：没有标时回 404，由我们自己退回字母，不用它的字母图（monogram）。
 * 美股裸代码；A 股按 suffix 表加后缀（默认 .SZ / .SS，文档没写，待用户拿 key 实测）；北交所与表里没有的场所不出候选。
 * 条款只许热链：不许缓存或本地存图，所以命令行 katana-logos fetch 不支持它；免费档 64px，要放署名链接。
 */
export declare function logoKit(options: LogoKitOptions): LogoProvider;

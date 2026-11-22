export type IconLink = {
    url: string;
    rel: string;
    size: number;
    svg: boolean;
};
/** 从首页 HTML 里挑图标链接：apple-touch-icon 在前，其余按 sizes 从大到小；相对地址按 base 补全。 */
export declare function iconLinks(html: string, base: string): IconLink[];
/** 一个官网的全部候选地址（按序试）：首页里的图标链接 → /apple-touch-icon.png → /favicon.ico → Google。 */
export declare function websiteCandidates(html: string | undefined, site: string): string[];
/** 官网 → 首页地址（域名补 https://）。 */
export declare function homepage(siteOrDomain: string): string;
/** 官网 → 域名（给 Google favicon 服务）。 */
export declare function domainOf(siteOrDomain: string): string;
export declare const googleFaviconUrl: (domain: string, size?: number) => string;

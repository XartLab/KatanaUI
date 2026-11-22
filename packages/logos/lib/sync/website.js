// SPDX-License-Identifier: MIT
// 官网图标来源（免费路线的主力，#95 2026-11-19 定）：抓官网首页 HTML，按优先级取
//   SVG 图标（rel=icon 且 type=image/svg+xml 或 .svg）→ <link rel="apple-touch-icon">（常见 180px）→ <link rel="icon" sizes> 最大的一个
//   → /apple-touch-icon.png → /favicon.ico（解析 ico 里最大的一帧）→ 最后 Google 的 favicon 服务
//   （https://www.google.com/s2/favicons?domain=…&sz=64；不认识的域名回 16px 地球，质量过滤会丢）。
// 域名：清单里的 domain（KATANAview 数据层从公司资料「公司网址」给）优先，其次 Wikidata 的官网（P856）。
/** 从首页 HTML 里挑图标链接：apple-touch-icon 在前，其余按 sizes 从大到小；相对地址按 base 补全。 */
export function iconLinks(html, base) {
    const out = [];
    for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
        const attr = (name) => new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
        const pick = (m) => m?.[1] ?? m?.[2] ?? m?.[3];
        const rel = pick(attr('rel'))?.toLowerCase() ?? '';
        const href = pick(attr('href'));
        if (!href || !/(^|\s)(apple-touch-icon(-precomposed)?|icon|shortcut icon)(\s|$)/.test(rel))
            continue;
        const sizes = pick(attr('sizes')) ?? '';
        const size = Math.max(0, ...[...sizes.matchAll(/(\d+)x(\d+)/gi)].map((m) => Number(m[1])));
        const svg = /svg/i.test(pick(attr('type')) ?? '') || /\.svg(\?|#|$)/i.test(href) || /\bany\b/i.test(sizes);
        try {
            out.push({ url: new URL(href, base).href, rel, svg, size: size || (rel.startsWith('apple') ? 180 : 0) });
        }
        catch {
            // 坏地址跳过
        }
    }
    // SVG 优先，再 apple-touch-icon，再按尺寸从大到小。
    return out.toSorted((a, b) => {
        const svg = Number(b.svg) - Number(a.svg);
        const apple = Number(b.rel.startsWith('apple')) - Number(a.rel.startsWith('apple'));
        return svg || apple || b.size - a.size;
    });
}
/** 一个官网的全部候选地址（按序试）：首页里的图标链接 → /apple-touch-icon.png → /favicon.ico → Google。 */
export function websiteCandidates(html, site) {
    const home = homepage(site);
    const origin = new URL(home).origin;
    const urls = [
        ...(html ? iconLinks(html, home).map((l) => l.url) : []),
        `${origin}/apple-touch-icon.png`,
        `${origin}/favicon.ico`,
        googleFaviconUrl(domainOf(site)),
    ];
    return [...new Set(urls)];
}
/** 官网 → 首页地址（域名补 https://）。 */
export function homepage(siteOrDomain) {
    const s = siteOrDomain.trim();
    return /^https?:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, '')}`;
}
/** 官网 → 域名（给 Google favicon 服务）。 */
export function domainOf(siteOrDomain) {
    return new URL(homepage(siteOrDomain)).hostname.replace(/^www\./, '');
}
export const googleFaviconUrl = (domain, size = 64) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;

// SPDX-License-Identifier: MIT
// 徽标解析：按调用方配置的来源（provider）顺序，给一个品种列出候选（地址，或按需载入的函数）。
// 包里不写死任何 key、不带企业商标图片：股票走应用自托管（selfHosted）或调用方给的地址模板（urlTemplate，key 由应用传）。
import { normalizeSymbol, normalizeVenue } from './normalize.js';
/** 从域名表里找这个品种的官网域名：先「代码.场所」，再原样输入，再裸代码。 */
export function domainFor(ref, domainMap) {
    if (!domainMap)
        return undefined;
    return domainMap[ref.key] ?? domainMap[ref.input] ?? domainMap[ref.input.toUpperCase()] ?? domainMap[ref.code];
}
/** 规整查询：venue 查询时 ref.code 是规整后的场所名（XNAS、BINANCE）。查询没带 domain 时按 domainMap 补。 */
export function logoContext(query, options = {}) {
    const kind = query.kind ?? (query.symbol ? 'symbol' : 'venue');
    if (kind === 'venue') {
        if (!query.venue)
            return undefined;
        const v = normalizeVenue(query.venue);
        return { query, kind, ref: { input: query.venue, code: v, venue: v, assetClass: 'unknown', key: v } };
    }
    if (!query.symbol?.trim())
        return undefined;
    const hint = {
        ...(query.venue ? { venue: query.venue } : {}),
        ...(query.assetClass ? { assetClass: query.assetClass } : {}),
    };
    const ref = normalizeSymbol(query.symbol, hint);
    const domain = query.domain ?? domainFor(ref, options.domainMap);
    return { query: domain ? { ...query, domain } : query, kind, ref };
}
/** 按来源顺序列出候选；同一个地址只出现一次。 */
export function resolveLogo(query, providers, options = {}) {
    const ctx = logoContext(query, options);
    if (!ctx)
        return [];
    const seen = new Set();
    const out = [];
    for (const provider of providers) {
        for (const source of provider.candidates(ctx)) {
            const key = typeof source === 'string' ? source : `${provider.id}:${ctx.kind}:${ctx.ref.key}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            out.push({ key, provider: provider.id, source });
        }
    }
    return out;
}
/** 模板里能用的占位：{code} {code_lower} {mic} {venue} {venue_lower} {key} {quote} {symbol} {name} {domain} {assetClass}，加调用方给的 params。 */
export function templateValues(ctx, params = {}) {
    const { ref, query } = ctx;
    const values = {
        ...params,
        code: ref.code,
        code_lower: ref.code.toLowerCase(),
        key: ref.key,
        symbol: ref.input,
        assetClass: ref.assetClass,
    };
    if (ref.venue) {
        values.venue = ref.venue;
        values.venue_lower = ref.venue.toLowerCase();
        if (/^[A-Z]{4}$/.test(ref.venue) && ref.assetClass !== 'crypto')
            values.mic = ref.venue;
    }
    if (ref.quote)
        values.quote = ref.quote;
    if (query.name)
        values.name = query.name;
    if (query.domain)
        values.domain = query.domain;
    return values;
}
/** 填模板；有占位没有值就返回 undefined（这个候选不成立）。值按 URL 组件编码，{base} 例外。 */
export function fillTemplate(template, values) {
    let missing = false;
    const out = template.replaceAll(/\{(\w+)\}/g, (_, name) => {
        const v = values[name];
        if (v === undefined || (v === '' && name !== 'base')) {
            missing = true;
            return '';
        }
        return name === 'base' ? v : encodeURIComponent(v);
    });
    return missing ? undefined : out;
}
function accepts(ctx, filter, defaultKinds) {
    if (!(filter.kinds ?? defaultKinds).includes(ctx.kind))
        return false;
    return !filter.assetClasses || ctx.kind === 'venue' || filter.assetClasses.includes(ctx.ref.assetClass);
}
/** 地址模板来源：徽标服务（Logo.dev 这类）或任何按代码拼地址的 CDN。 */
export function urlTemplate(options) {
    const templates = typeof options.template === 'string' ? [options.template] : options.template;
    return {
        id: options.id ?? 'url-template',
        candidates(ctx) {
            if (!accepts(ctx, options, ['symbol']))
                return [];
            const values = templateValues(ctx, options.params);
            return templates.map((t) => fillTemplate(t, values)).filter((u) => u !== undefined);
        },
    };
}
export const SELF_HOSTED_DEFAULT_PATTERN = ['{code}.{mic}.svg', '{code}.svg'];
export const SELF_HOSTED_CRYPTO_PATTERN = ['crypto/{code}.svg'];
export const SELF_HOSTED_VENUE_PATTERN = ['venues/{venue_lower}.svg'];
/** 应用自托管：A 股、港股、美股都走它（徽标归应用，不进本仓库）；`katana-logos fetch` 按同样的命名下载。 */
export function selfHosted(options) {
    const base = options.baseUrl.replace(/\/+$/, '');
    return {
        id: options.id ?? `self-hosted:${base}`,
        candidates(ctx) {
            if (!accepts(ctx, options, ['symbol', 'venue']))
                return [];
            const patterns = options.pattern === undefined
                ? ctx.kind === 'venue'
                    ? SELF_HOSTED_VENUE_PATTERN
                    : ctx.ref.assetClass === 'crypto'
                        ? SELF_HOSTED_CRYPTO_PATTERN
                        : SELF_HOSTED_DEFAULT_PATTERN
                : typeof options.pattern === 'string'
                    ? [options.pattern]
                    : options.pattern;
            const values = { ...templateValues(ctx), base };
            return patterns.map((p) => fillTemplate(`{base}/${p}`, values)).filter((u) => u !== undefined);
        },
    };
}
/** 自托管的文件名（不含 baseUrl），命令行下载与 selfHosted 用同一套命名。 */
export function selfHostedPath(query, pattern) {
    const ctx = logoContext(query);
    if (!ctx)
        return undefined;
    const [url] = selfHosted({ baseUrl: '', ...(pattern ? { pattern } : {}) }).candidates(ctx);
    return typeof url === 'string' ? url.replace(/^\//, '') : undefined;
}

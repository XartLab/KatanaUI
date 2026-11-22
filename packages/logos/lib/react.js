import { jsx as _jsx } from "react/jsx-runtime";
// SPDX-License-Identifier: MIT
// React 接法：LogoProvider 给一组来源与一份缓存，useLogo 给一个品种挑当前该试的地址；图加载失败（onError）就记进失败缓存、换下一个候选，
// 全失败返回没有 src（调用方退回字母）。没有 LogoProvider 时 useLogo 什么都不做（src 为空），件的行为与没接徽标时一样。
import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { LogoCache } from './cache.js';
import { resolveLogo } from './resolve.js';
const LogoContext = createContext(null);
export function LogoProvider({ providers, cache, domainMap, children }) {
    const [own] = useState(() => new LogoCache());
    const used = cache ?? own;
    const value = useMemo(() => ({ providers, cache: used, ...(domainMap ? { domainMap } : {}) }), [providers, used, domainMap]);
    return _jsx(LogoContext.Provider, { value: value, children: children });
}
const NONE = { src: undefined, status: 'none', onError: () => { }, onLoad: () => { } };
/** 有没有包在 LogoProvider 里。 */
export function useHasLogoProvider() {
    return useContext(LogoContext) !== null;
}
/** 给一个品种挑徽标地址。query 为 undefined 时不解析（调用方自己有图时传 undefined）。 */
export function useLogo(query) {
    const ctx = useContext(LogoContext);
    const [, rerender] = useReducer((n) => n + 1, 0);
    // query 对象每次渲染都是新的：按字段拼成一个串作依赖，字段没变就不重新解析。
    const sig = query ? JSON.stringify(query) : '';
    const candidates = useMemo(() => ctx && sig
        ? resolveLogo(JSON.parse(sig), ctx.providers, ctx.domainMap ? { domainMap: ctx.domainMap } : {})
        : [], [ctx, sig]);
    const current = ctx ? ctx.cache.pick(candidates) : undefined;
    const src = current && ctx ? ctx.cache.url(current) : undefined;
    useEffect(() => {
        if (!ctx || !current || src !== undefined)
            return;
        let live = true;
        ctx.cache.load(current).then(() => live && rerender(), () => live && rerender());
        return () => {
            live = false;
        };
    }, [ctx, current, src]);
    if (!ctx || !current)
        return NONE;
    return {
        src,
        status: src === undefined ? 'loading' : 'ready',
        onError: () => {
            ctx.cache.markFailed(current.key);
            rerender();
        },
        onLoad: () => ctx.cache.markOk(current.key),
    };
}

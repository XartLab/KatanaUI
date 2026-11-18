// SPDX-License-Identifier: MIT
// React 接法：LogoProvider 给一组来源与一份缓存，useLogo 给一个品种挑当前该试的地址；图加载失败（onError）就记进失败缓存、换下一个候选，
// 全失败返回没有 src（调用方退回字母）。没有 LogoProvider 时 useLogo 什么都不做（src 为空），件的行为与没接徽标时一样。
import { createContext, type ReactNode, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { LogoCache } from './cache.ts'
import { type DomainMap, type LogoProvider as LogoSourceProvider, type LogoQuery, resolveLogo } from './resolve.ts'

type LogoContextValue = { providers: readonly LogoSourceProvider[]; cache: LogoCache; domainMap?: DomainMap }

const LogoContext = createContext<LogoContextValue | null>(null)

export type LogoProviderProps = {
  /** 来源，按序尝试：如 `[web3icons(), selfHosted({ baseUrl: '/logos' })]`。 */
  providers: readonly LogoSourceProvider[]
  /** 共用的缓存；不给就每个 LogoProvider 自带一份（跟它活得一样长）。 */
  cache?: LogoCache
  /** 代码 → 官网域名（「代码.场所」作键），按域名取标的来源用。 */
  domainMap?: DomainMap
  children?: ReactNode
}

export function LogoProvider({ providers, cache, domainMap, children }: LogoProviderProps) {
  const [own] = useState(() => new LogoCache())
  const used = cache ?? own
  const value = useMemo(
    () => ({ providers, cache: used, ...(domainMap ? { domainMap } : {}) }),
    [providers, used, domainMap],
  )
  return <LogoContext.Provider value={value}>{children}</LogoContext.Provider>
}

export type UseLogoResult = {
  /** 当前该显示的地址；没有（没 Provider、没候选、都失败、还在载入）就是 undefined。 */
  src: string | undefined
  /** 'none'：没有候选或都失败了；'loading'：载入函数还没回来；'ready'：src 可用。 */
  status: 'none' | 'loading' | 'ready'
  /** 接到 img 的 onError：记失败、换下一个候选。 */
  onError: () => void
  /** 接到 img 的 onLoad：记成功，下次同一个品种直接用它。 */
  onLoad: () => void
}

const NONE: UseLogoResult = { src: undefined, status: 'none', onError: () => {}, onLoad: () => {} }

/** 有没有包在 LogoProvider 里。 */
export function useHasLogoProvider(): boolean {
  return useContext(LogoContext) !== null
}

/** 给一个品种挑徽标地址。query 为 undefined 时不解析（调用方自己有图时传 undefined）。 */
export function useLogo(query: LogoQuery | undefined): UseLogoResult {
  const ctx = useContext(LogoContext)
  const [, rerender] = useReducer((n: number) => n + 1, 0)
  // query 对象每次渲染都是新的：按字段拼成一个串作依赖，字段没变就不重新解析。
  const sig = query ? JSON.stringify(query) : ''
  const candidates = useMemo(
    () =>
      ctx && sig
        ? resolveLogo(JSON.parse(sig) as LogoQuery, ctx.providers, ctx.domainMap ? { domainMap: ctx.domainMap } : {})
        : [],
    [ctx, sig],
  )
  const current = ctx ? ctx.cache.pick(candidates) : undefined
  const src = current && ctx ? ctx.cache.url(current) : undefined

  useEffect(() => {
    if (!ctx || !current || src !== undefined) return
    let live = true
    ctx.cache.load(current).then(
      () => live && rerender(),
      () => live && rerender(),
    )
    return () => {
      live = false
    }
  }, [ctx, current, src])

  if (!ctx || !current) return NONE
  return {
    src,
    status: src === undefined ? 'loading' : 'ready',
    onError: () => {
      ctx.cache.markFailed(current.key)
      rerender()
    },
    onLoad: () => ctx.cache.markOk(current.key),
  }
}

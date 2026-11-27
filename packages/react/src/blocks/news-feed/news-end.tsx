// SPDX-License-Identifier: MIT
/**
 * The last row of NewsFeed's scroll area (more / loading / end / error with retry) and the hook that calls `onEndReached`.
 * NewsFeed 列表底部的那一行（还有 / 加载中 / 到底 / 出错可重试），以及触发 onEndReached 的钩子。
 * 触发用 IntersectionObserver 盯底部的哨兵，不挂 scroll 监听（modern-web-guidance 的「滚动时不做重活」：滚动期间不跑我们的代码）；
 * 虚拟列表里哨兵就在整个列表（一个固定总高的 ol）后面，所以与是否虚拟化无关。
 */
import { LoaderCircle } from 'lucide-react'
import { useEffect, useEffectEvent, type ReactNode, type RefObject } from 'react'
import { Button } from '../../primitives/button.tsx'

/** Bottom state of the list: more to load, loading, nothing left, or a failed load with its retry. 列表底部的状态。 */
export type NewsEndState = 'more' | 'loading' | 'end' | { error: ReactNode; retry: () => void }

/** Texts of the bottom row; all optional, English by default. 底部那一行的文字，都可不传，默认英文。 */
export type NewsEndLabels = {
  /** Default 'Loading more…'. */
  loadingMore?: string
  /** Default 'No more items'. */
  endReached?: string
  /** Default 'Retry'. */
  retry?: string
}

/**
 * 离底部多远就开始取下一页（像素）：待定。取约半屏（12 行 × 32px 的最小行高 ≈ 384，取整 400），让下一页在用户滚到底之前就在路上；没有实测。
 * 量法：在虚拟列表演示里调它，看滚到底时有没有看到「加载中」那一行。
 */
export const END_REACHED_MARGIN = 400

/**
 * When `enabled`, calls `onReach` whenever the sentinel is inside the scroll area (plus END_REACHED_MARGIN below it): once when the observer starts, then on every scroll that brings it back in.
 * `recheck` restarts the observer; pass something that changes when rows are added, so a sentinel that is still in view after a page arrives asks for the next page.
 * enabled 时哨兵进了滚动区（下方再留 END_REACHED_MARGIN）就调 onReach：观察一开始就算一次，之后每次滚回视野再算一次。
 * recheck 变了就重新观察：新的一页到了而哨兵还在视野里（页太短），要接着要下一页。调用方在取页期间要把 endState 设成 'loading'，不然同一页可能被要两次。
 */
export function useEndReached(
  sentinel: RefObject<HTMLElement | null>,
  root: RefObject<HTMLElement | null>,
  enabled: boolean,
  onReach: () => void,
  recheck: unknown,
) {
  const reach = useEffectEvent(onReach)
  useEffect(() => {
    const target = sentinel.current
    if (!enabled || !target || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (records) => {
        if (records.some((record) => record.isIntersecting)) reach()
      },
      { root: root.current, rootMargin: `0px 0px ${END_REACHED_MARGIN}px 0px` },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [enabled, recheck, sentinel, root])
}

type NewsEndProps = {
  state: NewsEndState
  labels: NewsEndLabels
  /** 'more' 时哨兵（空的一行）挂在这个 ref 上。 */
  sentinel: RefObject<HTMLDivElement | null>
}

export function NewsEnd({ state, labels, sentinel }: NewsEndProps) {
  if (state === 'more') return <div ref={sentinel} className="k-news-end" data-state="more" aria-hidden="true" />
  if (state === 'loading')
    return (
      <div className="k-news-end" data-state="loading" role="status">
        <LoaderCircle className="k-news-end-spin" size={14} aria-hidden="true" />
        {labels.loadingMore ?? 'Loading more…'}
      </div>
    )
  if (state === 'end')
    return (
      <div className="k-news-end" data-state="end" role="status">
        {labels.endReached ?? 'No more items'}
      </div>
    )
  return (
    <div className="k-news-end" data-state="error" role="alert">
      <span className="k-news-end-error">{state.error}</span>
      <Button size="sm" variant="ghost" onClick={state.retry}>
        {labels.retry ?? 'Retry'}
      </Button>
    </div>
  )
}

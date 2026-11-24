// SPDX-License-Identifier: MIT
// 系统是否要求减少动效（prefers-reduced-motion: reduce）。用 useSyncExternalStore 读媒体查询，没有 effect 里的同步 setState；服务端渲染时为 false。
// 产品底线是不跟系统的「减少动态效果」（见 theme/motion.css 头部），万能框（#224）是用户明说要跟的第一件：占位轮播与高亮滑动在减少动效时不动，所以它读这个。
import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** 用户是否要求减少动效。 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}

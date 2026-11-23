// SPDX-License-Identifier: MIT
// 非模态浮层的「滚动即关」（#125）：浮层开着时，页面或锚点的某个祖先滚动容器一滚，浮层就关。
// 不关的话浮层跟着锚点滚出屏幕还开着（Bombadil 的 overlaysInViewport 两次试跑都报，文档站 #/news-feed 能稳定复现）。
// 照 TradingView 的做法直接关，而不是 Radix 的 hideWhenDetached：后者只把浮层设成 visibility:hidden，人看不见、焦点和 data-state 却还在。
// 只认「装着锚点的」滚动：浮层自己里面的列表滚、页面上别的不相干的面板滚，都不关。
// 还要锚点真的被挪动了才关：scroll 事件晚一帧才派发，打开前那一下滚动（点之前 scrollIntoView、平滑滚动的尾巴）
// 的事件会落在打开之后；拿打开时锚点的位置当基准，没挪就不算。
import { useEffect, useEffectEvent, useRef, type Ref } from 'react'

/** 锚点挪动多少像素才算被滚走（亚像素的取整抖动不算）。 */
const MOVED_PX = 1

/** Returns a ref for the anchor; while `open`, scrolling the page or any container holding that anchor calls `close`. */
export function useScrollDismiss<T extends Element>(open: boolean, close: () => void, enabled = true) {
  const anchor = useRef<T | null>(null)
  const onClose = useEffectEvent(close)
  useEffect(() => {
    if (!open || !enabled) return
    const start = anchor.current?.getBoundingClientRect()
    const onScroll = (event: Event) => {
      const node = anchor.current
      if (!node?.isConnected || !start) return
      const target = event.target
      // 页面滚动时 target 是 document；元素滚动时是那个元素（scroll 不冒泡，所以在 document 上用捕获阶段收）。
      const container = target instanceof Document ? target.documentElement : target instanceof Element ? target : null
      if (!container?.contains(node)) return
      const now = node.getBoundingClientRect()
      if (Math.abs(now.top - start.top) > MOVED_PX || Math.abs(now.left - start.left) > MOVED_PX) onClose()
    }
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => document.removeEventListener('scroll', onScroll, { capture: true })
  }, [open, enabled])
  return anchor
}

/** 把节点交给一个 ref（函数或对象）；函数 ref 返回的清理函数原样带回。放在钩子外面，免得编译器把它当成改了只读值。 */
export function assignRef<T>(ref: Ref<T> | undefined, node: T | null): void | (() => void) {
  if (typeof ref === 'function') return ref(node)
  if (ref) ref.current = node
}

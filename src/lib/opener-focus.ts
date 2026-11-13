// SPDX-License-Identifier: MIT
import { useRef } from 'react'

/**
 * 关闭后把焦点还给打开前拿着焦点的元素（对话框、抽屉共用）。
 * Radix 的模态层关闭后只会聚焦它的 Trigger；我们的对话框、抽屉大多由代码打开、没有触发器，焦点就丢到 body 了。
 * 所以打开时记下当时拿着焦点的元素，关闭时还给它；调用方自己的 onCloseAutoFocus 先走，它 preventDefault 就不管。
 * 用法：把返回的两个处理函数放在 Content 的 props 之后（盖掉 props 里同名的，它们已经先调了调用方的）。
 */
export function useOpenerFocus({
  onOpenAutoFocus,
  onCloseAutoFocus,
}: {
  onOpenAutoFocus?: (event: Event) => void
  onCloseAutoFocus?: (event: Event) => void
}) {
  const opener = useRef<HTMLElement | null>(null)
  return {
    onOpenAutoFocus: (event: Event) => {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      onOpenAutoFocus?.(event)
    },
    onCloseAutoFocus: (event: Event) => {
      onCloseAutoFocus?.(event)
      if (event.defaultPrevented) return
      const target = opener.current
      if (target?.isConnected) {
        event.preventDefault()
        target.focus({ preventScroll: true })
      }
    },
  }
}

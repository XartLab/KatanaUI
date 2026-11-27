// SPDX-License-Identifier: MIT
import { useRef } from 'react'

/**
 * 打开时该记下的元素：拿着焦点的那个；是 body（或没有）就不记。
 * Safari 与 Mac 上的 Firefox 点按钮不给按钮焦点，打开时 activeElement 是 body；记了它，关闭时就会拦下 Radix 回触发器的那一步、
 * 再去聚焦一个聚焦不了的 body，焦点落到页面顶（KatanaUI #242）。不记时交给 Radix：有触发器回触发器。
 */
export function openerOf(active: Element | null, body: HTMLElement | null): HTMLElement | null {
  return active instanceof HTMLElement && active !== body ? active : null
}

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
      opener.current = openerOf(document.activeElement, document.body)
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

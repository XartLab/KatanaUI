// SPDX-License-Identifier: MIT
import { useEffect, useRef, useState, type PointerEvent } from 'react'

/**
 * 悬停开合：鼠标停在触发器上 openDelay 毫秒后开，离开触发器与弹层 closeDelay 毫秒后收。
 * Radix 的菜单、弹层没有「悬停打开」（Base UI 的 openOnHover 有），这里补一个：open、onOpenChange 接到 Root，
 * hover 摊在触发器和弹层内容两处（指针从触发器移进弹层时，进入内容会取消待收的计时）。
 * 触屏不触发（照 Base UI openOnHover 只管鼠标与笔）。数字由调用方给：参照 Base UI 的 delay / closeDelay，各处原来的值。
 */
export function useHoverOpen({ openDelay, closeDelay }: { openDelay: number; closeDelay: number }) {
  const [open, setOpen] = useState(false)
  /** 最近一次打开是不是悬停开的（关的时候不清，关闭时的焦点处理也要看它）：悬停开的菜单不该抢页面上正在用的焦点，调用方在 onOpenAutoFocus 里看它。 */
  const byHover = useRef(false)
  const previous = useRef<HTMLElement | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const clear = () => clearTimeout(timer.current)
  useEffect(() => clear, [])
  const schedule = (next: boolean, delay: number) => {
    clear()
    timer.current = setTimeout(() => {
      if (next) {
        byHover.current = true
        previous.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      }
      setOpen(next)
    }, delay)
  }
  const hover = {
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      if (open) clear()
      else schedule(true, openDelay)
    },
    onPointerLeave: (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      if (open) schedule(false, closeDelay)
      else clear()
    },
  }
  return {
    open,
    /** 接 Root 的 onOpenChange：Esc、点外面、选了项收起时清掉待办的计时。 */
    onOpenChange: (next: boolean) => {
      clear()
      if (next) byHover.current = false
      setOpen(next)
    },
    byHover,
    /**
     * 接菜单内容的 onCloseAutoFocus：悬停开的菜单收起时，焦点回到打开前的地方，而不是触发器。
     * Radix 的下拉菜单没有 onOpenAutoFocus，悬停打开时它仍会把焦点移进菜单，这里在收起时还回去。
     */
    onCloseAutoFocus: (event: Event) => {
      if (!byHover.current) return
      event.preventDefault()
      if (previous.current?.isConnected) previous.current.focus({ preventScroll: true })
    },
    hover,
  }
}

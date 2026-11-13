// SPDX-License-Identifier: MIT
// 悬停意图：指针停在上面一小会儿才算「想看」，路过不触发；离开也等一小会儿再收，给指针从触发处走到弹层上留时间。
// 来源：rare-ui 的 web-search 的行内引用（2026-11-14 读）里学到的行为——停 300ms 开、离开 150ms 收、键盘聚焦立即开；实现为本仓库原创。
import { useEffect, useRef, useState } from 'react'

export const HOVER_OPEN_MS = 300
export const HOVER_CLOSE_MS = 150

export function useHoverIntent(openDelay = HOVER_OPEN_MS, closeDelay = HOVER_CLOSE_MS) {
  const [active, setActive] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  /** 过 delay 毫秒后把状态设成 next；delay 为 0 立即设。再调一次会取消上一次还没到点的。 */
  const set = (next: boolean, delay: number) => {
    clearTimeout(timer.current)
    if (delay <= 0) setActive(next)
    else timer.current = setTimeout(() => setActive(next), delay)
  }
  return {
    active,
    set,
    /** 挂在触发处与弹层上。触屏没有悬停，不处理。 */
    hover: {
      onPointerEnter: (event: { pointerType: string }) => {
        if (event.pointerType !== 'touch') set(true, openDelay)
      },
      onPointerLeave: (event: { pointerType: string }) => {
        if (event.pointerType !== 'touch') set(false, closeDelay)
      },
    },
  }
}

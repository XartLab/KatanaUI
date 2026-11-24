// SPDX-License-Identifier: MIT
// 接近度悬停（#224，借 Jamie Merrill 的「基于接近度的悬停」交互，2026-11-24 看的录屏帧）：一块高亮底色在行间平滑滑动，
// 而不是逐行亮灭；指针划过行与行之间的缝、列表的上下内边时底色不灭，快速划过也不抖。
// 做法：一块绝对定位的底色元素（highlightRef）放在容器里，目标行有两个来源：指针最近的行（带迟滞）、没有指针时是「当前行」（activeSelector，
// 键盘高亮、cmdk 的 aria-selected 这类）。位置写成 translate 与 height（只动合成层属性），写在元素的 style 上，不走 React 状态，所以划得再快也不重渲染。
// 滑动的过渡写在 theme/proximity-highlight.css（产品不跟系统的「减少动态效果」，theme/motion.css 头部，所以不特判）。
// 菜单与列表也能用：容器要 position: relative 并且自己滚动（或不滚动），行用 itemSelector 认出来，底色元素放在容器里排第一个，行的自身底色改成透明。
import { useEffect, useRef, type RefObject } from 'react'

export type ProximityRect = { top: number; bottom: number }

export type NearestRowOptions = {
  /** Index of the row picked last time; kept while the pointer stays within `hysteresis` of its edges. */
  current?: number | null
  /** Pixels past the current row's edges in which it is kept. Defaults to 2. */
  hysteresis?: number
  /** Farthest distance in pixels from a row at which it is still picked. Defaults to 12. */
  reach?: number
}

/**
 * 指针 y 落在哪一行（纯函数，单测用）：y 在行里就是它；在行间缝里或容器内边里取最近的一行，离得超过 reach 算没有。
 * current 是上一次选中的行：y 离它的上下沿不超过 hysteresis 时继续选它，在相邻两行的交界处来回抖动时不换。
 */
export function nearestRow(
  rects: readonly ProximityRect[],
  y: number,
  { current, hysteresis = 2, reach = 12 }: NearestRowOptions = {},
): number | null {
  if (rects.length === 0) return null
  if (current != null) {
    const rect = rects[current]
    if (rect && y >= rect.top - hysteresis && y <= rect.bottom + hysteresis) {
      // 同时落在相邻行里（交界处）时仍留在当前行；只有离开了迟滞带才换。
      return current
    }
  }
  let best: number | null = null
  let bestDistance = Infinity
  rects.forEach((rect, index) => {
    const distance = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0
    if (distance < bestDistance) {
      best = index
      bestDistance = distance
    }
  })
  return bestDistance <= reach ? best : null
}

export type ProximityHighlightOptions = {
  /** CSS selector of the rows inside the container (for example `[cmdk-item]`). */
  itemSelector: string
  /** CSS selector of the current row when the pointer is away (keyboard highlight), for example `[cmdk-item][aria-selected="true"]`. */
  activeSelector?: string
  /** Turn the highlight off (rows keep their own background). Defaults to true. */
  enabled?: boolean
  /** Pixels past a row's edge in which the pointer still counts as on it, so the highlight does not flip back and forth at the seam. Defaults to 2. */
  hysteresis?: number
  /** Farthest distance in pixels from a row at which the pointer still picks it (the gap and padding around rows). Defaults to 12; ignored (0) when `activeSelector` is set, so the pointer row is always the row under the pointer. */
  reach?: number
}

/**
 * Slides one highlight element between rows following the pointer (nearest row, with hysteresis) or the active row.
 * Put the element returned as `highlightRef` inside the container (first child, `aria-hidden`), and make the container `position: relative`.
 * It writes `translate` and `height` straight to the element, and `data-visible` / `data-instant` for the stylesheet.
 */
export function useProximityHighlight<C extends HTMLElement = HTMLElement>(
  containerRef: RefObject<C | null>,
  { itemSelector, activeSelector, enabled = true, hysteresis = 2, reach = 12 }: ProximityHighlightOptions,
): { highlightRef: RefObject<HTMLDivElement | null> } {
  const highlightRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const container = containerRef.current
    const highlight = highlightRef.current
    if (!enabled || !container || !highlight) return
    let hovered: Element | null = null
    let frame = 0
    let shown = false

    // 禁用的行不亮：指针在它上面等于没有指针行，底色回到当前行（键盘高亮）。
    const isDisabled = (row: Element) => row.matches('[aria-disabled="true"], [data-disabled="true"]')
    const rows = () =>
      [...container.querySelectorAll<HTMLElement>(itemSelector)].filter((row) => !row.hidden && !isDisabled(row))
    const place = (row: HTMLElement | null) => {
      if (!row) {
        shown = false
        highlight.dataset.visible = 'false'
        return
      }
      const box = container.getBoundingClientRect()
      const rect = row.getBoundingClientRect()
      const top = rect.top - box.top + container.scrollTop
      if (!shown) {
        // 第一次出现：先在目标位置落下，不从旧位置（或 0）滑过来。
        highlight.dataset.instant = ''
        highlight.style.translate = `${rect.left - box.left}px ${top}px`
        highlight.style.height = `${rect.height}px`
        highlight.style.width = `${rect.width}px`
        highlight.dataset.visible = 'true'
        void highlight.offsetHeight
        delete highlight.dataset.instant
        shown = true
        return
      }
      highlight.style.translate = `${rect.left - box.left}px ${top}px`
      highlight.style.height = `${rect.height}px`
      highlight.style.width = `${rect.width}px`
      highlight.dataset.visible = 'true'
    }
    const target = (): HTMLElement | null => {
      if (hovered?.isConnected && !isDisabled(hovered)) return hovered as HTMLElement
      return activeSelector ? container.querySelector<HTMLElement>(activeSelector) : null
    }
    const update = () => {
      frame = 0
      place(target())
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      const list = rows()
      const index = nearestRow(
        list.map((row) => {
          const rect = row.getBoundingClientRect()
          return { top: rect.top, bottom: rect.bottom }
        }),
        event.clientY,
        // 有当前行（activeSelector）时，指针行必须就是指针底下那一行（reach 0）：列表在指针落到缝里时不会换当前行，
        // 底色要是停在「最近的行」上，回车选中的却是另一行。
        {
          current: hovered ? list.indexOf(hovered as HTMLElement) : null,
          hysteresis,
          reach: activeSelector ? 0 : reach,
        },
      )
      const next = index == null ? null : (list[index] ?? null)
      if (next === hovered) return
      hovered = next
      schedule()
    }
    const onPointerLeave = () => {
      hovered = null
      schedule()
    }
    // 键盘移动当前行、列表内容变了（行增删、重排）、容器大小变了：重算位置。
    // 当前行被键盘（或别的办法）换到了指针行以外的行：作废指针行，底色跟当前行走，不然高亮与回车选中的行不一致。
    const observer = new MutationObserver((records) => {
      if (activeSelector && hovered) {
        for (const record of records) {
          const row = record.target as Element
          if (record.type === 'attributes' && row !== hovered && row.matches(activeSelector)) hovered = null
        }
      }
      schedule()
    })
    observer.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['aria-selected', 'data-selected', 'hidden', 'data-highlighted'],
    })
    const resize = new ResizeObserver(schedule)
    resize.observe(container)
    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerleave', onPointerLeave)
    schedule()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      resize.disconnect()
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerleave', onPointerLeave)
      highlight.dataset.visible = 'false'
    }
  }, [containerRef, itemSelector, activeSelector, enabled, hysteresis, reach])
  return { highlightRef }
}

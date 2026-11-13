// SPDX-License-Identifier: MIT
// 原在应用的 src/ui/use-roving-toolbar.ts（#1869 搬进 blocks 的工具条）。
import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type RefObject } from 'react'

// 工具条的方向键：照 WAI-ARIA APG 的 Toolbar 模式做 roving tabindex。
// 出处：https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/ 与 https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
// （2026-10-22 读）。要点：整条只占一个 Tab 站（当前项 tabindex=0，其余 -1）；← → 在项间移动，Home / End 到头尾；
// 上次聚焦的项就是下次 Tab 进来落脚的项。APG 的 Toolbar 示例里 ← → 到头不环绕（环绕是可选），这里不环绕。
// 输入框 / 下拉框自己要用 ← → 移光标，APG 说明这类控件不参与方向键移动：它们不进 roving，保持自己的 Tab 站。
// 弹出菜单在 portal 里，不在工具条的 DOM 内，菜单里的方向键归菜单自己；菜单触发器（按钮）是普通的一项，
// ← → 还是工具条的移动，↓ 由菜单自己用来打开。

const ITEM = 'button, a[href], [role="button"], [role="checkbox"], [role="switch"]'

/** 工具条里参与 roving 的项：能聚焦的（没禁用、没藏起来）按钮类控件。 */
function rovingItems(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(ITEM)].filter(
    (node) =>
      !node.matches(':disabled, [aria-disabled="true"]') &&
      // 收起来的工具是 visibility:hidden，只量宽度用，不能聚焦
      getComputedStyle(node).visibility !== 'hidden' &&
      !node.closest('[hidden]'),
  )
}

/**
 * 给一个 role="toolbar" 的元素加方向键与单 Tab 站。返回要放到该元素上的 onKeyDown。
 * 项增减（工具折进 »、禁用状态变化）时自己重排 tabindex，用 MutationObserver，不要求调用方传项的列表。
 */
export function useRovingToolbar(ref: RefObject<HTMLElement | null>): { onKeyDown: (event: KeyboardEvent) => void } {
  // 当前的 Tab 站（上次聚焦的项）。
  const active = useRef<HTMLElement | null>(null)
  const apply = useRef(() => {})

  useLayoutEffect(() => {
    apply.current = () => {
      const root = ref.current
      if (!root) return
      const items = rovingItems(root)
      if (items.length === 0) return
      if (!active.current || !items.includes(active.current)) active.current = items[0]
      for (const item of items) {
        const wanted = item === active.current ? '0' : '-1'
        if (item.getAttribute('tabindex') !== wanted) item.setAttribute('tabindex', wanted)
      }
    }
    apply.current()
  })

  useEffect(() => {
    const root = ref.current
    if (!root) return
    // 只看子树增删与会改变可聚焦性的属性；自己改 tabindex 不在监听的属性里，不会自激。
    const observer = new MutationObserver(() => apply.current())
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'aria-disabled', 'hidden', 'class'],
    })
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      if (target.matches(ITEM) && rovingItems(root).includes(target)) {
        active.current = target
        apply.current()
      }
    }
    root.addEventListener('focusin', onFocusIn)
    return () => {
      observer.disconnect()
      root.removeEventListener('focusin', onFocusIn)
    }
  }, [ref])

  const onKeyDown = (event: KeyboardEvent) => {
    const root = ref.current
    const target = event.target as HTMLElement
    // React 的事件会穿过 portal 冒上来（菜单弹层不在工具条的 DOM 里）：只管工具条自己 DOM 里的项。
    if (!root || !root.contains(target) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const items = rovingItems(root)
    const index = items.indexOf(target)
    if (index < 0) return
    let next: number
    if (event.key === 'ArrowRight') next = Math.min(items.length - 1, index + 1)
    else if (event.key === 'ArrowLeft') next = Math.max(0, index - 1)
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = items.length - 1
    else return
    event.preventDefault()
    items[next].focus()
  }

  return { onKeyDown }
}

// SPDX-License-Identifier: MIT
// 文档站的性质测试（Bombadil，antithesishq/bombadil，MIT）：不写剧本，让它在文档站里乱点、乱按键、乱拖，
// 每一步都查下面这些性质。跟 e2e 互补：e2e 管「这几步的结果对不对」，这里管「随便怎么操作都不该出现的事」。
// 用法见 bombadil/README.md；只在夜间或手动跑，不进每个 PR 的快检。

import { always, next, now } from '@antithesishq/bombadil'
import { actions, extract, weighted, type ActionTemplate } from '@antithesishq/bombadil/browser'
import { isAction } from '@antithesishq/bombadil/actions'
import {
  clicks,
  inputs,
  lastAction,
  navigation,
  scroll,
  waitOnce,
} from '@antithesishq/bombadil/browser/defaults/actions'

// 默认性质：未捕获异常、未处理的 promise rejection、console.error、HTTP 4xx/5xx。
export {
  noConsoleErrors,
  noHttpErrorCodes,
  noUncaughtExceptions,
  noUnhandledPromiseRejections,
} from '@antithesishq/bombadil/browser/defaults/properties'

// —— 取状态 ——

// 页头主题切换按下的那一项，与根节点 data-theme 是否一致。
const theme = extract((state) => {
  const pressed = state.document.querySelector('[aria-label="主题"] [data-state="on"]')
  return {
    root: state.document.documentElement.dataset.theme ?? '',
    pressed: pressed?.textContent?.trim().toLowerCase() ?? null,
  }
})

// 活的演示区（预览与用法里的实时件）里，渲染出来的坏文字：格式化漏掉的 NaN、undefined、[object Object]。
// 代码块（pre/code/kbd）里的是文档，不算。
const brokenText = extract((state) => {
  const bad = /\bNaN\b|\bundefined\b|\[object Object\]/
  const roots = state.document.querySelectorAll('.gal-preview, [data-usage-live]')
  for (const root of roots) {
    const walker = state.document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? ''
      if (!bad.test(text)) continue
      if (node.parentElement?.closest('pre, code, kbd')) continue
      return text.trim().slice(0, 120)
    }
  }
  return null
})

// 整页横向溢出：哪个件把文档撑宽了。
const overflowX = extract((state) => {
  const width = state.document.documentElement.scrollWidth
  return width > state.window.innerWidth + 1 ? width : null
})

// 正在显示的浮层（弹出、菜单、下拉、提示、对话框）。
const OVERLAY =
  '[data-radix-popper-content-wrapper] > *, [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tooltip"]'
const overlays = extract((state) => {
  const out: { role: string; left: number; top: number; right: number; bottom: number }[] = []
  for (const element of state.document.querySelectorAll(OVERLAY)) {
    const rect = element.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    if (element.closest('.gal-nav')) continue
    // 正在退场的（data-state="closed"）不算：无头 Chrome 里退场动画可能停住，Radix 就一直挂着它。
    if (element.closest('[data-state="closed"]')) continue
    out.push({
      role: element.getAttribute('role') ?? element.tagName.toLowerCase(),
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
    })
  }
  return { list: out, width: state.window.innerWidth, height: state.window.innerHeight }
})

// 演示区的矩形，给拖拽用。
const preview = extract((state) => {
  const element = state.document.querySelector('.gal-preview')
  if (!element) return null
  const rect = element.getBoundingClientRect()
  const top = Math.max(rect.top, 0)
  const bottom = Math.min(rect.bottom, state.window.innerHeight)
  if (bottom - top < 20 || rect.width < 20) return null
  return { left: rect.left, top, right: rect.right, bottom }
})

// 焦点在不是文字输入的件上（按钮、滑块、选项卡、菜单项……），这时值得按方向键。
const focusOnControl = extract((state) => {
  const element = state.document.activeElement
  if (!element || element === state.document.body) return false
  if (element instanceof HTMLTextAreaElement) return false
  if (
    element instanceof HTMLInputElement &&
    element.type !== 'checkbox' &&
    element.type !== 'radio' &&
    element.type !== 'range'
  )
    return false
  return true
})

const inNav = extract((state) => {
  const element = state.document.querySelector('.gal-nav')
  if (!element) return null
  const rect = element.getBoundingClientRect()
  return { right: rect.right }
})

// —— 性质 ——

export const themeInSync = always(() => theme.current.pressed === null || theme.current.pressed === theme.current.root)

export const noBrokenText = always(() => brokenText.current === null)

export const noHorizontalOverflow = always(() => overflowX.current === null)

export const overlaysInViewport = always(() => {
  const { list, width, height } = overlays.current
  return list.every((o) => o.left >= -1 && o.top >= -1 && o.right <= width + 1 && o.bottom <= height + 1)
})

// 有浮层时按 Escape，下一个状态浮层要少一层（嵌套的只关最里面那层）。
function isEscape(action: unknown) {
  return (
    action !== null &&
    typeof action === 'object' &&
    'PressKey' in action &&
    (action as { PressKey: { code: number } }).PressKey.code === 27
  )
}
// 不算 tooltip：文档站有受控常开的演示（gallery/pages/open.tsx 的 `<Tooltip open>`），Escape 本来就关不掉它。
const dismissable = (list: { role: string }[]) => list.filter((o) => o.role !== 'tooltip').length
export const escapeClosesOverlay = always(() => {
  const open = dismissable(overlays.current.list)
  return now(() => open > 0).implies(
    next(() => !isEscape(lastAction.current) || dismissable(overlays.current.list) < open),
  )
})

// 不用 extras/resources 的泄漏性质：它读的是 GC 前的计数。2026-11-22 试跑报监听器 170 → 3400，
// 用 Playwright 强制 GC 后核对，换几轮页、切 20 次主题都稳在 300 上下，是误报。

// —— 动作 ——

// 侧栏只是换页，压低它的比重，把时间花在件本身上。
function clickX(action: ActionTemplate): number | null {
  if (!isAction(action, 'Click')) return null
  const x = action.Click.point.x
  return typeof x === 'number' ? x : null
}
const navClicks = clicks.filter((action) => {
  const x = clickX(action)
  return x !== null && inNav.current !== null && x <= inNav.current.right
})
const componentClicks = clicks.filter((action) => {
  const x = clickX(action)
  return x === null || inNav.current === null || x > inNav.current.right
})

// 键盘：方向键、Home/End、Enter、空格、Escape、Tab。
const keyboard = actions(() => {
  if (!focusOnControl.current) return []
  return [9, 13, 27, 32, 35, 36, 37, 38, 39, 40].map((code) => ({ PressKey: { code } }))
})

// 演示区里的拖拽：滑块、分隔条、刷选、图表平移。
const drags = actions(() => {
  const rect = preview.current
  if (!rect) return []
  const cx = (rect.left + rect.right) / 2
  const cy = (rect.top + rect.bottom) / 2
  const w = (rect.right - rect.left) / 3
  const h = (rect.bottom - rect.top) / 3
  const points = [
    [cx - w, cy],
    [cx, cy],
    [cx + w, cy],
    [cx, cy - h],
    [cx, cy + h],
  ]
  const out: ActionTemplate[] = []
  for (const [fx, fy] of points)
    for (const [tx, ty] of points) {
      if (fx === tx && fy === ty) continue
      out.push({ MouseDrag: { from: { x: fx, y: fy }, to: { x: tx, y: ty }, steps: [4, 12], delayMillis: [0, 20] } })
    }
  return out
})

export const docsSiteActions = weighted([
  [100, componentClicks],
  [8, navClicks],
  [60, keyboard],
  [40, drags],
  [60, inputs],
  [30, scroll],
  [5, navigation],
  [1, waitOnce],
])

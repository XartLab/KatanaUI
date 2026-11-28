// SPDX-License-Identifier: MIT
import type { KeyboardEvent } from 'react'

/**
 * 方向键在一组项之间走，跳过禁用的（#263 审计，2026-11-28 用户定：键盘手感以迁移前为准）。
 * Radix 的 roving focus 跳过禁用项、两头回绕、Home / End 到头尾；UI SDK 的页签与开关组让禁用项留在方向键的路上（aria-disabled 仍可聚焦），
 * 手风琴的标题之间则根本没有方向键。写在 onKeyDown 上：UI SDK 的 props 合并让后写的先跑、preventDefault 能让它自己的那份不再跑。
 */
export type RovingOptions = {
  /** 本组全部的项（含禁用的）。 */
  items: (root: HTMLElement) => HTMLElement[]
  /** 哪些方向键算「前 / 后」：horizontal 是 ←→，vertical 是 ↑↓，both 是四个都算（→↓ 向后）。 */
  axis: 'horizontal' | 'vertical' | 'both'
  /** 走到的项要不要顺手选中（页签的自动激活）。 */
  activate?: boolean
  /** 只在组里有禁用项时接管，其余照 UI SDK 自己的走；手风琴要全接管，传 false。 */
  onlyWhenDisabled?: boolean
}

const disabledItem = (el: HTMLElement) =>
  el.hasAttribute('disabled') || el.hasAttribute('data-disabled') || el.getAttribute('aria-disabled') === 'true'

const NEXT = { horizontal: ['ArrowRight'], vertical: ['ArrowDown'], both: ['ArrowRight', 'ArrowDown'] }
const PREV = { horizontal: ['ArrowLeft'], vertical: ['ArrowUp'], both: ['ArrowLeft', 'ArrowUp'] }

export const rovingKeys = (root: HTMLElement | null, event: KeyboardEvent<HTMLElement>, options: RovingOptions) => {
  if (!root || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  const { key } = event
  const forward = NEXT[options.axis].includes(key)
  const backward = PREV[options.axis].includes(key)
  if (!forward && !backward && key !== 'Home' && key !== 'End') return
  const all = options.items(root)
  if ((options.onlyWhenDisabled ?? true) && !all.some(disabledItem)) return
  const enabled = all.filter((el) => !disabledItem(el))
  const index = enabled.findIndex((el) => el === event.target || el.contains(event.target as Node))
  if (index < 0 || enabled.length === 0) return
  const target =
    key === 'Home'
      ? enabled[0]
      : key === 'End'
        ? enabled.at(-1)
        : enabled[(index + (forward ? 1 : -1) + enabled.length) % enabled.length]
  event.preventDefault()
  if (!target) return
  target.focus()
  if (options.activate && target.getAttribute('aria-selected') !== 'true') target.click()
}

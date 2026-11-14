// SPDX-License-Identifier: MIT
// 序列图共用的扫读：指针在图上移动，或键盘走，选中一格。功能参照 Arc 的 Revenue explorer 的 hover scrubber（uiarc.dev/components/blocks/revenue-explorer，
// 2026-11-14 读，只取功能），键位照 #1917 定的：←→ 一格，Shift+←→ 三格，Home / End 到头尾，Esc 清掉；实现原创。
// Shift 一次走 3 格：Arc 的 Revenue explorer 页面写明 Shift+arrow 一次走三个月（2026-11-14 读自 uiarc.dev）。没选中时按 ←→ 先落到最新一格（图表的习惯是从右边最新处读起）。
import { useState, type KeyboardEvent, type PointerEvent } from 'react'

export const SCRUB_BIG_STEP = 3

export type ScrubMode = 'point' | 'band'

/**
 * 键盘走一步：返回新的选中格；null 是清掉；undefined 是这个键不归它管（调用方不要 preventDefault，Esc 才能继续往外冒给对话框）。
 * 纯函数。
 */
export function scrubKey(index: number | null, count: number, key: string, shift: boolean): number | null | undefined {
  if (count <= 0) return undefined
  const last = count - 1
  if (key === 'Escape') return index === null ? undefined : null
  if (key === 'Home') return 0
  if (key === 'End') return last
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return undefined
  if (index === null) return last
  const step = (shift ? SCRUB_BIG_STEP : 1) * (key === 'ArrowLeft' ? -1 : 1)
  return Math.min(last, Math.max(0, index + step))
}

/**
 * 指针横坐标到格号。point：格是一个个点（折线），最近的点；band：格是一条条带（柱），落在哪条带里。宽为 0（还没排版）返回 null。纯函数。
 */
export function scrubIndexAt(x: number, width: number, count: number, mode: ScrubMode = 'point'): number | null {
  if (!(width > 0) || count <= 0) return null
  const ratio = Math.min(1, Math.max(0, x / width))
  if (mode === 'band') return Math.min(count - 1, Math.floor(ratio * count))
  return count === 1 ? 0 : Math.round(ratio * (count - 1))
}

export type UseScrubberOptions = {
  /** 一共几格。 */
  count: number
  mode?: ScrubMode
  /** 受控：给了就以它为准（几张图共用一个选中格时，上层持有）。 */
  index?: number | null
  onIndexChange?: (index: number | null) => void
}

export function useScrubber({ count, mode = 'point', index: controlled, onIndexChange }: UseScrubberOptions) {
  const [inner, setInner] = useState<number | null>(null)
  const raw = controlled !== undefined ? controlled : inner
  // 格数变少时选中格可能越界：渲染时就当没选中，不等 effect。
  const index = raw !== null && raw >= 0 && raw < count ? raw : null
  const set = (next: number | null) => {
    if (controlled === undefined) setInner(next)
    onIndexChange?.(next)
  }
  const pointer = {
    onPointerMove: (event: PointerEvent<Element>) => {
      const box = event.currentTarget.getBoundingClientRect()
      const next = scrubIndexAt(event.clientX - box.left, box.width, count, mode)
      if (next !== null && next !== index) set(next)
    },
    onPointerLeave: () => {
      if (index !== null) set(null)
    },
  }
  const keys = {
    tabIndex: 0,
    onKeyDown: (event: KeyboardEvent<Element>) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      const next = scrubKey(index, count, event.key, event.shiftKey)
      if (next === undefined) return
      event.preventDefault()
      set(next)
    },
    onBlur: () => {
      if (index !== null) set(null)
    },
  }
  return { index, set, pointer, keys, props: { ...pointer, ...keys } }
}

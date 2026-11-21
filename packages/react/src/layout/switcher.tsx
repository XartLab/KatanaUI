// SPDX-License-Identifier: MIT
// Switcher：一行放几块，容器窄于 threshold 时整体变成竖排（不是一块一块地往下掉：要么全在一行，要么全竖着）。只管位置与间距。
// 模式取自 Every Layout 的 Switcher（every-layout.dev/layouts/switcher，2026-11-21 读目录页；站点没写明代码许可证，只借模式，代码自己写）。
// 靠的是容器宽度而不是视口宽度：每块的 flex-basis 写成 (threshold - 100%) × 一个大数，容器比 threshold 宽时它是负数（按 0 算，几块平分一行），
// 窄时是个很大的正数（每块独占一行）。theme/layout.css 里写。
import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '../lib/cn.ts'
import { spaceVar, type LayoutTag, type SpaceStep } from './space.ts'

/** 容器窄于多少 px 时整体变竖排。待定：起始值，看 KATANAview 样板时量（#115 的实现决定第 4 条）。 */
export const SWITCHER_THRESHOLD = 480

export type SwitcherProps = HTMLAttributes<HTMLElement> & {
  /**
   * Container width in pixels below which all children stack.
   * 容器窄于它（px）时，所有子节点上下叠。
   */
  threshold?: number
  /**
   * Gap between children, a spacing step name.
   * 子节点之间的间距，取间距刻度名。
   */
  gap?: SpaceStep
  /**
   * Element to render.
   * 渲染成哪个元素。
   */
  as?: LayoutTag
}

export function Switcher({
  threshold = SWITCHER_THRESHOLD,
  gap = 'space-3',
  as: Tag = 'div',
  className,
  style,
  ...rest
}: SwitcherProps) {
  return (
    <Tag
      {...rest}
      className={cn('k-switcher', className)}
      style={{ ...style, '--k-gap': spaceVar(gap), '--k-threshold': `${threshold}px` } as CSSProperties}
    />
  )
}

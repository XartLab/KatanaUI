// SPDX-License-Identifier: MIT
// Sidebar：一窄一宽并排，放不下时上下叠。恰好两个子节点：side 是 'start' 时第一个是窄的，是 'end' 时最后一个是窄的；
// 窄的固定一个宽度，宽的拿走剩下的，宽的不够 contentMin 就整体叠成上下两块（不是挤成一条缝）。只管位置与间距。
// 模式取自 Every Layout 的 Sidebar（every-layout.dev/layouts/sidebar，2026-11-21 读目录页；站点没写明代码许可证，只借模式，代码自己写）。
import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '../lib/cn.ts'
import { spaceVar, type LayoutTag, type SpaceStep } from './space.ts'

/** 宽的那一块最少占容器的几成（0 到 1）。待定：起始值，看 KATANAview 样板时量（#115 的实现决定第 4 条）。 */
export const SIDEBAR_CONTENT_MIN = 0.5

/** 窄的那一块的默认宽度（px）。待定：起始值，看 KATANAview 样板时量；取 240 是照 KATANAview design/katana-console/project/layout.md「面板最小 240」，不是窄栏宽度的出处。 */
export const SIDEBAR_SIDE_WIDTH = 240

export type SidebarProps = HTMLAttributes<HTMLElement> & {
  /**
   * Which child is the narrow one: the first (start) or the last (end).
   * 哪一个子节点是窄的：第一个（start）还是最后一个（end）。
   */
  side?: 'start' | 'end'
  /**
   * Width of the narrow child: a spacing step name or a number of pixels.
   * 窄的那块的宽度：间距刻度名，或像素数（刻度最大 32，放不下一块侧栏，所以也收像素）。
   */
  sideWidth?: SpaceStep | number
  /**
   * Smallest share of the container the wide child keeps before the two stack (0 to 1).
   * 宽的那块最少占容器的几成（0 到 1），再少就上下叠。
   */
  contentMin?: number
  /**
   * Gap between the two children, a spacing step name.
   * 两块之间的间距，取间距刻度名。
   */
  gap?: SpaceStep
  /**
   * Element to render.
   * 渲染成哪个元素。
   */
  as?: LayoutTag
}

export function Sidebar({
  side = 'start',
  sideWidth = SIDEBAR_SIDE_WIDTH,
  contentMin = SIDEBAR_CONTENT_MIN,
  gap = 'space-3',
  as: Tag = 'div',
  className,
  style,
  ...rest
}: SidebarProps) {
  return (
    <Tag
      {...rest}
      className={cn('k-sidebar', className)}
      data-side={side}
      style={
        {
          ...style,
          '--k-gap': spaceVar(gap),
          '--k-side-width': typeof sideWidth === 'number' ? `${sideWidth}px` : spaceVar(sideWidth),
          '--k-content-min': `${contentMin * 100}%`,
        } as CSSProperties
      }
    />
  )
}

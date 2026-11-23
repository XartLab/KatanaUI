// SPDX-License-Identifier: MIT
// Reel：一行横向滚动（一排题材卡、一排报价卡），子节点不缩、不换行。滚动条照 KATANAview 已定的 4px、平时不可见，悬停或键盘聚焦时才显出来。
// 自己是可聚焦的滚动区（方向键能滚），所以要用 aria-label 给它一个名字。只管位置与间距。
// 模式取自 Every Layout 的 Reel（every-layout.dev/layouts/reel，2026-11-21 读目录页；站点没写明代码许可证，只借模式，代码自己写）。
import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '../lib/cn.ts'
import { spaceVar, type LayoutTag, type SpaceStep } from './space.ts'

export type ReelProps = HTMLAttributes<HTMLElement> & {
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

export function Reel({ gap = 'space-2', as: Tag = 'div', className, style, tabIndex = 0, ...rest }: ReelProps) {
  return (
    <Tag
      {...rest}
      tabIndex={tabIndex}
      className={cn('k-reel', className)}
      style={{ ...style, '--k-gap': spaceVar(gap) } as CSSProperties}
    />
  )
}

// SPDX-License-Identifier: MIT
// Stack：竖排，子节点之间留固定间距。只管位置与间距，不画边框、不带底色。
// 模式取自 Every Layout 的 Stack（every-layout.dev/layouts/stack，2026-11-21 读目录页；站点没写明代码许可证，只借「竖排加统一间距」这个模式，代码自己写）。
import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '../lib/cn.ts'
import { spaceVar, type LayoutTag, type SpaceStep } from './space.ts'

export type StackProps = HTMLAttributes<HTMLElement> & {
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

export function Stack({ gap = 'space-3', as: Tag = 'div', className, style, ...rest }: StackProps) {
  return (
    <Tag
      {...rest}
      className={cn('k-stack', className)}
      style={{ ...style, '--k-gap': spaceVar(gap) } as CSSProperties}
    />
  )
}

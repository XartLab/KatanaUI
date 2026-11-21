// SPDX-License-Identifier: MIT
// Cluster：横排、放不下就换行，行与行、块与块用同一个间距（一排标签、一排按钮、一排筛选芯片）。只管位置与间距。
// 模式取自 Every Layout 的 Cluster（every-layout.dev/layouts/cluster，2026-11-21 读目录页；站点没写明代码许可证，只借模式，代码自己写）。
import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '../lib/cn.ts'
import { spaceVar, type LayoutTag, type SpaceStep } from './space.ts'

export type ClusterProps = HTMLAttributes<HTMLElement> & {
  /**
   * Gap between children, both across and down, a spacing step name.
   * 块与块、行与行之间的间距，取间距刻度名。
   */
  gap?: SpaceStep
  /**
   * Cross-axis alignment of the children in a row.
   * 同一行里子节点的上下对齐。
   */
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch'
  /**
   * Main-axis distribution of the children in a row.
   * 同一行里子节点的左右分布。
   */
  justify?: 'start' | 'center' | 'end' | 'between'
  /**
   * Element to render.
   * 渲染成哪个元素。
   */
  as?: LayoutTag
}

export function Cluster({
  gap = 'space-3',
  align = 'center',
  justify = 'start',
  as: Tag = 'div',
  className,
  style,
  ...rest
}: ClusterProps) {
  return (
    <Tag
      {...rest}
      className={cn('k-cluster', className)}
      data-align={align}
      data-justify={justify}
      style={{ ...style, '--k-gap': spaceVar(gap) } as CSSProperties}
    />
  )
}

// SPDX-License-Identifier: MIT
// Grid：等宽格，每格至少 min 宽，放得下几列就几列（一排题材卡、一组指标卡）；最后一行不够也保持同宽。只管位置与间距。
// 模式取自 Every Layout 的 Grid（every-layout.dev/layouts/grid，2026-11-21 读目录页；站点没写明代码许可证，只借模式，代码自己写）。
import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '../lib/cn.ts'
import { spaceVar, type LayoutTag, type SpaceStep } from './space.ts'

/** 每格最小宽（px）：KATANAview design/katana-console/project/layout.md「面板最小 240 × 160」（读于 2026-11-21）。 */
export const GRID_MIN = 240

export type GridProps = HTMLAttributes<HTMLElement> & {
  /**
   * Smallest width of a cell in pixels; as many columns as fit are used.
   * 每格的最小宽（px），放得下几列就几列。
   */
  min?: number
  /**
   * Gap between cells, a spacing step name.
   * 格与格之间的间距，取间距刻度名。
   */
  gap?: SpaceStep
  /**
   * Element to render.
   * 渲染成哪个元素。
   */
  as?: LayoutTag
}

export function Grid({ min = GRID_MIN, gap = 'space-3', as: Tag = 'div', className, style, ...rest }: GridProps) {
  return (
    <Tag
      {...rest}
      className={cn('k-grid-layout', className)}
      style={{ ...style, '--k-gap': spaceVar(gap), '--k-grid-min': `${min}px` } as CSSProperties}
    />
  )
}

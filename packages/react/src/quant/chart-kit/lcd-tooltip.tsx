// SPDX-License-Identifier: MIT
// 图的 tooltip（dataviz.md §4）：一个 LCD 窗——bg-000 底、recess 凹陷、数值等宽（num）。叠在图上，位置由调用方定（left 百分比、top 像素）。
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type LcdTooltipRow = {
  key: string
  label: string
  value: ReactNode
  /** 标记色块（序列的颜色）；不给就不画。 */
  swatch?: string
}

export type LcdTooltipProps = {
  /** 标题行：日期、品种等。 */
  title?: ReactNode
  rows: readonly LcdTooltipRow[]
  style?: CSSProperties
  className?: string
  /** 靠哪一边放：框在锚点右边（默认）还是左边（锚点靠右时用）。 */
  side?: 'right' | 'left'
}

export function LcdTooltip({ title, rows, style, className, side = 'right' }: LcdTooltipProps) {
  return (
    <div className={cn('k-ck-tip', className)} data-slot="lcd-tooltip" data-side={side} style={style}>
      {title === undefined ? null : <div className="k-ck-tip-title">{title}</div>}
      {rows.map((row) => (
        <div key={row.key} className="k-ck-tip-row">
          {row.swatch === undefined ? null : <i className="k-ck-tip-swatch" style={{ background: row.swatch }} />}
          <span className="k-ck-tip-label">{row.label}</span>
          <span className="k-ck-tip-value">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

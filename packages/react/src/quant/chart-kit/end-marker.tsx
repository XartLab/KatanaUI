// SPDX-License-Identifier: MIT
// 末点 / 最优点 / 当前点（dataviz.md §3）：ink-100 的圆点（不发光），旁边标数值；其余点不标。HTML 叠层，位置由调用方定（left 百分比、top 像素）。
import type { CSSProperties } from 'react'
import { pct } from '../series-geometry.ts'

export type EndMarkerProps = {
  /** 横向位置（viewBox 里的 x，0..PLOT_W）。 */
  x: number
  /** 纵向位置（px，从图顶起）。 */
  y: number
  /** 旁标的数值；不给就只有点。 */
  value?: string
  /** 数值标在点的哪一边（靠右的点标在左边，免得出图）。 */
  side?: 'left' | 'right'
  style?: CSSProperties
}

export function EndMarker({ x, y, value, side = 'left', style }: EndMarkerProps) {
  return (
    <span className="k-ck-end" data-slot="end-marker" data-side={side} style={{ left: pct(x), top: Math.round(y), ...style }}>
      <i className="k-ck-end-dot" />
      {value === undefined ? null : <span className="k-ck-end-value">{value}</span>}
    </span>
  )
}

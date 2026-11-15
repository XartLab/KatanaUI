// SPDX-License-Identifier: MIT
import { skeletonWidths } from './loading-gate.ts'

/**
 * 骨架本身：bg-200 的点阵圆角条，不脉冲（安静）；读屏读 label（调用方传，包里不带文字）。出现的时机由 LoadingWait 管。
 * rows：撑满面板主体时每行占一个表格行高（样式里按 --row-base 排），行数是量出来的。皮肤在 ../theme/loading.css。
 * 搬自 src/ui/LoadingSkeleton.tsx（#1860）。
 */
export function Skeleton({
  label,
  lines,
  rows = false,
}: {
  /** What screen readers read (required). */
  label: string
  /** How many lines to draw. */
  lines: number
  /** Fill the panel body with one table row height per line. */
  rows?: boolean
}) {
  return (
    <div className={`k-loading${rows ? ' is-rows' : ''}`} role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {skeletonWidths(lines).map((width, i) => (
        <span key={i} className="k-loading-line" aria-hidden="true" style={{ width: `${width}%` }} />
      ))}
    </div>
  )
}

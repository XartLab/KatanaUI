// SPDX-License-Identifier: MIT
// 表格的格内排版（#92，接 #90）：代码芯片、芯片后的全称、数字后的单位小字、按 locale 缩写的数（K/M/B ↔ 万/亿）。
// DataGrid、QuoteTable、Watchlist、LimitLadder、EventCalendar 共用这一份，样式在 theme/cell-type.css；行高各表照旧，只换格内排版。
// 从 @katana-ui/react/quotes（与根出口）公开，应用自己的表也用这一份。
// 数值照 TradingView 选股器（#90 记录的 2026-11-18 实测：芯片 12px w600、面底、圆角 6、高 24；单位 10px w500 次要色，跟在数后空一格），只取版式，颜色是我们的语义 token。
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { formatCompactNumber, type CompactFormat } from '../lib/chart/format/index.ts'

/** Symbol code drawn as a chip (12px w600 on a subtle fill, radius 6, 24px high). */
export function CodeChip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('k-code-chip', className)}>{children}</span>
}

/** Full name after a code chip: body colour, truncated with an ellipsis. */
export function CodeName({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('k-code-name', className)}>{children}</span>
}

/**
 * A number followed by its unit in small secondary text (10px w500); a no-break space (U+00A0) sits between them so the unit never wraps onto its own line and copied text reads "4.53 T USD" (#250, kubai 007).
 * Without a unit the number is returned as is.
 */
export function UnitValue({ children, unit, className }: { children: ReactNode; unit?: string; className?: string }) {
  if (!unit) return children
  return (
    <span className={cn('k-num-value', className)}>
      {children}
      {'\u00a0'}
      <span className="k-num-unit">{unit}</span>
    </span>
  )
}

/** A number abbreviated by locale (en-US K/M/B/T; zh-CN 万/亿 written like `formatCnAmount`), with an optional small unit; not finite is an em dash. */
export function CompactValue({
  value,
  locale,
  digits,
  unit,
  className,
}: CompactFormat & { value: number | null | undefined; unit?: string; className?: string }) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const text = formatCompactNumber(value, { locale, digits })
  return (
    <UnitValue unit={unit} className={className}>
      {text}
    </UnitValue>
  )
}

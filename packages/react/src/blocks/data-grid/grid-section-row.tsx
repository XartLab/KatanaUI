// SPDX-License-Identifier: MIT
/**
 * Section header cell of DataGrid: collapse toggle, heading, row count and an optional in-section summary.
 * DataGrid 的分节标题格（#87 第 1 条，#22 G7）：收起 / 展开钮、标题、这一节的行数、可选的组内汇总（靠右）。
 * 照 TradingView 自选表的分节（主会话 2026-11-18 实看：标题行左端一个三角，点了收起这一节）；行数与汇总是 #22 G7 的建议，TradingView 的标题行上没有，待核对。
 * 钮不进 Tab 次序（表是一个复合控件，键盘在行上走：分节行上 → 展开、← 收起、Enter 切换），点它不算点行、不起拖。
 */
import { ChevronRightIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type GridSectionRowProps = {
  /** 标题（rowSection 的返回）。 */
  heading: ReactNode
  /** 这一节有几行（收没收起都算）。 */
  count: number
  /** 组内汇总；没给就不画。 */
  summary?: ReactNode
  collapsed: boolean
  onToggle: () => void
  /** 钮的读屏名：收起时念 expand，展开时念 collapse。 */
  labels: { collapse: string; expand: string }
  /** gridcell（可交互）或 cell。 */
  role: string
  /** 跨几列（可见列数）。 */
  colSpan: number
}

export function GridSectionRow({
  heading,
  count,
  summary,
  collapsed,
  onToggle,
  labels,
  role,
  colSpan,
}: GridSectionRowProps) {
  return (
    <div role={role} aria-colspan={colSpan} className="k-grid-section-cell" data-slot="grid-section-row">
      <button
        type="button"
        className="k-grid-section-toggle"
        aria-expanded={!collapsed}
        aria-label={collapsed ? labels.expand : labels.collapse}
        tabIndex={-1}
        data-no-drag=""
        onClick={(event) => {
          event.stopPropagation()
          onToggle()
        }}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <ChevronRightIcon size={12} aria-hidden="true" />
      </button>
      <span className="k-grid-section-heading">{heading}</span>
      <span className="k-grid-section-count" data-slot="grid-section-count">
        {count}
      </span>
      {summary === undefined || summary === null || summary === false ? null : (
        <span className="k-grid-section-summary" data-slot="grid-section-summary">
          {summary}
        </span>
      )}
    </div>
  )
}

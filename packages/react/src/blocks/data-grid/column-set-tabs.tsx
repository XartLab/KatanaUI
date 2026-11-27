// SPDX-License-Identifier: MIT
import { cn } from '../../lib/cn.ts'
import type { ColumnSet } from './column-picker.tsx'
import type { GridColumnLayout } from './data-grid-props.ts'
import { activeColumnSet, applyColumnSet } from './layout-model.ts'

// 列集标签行（选股器表上方的 Overview、Performance、Valuation…，主会话 2026-11-15 实测 tradingview.com/screener/）：一行页签，点一个就把表的列换成这一套。
// 与 ColumnPicker 里的列集芯片是同一份数据（ColumnSet）、同一个纯函数（applyColumnSet / activeColumnSet）：不存状态，哪个亮着由看得见的列恰好等于它的列推出来；
// 手动改过列之后没有一个页签亮着。放在表上方，右侧 children 留给刷新、全屏这类按钮。文字全由调用方传。

export type ColumnSetTabsProps = {
  layout: readonly GridColumnLayout[]
  onLayoutChange: (next: GridColumnLayout[]) => void
  sets: readonly ColumnSet[]
  /** 整行的读屏名。 */
  label: string
  /** 右侧的按钮位。 */
  children?: React.ReactNode
  className?: string
}

export function ColumnSetTabs({ layout, onLayoutChange, sets, label, children, className }: ColumnSetTabsProps) {
  const active = activeColumnSet(layout, sets)
  return (
    <div className={cn('k-cset', className)} data-slot="column-set-tabs">
      <div role="tablist" aria-label={label} className="k-cset-list">
        {sets.map((set) => (
          <button
            key={set.id}
            type="button"
            role="tab"
            aria-selected={set.id === active}
            data-set={set.id}
            className="k-cset-tab"
            onClick={() => onLayoutChange(applyColumnSet(layout, set.columns))}
          >
            {set.label}
          </button>
        ))}
      </div>
      {children ? <div className="k-cset-extra">{children}</div> : null}
    </div>
  )
}

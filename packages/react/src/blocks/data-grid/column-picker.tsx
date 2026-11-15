// SPDX-License-Identifier: MIT
import { Columns3, PlusIcon } from 'lucide-react'
import { ChipGroup } from '../../patterns/chip-group.tsx'
import { Button } from '../../primitives/button.tsx'
import { Checkbox } from '../../primitives/checkbox.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../../primitives/popover.tsx'
import type { GridColumnLayout } from './data-grid.tsx'
import { activeColumnSet, applyColumnSet, setColumnVisible } from './layout-model.ts'

// 列选择器（#27）：弹层里上面一组「列集」芯片（整套列一键切换），下面逐列勾选显隐。功能参照 TradingView 筛选器的 column sets
// （只取「命名的一套列、一键切换」这个概念，2026-11-15 读其帮助文档），实现原创。
// 不存状态：layout 受控，勾选与切列集都经 onLayoutChange 交给调用方；哪个列集亮着由看得见的列恰好等于它的列推出来。文案全由调用方传。

export type ColumnSet = { id: string; label: string; columns: readonly string[] }

export type ColumnPickerLabels = {
  /** 触发按钮上的字与读屏名。 */
  trigger: string
  /** 列集那一组的名字（芯片组的读屏名与小标题）。 */
  sets: string
  /** 勾选那一组的小标题。 */
  columns: string
}

export type ColumnPickerProps = {
  layout: readonly GridColumnLayout[]
  onLayoutChange: (next: GridColumnLayout[]) => void
  /** 列集；省略或空就只有勾选。 */
  sets?: readonly ColumnSet[]
  labels: ColumnPickerLabels
  /** 触发按钮只画图标（读屏名仍是 labels.trigger），用在表头最右的「+」位置。 */
  iconOnly?: boolean
  className?: string
}

export function ColumnPicker({ layout, onLayoutChange, sets = [], labels, iconOnly, className }: ColumnPickerProps) {
  const active = activeColumnSet(layout, sets)
  const shown = layout.filter((column) => column.visible).length
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size={iconOnly ? 'icon' : 'sm'}
          variant="ghost"
          className={className}
          aria-label={labels.trigger}
          title={iconOnly ? labels.trigger : undefined}
        >
          {iconOnly ? <PlusIcon aria-hidden="true" /> : <Columns3 aria-hidden="true" />}
          {iconOnly ? null : labels.trigger}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="k-colpick" aria-label={labels.trigger}>
        {sets.length > 0 && (
          <>
            <div className="k-colpick-heading">{labels.sets}</div>
            <ChipGroup
              label={labels.sets}
              selection="single"
              items={sets.map((set) => ({ value: set.id, label: set.label }))}
              value={active ? [active] : []}
              onValueChange={([next]) => {
                const set = sets.find((candidate) => candidate.id === next)
                if (set) onLayoutChange(applyColumnSet(layout, set.columns))
              }}
            />
          </>
        )}
        <div className="k-colpick-heading">{labels.columns}</div>
        <div className="k-colpick-list" role="group" aria-label={labels.columns}>
          {layout.map((column) => (
            <label key={column.id} className="k-colpick-item">
              <Checkbox
                checked={column.visible}
                disabled={column.visible && shown <= 1}
                onCheckedChange={(checked) => onLayoutChange(setColumnVisible(layout, column.id, checked === true))}
              />
              {column.label}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

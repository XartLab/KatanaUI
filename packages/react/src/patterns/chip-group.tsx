// SPDX-License-Identifier: MIT
import { X } from 'lucide-react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'
import { cn } from '../lib/cn'

// 功能参照 Arc Chip group（uiarc.dev，2026-11-14 读：分面筛选，一组可开关的小标签），实现原创；外观在 theme/chip-group.css。
// 用途：筛选器、自选分组的快速过滤。每个芯片是 aria-pressed 的开关（同包里分段切换的约定），整组 role=group；
// 行为底座是 Radix ToggleGroup（方向键在芯片间走，Tab 只停一个）。多选是默认；single 最多选一个，点已选的就取消（取消 = 不筛）。
// 文字全由调用方传（label、clearLabel、每个芯片的 label），数量由调用方算好传进来。

export type ChipItem = {
  value: string
  label: string
  /** 命中数：写在芯片右边，等宽数字。 */
  count?: number
  disabled?: boolean
}

export type ChipGroupProps = {
  items: readonly ChipItem[]
  /** 选中的 value（受控）。 */
  value: readonly string[]
  onValueChange: (value: string[]) => void
  /** 整组的读屏名。 */
  label: string
  /** multiple 可以选多个（默认）；single 最多一个。 */
  selection?: 'multiple' | 'single'
  /** 给了，有选中项时末尾出现一个清除钮，读屏名与 title 用它。 */
  clearLabel?: string
  className?: string
}

export function ChipGroup({
  items,
  value,
  onValueChange,
  label,
  selection = 'multiple',
  clearLabel,
  className,
}: ChipGroupProps) {
  return (
    <ToggleGroupPrimitive.Root
      type="multiple"
      role="group"
      aria-label={label}
      className={cn('k-chips', className)}
      value={[...value]}
      onValueChange={(next) => onValueChange(selection === 'single' ? next.filter((v) => !value.includes(v)) : next)}
    >
      {items.map((item) => (
        <ToggleGroupPrimitive.Item key={item.value} value={item.value} disabled={item.disabled} className="k-chip">
          <span>{item.label}</span>
          {item.count !== undefined && <span className="k-chip-count">{item.count}</span>}
        </ToggleGroupPrimitive.Item>
      ))}
      {clearLabel && value.length > 0 && (
        <button
          type="button"
          className="k-chip-clear"
          aria-label={clearLabel}
          title={clearLabel}
          onClick={() => onValueChange([])}
        >
          <X size={12} aria-hidden />
        </button>
      )}
    </ToggleGroupPrimitive.Root>
  )
}

// SPDX-License-Identifier: MIT
import { X } from 'lucide-react'
import { Toggle, ToggleGroup } from '@ui-sdk/react/toggle'
import { cn } from '../lib/cn.ts'
import { legacyState, part } from '../lib/legacy-attrs.ts'
import { rovingKeys } from '../lib/roving-keys.ts'

// 功能参照 Arc Chip group（uiarc.dev，2026-11-14 读：分面筛选，一组可开关的小标签），实现原创；外观在 theme/chip-group.css。
// 用途：筛选器、自选分组的快速过滤。每个芯片是 aria-pressed 的开关（同包里分段切换的约定），整组 role=group；
// 行为底座是 UI SDK 的 ToggleGroup（方向键在芯片间走，Tab 只停一个；#263 从 Radix 换来）。多选是默认；single 最多选一个，点已选的就取消（取消 = 不筛）。
// 文字全由调用方传（label、labels.clear、每个芯片的 label），数量由调用方算好传进来。

export type ChipItem = {
  value: string
  label: string
  /** 命中数：写在芯片右边，等宽数字。 */
  count?: number
  disabled?: boolean
}

/** Texts of ChipGroup (the package ships no text). */
export type ChipGroupLabels = {
  /** Given: a clear button appears at the end while something is selected; its accessible name and title. 清除钮的读屏名与 title。 */
  clear?: string
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
  /** Texts: clear (optional; no clear button without it). */
  labels?: ChipGroupLabels
  /** Old name of labels.clear, kept for one release. @deprecated Use labels.clear. */
  clearLabel?: string
  className?: string
}

/** Facet filter chips: each chip is an aria-pressed toggle; multiple (default) or single selection, optional clear button. */
export function ChipGroup({
  items,
  value,
  onValueChange,
  label,
  selection = 'multiple',
  labels,
  clearLabel: legacyClear,
  className,
}: ChipGroupProps) {
  const clearLabel = labels?.clear ?? legacyClear
  return (
    <ToggleGroup
      role="group"
      aria-label={label}
      className={cn('k-chips', className)}
      // 方向键跳过禁用的芯片（Radix 的 roving focus 这样走；UI SDK 的开关组让禁用项留在路上）。
      onKeyDown={(event) =>
        rovingKeys(event.currentTarget, event, {
          items: (root) => [...root.querySelectorAll<HTMLElement>('.k-chip')],
          axis: 'both',
        })
      }
      multiple={selection === 'multiple'}
      value={[...value]}
      onValueChange={(next) => onValueChange(selection === 'single' ? next.filter((v) => !value.includes(v)) : next)}
    >
      {items.map((item) => (
        <Toggle
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          render={part('button', { state: legacyState.pressed })}
          className="k-chip"
        >
          <span>{item.label}</span>
          {item.count !== undefined && <span className="k-chip-count">{item.count}</span>}
        </Toggle>
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
    </ToggleGroup>
  )
}

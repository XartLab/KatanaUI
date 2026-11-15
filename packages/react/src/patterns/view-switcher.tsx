// SPDX-License-Identifier: MIT
import { ChevronDownIcon, PlusIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu.tsx'

// 已保存的视图切换：标题位置的一个下拉（当前视图名加小箭头），列出已保存的视图，底部可选「另存为…」。
// 照 TradingView 选股器标题的「保存的筛选 / Untitled screen」与新闻流标题的「Full feed」下拉（主会话 2026-11-15 登录态实测），实现原创。
// 件不存视图：列表、当前项都由调用方传，选了调 onValueChange、另存调 onSave（名字、命名对话框与存哪都归调用方）。

export type ViewOption = { key: string; label: string }

export type ViewSwitcherProps = {
  views: readonly ViewOption[]
  value: string
  onValueChange: (key: string) => void
  /** 给了，列表底部多一项「另存为」（文字用 labels.save）。 */
  onSave?: () => void
  labels: {
    /** 整个下拉的读屏名。 */
    trigger: string
    save?: string
  }
  /** 触发器里放什么；不给就写当前视图的名。 */
  children?: ReactNode
  className?: string
}

export function ViewSwitcher({ views, value, onValueChange, onSave, labels, children, className }: ViewSwitcherProps) {
  const current = views.find((view) => view.key === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn('k-viewsw', className)}
          data-slot="view-switcher"
          aria-label={labels.trigger}
        >
          <span className="k-viewsw-name">{children ?? current?.label ?? ''}</span>
          <ChevronDownIcon size={14} aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {views.map((view) => (
            <DropdownMenuRadioItem key={view.key} value={view.key}>
              {view.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {onSave && labels.save ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onSave}>
              <PlusIcon aria-hidden="true" />
              {labels.save}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

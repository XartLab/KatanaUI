// SPDX-License-Identifier: MIT
// 改自 Arc split-button（https://github.com/kuratlielia/arc-library ，registry/components/split-button，MIT，Copyright (c) 2026 Elia Kuratli；
// 2026-11-23 读，提交 8302b52）。一个按钮两个动作：左半是主动作，右半的箭头开一份同类动作的菜单。
// 交易台里的用法：下单「买入 · 限价」加菜单（市价、条件单）；持仓「平仓」加菜单（平一半、反手）；顶栏「保存」加菜单（另存为、重命名）。
// TradingView 顶栏的「保存」与左侧画图工具条的分组按钮也是一半执行、一半开菜单（凭对其公开界面的了解，这次没有实测，待核对）；
// 画图工具条那种「菜单里选了谁，主按钮就换成谁」由调用方做：onSelect 里改 children 与 onClick，件不记。
// 相对原件：按钮用我们的 Button（颜色、尺寸、焦点环随它）；菜单用我们的 DropdownMenu（材质、入场动效、二级规矩随它）；
// 去掉主按钮字的逐字变形与宽度弹簧（Precision Instrument §2.4：只留直接反馈），留下「按主动作时整组一起缩」与「箭头开着时转 180°」。
// 加了：Alt+↓ 在主按钮上也开菜单（Windows 与 macOS 原生拆分按钮的键位）；菜单项可带快捷键提示；文字全由调用方传。
import { ChevronDown } from 'lucide-react'
import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { Button } from '../primitives/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu.tsx'

/** One entry of the menu half. */
export type SplitButtonAction = {
  /** Stable key of the entry. */
  key: string
  /** Text of the menu row. */
  label: string
  /** Called when the entry is chosen. */
  onSelect: () => void
  /** Icon before the label. */
  icon?: ReactNode
  /** Shortcut hint shown at the right edge of the row; display only, the caller binds the key. */
  shortcut?: string
  /** Grey the entry out. */
  disabled?: boolean
  /** Draw the entry in the danger color (close all, reverse). */
  danger?: boolean
}

/** Texts of SplitButton (the package ships no text). */
export type SplitButtonLabels = {
  /** Accessible name of the arrow half and of its menu, for example "More order types". */
  menu: string
}

export type SplitButtonProps = {
  /** Content of the main half. */
  children: ReactNode
  /** Called when the main half is pressed. */
  onClick: () => void
  /** Entries of the menu half, in order. */
  actions: readonly SplitButtonAction[]
  /** Texts: menu (required, names the arrow half). */
  labels: SplitButtonLabels
  /** Look of both halves: default, primary (solid) or danger. */
  variant?: 'default' | 'primary' | 'danger'
  /** Height of both halves: md is 30px (default), sm is 26px. */
  size?: 'sm' | 'md'
  /** Disable both halves. */
  disabled?: boolean
  /** Extra class name on the root. */
  className?: string
}

/** A main action and a menu of related actions in one control: the left half runs, the arrow half opens the menu. */
export function SplitButton({
  children,
  onClick,
  actions,
  labels,
  variant = 'default',
  size = 'md',
  disabled,
  className,
}: SplitButtonProps) {
  const [open, setOpen] = useState(false)
  // Alt+↓：原生拆分按钮的键位，焦点在主按钮上也能开菜单（Radix 的触发器只认自己身上的键）。
  const onMainKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.altKey && event.key === 'ArrowDown' && actions.length > 0) {
      event.preventDefault()
      setOpen(true)
    }
  }
  // 两半各自的按下缩放关掉（cn 里后写的 scale-100 压过 Button 的 0.97），整组在 split-button.css 里一起缩。
  const half = 'not-disabled:active:scale-100'
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <div data-slot="split-button" data-variant={variant} data-size={size} className={cn('k-split', className)}>
        <Button
          data-split-main=""
          variant={variant}
          size={size}
          disabled={disabled}
          aria-keyshortcuts={actions.length > 0 ? 'Alt+ArrowDown' : undefined}
          onClick={onClick}
          onKeyDown={onMainKeyDown}
          className={cn(half, 'rounded-r-none')}
        >
          {children}
        </Button>
        <DropdownMenuTrigger asChild disabled={disabled || actions.length === 0}>
          <Button
            data-split-menu=""
            variant={variant}
            size={size}
            aria-label={labels.menu}
            className={cn(half, 'k-split-menu rounded-l-none px-0')}
          >
            <ChevronDown aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent align="end" aria-label={labels.menu}>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.key}
            variant={action.danger ? 'danger' : 'default'}
            disabled={action.disabled}
            onSelect={action.onSelect}
          >
            {action.icon}
            {action.label}
            {action.shortcut ? <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

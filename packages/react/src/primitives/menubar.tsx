// SPDX-License-Identifier: MIT
// 改自 SmoothUI menubar（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { Menubar as MenubarPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRingInset } from '../lib/focus.ts'
import { OverlayPortal } from '../lib/overlay.tsx'
import { MENU_SIDE_OFFSET, menuContainerClass, menuRowClass, menuSeparatorClass } from './menu-parts.tsx'

// 菜单栏：一排顶层菜单（文件、视图…），方向键在它们之间走，一个开着时划到别的自动换开。菜单容器与行直接用下拉菜单那一套皮肤（menu-parts），
// 入场动效在 theme/sui-motion.css 与下拉菜单同一条 snappy 弹簧。行为底座是 Radix Menubar。
function Menubar({ className, ...props }: ComponentProps<typeof MenubarPrimitive.Root>) {
  return (
    <MenubarPrimitive.Root
      data-slot="menubar"
      className={cn(
        'flex h-[30px] items-center gap-0.5 rounded-[var(--radius-control)] border border-alpha-white-6 bg-surface-1 p-0.5',
        className,
      )}
      {...props}
    />
  )
}

function MenubarMenu({ ...props }: ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu {...props} />
}

function MenubarTrigger({ className, ...props }: ComponentProps<typeof MenubarPrimitive.Trigger>) {
  return (
    <MenubarPrimitive.Trigger
      data-slot="menubar-trigger"
      className={cn(
        'k-text-data inline-flex h-[24px] cursor-pointer items-center rounded-[var(--radius-md)] px-2 text-ink-2 select-none',
        'transition-colors duration-100 hover:bg-alpha-white-4 hover:text-ink data-[state=open]:bg-alpha-white-6 data-[state=open]:text-ink',
        focusRingInset,
        className,
      )}
      {...props}
    />
  )
}

function MenubarContent({
  className,
  sideOffset = MENU_SIDE_OFFSET,
  align = 'start',
  ...props
}: ComponentProps<typeof MenubarPrimitive.Content>) {
  return (
    <OverlayPortal portal={MenubarPrimitive.Portal}>
      <MenubarPrimitive.Content
        data-slot="menubar-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(menuContainerClass, className)}
        {...props}
      />
    </OverlayPortal>
  )
}

function MenubarItem({ className, ...props }: ComponentProps<typeof MenubarPrimitive.Item>) {
  return <MenubarPrimitive.Item data-slot="menubar-item" className={cn(menuRowClass, className)} {...props} />
}

function MenubarSeparator({ className, ...props }: ComponentProps<typeof MenubarPrimitive.Separator>) {
  return (
    <MenubarPrimitive.Separator
      data-slot="menubar-separator"
      className={cn(menuSeparatorClass, className)}
      {...props}
    />
  )
}

export { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator }

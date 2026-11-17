// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-11 用 `shadcn add` 生成（#1777），行为底座是 Radix；
// 拷进来以后归我们改：样子（尺寸、颜色、动效）按 OpenMarket 实测样式与我们的 token 重写（决策记录 0049）。
import { Popover as PopoverPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { OverlayPortal } from '../lib/overlay.tsx'
import { menuContainerClass } from './menu-parts.tsx'

// 弹层：跟菜单同一块材质（OpenMarket tb-interval-dropdown：圆角 overlay · 7% 白边 · 0 16 48 + 0 2 8 阴影）。三种皮肤，variant 选：
//   panel（默认）：宽 288 · 内边 12，放一小段说明、一组控件。
//   menu：就是菜单的容器（最小宽 180 · 内边 6 · 超高自己滚），应用里「弹出一列东西」的弹层用它，跟菜单一个样。
//   bare：不带皮肤，只有位置、层级与入场动效；外观全由调用方的类名给（快速换品种那种自带整套样式的浮层）。
function Popover({ ...props }: ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverClose({ ...props }: ComponentProps<typeof PopoverPrimitive.Close>) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />
}

const skin = {
  panel:
    'k-text-body z-50 w-72 rounded-[var(--radius-overlay)] border border-alpha-white-6 bg-surface-4 p-3 text-ink-2 outline-0 shadow-[var(--shadow-overlay)]',
  menu: menuContainerClass,
  bare: 'z-50 outline-0',
} as const

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  variant = 'panel',
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content> & {
  /** Skin of the popup. */
  variant?: keyof typeof skin
}) {
  return (
    <OverlayPortal portal={PopoverPrimitive.Portal}>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        data-variant={variant}
        align={align}
        sideOffset={sideOffset}
        className={cn(skin[variant], className)}
        {...props}
      />
    </OverlayPortal>
  )
}

function PopoverAnchor({ ...props }: ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

function PopoverHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="popover-header" className={cn('mb-2 flex flex-col gap-1', className)} {...props} />
}

function PopoverTitle({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="popover-title" className={cn('k-text-data text-ink', className)} {...props} />
}

function PopoverDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p data-slot="popover-description" className={cn('k-text-caption text-ink-3', className)} {...props} />
}

export {
  Popover,
  PopoverTrigger,
  PopoverClose,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
}

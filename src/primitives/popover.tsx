// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-11 用 `shadcn add` 生成（#1777），行为底座是 Radix；
// 拷进来以后归我们改：样子（尺寸、颜色、动效）按 OpenMarket 实测样式与我们的 token 重写（决策记录 0049）。
import { Popover as PopoverPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn'

// 弹层：跟菜单同一块材质（OpenMarket tb-interval-dropdown：圆角 overlay · 7% 白边 · 0 16 48 + 0 2 8 阴影），内边 12。
function Popover({ ...props }: ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'k-text-body z-50 w-72 rounded-[var(--radius-overlay)] border border-white/7 bg-surface-4 p-3 text-ink-2 outline-0',
          'shadow-[0_16px_48px_rgba(0,0,0,0.55),0_2px_8px_rgba(0,0,0,0.3)]',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
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

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverHeader, PopoverTitle, PopoverDescription }

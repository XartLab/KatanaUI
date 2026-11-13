// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-13 用 `shadcn add` 生成（#1796），行为底座是 Radix；
// 拷进来以后归我们改：样子照改前的皮肤（OpenMarket 实测，数值取自改前 src/ui/ui.css 的 .k-sel*）与我们的 token 重写（决策记录 0049）。
import { cva } from 'class-variance-authority'
import { ChevronDown } from 'lucide-react'
import { Select as SelectPrimitive } from 'radix-ui'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../lib/cn'
import { OverlayPortal } from '../lib/overlay'
import { focusRing } from '../lib/focus'

// 下拉：照 OpenMarket combo-box（2026-10-05 实测）。
// 触发 30 高 · 圆角 control · 2.4% 白底 · 9% 白边 · 字 12px 500 · 10px 箭头开时翻转；
// 列表 4px 内边 · 圆角 7 · 9% 白边 · 0 8 24 阴影，选项 6px 8px · 圆角 inner · 11px，悬停 5% 白，当前 9% 白 + 600，不打勾。
const selectTriggerVariants = cva([
  'k-text-data box-border inline-flex h-[30px] min-w-[120px] cursor-pointer items-center justify-between gap-1.5',
  'rounded-[var(--radius-control)] border border-alpha-white-8 bg-alpha-white-1 px-2 leading-none whitespace-nowrap text-ink',
  'transition-[background-color] duration-[120ms]',
  'disabled:cursor-not-allowed disabled:opacity-45',
  '[&_[data-slot=select-icon]]:transition-transform [&_[data-slot=select-icon]]:duration-150',
  'data-[state=open]:[&_[data-slot=select-icon]]:rotate-180',
  focusRing,
])

/** 触发器上的小箭头：单选与多选共用，开时翻转（触发器 data-state=open）。 */
function SelectArrow() {
  return (
    <span data-slot="select-icon" className="inline-flex text-ink-3">
      <ChevronDown className="size-[10px]" aria-hidden="true" />
    </span>
  )
}

const selectItemClass =
  'k-text-caption relative flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-inner)] px-2 py-1.5 leading-[1.4] whitespace-nowrap text-ink-3 outline-0 transition-[background-color] duration-[80ms] select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 data-[highlighted]:data-[state=unchecked]:bg-alpha-white-4 data-[state=checked]:bg-alpha-white-8 data-[state=checked]:font-semibold data-[state=checked]:text-ink'

function Select(props: ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root {...props} />
}

function SelectValue(props: ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger data-slot="select-trigger" className={cn(selectTriggerVariants(), className)} {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <SelectArrow />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

// 列表贴在触发器下面（popper 定位，sideOffset 2），不是 Radix 默认的「盖住当前项」：改前 Base UI 也是 alignItemWithTrigger=false。
function SelectContent({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <OverlayPortal portal={SelectPrimitive.Portal}>
      <SelectPrimitive.Content
        data-slot="select-content"
        position="popper"
        align="start"
        sideOffset={2}
        className={cn(
          'k-text-body z-50 box-border max-h-[min(var(--radix-select-content-available-height),calc(100dvh-16px))] min-w-[var(--radix-select-trigger-width)] overflow-y-auto rounded-[7px] border border-alpha-white-8 bg-surface-4 p-1 text-ink-2 shadow-[0_8px_24px_rgba(0,0,0,0.4)] outline-0',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </OverlayPortal>
  )
}

function SelectItem({
  className,
  leading,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item> & {
  /** 文字前面的东西（色带之类）；不进触发器上的值。 */
  leading?: ReactNode
}) {
  return (
    <SelectPrimitive.Item data-slot="select-item" className={cn(selectItemClass, className)} {...props}>
      {leading}
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

export {
  Select,
  SelectArrow,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  selectItemClass,
  selectTriggerVariants,
}

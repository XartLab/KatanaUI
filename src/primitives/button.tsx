// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-11 用 `shadcn add` 生成（#1777），行为底座是 Radix；
// 拷进来以后归我们改：样子（尺寸、颜色、动效）按 OpenMarket 实测样式与我们的 token 重写（决策记录 0049）。
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn'
import { focusRing } from '../lib/focus'

// 按钮：照 OpenMarket action-btn / tsc-add（2026-10-05 实测，数值照抄，颜色落到 token）。30 高 · 圆角 control · 4% 白底 8% 白边 · 12px 500；
// 主按钮实心浅色 + 深字 700；悬停提亮、按下再深一档并缩到 0.97（界面在听）。禁用不接指针事件之外的任何状态变化。
const buttonVariants = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap select-none',
    'k-text-data leading-none rounded-[var(--radius-control)] border border-white/8 bg-white/4 text-ink-2',
    'transition-[color,background-color,border-color,scale] duration-150 ease-out',
    'enabled:hover:bg-white/7 enabled:hover:text-ink enabled:active:scale-[0.97] enabled:active:bg-white/10',
    'disabled:cursor-not-allowed disabled:opacity-45',
    '[&_svg]:pointer-events-none [&_svg]:size-[13px] [&_svg]:shrink-0',
    focusRing,
  ],
  {
    variants: {
      variant: {
        default: '',
        primary:
          'border-transparent bg-ink font-bold text-surface-1 enabled:hover:bg-white enabled:hover:text-surface-0 enabled:active:bg-ink-2',
        danger:
          'border-[color-mix(in_srgb,var(--signal-red)_30%,transparent)] text-danger enabled:hover:bg-[color-mix(in_srgb,var(--signal-red)_8%,transparent)] enabled:hover:text-danger enabled:active:bg-[color-mix(in_srgb,var(--signal-red)_14%,transparent)]',
        ghost: 'border-transparent bg-transparent enabled:hover:bg-white/7',
        link: 'h-auto border-transparent bg-transparent px-1 py-0.5 font-normal text-ink-3 underline decoration-white/25 underline-offset-[3px] enabled:hover:bg-transparent enabled:hover:text-ink enabled:active:bg-transparent',
      },
      size: {
        default: 'h-[30px] px-3',
        sm: 'k-text-caption h-[26px] rounded-[var(--radius-control)] px-2 font-semibold',
        icon: 'size-7 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  type,
  ...props
}: ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      // 原生 button 默认是 submit；放进表单里误提交的坑比多写一个 type 大得多。
      type={asChild ? type : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }

// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-13 用 `shadcn add` 生成（#1796）；
// 拷进来以后归我们改：样子照改前的皮肤（OpenMarket 实测，数值取自改前 src/ui/ui.css 的 .k-in）与我们的 token 重写（决策记录 0049）。
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRingInset } from '../lib/focus.ts'

// 文本框：照 OpenMarket frame-margin-input（2026-10-05 实测）。30 高 · 圆角 6 · 4% 白底 8% 白边 · 13px · 数字等宽；
// 聚焦边框提亮到 22% 白，焦点环画在里面（全局焦点环的画法，#471）。sm 是 26 高、字 12px。
// multiline：给 textarea 用，高度由 rows、min-height 与调用方的类定；竖向内边距为 0 是改前的样子（调用方各自按需要加）。
const inputVariants = cva(
  [
    'k-text-body box-border w-full py-0 rounded-[6px] border border-alpha-white-7 bg-alpha-white-3 text-ink tabular-nums',
    'transition-[border-color] duration-[120ms] placeholder:text-ink-3 focus:border-alpha-white-12',
    'disabled:cursor-not-allowed disabled:opacity-45',
    focusRingInset,
  ],
  {
    variants: {
      /** Height: default is 30px, sm is 26px with the data type size. */
      size: {
        default: 'h-[30px] px-2',
        sm: 'h-[26px] px-1.5 [font-size:var(--text-data-size)]',
      },
      multiline: { true: 'h-auto px-2', false: '' },
    },
    defaultVariants: { size: 'default', multiline: false },
  },
)

function Input({
  className,
  size,
  ...props
}: Omit<ComponentProps<'input'>, 'size'> & Pick<VariantProps<typeof inputVariants>, 'size'>) {
  return (
    <input
      type="text"
      data-slot="input"
      data-size={size ?? 'default'}
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }

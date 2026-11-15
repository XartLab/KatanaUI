// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-14 用 `shadcn add` 生成（#1870），行为底座是 Radix；
// 拷进来以后归我们改：尺寸、颜色、动效按我们的 token 重写（决策记录 0049）。
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'

// 行内提示：嵌在页面里的一条说明（不是弹出的提示，那是 Toast）。底色 surface-2、7% 白边，左边一道 2px 的色条标语气；
// 里面第一个直接子元素是 svg 时当图标放左边，取跟色条一样的颜色。语气不能只靠颜色：标题或说明里要写字。
// role 默认按语气定：warn 与 danger 是 alert（读屏马上读），default 与 ok 是 status（等读屏空了再读）；动态出现的提示才需要它，页面里一直在的可以传 role="note"。
const alertVariants = cva(
  [
    'k-text-body relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-[var(--radius-control)] border border-alpha-white-6 border-l-2 bg-surface-2 px-3 py-2.5 text-ink-2',
    'has-[>svg]:grid-cols-[16px_1fr] has-[>svg]:gap-x-2.5 [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:text-current',
  ],
  {
    variants: {
      /** Color of the stripe and the icon. */
      tone: {
        default: 'border-l-alpha-white-12 [&>svg]:text-ink-3',
        ok: 'border-l-ok [&>svg]:text-ok',
        warn: 'border-l-(--signal-amber) [&>svg]:text-(--signal-amber)',
        danger: 'border-l-danger [&>svg]:text-danger',
      },
    },
    defaultVariants: { tone: 'default' },
  },
)

function Alert({ className, tone, role, ...props }: ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      data-tone={tone ?? 'default'}
      role={role ?? (tone === 'warn' || tone === 'danger' ? 'alert' : 'status')}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="alert-title" className={cn('col-start-2 min-h-4 font-semibold text-ink', className)} {...props} />
  )
}

function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn('k-text-data col-start-2 text-ink-2 [&_p]:leading-relaxed', className)}
      {...props}
    />
  )
}

export { Alert, AlertDescription, AlertTitle, alertVariants }

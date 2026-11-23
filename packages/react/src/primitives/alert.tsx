// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-14 用 `shadcn add` 生成（#1870），行为底座是 Radix；
// 拷进来以后归我们改：尺寸、颜色、动效按我们的 token 重写（决策记录 0049）。
import { cva } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import type { Severity } from '../lib/severity.ts'

// 行内提示：嵌在页面里的一条说明（不是弹出的提示，那是 Toast）。底色 surface-2、7% 白边，左边一道 2px 的色条标语气；
// 里面第一个直接子元素是 svg 时当图标放左边，取跟色条一样的颜色。语气不能只靠颜色：标题或说明里要写字。
// 语气 tone 是 Severity（neutral | ok | warn | danger，体检 §4；旧名 default 等于 neutral，留一个版本）；颜色读 --k-status-*。
// role 默认按语气定：warn 与 danger 是 alert（读屏马上读），neutral 与 ok 是 status（等读屏空了再读）；动态出现的提示才需要它，页面里一直在的可以传 role="note"。
const alertVariants = cva(
  [
    'k-text-body relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-[var(--radius-control)] border border-(color:--k-container-subtle-borderColor) border-l-2 bg-(--k-container-secondary-background) px-3 py-2.5 text-(color:--k-content-body-foreground)',
    'has-[>svg]:grid-cols-[16px_1fr] has-[>svg]:gap-x-2.5 [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:text-current',
  ],
  {
    variants: {
      /** Color of the stripe and the icon. */
      tone: {
        neutral:
          'border-l-(color:--k-status-neutral-bold-borderColor) [&>svg]:text-(color:--k-status-neutral-foreground)',
        ok: 'border-l-(color:--k-status-ok-foreground) [&>svg]:text-(color:--k-status-ok-foreground)',
        warn: 'border-l-(color:--k-status-warn-foreground) [&>svg]:text-(color:--k-status-warn-foreground)',
        danger: 'border-l-(color:--k-status-danger-foreground) [&>svg]:text-(color:--k-status-danger-foreground)',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

/** Maps the deprecated tone name ('default') to its Severity. */
const severityOf = (tone: Severity | 'default' | null | undefined): Severity =>
  tone == null || tone === 'default' ? 'neutral' : tone

function Alert({
  className,
  tone: toneProp,
  role,
  ...props
}: ComponentProps<'div'> & {
  /** Color of the stripe and the icon: neutral (default), ok, warn or danger. `'default'` is the deprecated name of neutral. */
  tone?: Severity | 'default' | null
}) {
  const tone = severityOf(toneProp)
  return (
    <div
      data-slot="alert"
      data-tone={tone}
      role={role ?? (tone === 'warn' || tone === 'danger' ? 'alert' : 'status')}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('col-start-2 min-h-4 font-semibold text-(color:--k-content-primary-foreground)', className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'k-text-data col-start-2 text-(color:--k-content-body-foreground) [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  )
}

export { Alert, AlertDescription, AlertTitle, alertVariants, severityOf }

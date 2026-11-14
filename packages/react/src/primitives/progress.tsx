// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-14 用 `shadcn add` 生成（#1870），行为底座是 Radix；
// 拷进来以后归我们改：尺寸、颜色、动效按我们的 token 重写（决策记录 0049）。
import { cva, type VariantProps } from 'class-variance-authority'
import { Progress as ProgressPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'

// 进度条：4 高的细条，底是 8% 白，填充走 snappy 弹簧（theme/motion.css）。不知道进度（value 不给或 null）是不确定态：一块来回滑的条。
// tone 只改填充的颜色：默认强调色，ok 绿，warn 琥珀，danger 红；颜色之外要让人知道状态时旁边写字。读屏要一个名字：调用方传 aria-label。
const indicatorVariants = cva('k-progress-fill h-full w-full', {
  variants: {
    tone: {
      default: 'bg-brand',
      ok: 'bg-ok',
      warn: 'bg-(--signal-amber)',
      danger: 'bg-danger',
    },
  },
  defaultVariants: { tone: 'default' },
})

function Progress({
  className,
  value,
  max = 100,
  tone,
  ...props
}: Omit<ComponentProps<typeof ProgressPrimitive.Root>, 'value'> & {
  /** 0 到 max；不给或 null 是不确定态。 */
  value?: number | null
} & VariantProps<typeof indicatorVariants>) {
  const percent = value == null ? null : Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value == null ? null : Math.min(max, Math.max(0, value))}
      max={max}
      className={cn('relative h-1 w-full overflow-hidden rounded-full bg-alpha-white-7', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={indicatorVariants({ tone })}
        style={percent === null ? undefined : { translate: `-${100 - percent}% 0` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }

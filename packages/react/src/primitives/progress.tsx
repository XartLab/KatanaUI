// SPDX-License-Identifier: MIT
// 起步代码取自 shadcn/ui（https://ui.shadcn.com ，MIT，Copyright (c) 2023 shadcn），2026-11-14 用 `shadcn add` 生成（#1870），行为底座是 Radix；
// 拷进来以后归我们改：尺寸、颜色、动效按我们的 token 重写（决策记录 0049）。
import { cva } from 'class-variance-authority'
import { Progress as ProgressRoot, ProgressIndicator } from '@ui-sdk/react/progress'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'
import type { Severity } from '../lib/severity.ts'
import { severityOf } from './alert.tsx'

// 进度条：4 高的细条，底是 8% 白，填充走 snappy 弹簧（theme/motion.css）。不知道进度（value 不给或 null）是不确定态：一块来回滑的条。
// tone 是 Severity（体检 §4；旧名 default 等于 neutral），只改填充的颜色：neutral 亮中性，ok 绿，warn 琥珀，danger 红；颜色之外要让人知道状态时旁边写字。读屏要一个名字：调用方传 aria-label。
const indicatorVariants = cva('k-progress-fill h-full w-full', {
  variants: {
    /** Only changes the fill color; do not rely on color alone for status, write text beside it. */
    tone: {
      neutral: 'bg-(--k-status-neutral-bold-background)',
      ok: 'bg-(--k-status-ok-foreground)',
      warn: 'bg-(--k-status-warn-foreground)',
      danger: 'bg-(--k-status-danger-foreground)',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

function Progress({
  className,
  value,
  max = 100,
  tone,
  ...props
}: Omit<ComponentProps<typeof ProgressRoot>, 'value'> & {
  /**
   * Fill color: neutral (default), ok, warn or danger. Only changes the fill; do not rely on color alone for status, write text beside it.
   * `'default'` is the deprecated name of neutral.
   */
  tone?: Severity | 'default' | null
  /**
   * From 0 to max; omitted or null is the indeterminate state.
   * 0 到 max；不给或 null 是不确定态。
   */
  value?: number | null
}) {
  return (
    <ProgressRoot
      data-slot="progress"
      value={value == null ? null : Math.min(max, Math.max(0, value))}
      max={max}
      className={cn('relative h-1 w-full overflow-hidden rounded-full bg-(--k-container-track-background)', className)}
      {...props}
    >
      <ProgressIndicator data-slot="progress-indicator" className={indicatorVariants({ tone: severityOf(tone) })} />
    </ProgressRoot>
  )
}

export { Progress }

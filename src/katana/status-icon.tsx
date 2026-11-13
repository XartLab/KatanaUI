// SPDX-License-Identifier: AGPL-3.0-only
// 状态图标：提示条里的成功、失败、警告、说明、进行中。换状态时旧图标缩小退出、新图标弹入，对勾与叉是一笔一笔画出来的。
// 交互学自 rare-ui 的 toast（2026-11-14 读），实现为本仓库原创，未复制其代码。
// 学到的事实（只取行为）：① 笔画用 pathLength 从 0 画到 1，叉的两笔错开一点；② 进行中是一圈转动的弧，结果回来时它先退出、结果图标再进（不同时挤在一起）；
// ③ 失败、警告的图标不靠颜色单独表达，形状也不同。
// 不学：它的 squircle 外框与 sonner 依赖（提示条的外壳是应用自己的 AlertToasts）。
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../lib/cn'
import { snappy } from '../lib/motion'
import { unit } from '../lib/spring'

export type StatusIconStatus = 'success' | 'error' | 'warning' | 'info' | 'pending'

const TONE: Record<StatusIconStatus, string> = {
  success: 'text-[var(--signal-green)]',
  error: 'text-[var(--signal-red)]',
  warning: 'text-[var(--signal-amber)]',
  info: 'text-[var(--signal-blue)]',
  pending: 'text-ink-3',
}

const draw = { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: unit(snappy) }

function Glyph({ status }: { status: StatusIconStatus }) {
  switch (status) {
    case 'success':
      return <motion.path d="M5 12.5 10 17.5 19 7" {...draw} />
    case 'error':
      return (
        <>
          <motion.path d="M7 7 17 17" {...draw} />
          <motion.path d="M17 7 7 17" {...draw} transition={{ ...draw.transition, delay: 0.06 }} />
        </>
      )
    case 'warning':
      return (
        <>
          <motion.path d="M12 5v9" {...draw} />
          <circle cx={12} cy={18.5} r={1.4} fill="currentColor" stroke="none" />
        </>
      )
    case 'info':
      return (
        <>
          <circle cx={12} cy={6} r={1.4} fill="currentColor" stroke="none" />
          <motion.path d="M12 10.5v8.5" {...draw} />
        </>
      )
    case 'pending':
      return (
        <g className="k-status-spin">
          <circle cx={12} cy={12} r={8} strokeOpacity={0.25} />
          <path d="M12 4a8 8 0 0 1 8 8" />
        </g>
      )
  }
}

export function StatusIcon({
  status,
  label,
  className,
}: {
  status: StatusIconStatus
  /** 读屏名（必填）：只靠颜色与形状不够，读屏要听到状态。旁边已经有文字写明了状态时传空串，图标就当装饰、对读屏隐藏。 */
  label: string
  className?: string
}) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      data-slot="status-icon"
      data-status={status}
      className={cn('relative inline-block size-4 flex-none', TONE[status], className)}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.svg
          key={status}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute inset-0 size-full"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={unit(snappy)}
        >
          <Glyph status={status} />
        </motion.svg>
      </AnimatePresence>
    </span>
  )
}

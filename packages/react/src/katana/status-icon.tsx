// SPDX-License-Identifier: MIT
// 状态图标：提示条里的成功、失败、警告、说明、进行中。换状态时旧图标缩小退出、新图标弹入，对勾与叉是一笔一笔画出来的。
// 交互学自 rare-ui 的 toast（2026-11-14 读），实现为本仓库原创，未复制其代码。
// 学到的事实（只取行为）：① 笔画用 pathLength 从 0 画到 1，叉的两笔错开一点；② 进行中是一圈转动的弧，结果回来时它先退出、结果图标再进（不同时挤在一起）；
// ③ 失败、警告的图标不靠颜色单独表达，形状也不同。
// 不学：它的 squircle 外框与 sonner 依赖（提示条的外壳是应用自己的 AlertToasts）。
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../lib/cn.ts'
import { snappy } from '../lib/motion.ts'
import type { Severity } from '../lib/severity.ts'
import { unit } from '../lib/spring.ts'

// G3：语气改成 tone（lib/severity.ts 的 Severity 四档，加说明 info 与进行中 pending），颜色只读 --k-status-*；
// 旧的 status（success/error/warning/info/pending）留一个版本作兼容，映射到 ok/danger/warn/info/pending。neutral 画说明的字形、用中性色。

/** Tone of a status icon: a Severity, info (blue, an explanation) or pending (a spinning arc). */
export type StatusIconTone = Severity | 'info' | 'pending'

/**

 * Old name kept for one release.

 * @deprecated Use StatusIconTone: success → ok, error → danger, warning → warn.

 */
export type StatusIconStatus = 'success' | 'error' | 'warning' | 'info' | 'pending'

const FROM_STATUS: Record<StatusIconStatus, StatusIconTone> = {
  success: 'ok',
  error: 'danger',
  warning: 'warn',
  info: 'info',
  pending: 'pending',
}

const COLOR: Record<StatusIconTone, string> = {
  ok: 'text-(color:--k-status-ok-foreground)',
  danger: 'text-(color:--k-status-danger-foreground)',
  warn: 'text-(color:--k-status-warn-foreground)',
  info: 'text-(color:--k-status-info-foreground)',
  neutral: 'text-(color:--k-status-neutral-foreground)',
  pending: 'text-(color:--k-content-secondary-foreground)',
}

type Glyph = 'ok' | 'danger' | 'warn' | 'info' | 'pending'
const GLYPH: Record<StatusIconTone, Glyph> = {
  ok: 'ok',
  danger: 'danger',
  warn: 'warn',
  info: 'info',
  neutral: 'info',
  pending: 'pending',
}

const draw = { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: unit(snappy) }

function Glyph({ glyph }: { glyph: Glyph }) {
  switch (glyph) {
    case 'ok':
      return <motion.path d="M5 12.5 10 17.5 19 7" {...draw} />
    case 'danger':
      return (
        <>
          <motion.path d="M7 7 17 17" {...draw} />
          <motion.path d="M17 7 7 17" {...draw} transition={{ ...draw.transition, delay: 0.06 }} />
        </>
      )
    case 'warn':
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
  tone,
  status,
  label,
  className,
}: {
  /**
   * Tone: ok, warn, danger, neutral, info, or pending (a spinning arc). Required unless the deprecated status is given.
   * 语气：ok、warn、danger、neutral（说明字形、中性色）、info（说明、蓝）、pending（转圈）。
   */
  tone?: StatusIconTone
  /**
   * Old name kept for one release.
   * @deprecated Use tone (success → ok, error → danger, warning → warn).
   */
  status?: StatusIconStatus
  /**
   * Accessible name (required): color and shape alone are not enough. Pass an empty string when text next to it states the status, and the icon becomes decorative.
   * 读屏名（必填）：只靠颜色与形状不够，读屏要听到状态。旁边已经有文字写明了状态时传空串，图标就当装饰、对读屏隐藏。
   */
  label: string
  /** Extra class name on the icon. */
  className?: string
}) {
  const resolved: StatusIconTone = tone ?? (status ? FROM_STATUS[status] : 'pending')
  const glyph = GLYPH[resolved]
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      data-slot="status-icon"
      data-tone={resolved}
      className={cn('relative inline-block size-4 flex-none', COLOR[resolved], className)}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.svg
          key={glyph}
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
          <Glyph glyph={glyph} />
        </motion.svg>
      </AnimatePresence>
    </span>
  )
}

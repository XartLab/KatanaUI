// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-context-meter（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 上下文窗口用掉了多少：一个小环加「已用/总量」；越过警告线环变琥珀、越过危险线变红，几何不变，靠色相说话。
// 悬停、聚焦或点按弹出分项（什么在占窗口）。
// 相对原件：读屏名由调用方传（原件拼英文）；颜色走 --signal-amber / --signal-red；弹簧取 snappy；去掉 reduced-motion 分支；弹层放在上方，贴着触发器。
import { AnimatePresence, motion } from 'motion/react'
import { useId, useState } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'
import { snappy } from '../lib/motion.ts'
import { unit } from '../lib/spring.ts'
import {
  contextFraction,
  contextLevel,
  DEFAULT_DANGER_AT,
  DEFAULT_WARNING_AT,
  formatTokenCount,
  type ContextLevel,
} from './ai-context-model.ts'

const VIEWBOX = 32
const CENTER = VIEWBOX / 2
const RADIUS = 13
const STROKE_WIDTH = 3

const LEVEL_COLOR: Readonly<Record<ContextLevel, string>> = {
  ok: 'currentColor',
  warning: 'var(--signal-amber)',
  danger: 'var(--signal-red)',
}

export type AiContextBreakdownItem = {
  label: string
  tokens: number
}

export type AiContextMeterProps = {
  /** Tokens currently used. */
  used: number
  /** Total size of the context window in tokens. */
  limit: number
  /**
   * Accessible name (required), such as "Context 62% used, 79k of 128k tokens".
   * 读屏名（必填），如「上下文已用 62%，79k / 128k」。
   */
  label: string
  /** Optional split of what is filling the window; makes the meter open a popover. */
  breakdown?: readonly AiContextBreakdownItem[]
  /** Fraction at which the ring turns amber. */
  warningAt?: number
  /** Fraction at which the ring turns red. */
  dangerAt?: number
  /** Extra class name on the root. */
  className?: string
}

export function AiContextMeter({
  used,
  limit,
  label,
  breakdown,
  warningAt = DEFAULT_WARNING_AT,
  dangerAt = DEFAULT_DANGER_AT,
  className,
}: AiContextMeterProps) {
  const panelId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const fraction = contextFraction(used, limit)
  const level = contextLevel(fraction, warningAt, dangerAt)
  const hasBreakdown = Boolean(breakdown?.length)
  return (
    <div data-slot="ai-context-meter" data-level={level} className={cn('relative inline-block', className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={hasBreakdown ? isOpen : undefined}
        aria-controls={hasBreakdown ? panelId : undefined}
        disabled={!hasBreakdown}
        onClick={() => setIsOpen((current) => !current)}
        onPointerEnter={() => hasBreakdown && setIsOpen(true)}
        onPointerLeave={() => setIsOpen(false)}
        onFocus={(event) => hasBreakdown && event.target.matches(':focus-visible') && setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className={cn(
          'k-text-caption flex items-center gap-1.5 rounded-[var(--radius-control)] px-1 py-0.5 text-ink-3 enabled:cursor-pointer',
          'transition-colors duration-[120ms] enabled:hover:text-ink',
          focusRing,
        )}
      >
        <svg aria-hidden="true" viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="size-4 -rotate-90">
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.2}
            strokeWidth={STROKE_WIDTH}
          />
          {/* pathLength 把虚线算术归一：填充就是占比本身，不用算周长。 */}
          <circle
            data-slot="ai-context-ring"
            className="transition-[stroke,stroke-dasharray] duration-[var(--dur-snappy)] ease-[var(--ease-snappy)]"
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            pathLength={1}
            strokeLinecap="round"
            strokeWidth={STROKE_WIDTH}
            style={{ stroke: LEVEL_COLOR[level], strokeDasharray: `${fraction} ${1 - fraction}` }}
          />
        </svg>
        <span className="tabular-nums" data-slot="ai-context-readout">
          {formatTokenCount(used)}/{formatTokenCount(limit)}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && hasBreakdown ? (
          <motion.div
            id={panelId}
            role="group"
            data-slot="ai-context-breakdown"
            className="absolute bottom-full left-0 z-50 mb-1.5 w-56 rounded-[var(--radius-overlay)] border border-alpha-white-6 bg-surface-4 p-2.5 shadow-[var(--shadow-overlay)]"
            style={{ transformOrigin: 'bottom left' }}
            initial={{ opacity: 0, scale: 0.96, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={unit(snappy)}
          >
            <ul className="m-0 list-none space-y-1 p-0">
              {breakdown?.map((item) => (
                <li key={item.label} className="k-text-caption flex items-baseline justify-between gap-3">
                  <span className="truncate text-ink-3">{item.label}</span>
                  <span className="shrink-0 text-ink tabular-nums">{formatTokenCount(item.tokens)}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

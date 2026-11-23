// SPDX-License-Identifier: MIT
// 改自 SmoothUI animated-list（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 信息流的进场件：新条目从上方弹性插入、其余条目被挤着下移（layout 动画），超出 maxVisible 的老条目淡出；新条目带 live.css 的高亮（k-live-enter）。
// 与原件的差别：① 不自带「定时喂条目」的 feed 模式，条目由调用方推（新闻流、成交回报），items 按显示顺序从上到下给；
// ② 新增悬停暂停：鼠标停在列表上时新来的条目先攒着、不往下挤（读新闻的人正在看某一条），移开后一次放进来，攒了几条可经 pendingLabel 提示；
// ③ 递减（越旧越淡越小）是可选的 recede，默认关，因为信息流要让每一条都读得清。
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

// 弹簧参数来自 SmoothUI animated-list：bounce 0.1、0.25 秒。
const ENTER_SPRING = { type: 'spring' as const, bounce: 0.1, duration: 0.25 }
// 间隔进场的延迟步长与上限（一次来好几条时依次落下，不是同时砸下来）。
const STAGGER_STEP = 0.05
const MAX_STAGGER = 0.3
// 递减：每往下一位，透明度降 0.18、缩放降 0.05，各有下限（来自原件）。
const RECEDE_OPACITY_STEP = 0.18
const RECEDE_SCALE_STEP = 0.05
const MIN_RECEDE_OPACITY = 0.35
const MIN_RECEDE_SCALE = 0.85
const ENTER_OFFSET = 14

export type AnimatedListItem = {
  /** Stable id; a new id enters with the spring, a removed one fades out. */
  id: string
  /** What the row shows. */
  content: ReactNode
  /** Accessible name of the row button; required when the list has onItemClick. */
  label?: string
}

export type AnimatedListProps = {
  /** Rows from top to bottom; the list animates whatever changes between renders. */
  items: readonly AnimatedListItem[]
  /** Accessible name of the whole list. */
  label: string
  /** Show at most this many rows; the rest are dropped from the bottom (default: all). */
  maxVisible?: number
  /** Where new rows come from: top slides down, bottom slides up. */
  enterFrom?: 'top' | 'bottom'
  /** Older rows get smaller and fainter the further down they are. */
  recede?: boolean
  /** Delay between rows that arrive in the same frame, in seconds. */
  stagger?: number
  /** Flash the left accent on rows that arrived after the first render. */
  highlightNew?: boolean
  /** Hold back new rows while the pointer is over the list; they enter when it leaves. */
  pauseOnHover?: boolean
  /** Text of the "n waiting" chip shown while rows are held back; no chip when omitted. */
  pendingLabel?: (count: number) => string
  /** Makes every row a button. */
  onItemClick?: (id: string) => void
  /** Extra class name on the root. */
  className?: string
}

export function AnimatedList({
  items,
  label,
  maxVisible,
  enterFrom = 'top',
  recede = false,
  stagger = STAGGER_STEP,
  highlightNew = true,
  pauseOnHover = true,
  pendingLabel,
  onItemClick,
  className,
}: AnimatedListProps) {
  // 第一次渲染就在的条目不算「新」，不高亮。
  const [initialIds] = useState(() => new Set(items.map((item) => item.id)))
  const [frozen, setFrozen] = useState<readonly string[] | null>(null)
  const shown = frozen === null ? items : items.filter((item) => frozen.includes(item.id))
  const pending = frozen === null ? 0 : items.filter((item) => !frozen.includes(item.id)).length
  const rows = maxVisible === undefined ? shown : shown.slice(0, maxVisible)
  const enterY = enterFrom === 'top' ? -ENTER_OFFSET : ENTER_OFFSET
  return (
    <div
      className={cn('relative flex flex-col gap-(--space-2)', className)}
      onMouseEnter={pauseOnHover ? () => setFrozen(items.map((item) => item.id)) : undefined}
      onMouseLeave={pauseOnHover ? () => setFrozen(null) : undefined}
      data-slot="animated-list"
      data-pending={pending}
    >
      {pendingLabel && pending > 0 && (
        <span
          role="status"
          data-slot="animated-list-pending"
          className="k-text-micro self-center rounded-[var(--radius-pill)] bg-surface-3 px-(--space-3) py-(--space-1) text-ink-2"
        >
          {pendingLabel(pending)}
        </span>
      )}
      <ul aria-label={label} aria-live="polite" className="m-0 flex list-none flex-col gap-(--space-2) p-0">
        <AnimatePresence initial={false} mode="popLayout">
          {rows.map((item, index) => {
            const fresh = highlightNew && !initialIds.has(item.id)
            return (
              <motion.li
                key={item.id}
                layout
                data-slot="animated-list-item"
                className={cn('list-none', fresh && 'k-live-enter')}
                initial={{ opacity: 0, scale: 0.95, y: enterY }}
                animate={
                  recede
                    ? {
                        opacity: Math.max(MIN_RECEDE_OPACITY, 1 - index * RECEDE_OPACITY_STEP),
                        scale: Math.max(MIN_RECEDE_SCALE, 1 - index * RECEDE_SCALE_STEP),
                        y: 0,
                      }
                    : { opacity: 1, scale: 1, y: 0 }
                }
                exit={{ opacity: 0, scale: 0.9, y: 0 }}
                transition={{ ...ENTER_SPRING, delay: Math.min(index * stagger, MAX_STAGGER) }}
              >
                {onItemClick ? (
                  <button
                    type="button"
                    aria-label={item.label}
                    onClick={() => onItemClick(item.id)}
                    className={cn(
                      'block w-full cursor-pointer rounded-[var(--radius-control)] border-0 bg-transparent p-0 text-left text-ink hover:bg-alpha-white-4',
                      focusRing,
                    )}
                  >
                    {item.content}
                  </button>
                ) : (
                  item.content
                )}
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </div>
  )
}

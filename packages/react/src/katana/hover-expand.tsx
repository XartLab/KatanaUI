// SPDX-License-Identifier: MIT
// 改自 SmoothUI hover-expand（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 悬停展开的并排面板：一排板块或策略卡，鼠标移到哪块哪块撑开（flex-grow 弹簧），其余收窄，收窄的标题竖排；键盘聚焦同样展开。
// 与原件的差别：原件的面板是图片卡，这里面板内容由调用方给（children 与收起时的标题 title），不带图片与渐变；
// 触屏没有悬停，点击展开（与原件一致）；读屏名由调用方给，面板是 aria-pressed 的按钮。
import { motion } from 'motion/react'
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

// 弹簧参数来自 SmoothUI hover-expand：bounce 0.1、0.25 秒。
const SPRING = { type: 'spring' as const, bounce: 0.1, duration: 0.25 }
const DEFAULT_EXPANDED_FLEX = 4
const DEFAULT_COLLAPSED_FLEX = 1
// 收起面板里的标题竖排：旋转 -90 度。
const LABEL_ROTATION = -90

export type HoverExpandItem = {
  id: string
  /** Heading; stays visible when the panel is collapsed (rotated in a row). */
  title: string
  /** What shows when the panel is open. */
  children?: ReactNode
}

export type HoverExpandProps = {
  /** The panels in order; each has an id, a title and the content shown when open. */
  items: readonly HoverExpandItem[]
  /** Accessible name of the group. */
  label: string
  /** Whether the panels sit side by side or one under another. */
  orientation?: 'horizontal' | 'vertical'
  /** Active index (controlled); omit to let the component keep it. */
  activeIndex?: number
  /** Called with the index of the panel that just opened. */
  onActiveIndexChange?: (index: number) => void
  /** Flex-grow of the open panel and of the others. */
  expandedFlex?: number
  /** Flex-grow of the closed panels. */
  collapsedFlex?: number
  /** Extra class name on the group. */
  className?: string
}

export function HoverExpand({
  items,
  label,
  orientation = 'horizontal',
  activeIndex: controlled,
  onActiveIndexChange,
  expandedFlex = DEFAULT_EXPANDED_FLEX,
  collapsedFlex = DEFAULT_COLLAPSED_FLEX,
  className,
}: HoverExpandProps) {
  const [own, setOwn] = useState(0)
  const [canHover] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches,
  )
  const panels = useRef<(HTMLButtonElement | null)[]>([])
  const horizontal = orientation === 'horizontal'
  const active = controlled ?? own
  const set = (index: number) => {
    setOwn(index)
    onActiveIndexChange?.(index)
  }
  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = horizontal ? 'ArrowRight' : 'ArrowDown'
    const prev = horizontal ? 'ArrowLeft' : 'ArrowUp'
    if (event.key !== next && event.key !== prev) return
    event.preventDefault()
    const target = Math.min(items.length - 1, Math.max(0, index + (event.key === next ? 1 : -1)))
    set(target)
    panels.current[target]?.focus()
  }
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="hover-expand"
      className={cn('flex w-full gap-(--space-2)', horizontal ? 'flex-row' : 'flex-col', className)}
    >
      {items.map((item, index) => {
        const open = index === active
        return (
          <motion.button
            key={item.id}
            ref={(element) => {
              panels.current[index] = element
            }}
            type="button"
            aria-pressed={open}
            data-open={open || undefined}
            initial={false}
            animate={{ flexGrow: open ? expandedFlex : collapsedFlex }}
            transition={SPRING}
            style={{ flexBasis: 0 }}
            onClick={() => {
              if (!canHover) set(index)
            }}
            onFocus={() => set(index)}
            onMouseEnter={() => {
              if (canHover) set(index)
            }}
            onKeyDown={(event) => onKey(event, index)}
            className={cn(
              'relative min-h-0 min-w-0 cursor-pointer overflow-hidden rounded-[var(--radius-control)] border border-line bg-surface-1 p-(--space-3) text-left text-ink',
              open && 'border-line-strong bg-surface-2',
              focusRing,
            )}
          >
            <motion.div
              initial={false}
              animate={{ rotate: horizontal && !open ? LABEL_ROTATION : 0 }}
              transition={SPRING}
              className={cn(
                'flex min-w-0 flex-col gap-(--space-2)',
                horizontal && !open && 'origin-left whitespace-nowrap',
              )}
              style={
                horizontal && !open
                  ? { position: 'absolute', left: 'var(--space-3)', bottom: 'var(--space-3)' }
                  : undefined
              }
            >
              <span className="k-text-data font-semibold">{item.title}</span>
              {open && <div className="k-text-caption text-ink-2">{item.children}</div>}
            </motion.div>
          </motion.button>
        )
      })}
    </div>
  )
}

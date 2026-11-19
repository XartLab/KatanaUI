// SPDX-License-Identifier: MIT
// 改自 SmoothUI folder-reveal（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { motion } from 'motion/react'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { focusRing } from '../../lib/focus.ts'

// 文件夹展开：一个合着的文件夹，悬停（或点击）时前盖翻开，里面的几张卡扇形展开。适用：首页或营销页里「一组东西收在一起」的示意（一个策略的回测报告、因子库）；
// 不进交易主界面：它是一个插画式的交互，不是数据容器。
// 原件的五种写死 oklch 皮肤换成「色调」：neutral / accent / up / down / warn，每个色调只取一个 token 色，深浅用 color-mix 与底色混出来（跟主题走）。
// 版式比例、扇形的角度与位移、前盖的翻转角、错开间隔与弹簧都是原件的常量。

/** 原件的版式常量：长宽比、前盖占高、纸卡占宽高与离底、扇出时抬起的比例。 */
const ASPECT = 0.78
const FLAP_TOP_RATIO = 0.44
const CARD_WIDTH_RATIO = 0.6
const CARD_HEIGHT_RATIO = 0.5
const CARD_BOTTOM_RATIO = 0.16
const FAN_LIFT_RATIO = 0.36
const CLOSED_SCALE = 0.97
const FLAP_OPEN_ROTATE_X = -32
const STAGGER_STEP = 0.035
const CLOSE_STAGGER_STEP = 0.018
const PERSPECTIVE = 1000
const SPRING = { type: 'spring' as const, bounce: 0.1, duration: 0.25 }
const BACK_PANEL_PATH =
  'M 0 14 Q 0 0 14 0 L 108 0 Q 118 0 124 8 L 137 25 Q 143 33 153 33 L 306 33 Q 320 33 320 47 L 320 236 Q 320 250 306 250 L 14 250 Q 0 250 0 236 Z'

export type FolderTone = 'neutral' | 'accent' | 'up' | 'down' | 'warn'
const TONE: Record<FolderTone, string> = {
  neutral: 'var(--ink-300)',
  accent: 'var(--accent)',
  up: 'var(--pnl-up)',
  down: 'var(--pnl-down)',
  warn: 'var(--signal-amber)',
}
const mix = (tone: string, base: string, pct: number) => `color-mix(in oklab, ${tone} ${pct}%, ${base})`

export type FolderRevealItem = {
  id: string
  content: ReactNode
}

export type FolderRevealProps = {
  /** The cards inside, back to front. */
  items: readonly FolderRevealItem[]
  /** Text on the tab and the spoken name of the folder (required). */
  label: string
  /** Hue of the folder. */
  tone?: FolderTone
  /** Open on hover or on click; touch devices always use click. */
  trigger?: 'hover' | 'click'
  /** Whether the folder is open (controlled). */
  open?: boolean
  /** Called when it opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Fan angle per card, degrees. */
  rotation?: number
  /** Fan spread per card, px. */
  spread?: number
  /** Width of the folder, px. */
  size?: number
  /** Extra classes for the root element. */
  className?: string
}

export function FolderReveal({
  items,
  label,
  tone = 'neutral',
  trigger = 'hover',
  open: openProp,
  onOpenChange,
  rotation = 7,
  spread = 62,
  size = 260,
  className,
}: FolderRevealProps) {
  const gradientId = useId()
  const [inner, setInner] = useState(false)
  const open = openProp ?? inner
  const fine = useRef(false)
  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)')
    fine.current = query.matches
    const onChange = (event: MediaQueryListEvent) => (fine.current = event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  const setOpen = (next: boolean) => {
    setInner(next)
    onOpenChange?.(next)
  }

  const height = size * ASPECT
  const flapHeight = height * (1 - FLAP_TOP_RATIO)
  const cardWidth = size * CARD_WIDTH_RATIO
  const cardHeight = height * CARD_HEIGHT_RATIO
  const base = TONE[tone]
  const skin = {
    back: mix(base, 'var(--bg-300)', 70),
    backDeep: mix(base, 'var(--bg-200)', 55),
    flap: mix(base, 'var(--bg-400)', 82),
    flapDeep: mix(base, 'var(--bg-300)', 66),
    edge: mix(base, 'white', 40),
    label: 'var(--bg-000)',
  }
  const center = (items.length - 1) / 2
  const topId = items.at(-1)?.id

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (trigger === 'hover' && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      setOpen(!open)
    }
  }

  return (
    <div
      data-slot="folder-reveal"
      className={cn('relative select-none', className)}
      style={{ width: size, height, perspective: PERSPECTIVE }}
      onMouseEnter={() => trigger === 'hover' && fine.current && setOpen(true)}
      onMouseLeave={() => trigger === 'hover' && fine.current && setOpen(false)}
    >
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={{ opacity: open ? 0.55 : 0.28, scaleX: open ? 1.06 : 0.88 }}
        transition={SPRING}
        className="absolute -bottom-4 left-1/2 h-6 w-[88%] -translate-x-1/2 rounded-[50%] bg-black blur-lg"
      />
      <svg aria-hidden="true" viewBox="0 0 320 250" className="absolute inset-0 h-full w-full" fill="none">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={skin.back} />
            <stop offset="100%" stopColor={skin.backDeep} />
          </linearGradient>
        </defs>
        <path d={BACK_PANEL_PATH} fill={`url(#${gradientId})`} />
      </svg>
      <span
        aria-hidden="true"
        className="k-text-caption absolute top-0 left-0 flex items-center truncate px-3 font-semibold"
        style={{ color: skin.label, height: height * 0.132, maxWidth: size * 0.34 }}
      >
        {label}
      </span>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-[14px]"
        style={{
          top: height * 0.132,
          boxShadow: 'inset 0 14px 16px -14px color-mix(in srgb, var(--bg-000) 45%, transparent)',
        }}
      />
      <div
        aria-hidden={!open}
        className="pointer-events-none absolute inset-x-0 flex justify-center"
        style={{ bottom: height * CARD_BOTTOM_RATIO, zIndex: 10 }}
      >
        {items.map((item, index) => {
          const offset = index - center
          return (
            <motion.div
              key={item.id}
              initial={false}
              animate={
                open
                  ? { opacity: 1, rotate: offset * rotation, scale: 1, x: offset * spread, y: -height * FAN_LIFT_RATIO }
                  : { opacity: item.id === topId ? 1 : 0, rotate: 0, scale: CLOSED_SCALE, x: 0, y: 0 }
              }
              transition={{
                ...SPRING,
                delay: open ? index * STAGGER_STEP : (items.length - 1 - index) * CLOSE_STAGGER_STEP,
              }}
              className="absolute bottom-0 origin-bottom overflow-hidden rounded-[10px] border border-alpha-white-8 bg-surface-3 shadow-[0_8px_18px_-8px_color-mix(in_srgb,var(--bg-000)_50%,transparent)]"
              style={{ width: cardWidth, height: cardHeight, zIndex: index }}
            >
              {item.content}
            </motion.div>
          )
        })}
      </div>
      <motion.button
        type="button"
        aria-expanded={open}
        aria-label={label}
        initial={false}
        animate={{ rotateX: open ? FLAP_OPEN_ROTATE_X : 0 }}
        transition={SPRING}
        onClick={() => trigger === 'click' && setOpen(!open)}
        onFocus={() => trigger === 'hover' && setOpen(true)}
        onBlur={() => trigger === 'hover' && setOpen(false)}
        onKeyDown={onKeyDown}
        className={cn('absolute inset-x-0 bottom-0 cursor-pointer rounded-t-[8px] rounded-b-[14px]', focusRing)}
        style={{
          height: flapHeight,
          backgroundImage: `linear-gradient(to bottom, ${skin.flap}, ${skin.flapDeep})`,
          boxShadow: `inset 0 1px 0 ${skin.edge}, 0 -2px 6px -2px color-mix(in srgb, var(--bg-000) 18%, transparent), 0 10px 22px -12px color-mix(in srgb, var(--bg-000) 50%, transparent)`,
          transformOrigin: 'bottom',
          transformStyle: 'preserve-3d',
          zIndex: 20,
        }}
      />
    </div>
  )
}

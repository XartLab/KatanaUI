// SPDX-License-Identifier: MIT
// 改自 SmoothUI 的 fade-through、shared-axis-x、shared-axis-y、shared-axis-z、short-slide-right（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 归并：这 5 个原件都是「一句话换成下一句」（旧的出、新的进，AnimatePresence 按 key 换），只差进出的方式；这里合成一个件，variant 一一对应原件。
// 额外加了受控的 index 与 onIndexChange（原件只会自己定时轮播），交易里要按用户切换视图或新来一条标题就换。
import { AnimatePresence, motion, type TargetAndTransition, type Transition } from 'motion/react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { cn } from '../../lib/cn.ts'

export type TextSwapVariant = 'fade-through' | 'axis-x' | 'axis-z' | 'word-cut' | 'slide-right'

export type TextSwapProps = {
  /** Extra class names for the root element. */
  className?: string
  /** The shown phrase when you drive it yourself; leave it out to let `interval` cycle. */
  index?: number
  /** Milliseconds between automatic swaps; 0 turns cycling off. */
  interval?: number
  /** Called with the next index whenever the component cycles by itself. */
  onIndexChange?: (index: number) => void
  /** The phrases to swap between. */
  phrases: readonly string[]
  /** fade-through (Material fade), axis-x (slide left), axis-z (scale and depth), word-cut (hard-cut word staircase) or slide-right (glide in, words fade in turn). */
  variant?: TextSwapVariant
}

// 以下来自 SmoothUI 各原件的常量（秒）。
const ENTER_EASE = [0.2, 0, 0, 1] as const
const EXIT_EASE = [0.4, 0, 1, 1] as const
const SLIDE_EASE = [0.2, 0.8, 0.2, 1] as const
const SLIDE_EXIT_EASE = [0.4, 0, 0.2, 1] as const
const CUT_STAGGER_S = 0.078
const SLIDE_WORD_STAGGER_S = 0.092

type Motion = {
  initial: Record<string, number | string>
  animate: Record<string, number | string>
  exit: TargetAndTransition
  transition: Transition
  clip: boolean
}

const MOTIONS: Record<Exclude<TextSwapVariant, 'word-cut' | 'slide-right'>, Motion> = {
  'fade-through': {
    initial: { filter: 'blur(2px)', opacity: 0, scale: 0.99, y: 6 },
    animate: { filter: 'blur(0px)', opacity: 1, scale: 1, y: 0 },
    exit: { filter: 'blur(0px)', opacity: 0, scale: 1, y: -4, transition: { duration: 0.26, ease: EXIT_EASE } },
    transition: { duration: 0.42, ease: ENTER_EASE },
    clip: false,
  },
  'axis-x': {
    initial: { opacity: 0, scale: 0.98, x: 24 },
    animate: { opacity: 1, scale: 1, x: 0 },
    exit: { opacity: 0, scale: 0.98, x: -20, transition: { duration: 0.36, ease: EXIT_EASE } },
    transition: { duration: 0.5, ease: ENTER_EASE },
    clip: true,
  },
  'axis-z': {
    initial: { filter: 'blur(2px)', opacity: 0, scale: 0.9 },
    animate: { filter: 'blur(0px)', opacity: 1, scale: 1 },
    exit: { filter: 'blur(1px)', opacity: 0, scale: 1.06, transition: { duration: 0.36, ease: EXIT_EASE } },
    transition: { duration: 0.52, ease: ENTER_EASE },
    clip: true,
  },
}

const INLINE: CSSProperties = { display: 'inline-block' }

/**
 * Swaps one phrase for the next with an exit and an enter: news headlines, rotating notices, a label that follows the active view.
 * Cycles by itself every `interval` ms, or follows `index` when you pass one.
 */
export function TextSwap({
  className,
  index,
  interval = 2500,
  onIndexChange,
  phrases,
  variant = 'fade-through',
}: TextSwapProps) {
  const [own, setOwn] = useState(0)
  const controlled = index !== undefined
  const current = controlled ? index : own
  const count = phrases.length

  // 回调与当前序号放 ref：轮播的定时器不因为父组件每次渲染换了回调而重建，更新函数里也不做副作用。
  const ownRef = useRef(0)
  const notify = useRef(onIndexChange)
  useEffect(() => {
    notify.current = onIndexChange
  })

  useEffect(() => {
    if (controlled || interval <= 0 || count <= 1) return
    const id = setInterval(() => {
      const next = (ownRef.current + 1) % count
      ownRef.current = next
      setOwn(next)
      notify.current?.(next)
    }, interval)
    return () => clearInterval(id)
  }, [controlled, interval, count])

  const phrase = phrases[count === 0 ? 0 : ((current % count) + count) % count] ?? ''
  const key = controlled ? current : own

  if (variant === 'word-cut') {
    const words = phrase.split(' ')
    return (
      <span
        aria-live="polite"
        className={cn('inline-flex flex-wrap gap-x-[0.25em]', className)}
        data-index={key}
        data-slot="text-swap"
        data-variant={variant}
      >
        <AnimatePresence mode="wait">
          <motion.span className="inline-flex flex-wrap gap-x-[0.25em]" key={key}>
            {words.map((word, i) => (
              <motion.span
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { delay: i * CUT_STAGGER_S, duration: 0 } }}
                initial={{ opacity: 0 }}
                key={i}
                style={INLINE}
                transition={{ delay: i * CUT_STAGGER_S, duration: 0 }}
              >
                {word}
              </motion.span>
            ))}
          </motion.span>
        </AnimatePresence>
      </span>
    )
  }

  if (variant === 'slide-right') {
    const words = phrase.split(' ')
    return (
      <span
        aria-live="polite"
        className={cn('relative inline-block overflow-hidden', className)}
        data-index={key}
        data-slot="text-swap"
        data-variant={variant}
      >
        <AnimatePresence mode="wait">
          <motion.span
            animate={{ filter: 'blur(0px)', x: 0 }}
            exit={{ filter: 'blur(1px)', opacity: 0, x: 12, transition: { duration: 0.32, ease: SLIDE_EXIT_EASE } }}
            initial={{ filter: 'blur(1.2px)', x: -24 }}
            key={key}
            style={{ display: 'inline-flex', flexWrap: 'nowrap', gap: '0.25em' }}
            transition={{ duration: 0.52, ease: SLIDE_EASE }}
          >
            {words.map((word, i) => (
              <motion.span
                animate={{ opacity: 1 }}
                initial={{ opacity: 0 }}
                key={i}
                style={INLINE}
                transition={{ delay: i * SLIDE_WORD_STAGGER_S, duration: 0.21, ease: SLIDE_EASE }}
              >
                {word}
              </motion.span>
            ))}
          </motion.span>
        </AnimatePresence>
      </span>
    )
  }

  const spec = MOTIONS[variant]
  return (
    <span
      aria-live="polite"
      className={cn('relative inline-block', spec.clip && 'overflow-hidden', className)}
      data-index={key}
      data-slot="text-swap"
      data-variant={variant}
    >
      <AnimatePresence mode="wait">
        <motion.span
          animate={spec.animate}
          exit={spec.exit}
          initial={spec.initial}
          key={key}
          style={INLINE}
          transition={spec.transition}
        >
          {phrase}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

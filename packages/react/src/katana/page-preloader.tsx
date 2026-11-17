// SPDX-License-Identifier: MIT
// 改自 SmoothUI page-preloader（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 面板或整页的进场遮罩：先盖住内容停一会儿，数据就绪后用「幕布 / 阶梯 / 像素 / 文字」四种方式之一揭开。用在切换工作区、冷启动首屏。
// 与 Loading 的分工：Loading 是等数据时的骨架与超时处理，PagePreloader 只管「揭开」这一下的过场，两者可以叠着用。
// 与原件的差别：① 默认只盖住父级（absolute），整页遮罩要显式 fullScreen；② 颜色是 CSS 颜色值（默认 --bg-000），不再是 Tailwind 类；
// ③ 文字款的词与读屏名全由调用方给；④ 像素款的乱序用原件同一个种子（733）的线性同余，保证每次揭开的顺序一样。
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { cn } from '../lib/cn.ts'

export const PAGE_PRELOADER_VARIANTS = ['curtain', 'stairs', 'pixel', 'words'] as const
export type PagePreloaderVariant = (typeof PAGE_PRELOADER_VARIANTS)[number]

type Bezier = [number, number, number, number]
// 时长与缓动全部来自 SmoothUI page-preloader（秒）。
const CURTAIN_EXIT_S = 0.5
const STAIRS_EXIT_S = 0.55
const STAIRS_STAGGER_S = 0.06
const PIXEL_EXIT_S = 0.4
const PIXEL_STAGGER_S = 0.012
const WORDS_EXIT_S = 0.45
const WORD_STEP_MS = 480
const EASE_MOVE: Bezier = [0.645, 0.045, 0.355, 1]
const EASE_ENTER: Bezier = [0.23, 1, 0.32, 1]
const WORD_SPRING = { type: 'spring' as const, bounce: 0.1, duration: 0.25 }
const PIXEL_SEED = 733
const MS_PER_S = 1000

/** 确定性的洗牌（线性同余，不用 Math.random）：渲染里用也安全，同一个种子同一个顺序。 */
function seededOrder(count: number, seed: number): number[] {
  let state = seed
  const next = () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return state / 0xff_ff_ff_ff
  }
  const order = Array.from({ length: count }, (_, index) => index)
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1))
    ;[order[i], order[j]] = [order[j]!, order[i]!]
  }
  return order
}

/** 揭开这一下要多久（毫秒）：父级据此在揭开完成后摘掉遮罩。 */
export function preloaderExitMs(variant: PagePreloaderVariant, columns: number): number {
  switch (variant) {
    case 'stairs':
      return (STAIRS_EXIT_S + Math.max(0, columns - 1) * STAIRS_STAGGER_S) * MS_PER_S
    case 'pixel':
      return (PIXEL_EXIT_S + Math.max(0, columns * columns - 1) * PIXEL_STAGGER_S) * MS_PER_S
    case 'words':
      return WORDS_EXIT_S * MS_PER_S
    default:
      return CURTAIN_EXIT_S * MS_PER_S
  }
}

type Stage = 'idle' | 'hold' | 'exiting'
type PieceProps = { background: string; exiting: boolean }

function Curtain({ background, exiting }: PieceProps) {
  const transition = { duration: CURTAIN_EXIT_S, ease: EASE_MOVE }
  return (
    <div aria-hidden="true" className="absolute inset-0 flex">
      <motion.div
        className="h-full w-1/2"
        style={{ background }}
        initial={false}
        animate={{ x: exiting ? '-100%' : 0 }}
        transition={transition}
      />
      <motion.div
        className="h-full w-1/2"
        style={{ background }}
        initial={false}
        animate={{ x: exiting ? '100%' : 0 }}
        transition={transition}
      />
    </div>
  )
}

function Stairs({ background, exiting, columns }: PieceProps & { columns: number }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 flex">
      {Array.from({ length: columns }, (_, index) => (
        <motion.div
          key={index}
          className="h-full flex-1"
          style={{ background, transformOrigin: 'bottom' }}
          initial={false}
          animate={{ scaleY: exiting ? 0 : 1 }}
          transition={{ delay: exiting ? index * STAIRS_STAGGER_S : 0, duration: STAIRS_EXIT_S, ease: EASE_MOVE }}
        />
      ))}
    </div>
  )
}

function Pixel({ background, exiting, columns }: PieceProps & { columns: number }) {
  const total = columns * columns
  const order = useMemo(() => seededOrder(total, PIXEL_SEED), [total])
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: total }, (_, index) => (
        <motion.div
          key={index}
          style={{ background }}
          initial={false}
          animate={{ opacity: exiting ? 0 : 1 }}
          transition={{
            delay: exiting ? (order[index] ?? 0) * PIXEL_STAGGER_S : 0,
            duration: PIXEL_EXIT_S,
            ease: EASE_ENTER,
          }}
        />
      ))}
    </div>
  )
}

function Words({ background, exiting, words, index }: PieceProps & { words: readonly string[]; index: number }) {
  return (
    <motion.div
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ background }}
      initial={false}
      animate={{ y: exiting ? '-100%' : 0 }}
      transition={{ duration: WORDS_EXIT_S, ease: EASE_MOVE }}
    >
      <div className="relative h-8 overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={words[index] ?? index}
            className="k-text-title block text-ink"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={WORD_SPRING}
          >
            {words[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export type PagePreloaderProps = {
  /** Accessible name announced while the cover is up, for example "Loading workspace". */
  label: string
  /** How the cover is lifted. */
  variant?: PagePreloaderVariant
  /** Cover shown (controlled); setting it false plays the reveal. Omit to hold for `duration` then reveal by itself. */
  active?: boolean
  /** Whether the cover starts up when uncontrolled. */
  defaultActive?: boolean
  /** How long the uncontrolled cover holds before it reveals, in milliseconds. */
  duration?: number
  /** Columns of the stairs variant, and rows and columns of the pixel variant. */
  columns?: number
  /** Words cycled by the words variant while holding. */
  words?: readonly string[]
  /** Any CSS colour of the cover pieces. */
  background?: string
  /** Cover the whole window instead of the parent box. */
  fullScreen?: boolean
  /** Called once the reveal has finished and the cover is gone. */
  onComplete?: () => void
  /** Extra class name on the cover. */
  className?: string
}

export function PagePreloader({
  label,
  variant = 'curtain',
  active,
  defaultActive = true,
  duration = 1400,
  columns = 6,
  words = [],
  background = 'var(--bg-000)',
  fullScreen = false,
  onComplete,
  className,
}: PagePreloaderProps) {
  const controlled = active !== undefined
  const [own, setOwn] = useState(defaultActive)
  const on = controlled ? Boolean(active) : own
  const [stage, setStage] = useState<Stage>(on ? 'hold' : 'idle')
  const [wordIndex, setWordIndex] = useState(0)
  const finish = useCallback(() => {
    setStage('idle')
    if (!controlled) setOwn(false)
    onComplete?.()
  }, [controlled, onComplete])
  // active 变化时同步阶段：升起就重新计时，停留中被收起就开始揭开（由 props 推导的状态，照 React 文档在渲染时调整）。
  const [seenOn, setSeenOn] = useState(on)
  if (seenOn !== on) {
    setSeenOn(on)
    if (on) {
      setStage(stage === 'exiting' ? stage : 'hold')
      setWordIndex(0)
    } else if (stage === 'hold') {
      setStage('exiting')
    }
  }
  useEffect(() => {
    if (controlled || stage !== 'hold') return
    const timer = setTimeout(() => setStage('exiting'), duration)
    return () => clearTimeout(timer)
  }, [controlled, duration, stage])
  useEffect(() => {
    if (variant !== 'words' || stage !== 'hold' || words.length <= 1) return
    const timer = setInterval(() => setWordIndex((index) => (index + 1) % words.length), WORD_STEP_MS)
    return () => clearInterval(timer)
  }, [variant, stage, words.length])
  useEffect(() => {
    if (stage !== 'exiting') return
    const timer = setTimeout(finish, preloaderExitMs(variant, columns))
    return () => clearTimeout(timer)
  }, [columns, finish, stage, variant])
  // 整页遮罩时锁住 body 滚动。
  useEffect(() => {
    if (!fullScreen || stage === 'idle') return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [fullScreen, stage])
  if (stage === 'idle') return null
  const exiting = stage === 'exiting'
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      data-slot="page-preloader"
      data-stage={stage}
      data-variant={variant}
      className={cn('overflow-hidden', fullScreen ? 'fixed inset-0 z-[100]' : 'absolute inset-0 z-40', className)}
    >
      {variant === 'curtain' && <Curtain background={background} exiting={exiting} />}
      {variant === 'stairs' && <Stairs background={background} exiting={exiting} columns={columns} />}
      {variant === 'pixel' && <Pixel background={background} exiting={exiting} columns={columns} />}
      {variant === 'words' && <Words background={background} exiting={exiting} words={words} index={wordIndex} />}
    </div>
  )
}

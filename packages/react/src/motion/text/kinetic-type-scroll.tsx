// SPDX-License-Identifier: MIT
// 改自 SmoothUI kinetic-type-scroll（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 随滚动，一道「波」从第一个词走到最后一个词：波峰上的词放大、拉开字距、变粗、上浮、变亮，过了就回落。
// 每个词把滚动进度的一小段映射成 0 到 1 的强度，再经弹簧平滑。我们的默认字体不是可变字体，所以字重不默认开（给了 weightRange 才用）。
import { motion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useRef, type RefObject } from 'react'
import { cn } from '../../lib/cn.ts'

export type KineticTypeScrollAlign = 'start' | 'center' | 'end'
type UseScrollOptions = NonNullable<Parameters<typeof useScroll>[0]>
export type ScrollOffsetTuple = UseScrollOptions['offset']
type Range = readonly [number, number]

export type KineticTypeScrollProps = {
  /** Horizontal alignment of the wrapped words. */
  align?: KineticTypeScrollAlign
  /** Extra class names for the root element. */
  className?: string
  /** Scrollable ancestor whose progress drives the effect; the page itself when omitted. */
  container?: RefObject<HTMLElement | null>
  /** Opacity at rest and at each word's peak. */
  dimRange?: Range
  /** Vertical offset in pixels at rest and at each word's peak. */
  liftRange?: Range
  /** Motion scroll offset notation, forwarded to useScroll. */
  offset?: ScrollOffsetTuple
  /** Scale at rest and at each word's peak. */
  scaleRange?: Range
  /** Fractional gap between the peaks of two neighbouring words, from 0 to 1. */
  stagger?: number
  /** Letter spacing in pixels at rest and at each word's peak. */
  trackingRange?: Range
  /** Variable-font weight at rest and at each word's peak; leave out when the font is not variable. */
  weightRange?: Range
  /** The words to animate, in order. */
  words: readonly string[]
}

const ALIGN: Record<KineticTypeScrollAlign, string> = {
  center: 'justify-center',
  end: 'justify-end',
  start: 'justify-start',
}
// 以下默认值与常量来自 SmoothUI 原件。
const DEFAULT_SCALE: Range = [0.92, 1.18]
const DEFAULT_TRACKING: Range = [-0.5, 2.5]
const DEFAULT_LIFT: Range = [0, -12]
// 不会全黑：静止时整句仍可读，波峰才把它点亮。
const DEFAULT_DIM: Range = [0.45, 1]
const DEFAULT_STAGGER = 0.12
/** 滚动区间两头各留的空：词读完了波才开始，波走完了词才离开。 */
const WAVE_MARGIN = 0.14
/** 每个词的活动窗口是相邻两峰间距的多少倍；大于 1 窗口重叠，才是一道波而不是一排各自的脉冲。 */
const WINDOW_OVERLAP = 1.2
const MIN_WINDOW = 0.09
const SPRING = { bounce: 0, duration: 0.32, type: 'spring' as const }
/** motion 默认区间在元素比滚动容器矮时会塌到 0；这一段从词句进入视口下部开始，到它走到中间前后结束。 */
const DEFAULT_OFFSET = ['start 0.9', 'end 0.45'] as ScrollOffsetTuple

type WordProps = {
  dimRange: Range
  index: number
  liftRange: Range
  progress: MotionValue<number>
  scaleRange: Range
  stagger: number
  total: number
  trackingRange: Range
  weightRange?: Range
  word: string
}

function KineticWord({
  dimRange,
  index,
  liftRange,
  progress,
  scaleRange,
  stagger,
  total,
  trackingRange,
  weightRange,
  word,
}: WordProps) {
  const gaps = Math.max(1, total - 1)
  // 波峰等距，整道波居中，短句不会挤在滚动的前三分之一。
  const spacing = Math.min(stagger, (1 - 2 * WAVE_MARGIN) / gaps)
  const center = (1 - spacing * gaps) / 2 + spacing * index
  const half = Math.max(spacing * WINDOW_OVERLAP, MIN_WINDOW)
  const local = useTransform(progress, [center - half, center + half], [0, 1], { clamp: true })
  const intensity = useTransform(local, (value) => 1 - Math.abs(value * 2 - 1))
  const scale = useSpring(useTransform(intensity, [0, 1], [...scaleRange]), SPRING)
  const tracking = useSpring(useTransform(intensity, [0, 1], [...trackingRange]), SPRING)
  const weight = useSpring(useTransform(intensity, [0, 1], [...(weightRange ?? [0, 0])]), SPRING)
  const y = useSpring(useTransform(intensity, [0, 1], [...liftRange]), SPRING)
  const opacity = useSpring(useTransform(intensity, [0, 1], [...dimRange]), SPRING)
  const letterSpacing = useTransform(tracking, (value) => `${value}px`)
  const fontVariationSettings = useTransform(weight, (value) =>
    weightRange ? `"wght" ${Math.round(value)}` : 'normal',
  )
  return (
    <motion.span
      aria-hidden="true"
      className="inline-block will-change-transform"
      style={{ fontVariationSettings, letterSpacing, opacity, scale, y }}
    >
      {word}
    </motion.span>
  )
}

/** Editorial type driven by scroll: a wave of emphasis travels through the words as the section scrolls, like a headline being read aloud. */
export function KineticTypeScroll({
  align = 'center',
  className,
  container,
  dimRange = DEFAULT_DIM,
  liftRange = DEFAULT_LIFT,
  offset = DEFAULT_OFFSET,
  scaleRange = DEFAULT_SCALE,
  stagger = DEFAULT_STAGGER,
  trackingRange = DEFAULT_TRACKING,
  weightRange,
  words,
}: KineticTypeScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ container, offset, target: ref })
  return (
    // 间距用 em 并留够波峰的放大量：scale 是 transform，放大的词会溢出布局框，固定像素的间距会让波峰撞到邻居。
    <div
      className={cn('flex flex-wrap gap-x-[0.4em] gap-y-[0.18em]', ALIGN[align], className)}
      data-slot="kinetic-type-scroll"
      ref={ref}
    >
      <span className="sr-only">{words.join(' ')}</span>
      {words.map((word, index) => (
        <KineticWord
          dimRange={dimRange}
          index={index}
          key={`${index}-${word}`}
          liftRange={liftRange}
          progress={scrollYProgress}
          scaleRange={scaleRange}
          stagger={stagger}
          total={words.length}
          trackingRange={trackingRange}
          weightRange={weightRange}
          word={word}
        />
      ))}
    </div>
  )
}

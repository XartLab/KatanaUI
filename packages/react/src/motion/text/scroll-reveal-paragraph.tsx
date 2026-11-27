// SPDX-License-Identifier: MIT
// 改自 SmoothUI scroll-reveal-paragraph（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 一段话随滚动一个词一个词地亮起来：每个词叠两层，底层是暗字，上层按滚动进度的一小段从 0 渐到 1。
// 我们加的：container（在某个滚动容器里滚时传它的 ref，文档站的预览就是这样）与 offset，读屏读整段，词是 aria-hidden。
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef, type RefObject } from 'react'
import { cn } from '../../lib/cn.ts'

type UseScrollOptions = NonNullable<Parameters<typeof useScroll>[0]>

export type ScrollRevealParagraphProps = {
  /** Extra class names for the root element. */
  className?: string
  /** Scrollable ancestor whose progress drives the reveal; the page itself when omitted. */
  container?: RefObject<HTMLElement | null>
  /** Which part of the scroll range reveals the paragraph, in motion's scroll offset notation. */
  offset?: UseScrollOptions['offset']
  /** The paragraph to reveal word by word. */
  paragraph: string
}

// 来源：SmoothUI 的区间——段落顶部到视口 90% 处开始亮，到 25% 处全亮。
const DEFAULT_OFFSET = ['start 0.9', 'start 0.25'] as UseScrollOptions['offset']

function Word({
  children,
  progress,
  range,
}: {
  /** The text to show. */
  children: string
  progress: MotionValue<number>
  range: [number, number]
}) {
  const opacity = useTransform(progress, range, [0, 1])
  return (
    <span className="relative mr-[0.3em] inline-block" aria-hidden="true">
      <span style={{ color: 'var(--ink-400)' }}>{children}</span>
      <motion.span className="absolute inset-0" style={{ color: 'var(--ink-100)', opacity }}>
        {children}
      </motion.span>
    </span>
  )
}

/** A paragraph that lights up word by word as it scrolls into view: a market note read at the pace of the scroll. */
export function ScrollRevealParagraph({
  className,
  container,
  offset = DEFAULT_OFFSET,
  paragraph,
}: ScrollRevealParagraphProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ container, offset, target: ref })
  const words = paragraph.split(' ')
  return (
    <p className={cn('leading-relaxed', className)} data-slot="scroll-reveal-paragraph" ref={ref}>
      <span className="sr-only">{paragraph}</span>
      {words.map((word, i) => (
        <Word key={`${i}-${word}`} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
          {word}
        </Word>
      ))}
    </p>
  )
}

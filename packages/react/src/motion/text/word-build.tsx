// SPDX-License-Identifier: MIT
// 改自 SmoothUI 的 kinetic-center-build、short-slide-down（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 归并：两个原件都是「一句话一个词一个词地搭起来，停一会儿，整句退场，换下一句」，差别只有词从哪边进（右边推着一行走 / 上边落下来叠成一列）和节奏，合成一个件，from 区分。
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn.ts'

export type WordBuildFrom = 'right' | 'top'

export type WordBuildProps = {
  /** Extra class names for the root element. */
  className?: string
  /** Which way new words arrive: from the right and push one centred line, or from above and stack into a column. */
  from?: WordBuildFrom
  /** How long a finished phrase stays before it leaves, in milliseconds. */
  hold?: number
  /** The phrases to build one after another. */
  phrases: readonly string[]
  /** Overrides the delay between one word and the next, in milliseconds. */
  wordInterval?: number
}

// 来源：kinetic-center-build（right）与 short-slide-down（top）的常量；时长单位秒，间隔单位毫秒。
const BUILD_EASE = [0.2, 0.8, 0.2, 1] as const
const EXIT_EASE = [0.4, 0, 0.2, 1] as const
const SPEC = {
  right: {
    wordInterval: 430,
    settle: 340,
    exitMs: 260 + 220,
    first: 0.34,
    rest: 0.43,
    layout: 0.43,
    enter: { filter: 'blur(3.5px)', opacity: 0, scale: 0.992, x: 88, y: 6 },
    exit: { filter: 'blur(2.5px)', opacity: 0, transition: { duration: 0.26, ease: EXIT_EASE }, y: -6 },
  },
  top: {
    wordInterval: 500,
    settle: 360,
    exitMs: 320 + 180,
    first: 0.36,
    rest: 0.5,
    layout: 0.5,
    enter: { filter: 'blur(2.4px)', opacity: 0, scale: 0.992, y: -28 },
    exit: { filter: 'blur(1.2px)', opacity: 0, transition: { duration: 0.32, ease: EXIT_EASE }, y: 10 },
  },
} as const

/**
 * Builds a phrase word by word, holds it, clears it and moves to the next: an AI headline or a one-line market summary writing itself.
 */
export function WordBuild({ className, from = 'right', hold = 2500, phrases, wordInterval }: WordBuildProps) {
  const spec = SPEC[from]
  const step = wordInterval ?? spec.wordInterval
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [wordCount, setWordCount] = useState(1)
  const [exiting, setExiting] = useState(false)

  const phrase = phrases[phraseIndex] ?? ''
  const words = phrase.split(' ')
  const total = words.length
  const count = phrases.length

  useEffect(() => {
    // 起点（第一个词、未退场）由换句时的回调设好，这里不再同步 setState。
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 1; i < total; i += 1) timers.push(setTimeout(() => setWordCount(i + 1), i * step))
    if (count > 1) {
      timers.push(
        setTimeout(
          () => {
            setExiting(true)
            timers.push(
              setTimeout(() => {
                setPhraseIndex((previous) => (previous + 1) % count)
                setWordCount(1)
                setExiting(false)
              }, spec.exitMs),
            )
          },
          (total - 1) * step + spec.settle + hold,
        ),
      )
    }
    return () => {
      for (const timer of timers) clearTimeout(timer)
    }
  }, [phraseIndex, count, total, step, hold, spec.settle, spec.exitMs])

  const resting = { filter: 'blur(0px)', opacity: 1, scale: 1, x: 0, y: 0 }
  return (
    <span
      aria-live="polite"
      className={cn(
        from === 'right'
          ? 'flex flex-wrap items-center justify-center gap-x-[0.3em]'
          : 'flex flex-col items-center gap-y-[0.3em]',
        className,
      )}
      data-from={from}
      data-slot="word-build"
      data-words={wordCount}
    >
      <AnimatePresence mode="popLayout">
        {words.slice(0, wordCount).map((word, i) => (
          <motion.span
            animate={exiting ? spec.exit : resting}
            initial={spec.enter}
            key={`${phraseIndex}-${i}`}
            layout
            style={{ display: from === 'right' ? 'inline-block' : 'block' }}
            transition={{
              duration: i === 0 ? spec.first : spec.rest,
              ease: BUILD_EASE,
              layout: { duration: spec.layout, ease: BUILD_EASE },
            }}
          >
            {word}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  )
}

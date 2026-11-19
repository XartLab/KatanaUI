// SPDX-License-Identifier: MIT
// 改自 SmoothUI wave-text（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 每个字依次上下起伏，一道波在文字里循环走；读屏读整句，字是 aria-hidden。
import { motion } from 'motion/react'
import { segmentGraphemes } from './split.ts'

export type WaveTextProps = {
  /** How far a character rises above its baseline, in pixels. */
  amplitude?: number
  /** The text to show. */
  children: string
  /** Extra class names for the root element. */
  className?: string
  /** Duration of one wave cycle for a character, in seconds. */
  duration?: number
  /** Delay between one character and the next, in seconds. */
  staggerDelay?: number
}

// 来源：SmoothUI wave-text 的缓动（正弦式 ease-in-out）与五个关键帧时刻。
const WAVE_EASE = [0.37, 0, 0.63, 1] as const
const WAVE_TIMES = [0, 0.25, 0.5, 0.75, 1]

/** Characters bob up and down in turn so a wave travels through the text; a quiet "live" cue for a word or label. */
export function WaveText({ amplitude = 8, children, className, duration = 1.2, staggerDelay = 0.05 }: WaveTextProps) {
  return (
    <span className={className} data-slot="wave-text" style={{ display: 'inline-block' }}>
      <span className="sr-only">{children}</span>
      {segmentGraphemes(children).map((char, i) => (
        <motion.span
          animate={{ y: [0, -amplitude, 0, amplitude * 0.5, 0] }}
          aria-hidden="true"
          key={`${i}-${char}`}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
          transition={{
            delay: i * staggerDelay,
            duration,
            ease: WAVE_EASE,
            repeat: Number.POSITIVE_INFINITY,
            times: WAVE_TIMES,
          }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  )
}

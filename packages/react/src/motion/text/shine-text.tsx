// SPDX-License-Identifier: MIT
// 改自 SmoothUI shine-text（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 一道高光循环扫过文字（背景渐变裁到字形里再平移）；AI 在思考、数据在加载时的「进行中」文字用它。
import { motion } from 'motion/react'

export type ShineTextProps = {
  /** Text color away from the highlight; any CSS color, defaults to the quiet ink token. */
  baseColor?: string
  /** The text to show. */
  children: string
  /** Extra class names for the root element. */
  className?: string
  /** Duration of one sweep, in seconds. */
  duration?: number
  /** Pause between sweeps, in seconds. */
  repeatDelay?: number
  /** Color of the sweeping highlight band; defaults to the strong ink token. */
  shineColor?: string
}

/** Text with a light band that sweeps across it on a loop, for work that is still in progress. */
export function ShineText({
  baseColor = 'var(--ink-300)',
  children,
  className,
  duration = 2.5,
  repeatDelay = 0.6,
  shineColor = 'var(--ink-100)',
}: ShineTextProps) {
  return (
    <motion.span
      animate={{ backgroundPositionX: ['150%', '-150%'] }}
      className={className}
      data-slot="shine-text"
      style={{
        backgroundClip: 'text',
        backgroundImage: `linear-gradient(110deg, ${baseColor} 40%, ${shineColor} 50%, ${baseColor} 60%)`,
        backgroundSize: '250% 100%',
        color: 'transparent',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
      transition={{ duration, ease: 'linear', repeat: Number.POSITIVE_INFINITY, repeatDelay }}
    >
      {children}
    </motion.span>
  )
}

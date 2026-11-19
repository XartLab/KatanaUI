// SPDX-License-Identifier: MIT
// 改自 SmoothUI scroll-progress（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 滚动进度：读长文（研报、新闻正文、策略报告）时，指示读到哪了。条 / 环 / 数字 / 分段四种；值经弹簧平滑，不跟着滚轮的颗粒抖。
// 与 Progress 的分工：Progress 是「任务做了多少」的受控进度条，ScrollProgress 自己读滚动位置（窗口，或 container 指定的滚动容器），不需要传值。
// 与原件的差别：读屏名必填；原件的「read」字样与默认颜色换成调用方给的 valueText 与 token（--accent）；条的亮头用 color-mix 从主色算。
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useState, type RefObject } from 'react'
import { cn } from '../lib/cn.ts'

// 弹簧参数来自 SmoothUI scroll-progress：整体 damping 30、mass 0.4、stiffness 220；分段各自 0.25 秒 bounce 0.1。
const SPRING = { damping: 30, mass: 0.4, stiffness: 220 }
const SEGMENT_SPRING = { bounce: 0.1, duration: 0.25 }
const SEGMENT_WIDTH_PX = 18
// 环中间的数字字号占环直径的比例。
const RING_LABEL_RATIO = 0.28
const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export type ScrollProgressProps = {
  /** Accessible name, for example "Reading progress". */
  label: string
  /** How the progress is drawn. */
  variant?: 'bar' | 'ring' | 'number' | 'segments'
  /** Scroll container to follow; the window when omitted. */
  container?: RefObject<HTMLElement | null>
  /** sticky pins it to the top or bottom edge of its scroll container; inline leaves it where you put it. */
  position?: 'top' | 'bottom' | 'inline'
  /** Bar height, ring and segment stroke, in pixels. */
  thickness?: number
  /** Any CSS colour; defaults to the accent. */
  color?: string
  /** Diameter of the ring in pixels. */
  size?: number
  /** Number of pills in the segments variant. */
  segments?: number
  /** Print the percentage next to or inside the indicator. */
  showValue?: boolean
  /** Spring-smooth the value. */
  smooth?: boolean
  /** Extra class name on the root. */
  className?: string
}

const POSITION = {
  top: 'sticky inset-x-0 top-0 z-40',
  bottom: 'sticky inset-x-0 bottom-0 z-40',
  inline: 'relative',
} as const

function Segment({
  value,
  index,
  segments,
  thickness,
  color,
}: {
  value: MotionValue<number>
  index: number
  segments: number
  thickness: number
  color: string
}) {
  // 每个胶囊负责 1/segments 的区间，所以是一个接一个填满，不是一起慢慢涨。
  const fill = useTransform(value, (progress) => clamp01(progress * segments - index))
  const spring = useSpring(fill, SEGMENT_SPRING)
  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-full bg-surface-4"
      style={{ height: thickness, width: SEGMENT_WIDTH_PX }}
    >
      <motion.span
        className="absolute inset-0 origin-left rounded-full"
        style={{ backgroundColor: color, scaleX: spring }}
      />
    </span>
  )
}

export function ScrollProgress({
  label,
  variant = 'bar',
  container,
  position = 'top',
  thickness = 4,
  color = 'var(--accent)',
  size = 56,
  segments = 8,
  showValue = false,
  smooth = true,
  className,
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll({ container })
  const spring = useSpring(scrollYProgress, SPRING)
  const value = smooth ? spring : scrollYProgress
  const [percent, setPercent] = useState(0)
  useMotionValueEvent(value, 'change', (latest) => setPercent(Math.round(clamp01(latest) * 100)))
  // 填充整条铺满、用平移滑入而不是缩放：渐变与圆头不变形，亮头就是条的末端。
  const fillX = useTransform(value, (latest) => `${-100 * (1 - clamp01(latest))}%`)
  const aria = {
    role: 'progressbar' as const,
    'aria-label': label,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': percent,
    'data-slot': 'scroll-progress',
    'data-variant': variant,
  }
  if (variant === 'bar') {
    return (
      <div {...aria} className={cn(POSITION[position], 'w-full', className)}>
        <div className="w-full overflow-hidden rounded-full bg-surface-4" style={{ height: Math.max(thickness, 2) }}>
          <motion.div
            className="h-full w-full rounded-full"
            style={{
              backgroundImage: `linear-gradient(90deg, ${color} 0%, ${color} calc(100% - 2.25rem), color-mix(in srgb, ${color} 60%, white) 100%)`,
              x: fillX,
            }}
          />
        </div>
        {showValue && <span className="sr-only">{`${percent}%`}</span>}
      </div>
    )
  }
  if (variant === 'ring') {
    const radius = (size - thickness) / 2
    return (
      <div {...aria} className={cn(POSITION[position], 'inline-flex shrink-0 items-center justify-center', className)}>
        <svg aria-hidden="true" className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={thickness}
            style={{ stroke: 'var(--bg-400)' }}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            pathLength={1}
            stroke={color}
            strokeLinecap="round"
            strokeWidth={thickness}
            style={{ pathLength: value }}
          />
        </svg>
        {showValue && (
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center font-semibold text-ink tabular-nums"
            style={{ fontSize: size * RING_LABEL_RATIO }}
          >
            {percent}
            <span className="ml-[0.06em] text-[0.56em] text-ink-3">%</span>
          </span>
        )}
      </div>
    )
  }
  if (variant === 'number') {
    return (
      <div
        {...aria}
        className={cn(POSITION[position], 'k-text-title inline-flex shrink-0 items-baseline leading-none', className)}
      >
        <span className="tabular-nums" style={{ color }}>
          {percent}
        </span>
        <span className="ml-[0.06em] text-[0.56em] text-ink-3">%</span>
      </div>
    )
  }
  return (
    <div {...aria} className={cn(POSITION[position], 'flex items-center gap-(--space-2)', className)}>
      {Array.from({ length: segments }, (_, index) => (
        <Segment key={index} value={value} index={index} segments={segments} thickness={thickness} color={color} />
      ))}
      {showValue && (
        <span className="k-text-caption ml-(--space-2) w-[3.25ch] text-right text-ink-3 tabular-nums">{percent}%</span>
      )}
    </div>
  )
}

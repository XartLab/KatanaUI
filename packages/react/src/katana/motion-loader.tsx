// SPDX-License-Identifier: MIT
// 改自 SmoothUI motion-loader（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 一组圆形小加载指示：轨道、彗星、雷达、波形条、点环、呼吸光、方块蛇、变形环；都从 size 一个数缩放，颜色跟文字色（currentColor）。
// 与 GridLoader 的分工：GridLoader 是像素点阵，MotionLoader 是连续运动的圆形。
// 与原件的差别：只留 8 个款式（去掉牛顿摆、钟摆、沙漏、方块翻转：交易面板里不常用，且摆动类不好缩到 16px）；
// 读屏名必填；时长常量照原件（周期 1.1 秒、慢 1.4 秒），speed 是倍率。
import { motion } from 'motion/react'
import type { CSSProperties, ReactElement } from 'react'
import { cn } from '../lib/cn.ts'

export const MOTION_LOADER_VARIANTS = [
  'orbit',
  'comet',
  'radar',
  'wave-bars',
  'dot-ring',
  'breathing-glow',
  'square-snake',
  'morph-ring',
] as const
export type MotionLoaderVariant = (typeof MOTION_LOADER_VARIANTS)[number]

type Bezier = [number, number, number, number]
const LINEAR: Bezier = [0, 0, 1, 1]
const EASE_IN_OUT: Bezier = [0.645, 0.045, 0.355, 1]
const EASE_OUT: Bezier = [0.23, 1, 0.32, 1]
// 周期与各款式的比例，全部来自 SmoothUI motion-loader。
const CYCLE = 1.1
const SLOW_CYCLE = 1.4
const DOT_RATIO = 0.2
const SMALL_DOT_RATIO = 0.14
const TRACK_OPACITY = 0.2
const TRAIL_LENGTH = 4
const TRAIL_STEP_DEG = 16
const WAVE_BARS = 5
const WAVE_MIN_SCALE = 0.3
const WAVE_STAGGER = 0.1
const RING_DOTS = 8
const RING_DOT_FADE = 0.15
const RING_STAGGER = 0.09
const SNAKE_CELL_RATIO = 0.38
const GLOW_SCALE = 1.25
const GLOW_MIN_OPACITY = 0.45

const loop = (duration: number, ease: Bezier, delay = 0) => ({
  duration,
  ease,
  delay,
  repeat: Infinity,
  repeatType: 'loop' as const,
})
const dot = (diameter: number): CSSProperties => ({ width: diameter, height: diameter })
const ids = (prefix: string, count: number) => Array.from({ length: count }, (_, index) => `${prefix}-${index}`)

type Part = { size: number; speed: number }

function Orbit({ size, speed }: Part) {
  const d = size * DOT_RATIO
  return (
    <>
      <span className="absolute inset-0 rounded-full border border-current" style={{ opacity: TRACK_OPACITY }} />
      <motion.span className="absolute inset-0" animate={{ rotate: 360 }} transition={loop(CYCLE / speed, LINEAR)}>
        <span
          className="absolute top-0 left-1/2 rounded-full bg-current"
          style={{ ...dot(d), marginLeft: -d / 2, marginTop: -d / 2 }}
        />
      </motion.span>
    </>
  )
}

function Comet({ size, speed }: Part) {
  const d = size * SMALL_DOT_RATIO
  return (
    <motion.span className="absolute inset-0" animate={{ rotate: 360 }} transition={loop(CYCLE / speed, LINEAR)}>
      {ids('comet', TRAIL_LENGTH).map((id, index) => (
        <span key={id} className="absolute inset-0" style={{ transform: `rotate(${-index * TRAIL_STEP_DEG}deg)` }}>
          <span
            className="absolute top-0 left-1/2 rounded-full bg-current"
            style={{
              ...dot(d * (1 - index / (TRAIL_LENGTH * 2))),
              marginLeft: -d / 2,
              opacity: 1 - index / TRAIL_LENGTH,
            }}
          />
        </span>
      ))}
    </motion.span>
  )
}

function Radar({ size, speed }: Part) {
  const d = size * SMALL_DOT_RATIO
  return (
    <>
      <span className="absolute inset-0 rounded-full border border-current" style={{ opacity: TRACK_OPACITY }} />
      <span className="absolute inset-0 overflow-hidden rounded-full">
        <motion.span
          className="absolute inset-0"
          style={{ background: 'conic-gradient(from 0deg, transparent 0deg, transparent 260deg, currentColor 360deg)' }}
          animate={{ rotate: 360 }}
          transition={loop(CYCLE / speed, LINEAR)}
        />
      </span>
      <span
        className="absolute top-1/2 left-1/2 rounded-full bg-current"
        style={{ ...dot(d), marginLeft: -d / 2, marginTop: -d / 2 }}
      />
    </>
  )
}

function WaveBars({ size, speed }: Part) {
  return (
    <span className="absolute inset-0 flex items-center justify-between" style={{ gap: size / (WAVE_BARS * 2) / 2 }}>
      {ids('wave', WAVE_BARS).map((id, index) => (
        <motion.span
          key={id}
          className="flex-1 rounded-full bg-current"
          style={{ height: size }}
          animate={{ scaleY: [WAVE_MIN_SCALE, 1, WAVE_MIN_SCALE] }}
          transition={loop(CYCLE / speed, EASE_IN_OUT, index * WAVE_STAGGER)}
        />
      ))}
    </span>
  )
}

function DotRing({ size, speed }: Part) {
  const d = size * SMALL_DOT_RATIO
  const radius = size / 2 - d / 2
  return (
    <>
      {ids('ring', RING_DOTS).map((id, index) => (
        <motion.span
          key={id}
          className="absolute top-1/2 left-1/2 rounded-full bg-current"
          style={{
            ...dot(d),
            marginLeft: -d / 2,
            marginTop: -d / 2,
            transform: `rotate(${(index * 360) / RING_DOTS}deg) translateY(${-radius}px)`,
          }}
          animate={{ opacity: [1, RING_DOT_FADE] }}
          transition={loop(CYCLE / speed, LINEAR, index * RING_STAGGER)}
        />
      ))}
    </>
  )
}

function BreathingGlow({ size, speed }: Part) {
  return (
    <>
      <motion.span
        className="absolute inset-0 rounded-full bg-current blur-md"
        style={{ opacity: GLOW_MIN_OPACITY }}
        animate={{ opacity: [GLOW_MIN_OPACITY, 0, GLOW_MIN_OPACITY], scale: [1, GLOW_SCALE, 1] }}
        transition={loop(SLOW_CYCLE / speed, EASE_IN_OUT)}
      />
      <motion.span
        className="rounded-full bg-current"
        style={dot(size / 2)}
        animate={{ scale: [1, GLOW_SCALE, 1] }}
        transition={loop(SLOW_CYCLE / speed, EASE_OUT)}
      />
    </>
  )
}

function SquareSnake({ size, speed }: Part) {
  const cell = size * SNAKE_CELL_RATIO
  const travel = size - cell
  const corners: CSSProperties[] = [
    { left: 0, top: 0 },
    { left: travel, top: 0 },
    { left: travel, top: travel },
    { left: 0, top: travel },
  ]
  return (
    <>
      {ids('snake', 4).map((id, index) => (
        <span
          key={id}
          className="absolute rounded-sm bg-current"
          style={{ ...corners[index], ...dot(cell), opacity: TRACK_OPACITY }}
        />
      ))}
      <motion.span
        className="absolute top-0 left-0 rounded-sm bg-current"
        style={dot(cell)}
        animate={{ x: [0, travel, travel, 0, 0], y: [0, 0, travel, travel, 0] }}
        transition={{ ...loop(SLOW_CYCLE / speed, EASE_IN_OUT), times: [0, 0.25, 0.5, 0.75, 1] }}
      />
    </>
  )
}

function MorphRing({ size, speed }: Part) {
  return (
    <motion.svg
      className="absolute inset-0 stroke-current"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      animate={{ scale: [1, 0.88, 1] }}
      transition={loop(CYCLE / speed, EASE_IN_OUT)}
    >
      <motion.circle
        cx="24"
        cy="24"
        r="20"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="62 64"
        style={{ transformOrigin: 'center' }}
        animate={{ rotate: 360 }}
        transition={loop(CYCLE / speed, LINEAR)}
      />
      <motion.circle
        cx="24"
        cy="24"
        r="11"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="24 45"
        opacity={0.45}
        style={{ transformOrigin: 'center' }}
        animate={{ rotate: -360 }}
        transition={loop((CYCLE * 1.5) / speed, LINEAR)}
      />
    </motion.svg>
  )
}

const RENDERERS: Record<MotionLoaderVariant, (part: Part) => ReactElement> = {
  orbit: Orbit,
  comet: Comet,
  radar: Radar,
  'wave-bars': WaveBars,
  'dot-ring': DotRing,
  'breathing-glow': BreathingGlow,
  'square-snake': SquareSnake,
  'morph-ring': MorphRing,
}

export type MotionLoaderProps = {
  /** Accessible name, for example "Syncing positions". */
  label: string
  /** Which animation to draw. */
  variant?: MotionLoaderVariant
  /** Side of the square in pixels; every variant scales from it. */
  size?: number
  /** Speed multiplier; 2 runs twice as fast. */
  speed?: number
  /** Any CSS colour, tokens included; defaults to the current text colour. */
  color?: string
  /** Extra class name on the root. */
  className?: string
}

export function MotionLoader({ label, variant = 'orbit', size = 24, speed = 1, color, className }: MotionLoaderProps) {
  const Renderer = RENDERERS[variant]
  return (
    <span
      role="status"
      aria-label={label}
      data-slot="motion-loader"
      data-variant={variant}
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size, color: color ?? 'currentColor' }}
    >
      <Renderer size={size} speed={speed > 0 ? speed : 1} />
    </span>
  )
}

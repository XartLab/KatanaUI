// SPDX-License-Identifier: MIT
// 改自 SmoothUI exposure-slider（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 刻度尺式的双向调节：中间一根定位线，左右拖动刻度尺，对准的刻度亮起，上方环形读数左右半圆分别表示正负。
// 拿来调「净敞口、仓位偏移、杠杆」这类有正有负、中点是 0 的量；松手吸附到刻度；键盘 ← → 走一格、PageUp / PageDown 走十格、Home / End 到两端。
// 与 Slider 的分工：Slider 是 0 到 N 的单向值与区间，ExposureSlider 是以中点为基准的双向偏移，手感是拨盘。
// 与原件的差别：重写了取值与拖动（原件靠偏移量反推值，步长不为 1 时会错位），改成「当前格序号」为唯一状态，受控 / 非受控都支持；
// 加了 role=slider 与键盘；正负可按涨跌色着色（tone="pnl"）；读数格式由调用方给。
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

// 一格的宽（像素）：3px 的刻度加 10px 的缝，来自 SmoothUI exposure-slider。
const NOTCH_WIDTH = 13
// 刻度尺的弹簧参数来自 SmoothUI exposure-slider（damping 30、mass 0.5、stiffness 300）。
const SPRING = { damping: 30, mass: 0.5, stiffness: 300 }
const NOTCH_HEIGHT = 40
const PAGE_NOTCHES = 10

const round = (value: number) => Math.round(value * 1e9) / 1e9

export type ExposureSliderProps = {
  /** Accessible name of the dial, for example "Net exposure". */
  label: string
  /** Lowest value, at the left end of the ruler. */
  min?: number
  /** Highest value, at the right end of the ruler. */
  max?: number
  /** Distance between two notches. */
  step?: number
  /** Value (controlled). */
  value?: number
  /** Value at first render when uncontrolled. */
  defaultValue?: number
  /** Called with the new value whenever the notch under the line changes. */
  onValueChange?: (value: number) => void
  /** Turn the number into text; the default prints it with a sign. */
  format?: (value: number) => string
  /** pnl paints positive values with the gain colour and negative ones with the loss colour; accent paints both with the accent. */
  tone?: 'accent' | 'pnl'
  /** Draw the ring and the number above the ruler. */
  showIndicator?: boolean
  /** Extra class name on the root. */
  className?: string
}

const defaultFormat = (value: number) => (value > 0 ? `+${value}` : String(value))

function Notch({ index, position, active }: { index: number; position: MotionValue<number>; active: string }) {
  // 离对准线多少格：决定这根刻度的透明度、露出多少、是不是亮的那根。
  const distance = useTransform(position, (latest) => Math.abs(index - (-latest - NOTCH_WIDTH / 2) / NOTCH_WIDTH))
  const opacity = useTransform(distance, [0, 1, 3], [1, 0.6, 0.3])
  const clip = useTransform(distance, [0, 1, 2], [0, 30, 50])
  const clipPath = useTransform(clip, (percent) => `inset(${percent}% 0px 0px)`)
  const background = useTransform(distance, (d) => (d < 0.5 ? active : 'var(--ink-300)'))
  return (
    <li
      className="absolute top-0 flex h-full items-center justify-center"
      style={{ left: index * NOTCH_WIDTH, width: NOTCH_WIDTH }}
    >
      <motion.div
        className="rounded-sm"
        style={{ width: 3, height: NOTCH_HEIGHT, opacity, clipPath, backgroundColor: background }}
      />
    </li>
  )
}

export function ExposureSlider({
  label,
  min = -20,
  max = 20,
  step = 1,
  value,
  defaultValue = 0,
  onValueChange,
  format = defaultFormat,
  tone = 'accent',
  showIndicator = true,
  className,
}: ExposureSliderProps) {
  const count = Math.floor(round((max - min) / step)) + 1
  const [own, setOwn] = useState(defaultValue)
  const current = value ?? own
  const indexOf = useCallback(
    (v: number) => Math.min(count - 1, Math.max(0, Math.round((v - min) / step))),
    [count, min, step],
  )
  const index = indexOf(current)
  const target = useMotionValue(-(index * NOTCH_WIDTH + NOTCH_WIDTH / 2))
  const position = useSpring(target, SPRING)
  // 值从外面变了（受控），刻度尺跟过去；拖动时 commit 已经把目标放好了，这里再放一次是同一个值。
  useEffect(() => {
    target.set(-(index * NOTCH_WIDTH + NOTCH_WIDTH / 2))
  }, [index, target])
  const commit = (nextIndex: number) => {
    const clamped = Math.min(count - 1, Math.max(0, nextIndex))
    const next = round(min + clamped * step)
    target.set(-(clamped * NOTCH_WIDTH + NOTCH_WIDTH / 2))
    if (next !== current) {
      setOwn(next)
      onValueChange?.(next)
    }
  }
  const drag = useRef<{ x: number; index: number } | null>(null)
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: event.clientX, index }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current
    if (!start) return
    // 刻度尺跟着手走：向左拖，值变大。
    commit(Math.round(start.index - (event.clientX - start.x) / NOTCH_WIDTH))
  }
  const end = () => {
    drag.current = null
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowUp: index + 1,
      ArrowLeft: index - 1,
      ArrowDown: index - 1,
      PageUp: index + PAGE_NOTCHES,
      PageDown: index - PAGE_NOTCHES,
      Home: 0,
      End: count - 1,
    }
    const next = moves[event.key]
    if (next === undefined) return
    event.preventDefault()
    commit(next)
  }
  const color = (v: number) =>
    tone === 'pnl' ? (v > 0 ? 'var(--pnl-up)' : v < 0 ? 'var(--pnl-down)' : 'var(--ink-100)') : 'var(--accent)'
  const active = color(current)
  // 环：右半圆画正的、左半圆画负的，比例按离 0 的距离占该侧全程。
  const ratio = current >= 0 ? (max > 0 ? current / max : 0) : min < 0 ? -current / -min : 0
  return (
    <div
      data-slot="exposure-slider"
      className={cn('flex w-full max-w-[500px] flex-col items-center gap-(--space-6) text-ink', className)}
    >
      {showIndicator && (
        <div className="relative flex size-[75px] items-center justify-center">
          <svg aria-hidden="true" className="absolute inset-0 size-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="var(--bg-300)" stroke="var(--line-200)" strokeWidth="3" />
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              pathLength={1}
              stroke={active}
              strokeWidth="3"
              strokeDasharray={`${Math.abs(ratio)} ${1 - Math.abs(ratio)}`}
              style={{
                transform: current < 0 ? 'scaleX(-1) rotate(-90deg)' : 'rotate(-90deg)',
                transformBox: 'fill-box',
                transformOrigin: '50% 50%',
              }}
            />
          </svg>
          <span
            data-slot="exposure-slider-value"
            className="k-text-title absolute tabular-nums"
            style={{ color: active }}
          >
            {format(current)}
          </span>
        </div>
      )}
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-valuetext={format(current)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={onKeyDown}
        data-slot="exposure-slider-ruler"
        className={cn('relative h-10 w-full cursor-grab touch-pan-y select-none active:cursor-grabbing', focusRing)}
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)',
        }}
      >
        <motion.ul className="absolute top-0 left-1/2 m-0 h-full list-none p-0" style={{ x: position }}>
          {Array.from({ length: count }, (_, i) => (
            <Notch key={i} index={i} position={position} active={active} />
          ))}
        </motion.ul>
      </div>
    </div>
  )
}

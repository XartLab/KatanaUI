// SPDX-License-Identifier: MIT
// 单向刻度尺：中间一根定位线，左右拖动刻度尺，从 min 到当前值的刻度都亮，上方的环从 12 点顺时针画到当前值占全程的比例。
// 拿来调「仓位比例、杠杆、数量占可用的百分比」这类只有一侧的量；有正有负、中点是 0 的量用 ExposureSlider。
// 手感（一格的宽、弹簧、刻度按离定位线的距离变淡变矮、拖动跟手、松手吸附、← → 一格、Home / End 到两端）照本包的 ExposureSlider，
// 它改自 SmoothUI exposure-slider（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）。
// 带数字的大刻度、点一下刻度尺滑到点的那一格、Shift + 方向键与 PageUp / PageDown 走一大格、点按与拖动的分界 4px，
// 改自 Arc ruler-slider（https://github.com/kuratlielia/arc-library ，免费部分 MIT，© 2026 Elia Kuratli；2026-11-23 读，提交 8302b52）；
// 它的甩动惯性、拉过头回弹、触控板横滑、滚动数字读数没有取，手感跟 ExposureSlider 一致。
// 交互照 TradingView 下单面板的数量滑块：刻度从左端亮到当前值、点带数字的档位就到那一档（只取功能，没读到它的帮助页，待核对）。
// 与 ExposureSlider 的差别：大刻度只标「大刻度步长的整数倍」（1× 起的杠杆读 5×、10×…，不读 1×、6×…）；值在 min 时数字用中性色、环不画弧。
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

// 一格的宽（像素）与刻度高：3px 的刻度加 10px 的缝，来自 SmoothUI exposure-slider，与 ExposureSlider 同。
const NOTCH_WIDTH = 13
const NOTCH_HEIGHT = 40
// 刻度尺的弹簧参数来自 SmoothUI exposure-slider（damping 30、mass 0.5、stiffness 300），与 ExposureSlider 同。
const SPRING = { damping: 30, mass: 0.5, stiffness: 300 }
// 按下后挪不到 4px 算点按：来自 Arc ruler-slider 的 TAP_SLOP。
const TAP_SLOP = 4

const round = (value: number) => Math.round(value * 1e9) / 1e9

export type RulerSliderProps = {
  /** Accessible name of the ruler, for example "Position size". */
  label: string
  /** Lowest value, at the left end of the ruler; the lit notches start here. */
  min?: number
  /** Highest value, at the right end of the ruler. */
  max?: number
  /** Distance between two notches. */
  step?: number
  /** Notches in one large step: values on a multiple of it get a number, and PageUp / PageDown or Shift with an arrow move this far. */
  majorEvery?: number
  /** Value (controlled). */
  value?: number
  /** Value at first render when uncontrolled; defaults to min. */
  defaultValue?: number
  /** Called with the new value whenever the notch under the line changes. */
  onValueChange?: (value: number) => void
  /** Turn the number into text for the readout, the numbered notches and the spoken value. */
  format?: (value: number) => string
  /** Draw the ring and the number above the ruler. */
  showIndicator?: boolean
  /** Extra class name on the root. */
  className?: string
}

/** 按键要走到的格序号；不认的键返回 null。Shift + 方向键与 PageUp / PageDown 走一大格（majorEvery 格）。 */
export function rulerKeyIndex(
  key: string,
  shiftKey: boolean,
  index: number,
  count: number,
  majorEvery: number,
): number | null {
  const one = shiftKey ? majorEvery : 1
  const moves: Record<string, number> = {
    ArrowRight: index + one,
    ArrowUp: index + one,
    ArrowLeft: index - one,
    ArrowDown: index - one,
    PageUp: index + majorEvery,
    PageDown: index - majorEvery,
    Home: 0,
    End: count - 1,
  }
  return moves[key] ?? null
}

/** 点按处离定位线 offset 像素，刻度尺要滑到的格序号（不夹范围，交给 commit）。 */
export const rulerTapIndex = (index: number, offset: number) => index + Math.round(offset / NOTCH_WIDTH)

/** 环画多少：从 min 起到当前值占全程的比例，夹在 0 到 1。 */
export const rulerRatio = (value: number, min: number, max: number) =>
  max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0

function Notch({
  index,
  position,
  active,
  label,
}: {
  index: number
  position: MotionValue<number>
  active: string
  label?: string
}) {
  // 离定位线多少格（带正负）：右边为正。决定透明度、露出多少，以及亮不亮：定位线和它左边（min 那一侧）的都亮。
  const offset = useTransform(position, (latest) => index - (-latest - NOTCH_WIDTH / 2) / NOTCH_WIDTH)
  const distance = useTransform(offset, Math.abs)
  const opacity = useTransform(distance, [0, 1, 3], [1, 0.6, 0.3])
  const clip = useTransform(distance, [0, 1, 2], [0, 30, 50])
  const clipPath = useTransform(clip, (percent) => `inset(${percent}% 0px 0px)`)
  const background = useTransform(offset, (o) => (o < 0.5 ? active : 'var(--ink-300)'))
  return (
    <li
      className="absolute top-0 flex h-full items-center justify-center"
      style={{ left: index * NOTCH_WIDTH, width: NOTCH_WIDTH }}
    >
      <motion.div
        data-ruler-notch=""
        className="rounded-sm"
        style={{ width: 3, height: NOTCH_HEIGHT, opacity, clipPath, backgroundColor: background }}
      />
      {label !== undefined && (
        <span
          data-slot="ruler-slider-mark"
          className="k-text-micro absolute top-full left-1/2 mt-(--space-1) -translate-x-1/2 whitespace-nowrap text-ink-4 tabular-nums"
        >
          {label}
        </span>
      )}
    </li>
  )
}

export function RulerSlider({
  label,
  min = 0,
  max = 100,
  step = 1,
  majorEvery = 10,
  value,
  defaultValue,
  onValueChange,
  format = String,
  showIndicator = true,
  className,
}: RulerSliderProps) {
  const count = Math.floor(round((max - min) / step)) + 1
  const major = Math.max(1, Math.round(majorEvery))
  const majorStep = step * major
  const [own, setOwn] = useState(defaultValue ?? min)
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
  const drag = useRef<{ x: number; index: number; moved: boolean } | null>(null)
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    drag.current = { x: event.clientX, index, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current
    if (!start) return
    const dx = event.clientX - start.x
    if (!start.moved && Math.abs(dx) < TAP_SLOP) return
    start.moved = true
    // 刻度尺跟着手走：向左拖，值变大。
    commit(Math.round(start.index - dx / NOTCH_WIDTH))
  }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current
    drag.current = null
    if (!start || start.moved) return
    // 点按：点的那一格滑到定位线下。
    const rect = event.currentTarget.getBoundingClientRect()
    commit(rulerTapIndex(index, event.clientX - (rect.left + rect.width / 2)))
  }
  const cancel = () => {
    drag.current = null
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = rulerKeyIndex(event.key, event.shiftKey, index, count, major)
    if (next === null) return
    event.preventDefault()
    commit(next)
  }
  const active = current <= min ? 'var(--ink-100)' : 'var(--accent)'
  const ratio = rulerRatio(current, min, max)
  // 大刻度：值落在大刻度步长整数倍上的那几格（容差去浮点尾巴）。
  const markOf = (i: number) => {
    const v = round(min + i * step)
    const k = v / majorStep
    return Math.abs(k - Math.round(k)) < 1e-6 ? format(v) : undefined
  }
  return (
    <div
      data-slot="ruler-slider"
      className={cn('flex w-full max-w-[500px] flex-col items-center gap-(--space-6) text-ink', className)}
    >
      {showIndicator && (
        <div className="relative flex size-[75px] items-center justify-center">
          <svg aria-hidden="true" className="absolute inset-0 size-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="var(--bg-300)" stroke="var(--line-200)" strokeWidth="3" />
            <circle
              data-slot="ruler-slider-arc"
              cx="50"
              cy="50"
              r="48"
              fill="none"
              pathLength={1}
              stroke={active}
              strokeWidth="3"
              strokeDasharray={`${ratio} ${1 - ratio}`}
              style={{ transform: 'rotate(-90deg)', transformBox: 'fill-box', transformOrigin: '50% 50%' }}
            />
          </svg>
          <span data-slot="ruler-slider-value" className="k-text-title absolute tabular-nums" style={{ color: active }}>
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
        aria-orientation="horizontal"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={cancel}
        onKeyDown={onKeyDown}
        data-slot="ruler-slider-ruler"
        className={cn('relative h-14 w-full cursor-grab touch-pan-y select-none active:cursor-grabbing', focusRing)}
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)',
        }}
      >
        <motion.ul className="absolute top-0 left-1/2 m-0 h-10 list-none p-0" style={{ x: position }}>
          {Array.from({ length: count }, (_, i) => (
            <Notch key={i} index={i} position={position} active={active} label={markOf(i)} />
          ))}
        </motion.ul>
      </div>
    </div>
  )
}

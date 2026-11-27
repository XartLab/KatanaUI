// SPDX-License-Identifier: MIT
// 改自 SmoothUI scrubber（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 一条带填充的擦洗条：左边写名字，右边写读数，指针在条上按下与拖动就把值擦到那里，松手停住。拿来擦回测时间点、拖下单数量、调价格偏移。
// 与 Slider 的分工：Slider 是表单里的单值或区间输入；Scrubber 是「读数在条里面」的紧凑擦洗控件，整条是抓手，适合一行里放一个量。
// 与 useScrubber 的分工：useScrubber（lib/use-scrubber.ts）是图上悬停选一格、可以是「没选中」的钩子；这里是连续（或按步长吸附）的值、总有一个值、按下才算，两者的状态模型不同，所以没有叠在那个钩子上，只共用它的键位习惯（Home / End）。
// 搬来的：填充条、刻度点、胶囊把手悬停时放大变实、按下拖动时去掉过渡（跟手）；弹簧换成我们 token 的 --ease-snappy。
// 改的：键盘 ← → ↑ ↓ 走一步、Shift 走十步、PageUp / PageDown 十步（原件没有 Shift 与翻页）；读数格式由调用方给；名字必填并当作读屏名。
import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { fillVar } from '../lib/fill.ts'
import { cn } from '../lib/cn.ts'

const PAGE_STEPS = 10

/** 把值夹进 [min, max] 并吸附到步长（从 min 起算）。纯函数。 */
export function scrubSnap(value: number, min: number, max: number, step: number): number {
  const snapped = step > 0 ? Math.round((value - min) / step) * step + min : value
  // 去掉浮点尾巴（0.1 的整数倍）。
  const clean = Math.round(snapped * 1e9) / 1e9
  return Math.min(max, Math.max(min, clean))
}

/** 指针横坐标（相对条左端）到值。条宽为 0（还没排版）返回 null。纯函数。 */
export function scrubValueAt(x: number, width: number, min: number, max: number, step: number): number | null {
  if (!(width > 0)) return null
  const ratio = Math.min(1, Math.max(0, x / width))
  return scrubSnap(min + ratio * (max - min), min, max, step)
}

export type ScrubberProps = {
  /** Name shown on the left of the bar and read by screen readers, for example "Quantity". */
  label: string
  /** Controlled value. */
  value?: number
  /** Initial value when uncontrolled. */
  defaultValue?: number
  /** Called whenever the value changes while dragging or pressing keys. */
  onValueChange?: (value: number) => void
  /** Lowest value, at the left end. */
  min?: number
  /** Highest value, at the right end. */
  max?: number
  /** Distance between two values; the value snaps to it. */
  step?: number
  /** Number of tick dots between the ends; 0 hides them. */
  ticks?: number
  /** Turns the value into the text on the right, for example a price or a date; two decimals when omitted. */
  format?: (value: number) => string
  /** Extra class name on the root. */
  className?: string
}

export function Scrubber({
  label,
  value: controlled,
  defaultValue = 0,
  onValueChange,
  min = 0,
  max = 1,
  step = 0.01,
  ticks = 9,
  format = (v) => v.toFixed(2),
  className,
}: ScrubberProps) {
  const track = useRef<HTMLDivElement>(null)
  const [inner, setInner] = useState(defaultValue)
  const [dragging, setDragging] = useState(false)
  const value = controlled ?? inner
  const range = max - min
  const percent = range > 0 ? ((value - min) / range) * 100 : 0

  const commit = (next: number) => {
    const snapped = scrubSnap(next, min, max, step)
    if (controlled === undefined) setInner(snapped)
    if (snapped !== value) onValueChange?.(snapped)
  }
  const at = (clientX: number) => {
    const box = track.current?.getBoundingClientRect()
    return box ? scrubValueAt(clientX - box.left, box.width, min, max, step) : null
  }
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.focus()
    setDragging(true)
    const next = at(event.clientX)
    if (next !== null) commit(next)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    const next = at(event.clientX)
    if (next !== null) commit(next)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const big = event.shiftKey ? PAGE_STEPS : 1
    const moves: Record<string, number | undefined> = {
      ArrowRight: value + step * big,
      ArrowUp: value + step * big,
      ArrowLeft: value - step * big,
      ArrowDown: value - step * big,
      PageUp: value + step * PAGE_STEPS,
      PageDown: value - step * PAGE_STEPS,
      Home: min,
      End: max,
    }
    const next = moves[event.key]
    if (next === undefined) return
    event.preventDefault()
    commit(next)
  }

  return (
    <div className={cn('k-scrubber', className)} data-slot="scrubber" data-dragging={dragging ? '' : undefined}>
      <div
        ref={track}
        className="k-scrubber-track"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={format(value)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={onKeyDown}
      >
        <div className="k-scrubber-fill" style={fillVar(percent / 100)} />
        {ticks > 0 && (
          <div className="k-scrubber-ticks" aria-hidden="true">
            {Array.from({ length: ticks }, (_, i) => (
              <i key={i} style={{ left: `${((i + 1) / (ticks + 1)) * 100}%` } as CSSProperties} />
            ))}
          </div>
        )}
        <div className="k-scrubber-thumb" aria-hidden="true" style={fillVar(percent / 100)} />
        <span className="k-scrubber-label">{label}</span>
        <span className="k-scrubber-value" data-slot="scrubber-value">
          {format(value)}
        </span>
      </div>
    </div>
  )
}

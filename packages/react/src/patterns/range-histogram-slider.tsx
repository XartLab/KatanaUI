// SPDX-License-Identifier: MIT
// 直方图上的区间滑块：一排柱子画出全体的分布，下面一条轨道两个把手，拖出来的区间里的柱子亮、区间外的暗。
// 用在筛选器：在全市场分布上拖市值、涨幅、换手的区间。功能参照 Arc Range histogram slider（uiarc.dev，2026-11-14 读），实现原创。
// 键盘与角色照 WAI-ARIA APG 的 Multi-Thumb Slider：两个 role=slider，各自带 aria-valuemin / max / now / valuetext，
// 方向键一步、PageUp / PageDown 十步、Home / End 去端点，两个把手不交叉。文字全由 props 传。
import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { seqColor } from '../lib/chart/chart-kit/series-colors.ts'
import { moveThumb, nearestThumb, ratioOf, snapValue, stepValue, valueAt, type Thumb } from './range-histogram-model.ts'

// 箱的高度越高颜色越亮（顺序色阶 seq-200..600，dataviz §2）：取 lib/chart 的 seqColor（0..4 档）。
const SEQ_TOP = 4

/** Texts of RangeHistogramSlider (the package ships no text). */
export type RangeHistogramSliderLabels = {
  /** Accessible name of the lower thumb (a full phrase, such as "Market cap minimum"). 下限把手的读屏名。 */
  low: string
  /** Accessible name of the upper thumb. 上限把手的读屏名。 */
  high: string
}

export type RangeHistogramSliderProps = {
  /** 每一箱的个数，等宽分箱铺满 [min, max]；用 histogramBins 算。 */
  counts: readonly number[]
  min: number
  max: number
  /** 步长；不给用一箱的宽（(max - min) / 箱数）。 */
  step?: number
  value?: readonly [number, number]
  defaultValue?: readonly [number, number]
  onValueChange?: (value: [number, number]) => void
  /** 数值怎么写（读数行、读屏的 aria-valuetext 都用它）。 */
  formatValue?: (value: number) => string
  /** Thumb names: low and high (required). 两个把手的读屏名。 */
  labels: RangeHistogramSliderLabels
  /** 整条的读屏名。 */
  label: string
  /** 读数行：给了就写它的结果，不给写「下限 – 上限」。 */
  describe?: (range: readonly [number, number]) => ReactNode
  className?: string
}

/** Range filter drawn over the distribution histogram: two APG multi-thumb sliders; bars inside the range light up. */
export function RangeHistogramSlider({
  counts,
  min,
  max,
  step,
  value,
  defaultValue,
  onValueChange,
  formatValue = String,
  labels,
  label,
  describe,
  className,
}: RangeHistogramSliderProps) {
  const unit = step ?? (counts.length > 0 ? (max - min) / counts.length : (max - min) / 100)
  const [inner, setInner] = useState<readonly [number, number]>(defaultValue ?? [min, max])
  const range = value ?? inner
  const track = useRef<HTMLDivElement>(null)
  const dragging = useRef<Thumb | null>(null)
  const refs = { low: useRef<HTMLDivElement>(null), high: useRef<HTMLDivElement>(null) }
  const peak = Math.max(1, ...counts)
  const lowRatio = ratioOf(range[0], min, max)
  const highRatio = ratioOf(range[1], min, max)

  const commit = (thumb: Thumb, next: number) => {
    const moved = moveThumb(range, thumb, next)
    if (moved[0] === range[0] && moved[1] === range[1]) return
    if (value === undefined) setInner(moved)
    onValueChange?.(moved)
  }
  const ratioAt = (event: PointerEvent) => {
    const box = track.current!.getBoundingClientRect()
    return box.width > 0 ? (event.clientX - box.left) / box.width : 0
  }
  const drag = (event: PointerEvent) => {
    let thumb = dragging.current
    if (!thumb) return
    const ratio = ratioAt(event)
    // 两个把手叠在一起时按指针往哪边拖决定动哪个，否则 low 与 high 互相夹死、谁也拖不开。
    if (range[0] === range[1] && ratio !== lowRatio) thumb = ratio < lowRatio ? 'low' : 'high'
    dragging.current = thumb
    commit(thumb, snapValue(valueAt(ratio, min, max), min, max, unit))
  }
  const onKey = (thumb: Thumb) => (event: KeyboardEvent) => {
    const next = stepValue(thumb === 'low' ? range[0] : range[1], event.key, min, max, unit)
    if (next === null) return
    event.preventDefault()
    commit(thumb, next)
  }

  return (
    <div
      className={`k-range-hist${className ? ` ${className}` : ''}`}
      data-slot="range-histogram-slider"
      role="group"
      aria-label={label}
    >
      <div
        ref={track}
        className="k-range-hist-body"
        onPointerDown={(event) => {
          if (event.button !== 0) return
          const ratio = ratioAt(event)
          // 按在把手上就抓住它，不改值；按在柱子或轨道上，最近的把手跳过去。
          const hit = (event.target as HTMLElement).closest<HTMLElement>('[data-thumb]')?.dataset.thumb as
            | Thumb
            | undefined
          const thumb = hit ?? nearestThumb(ratio, lowRatio, highRatio)
          dragging.current = thumb
          event.currentTarget.setPointerCapture(event.pointerId)
          if (!hit) commit(thumb, snapValue(valueAt(ratio, min, max), min, max, unit))
          refs[thumb].current?.focus()
        }}
        onDragStart={(event) => event.preventDefault()}
        onPointerMove={drag}
        onPointerUp={() => {
          dragging.current = null
        }}
        onPointerCancel={() => {
          dragging.current = null
        }}
      >
        <div className="k-range-hist-bars" aria-hidden="true">
          {counts.map((count, index) => {
            const center = (index + 0.5) / counts.length
            return (
              <span
                // 箱数固定，下标就是箱的身份。
                key={index}
                className="k-range-hist-bar"
                data-in={center >= lowRatio && center <= highRatio ? 'true' : 'false'}
                style={{
                  height: `${(count / peak) * 100}%`,
                  background: seqColor((count / peak) * SEQ_TOP),
                }}
              />
            )
          })}
        </div>
        <div className="k-range-hist-rail" aria-hidden="true">
          <span
            className="k-range-hist-span"
            style={{ left: `${lowRatio * 100}%`, width: `${(highRatio - lowRatio) * 100}%` }}
          />
        </div>
        {(['low', 'high'] as const).map((thumb) => {
          const current = thumb === 'low' ? range[0] : range[1]
          return (
            <div
              key={thumb}
              ref={refs[thumb]}
              className="k-range-hist-thumb"
              data-thumb={thumb}
              role="slider"
              tabIndex={0}
              aria-label={labels[thumb]}
              aria-orientation="horizontal"
              aria-valuemin={thumb === 'low' ? min : range[0]}
              aria-valuemax={thumb === 'low' ? range[1] : max}
              aria-valuenow={current}
              aria-valuetext={formatValue(current)}
              style={{ left: `${(thumb === 'low' ? lowRatio : highRatio) * 100}%` }}
              onKeyDown={onKey(thumb)}
            />
          )
        })}
      </div>
      <output className="k-range-hist-readout">
        {describe ? describe(range) : `${formatValue(range[0])} – ${formatValue(range[1])}`}
      </output>
    </div>
  )
}

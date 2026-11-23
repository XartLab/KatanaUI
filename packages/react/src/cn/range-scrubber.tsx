// SPDX-License-Identifier: MIT
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import { moveThumb, nearestThumb, stepValue, type Thumb } from '../patterns/range-histogram-model.ts'
import { FLOW_MINUTES } from './flow-race-model.ts'
import { cnLabelsZh, type RangeScrubberLabels } from './labels.ts'
import {
  SCRUB_LUNCH,
  SCRUB_TICKS,
  presetRange,
  scrubBars,
  scrubClock,
  scrubNow,
  scrubRange,
  scrubRangeOf,
  shiftRange,
  type ScrubPoint,
} from './range-scrubber-model.ts'

// 区间时间轴（KatanaUI #11 第 6 项）：一条 09:30–15:00 的交易时段轴（午休不占宽度，中间一条竖虚线是 11:30/13:00），在上面拖出一个时段，调用方拿这个时段去算板块与个股的区间涨幅、净额、强度并排序。
// 功能参照开盘啦「区间统计」（App Store 介绍与官网教程 kaipanla.com/article/42660、42661，2026-11-15 读：可拖动时间轴选区间、切换强度 / 涨幅 / 净额），
// 交互照 TradingView 图表底部的区间选择：按住选区中间整段平移，按两端改起止，「近 N 分钟」一键选；界面形态开盘啦没写，是我们定的。
// 拖与键盘复用 RangeHistogramSlider 的模型（APG Multi-Thumb Slider：两个 role=slider，方向键一分钟、PageUp / PageDown 十分钟、Home / End 去端点，两把手不交叉）。
// 「现在」之后的时段还没发生，盖一层斜纹、选不进去。背景柱（成交额之类）由调用方给，可不给。文字走 labels，口径（怎么算涨幅、净额、强度）由调用方定。

/** Drag modes: one thumb, or the whole window. */
type Drag = { mode: 'thumb'; thumb: Thumb } | { mode: 'move'; anchor: number; start: [number, number] }

export type RangeScrubberProps = {
  /**
   * The selected session span as clock times, such as ["09:30", "10:15"] (controlled).
   * 选中的时段（受控），写成时刻。
   */
  value?: readonly [string, string]
  /**
   * The initial span when uncontrolled; the whole elapsed session when omitted.
   * 不受控时的初始时段；不给就是开盘到现在。
   */
  defaultValue?: readonly [string, string]
  /**
   * Called with the new span as clock times; a start on the lunch point reads 13:00, an end reads 11:30.
   * 时段变了：起点正好在午休那一点写 13:00，终点写 11:30。
   */
  onValueChange?: (value: [string, string]) => void
  /**
   * Clock time of the latest data, such as "10:42"; later minutes have not happened and cannot be selected. 15:00 when omitted.
   * 最新数据的时刻；之后的分钟还没发生，选不进去。不给按 15:00（全天）。
   */
  now?: string
  /**
   * Background bars (turnover per minute and the like), each drawn to the next point's time; none when omitted.
   * 背景柱（每分钟成交额之类），每根画到下一个点的时刻；不给不画。
   */
  bars?: readonly ScrubPoint[]
  /**
   * Quick spans in trading minutes back from now, such as [5, 15, 30, 60]; no buttons when omitted.
   * 「近 N 分钟」快捷钮（交易分钟，从现在往回数）；不给没有。
   */
  presets?: readonly number[]
  /**
   * Keys of the ranking measures to switch between, such as ["change", "net", "strength"]; names come from labels.metrics. No switch when omitted.
   * 统计口径切换（键名，名字读 labels.metrics）；不给没有。
   */
  metrics?: readonly string[]
  /**
   * The selected measure (controlled).
   * 选中的口径（受控）。
   */
  metric?: string
  /**
   * The initially selected measure when uncontrolled; the first of `metrics` when omitted.
   * 不受控时初始选中的口径；不给取第一个。
   */
  defaultMetric?: string
  /** Called with the newly selected measure key. */
  onMetricChange?: (metric: string) => void
  /**
   * Text pack; the Simplified Chinese default is used when omitted.
   * 文案；不传用简体中文默认。
   */
  labels?: RangeScrubberLabels
  /** Extra class names. */
  className?: string
}

const pct = (share: number) => `${share * 100}%`
/** 轴上第几个交易分钟的位置（先乘 100 再除，免得 0.3 × 100 写出 30.000000000000004%）。 */
const pos = (index: number) => `${(index * 100) / FLOW_MINUTES}%`

export function RangeScrubber({
  value,
  defaultValue,
  onValueChange,
  now,
  bars,
  presets,
  metrics,
  metric,
  defaultMetric,
  onMetricChange,
  labels = cnLabelsZh.rangeScrubber,
  className,
}: RangeScrubberProps) {
  const top = scrubNow(now)
  const [inner, setInner] = useState<[number, number]>(() =>
    defaultValue ? scrubRangeOf(defaultValue, top) : [0, top],
  )
  const range = value ? scrubRangeOf(value, top) : scrubRange(inner, top)
  const [innerMetric, setInnerMetric] = useState<string | null>(defaultMetric ?? metrics?.[0] ?? null)
  const shownMetric = metric ?? innerMetric
  const track = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const refs = { low: useRef<HTMLDivElement>(null), high: useRef<HTMLDivElement>(null) }
  const placed = bars ? scrubBars(bars) : []

  const commit = (next: readonly [number, number]) => {
    const tidy = scrubRange(next, top)
    if (tidy[0] === range[0] && tidy[1] === range[1]) return
    if (value === undefined) setInner(tidy)
    onValueChange?.([scrubClock(tidy[0], 'low'), scrubClock(tidy[1], 'high')])
  }
  const indexAt = (event: PointerEvent) => {
    const box = track.current!.getBoundingClientRect()
    const ratio = box.width > 0 ? (event.clientX - box.left) / box.width : 0
    return Math.min(top, Math.max(0, Math.round(ratio * FLOW_MINUTES)))
  }
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const at = indexAt(event)
    const hit = (event.target as HTMLElement).closest<HTMLElement>('[data-thumb]')?.dataset.thumb as Thumb | undefined
    event.currentTarget.setPointerCapture(event.pointerId)
    if (hit) {
      drag.current = { mode: 'thumb', thumb: hit }
      refs[hit].current?.focus()
      return
    }
    // 按在选区里面：整段平移（TradingView 区间选择的拖法）；按在选区外：近的那个把手跳过去，接着拖它。
    if (range[1] > range[0] && at > range[0] && at < range[1]) {
      drag.current = { mode: 'move', anchor: at, start: [range[0], range[1]] }
      return
    }
    const thumb = nearestThumb(at / FLOW_MINUTES, range[0] / FLOW_MINUTES, range[1] / FLOW_MINUTES)
    drag.current = { mode: 'thumb', thumb }
    commit(moveThumb(range, thumb, at))
    refs[thumb].current?.focus()
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (!state) return
    const at = indexAt(event)
    if (state.mode === 'move') {
      commit(shiftRange(state.start, at - state.anchor, top))
      return
    }
    // 两个把手叠在一起时按往哪边拖决定动哪个，不然谁也拖不开（同 RangeHistogramSlider）。
    let thumb = state.thumb
    if (range[0] === range[1] && at !== range[0]) thumb = at < range[0] ? 'low' : 'high'
    drag.current = { mode: 'thumb', thumb }
    commit(moveThumb(range, thumb, at))
  }
  const release = () => {
    drag.current = null
  }
  const onKey = (thumb: Thumb) => (event: KeyboardEvent) => {
    const next = stepValue(thumb === 'low' ? range[0] : range[1], event.key, 0, top, 1)
    if (next === null) return
    event.preventDefault()
    commit(moveThumb(range, thumb, next))
  }
  const activePreset =
    presets?.find((minutes) => {
      const span = presetRange(minutes, top)
      return span[0] === range[0] && span[1] === range[1]
    }) ?? null
  const from = scrubClock(range[0], 'low')
  const to = scrubClock(range[1], 'high')

  return (
    <section className={cn('k-rs', className)} data-slot="range-scrubber" aria-label={labels.region}>
      <div className="k-rs-head">
        <output className="k-rs-readout" data-slot="range-scrubber-readout">
          {labels.span(from, to, range[1] - range[0])}
        </output>
        {presets && presets.length > 0 && (
          <ToggleGroup
            size="sm"
            aria-label={labels.presetGroup}
            value={activePreset === null ? null : String(activePreset)}
            onValueChange={(next) => commit(presetRange(Number(next), top))}
          >
            {presets.map((minutes) => (
              <ToggleGroupItem key={minutes} value={String(minutes)}>
                {labels.preset(minutes)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
        {metrics && metrics.length > 0 && (
          <ToggleGroup
            size="sm"
            className="k-rs-metrics"
            aria-label={labels.metricGroup}
            value={shownMetric}
            onValueChange={(next) => {
              if (metric === undefined) setInnerMetric(next)
              onMetricChange?.(next)
            }}
          >
            {metrics.map((key) => (
              <ToggleGroupItem key={key} value={key}>
                {labels.metrics[key] ?? key}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </div>
      <div
        ref={track}
        className="k-rs-track"
        data-slot="range-scrubber-track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={release}
        onPointerCancel={release}
        onDragStart={(event) => event.preventDefault()}
      >
        <div className="k-rs-bars" aria-hidden="true">
          {placed.map((bar) => (
            <span
              key={bar.index}
              className="k-rs-bar"
              data-in={bar.index >= range[0] && bar.index < range[1] ? 'true' : 'false'}
              style={{ left: pct(bar.x0), width: pct(bar.x1 - bar.x0), height: pct(bar.share) }}
            />
          ))}
        </div>
        <span className="k-rs-lunch" aria-hidden="true" style={{ left: pos(SCRUB_LUNCH) }} />
        {top < FLOW_MINUTES && (
          <span
            className="k-rs-future"
            data-slot="range-scrubber-future"
            title={labels.future}
            aria-hidden="true"
            style={{ left: pos(top) }}
          />
        )}
        <span
          className="k-rs-span"
          data-slot="range-scrubber-span"
          aria-hidden="true"
          style={{ left: pos(range[0]), width: pos(range[1] - range[0]) }}
        />
        {(['low', 'high'] as const).map((thumb) => {
          const at = thumb === 'low' ? range[0] : range[1]
          return (
            <div
              key={thumb}
              ref={refs[thumb]}
              className="k-rs-thumb"
              data-thumb={thumb}
              role="slider"
              tabIndex={0}
              aria-label={labels[thumb]}
              aria-orientation="horizontal"
              aria-valuemin={thumb === 'low' ? 0 : range[0]}
              aria-valuemax={thumb === 'low' ? range[1] : top}
              aria-valuenow={at}
              aria-valuetext={scrubClock(at, thumb)}
              style={{ left: pos(at) }}
              onKeyDown={onKey(thumb)}
            />
          )
        })}
      </div>
      <div className="k-rs-ticks" aria-hidden="true">
        {SCRUB_TICKS.map((tick) => {
          const index = Math.round(tick.at * FLOW_MINUTES)
          return (
            <span key={index} className="k-rs-tick" data-major={tick.major || undefined} style={{ left: pos(index) }}>
              {tick.major
                ? index === SCRUB_LUNCH
                  ? `${scrubClock(index, 'high')}/${scrubClock(index, 'low')}`
                  : scrubClock(index)
                : null}
            </span>
          )
        })}
      </div>
    </section>
  )
}

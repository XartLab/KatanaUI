// SPDX-License-Identifier: MIT
/**
 * Rate limit planner: a day of jobs against one source's rate limit; the summed load is drawn against the limit and each job is a bar to drag or move with the keys.
 * 限额排程（KATANAview #1908 第二批）：一个数据源一天里的抓取任务（仓库回补、新闻轮询……）摆在时间轴上，叠起来的负载曲线跟它的限额比：
 * 头一行标题、状态（在限额内 / 接近上限 / 超过限额）、峰值与时刻；上面是负载面积，一道限额实线、一道预警虚线（限额 × buffer），超过限额的部分涂 danger；
 * 下面每个任务一行，条可以拖（按 15 分对齐），聚焦后 ←→ 挪 15 分、Shift 或 PageUp / PageDown 挪一小时、Home / End 到最早 / 最晚、Delete 删掉；
 * 已开始的任务（开始早于 now）不能挪。「错开」按负载大小一个个重摆，压低峰值。每次挪动在底栏用读屏播报结果。
 * 功能与键位参照 affectUI 的 Rate Limit Planner（affectui.com/components/rate-limit-planner，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创）。
 * 跟它不同：负载是矩形（匀速打请求的任务），不是「爬升再衰减」；没有设置对话框与「加任务」（任务从哪来是调用方的事）；不画实测用量。
 * 纯逻辑在 rate-limit-model.ts。时间是从窗口开始算的分钟，怎么写成钟点由调用方给（formatTime）。包里不带语言。
 */
import { XIcon } from 'lucide-react'
import { useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { niceTicks, PLOT_W } from '../../lib/chart/series-geometry.ts'
import { Button } from '../../primitives/button.tsx'
import {
  CURVE_STEP,
  DAY_MINUTES,
  clampStart,
  keyMove,
  loadCurve,
  peakOf,
  planStatus,
  snap,
  spreadRuns,
  type PlanStatus,
  type PlannedRun,
} from './rate-limit-model.ts'

/** Texts of RateLimitPlanner (the package ships no text). */
export type RateLimitPlannerLabels = {
  /** Status words. */
  status: Record<PlanStatus, string>
  /** Peak readout (「峰值 1,200 / 分 · 15:05」). */
  peak: (peak: string, at: string) => string
  /** Legend names of the two lines. */
  limit: string
  buffer: string
  /** Accessible name of the job list. */
  runs: string
  /** Slider text of a job (「回补 · 15:00 → 16:30 · 600 / 分」). */
  run: (run: PlannedRun, start: string, end: string, rate: string) => string
  /** Tag on a job that has started. */
  locked: string
  /** Remove button label; the accessible name also gets the job name. */
  remove: string
  /** Spread button label. */
  spread: string
  /** Announcement after a move (「回补 挪到 15:30，峰值 900 / 分」). */
  moved: (run: PlannedRun, start: string, peak: string) => string
  /** Text when there are no jobs. */
  empty: string
}

export type RateLimitPlannerProps = {
  /** Controlled jobs. */
  runs?: readonly PlannedRun[]
  /** Jobs when uncontrolled. */
  defaultRuns?: readonly PlannedRun[]
  /** Called with the new jobs after every drag, key move, spread or removal; controlled jobs without it are read-only. */
  onRunsChange?: (runs: readonly PlannedRun[]) => void
  /** The source's limit, in its unit per minute. */
  limit: number
  /** Share of the limit to stay under, 0..1; above it the status is near. */
  buffer: number
  /** Window length in minutes; defaults to a day. */
  span?: number
  /** Current time in minutes from the window start; jobs that started before it cannot move. */
  now?: number
  /** How minutes from the window start are written (「15:05」). */
  formatTime: (minutes: number) => string
  /** How a load per minute is written, such as 1,200 / min. */
  formatRate: (rate: number) => string
  /** Heading. */
  title: ReactNode
  /** Texts. */
  labels: RateLimitPlannerLabels
  /** Extra class name on the root. */
  className?: string
}

/** 负载图高度：照 HorizonChart 一类小图，待定（没有实测依据）。 */
const CHART_H = 72

export function RateLimitPlanner({
  runs: runsProp,
  defaultRuns = [],
  onRunsChange,
  limit,
  buffer,
  span = DAY_MINUTES,
  now,
  formatTime,
  formatRate,
  title,
  labels,
  className,
}: RateLimitPlannerProps) {
  const [inner, setInner] = useState<readonly PlannedRun[]>(defaultRuns)
  const [message, setMessage] = useState('')
  const drag = useRef<{ id: string; x: number; start: number; width: number } | null>(null)
  const bars = useRef(new Map<string, HTMLElement>())
  const clipId = useId().replaceAll(':', '_')
  const runs = runsProp ?? inner
  const editable = onRunsChange !== undefined || runsProp === undefined
  const earliest = Math.max(0, now ?? 0)
  const curve = loadCurve(runs, span)
  const peak = peakOf(curve)
  const status = planStatus(peak.value, limit, buffer)
  const top = niceTicks(0, Math.max(peak.value, limit, 1), 3).domain[1]
  const yAt = (value: number) => CHART_H - (value / top) * CHART_H
  const xAt = (minutes: number) => (minutes / span) * PLOT_W
  const area = `M0,${CHART_H}${curve
    .map(
      (value, i) =>
        `L${xAt(i * CURVE_STEP).toFixed(2)},${yAt(value).toFixed(2)}H${xAt((i + 1) * CURVE_STEP).toFixed(2)}`,
    )
    .join('')}V${CHART_H}Z`
  const percent = (minutes: number) => `${((minutes / span) * 100).toFixed(3)}%`
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((q) => Math.round(span * q))

  const commit = (next: readonly PlannedRun[], movedId?: string) => {
    if (runsProp === undefined) setInner(next)
    onRunsChange?.(next)
    const after = peakOf(loadCurve(next, span))
    const run = next.find((item) => item.id === movedId)
    setMessage(
      run
        ? labels.moved(run, formatTime(run.start), formatRate(after.value))
        : labels.peak(formatRate(after.value), formatTime(after.index * CURVE_STEP)),
    )
  }
  const moveTo = (id: string, start: number) => {
    const run = runs.find((item) => item.id === id)
    if (!run || run.start === start) return
    commit(
      runs.map((item) => (item.id === id ? { ...item, start } : item)),
      id,
    )
  }
  const remove = (id: string) => {
    const index = runs.findIndex((item) => item.id === id)
    const next = runs.filter((item) => item.id !== id)
    commit(next)
    const focusId = next[Math.min(index, next.length - 1)]?.id
    if (focusId !== undefined) bars.current.get(focusId)?.focus()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLElement>, run: PlannedRun) => {
    if (event.altKey || event.ctrlKey || event.metaKey || !editable) return
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      remove(run.id)
      return
    }
    const next = keyMove(run.start, run.duration, event.key, event.shiftKey, earliest, span)
    if (next === undefined) return
    event.preventDefault()
    moveTo(run.id, next)
  }
  const onPointerDown = (event: PointerEvent<HTMLElement>, run: PlannedRun) => {
    if (!editable || event.button !== 0) return
    const track = event.currentTarget.parentElement?.getBoundingClientRect()
    if (!track || !(track.width > 0)) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { id: run.id, x: event.clientX, start: run.start, width: track.width }
  }
  const onPointerMove = (event: PointerEvent<HTMLElement>, run: PlannedRun) => {
    const state = drag.current
    if (!state || state.id !== run.id) return
    const minutes = ((event.clientX - state.x) / state.width) * span
    moveTo(run.id, clampStart(snap(state.start + minutes), run.duration, earliest, span))
  }
  const endDrag = () => {
    drag.current = null
  }

  return (
    <section className={cn('k-rlp', className)} data-slot="rate-limit-planner" data-status={status}>
      <header className="k-rlp-head">
        <h4 className="k-rlp-title">{title}</h4>
        <span className="k-rlp-status" data-slot="rate-limit-status" data-status={status}>
          {labels.status[status]}
        </span>
        <span className="k-rlp-peak" data-slot="rate-limit-peak">
          {labels.peak(formatRate(peak.value), formatTime(peak.index * CURVE_STEP))}
        </span>
      </header>
      <div className="k-rlp-chart" aria-hidden="true">
        <svg viewBox={`0 0 ${PLOT_W} ${CHART_H}`} preserveAspectRatio="none" style={{ height: CHART_H }}>
          <defs>
            <clipPath id={`${clipId}-over`}>
              <rect x={0} y={0} width={PLOT_W} height={Math.max(0, yAt(limit))} />
            </clipPath>
          </defs>
          <path className="k-rlp-area" d={area} />
          <path className="k-rlp-over" d={area} clipPath={`url(#${clipId}-over)`} data-slot="rate-limit-over" />
          <line className="k-rlp-buffer" x1={0} x2={PLOT_W} y1={yAt(limit * buffer)} y2={yAt(limit * buffer)} />
          <line className="k-rlp-limit" x1={0} x2={PLOT_W} y1={yAt(limit)} y2={yAt(limit)} />
          {now !== undefined && <line className="k-rlp-now" x1={xAt(now)} x2={xAt(now)} y1={0} y2={CHART_H} />}
        </svg>
        <span className="k-rlp-key">
          <i data-part="limit" />
          {labels.limit} {formatRate(limit)}
          <i data-part="buffer" />
          {labels.buffer} {formatRate(limit * buffer)}
        </span>
        <div className="k-plot-xaxis k-rlp-xaxis">
          {ticks.map((tick, index) => (
            <span
              key={tick}
              style={{ left: percent(tick) }}
              data-align={index === 0 ? 'start' : index === ticks.length - 1 ? 'end' : 'mid'}
            >
              {formatTime(tick)}
            </span>
          ))}
        </div>
      </div>
      {runs.length === 0 ? (
        <p className="k-rlp-empty">{labels.empty}</p>
      ) : (
        <ul className="k-rlp-runs" aria-label={labels.runs}>
          {runs.map((run) => {
            const locked = run.start < earliest
            const end = run.start + run.duration
            return (
              <li key={run.id} className="k-rlp-row" data-slot="rate-limit-run" data-id={run.id}>
                <span className="k-rlp-name">
                  {run.name}
                  {locked && <small>{labels.locked}</small>}
                </span>
                <span className="k-rlp-track">
                  <span
                    ref={(node) => {
                      if (node) bars.current.set(run.id, node)
                      else bars.current.delete(run.id)
                    }}
                    className="k-rlp-bar"
                    role="slider"
                    tabIndex={0}
                    aria-label={run.name}
                    aria-valuemin={earliest}
                    aria-valuemax={Math.max(earliest, span - run.duration)}
                    aria-valuenow={run.start}
                    aria-valuetext={labels.run(run, formatTime(run.start), formatTime(end), formatRate(run.rate))}
                    aria-disabled={locked || !editable ? true : undefined}
                    data-locked={locked ? '' : undefined}
                    data-slot="rate-limit-bar"
                    style={{ left: percent(run.start), width: `max(4px, ${percent(run.duration)})` }}
                    onKeyDown={(event) => (locked ? undefined : onKeyDown(event, run))}
                    onPointerDown={(event) => (locked ? undefined : onPointerDown(event, run))}
                    onPointerMove={(event) => onPointerMove(event, run)}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                  />
                </span>
                <span className="k-rlp-when">
                  {formatTime(run.start)}–{formatTime(end)} · {formatRate(run.rate)}
                </span>
                {editable && !locked && (
                  <button
                    type="button"
                    className="k-rlp-remove"
                    aria-label={`${labels.remove} ${run.name}`}
                    onClick={() => remove(run.id)}
                  >
                    <XIcon aria-hidden="true" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <footer className="k-rlp-foot">
        {editable && runs.length > 1 && (
          <Button size="sm" data-slot="rate-limit-spread" onClick={() => commit(spreadRuns(runs, earliest, span))}>
            {labels.spread}
          </Button>
        )}
        <span className="k-rlp-message" aria-live="polite" data-slot="rate-limit-message">
          {message}
        </span>
      </footer>
    </section>
  )
}

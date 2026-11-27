// SPDX-License-Identifier: MIT
/**
 * Fan-out grid: one agent splits a large job across many workers; each sub-task is a cell that fills in as work completes, with counts, cost and time left.
 * 分发网格（KATANAview #1908 第三批）：一个 Agent 把一件大活（给 300 只票补资金流、给 240 篇研报打标签）拆给很多 worker，每个子任务一格，
 * 按状态着色：排队灰、在跑强调色、重试 warn、成功 ok、失败 danger。头一行标题、任务、进度、剩余时间与花费合计；悬停或聚焦一格，下面写它的详情（worker、耗时、第几次、结果、错误），
 * Enter / Space 钉住或放开。底下一排状态计数是开关钮（一次亮一种，其余格变淡），有失败的出「重试失败的」。进度每过一成播报一次。
 * 功能参照 affectUI 的 Fan-out Grid（affectui.com/components/fan-out-grid，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。
 * 跟它不同：花费与时间的写法都由调用方给（不默认美元）；在跑的格不做流光动画，只着色。纯逻辑在 fan-out-model.ts。包里不带语言。
 */
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { fillVar } from '../lib/fill.ts'
import { cn } from '../lib/cn.ts'
import { Button } from '../primitives/button.tsx'
import {
  FAN_STATUSES,
  fanCost,
  fanCounts,
  fanEta,
  fanProgress,
  moveCell,
  type FanTask,
  type FanTaskStatus,
} from './fan-out-model.ts'

/** Texts of FanOutGrid (the package ships no text). */
export type FanOutGridLabels = {
  /** Status words. */
  status: Record<FanTaskStatus, string>
  /** Accessible name of the grid. */
  grid: string
  /** Progress line (「已完成 120 / 240」), and the live line every tenth (「完成 50%」). */
  progress: (finished: number, total: number) => string
  live: (percent: number) => string
  /** Time left; null when it cannot be estimated yet. */
  eta: (text: string | null) => string
  /** Cost total. */
  cost: (text: string) => string
  /** Detail field names. */
  worker: string
  took: string
  attempts: string
  result: string
  error: string
  /** Accessible name of the status filter group, and the retry button. */
  filter: string
  retry: (count: number) => string
  /** Text of the details line when no cell is focused. */
  hint: string
}

export type FanOutGridProps = {
  /** Sub-tasks in the order to show them. */
  tasks: readonly FanTask[]
  /** Heading. */
  title: ReactNode
  /** What the whole job is, such as the number of symbols to fill. */
  job?: string
  /** Concurrent workers, for the time-left estimate. */
  workers?: number
  /** Called with the failed ids by Retry failed. */
  onRetry?: (ids: readonly string[]) => void
  /** Called when a cell is pinned, or with null when released. */
  onSelect?: (task: FanTask | null) => void
  /** How a cost is written. */
  formatCost: (cost: number) => string
  /** How a duration in milliseconds is written. */
  formatDuration: (ms: number) => string
  /** Texts. */
  labels: FanOutGridLabels
  /** Extra class name on the root. */
  className?: string
}

export function FanOutGrid({
  tasks,
  title,
  job,
  workers,
  onRetry,
  onSelect,
  formatCost,
  formatDuration,
  labels,
  className,
}: FanOutGridProps) {
  const [focusIndex, setFocusIndex] = useState(0)
  const [peek, setPeek] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)
  const [filter, setFilter] = useState<FanTaskStatus | null>(null)
  const grid = useRef<HTMLUListElement>(null)
  const detailsId = useId()
  const counts = fanCounts(tasks)
  const progress = fanProgress(tasks)
  const eta = fanEta(tasks, workers)
  const finished = counts.done + counts.failed
  const current = Math.min(focusIndex, Math.max(0, tasks.length - 1))
  const shown = tasks.find((task) => task.id === (pinned ?? peek)) ?? null
  const failedIds = tasks.filter((task) => task.status === 'failed').map((task) => task.id)

  const cells = () => [...(grid.current?.querySelectorAll<HTMLElement>('[data-slot="fan-cell"]') ?? [])]
  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number, task: FanTask) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const next = pinned === task.id ? null : task.id
      setPinned(next)
      onSelect?.(next === null ? null : task)
      return
    }
    if (event.key === 'Escape' && pinned !== null) {
      event.preventDefault()
      setPinned(null)
      onSelect?.(null)
      return
    }
    // 一行几格由布局决定（容器宽度与 auto-fill），按键时量：跟第一格同一行的有几个。
    const all = cells()
    const top = all[0]?.offsetTop
    const cols = Math.max(1, all.filter((cell) => cell.offsetTop === top).length)
    const next = moveCell(index, event.key, tasks.length, cols)
    if (next === undefined) return
    event.preventDefault()
    setFocusIndex(next)
    setPeek(tasks[next]!.id)
    all[next]?.focus()
  }

  return (
    <section className={cn('k-fan', className)} data-slot="fan-out-grid" data-filter={filter ?? undefined}>
      <header className="k-fan-head">
        <h4 className="k-fan-title">{title}</h4>
        {job !== undefined && <span className="k-fan-job">{job}</span>}
        <span className="k-fan-facts">
          <span data-slot="fan-progress">{labels.progress(finished, tasks.length)}</span>
          <span>{labels.eta(eta === null ? null : formatDuration(eta))}</span>
          <span>{labels.cost(formatCost(fanCost(tasks)))}</span>
        </span>
      </header>
      <span className="k-fan-meter" aria-hidden="true">
        <b style={fillVar(progress)} />
      </span>
      <ul ref={grid} className="k-fan-grid" aria-label={labels.grid}>
        {tasks.map((task, index) => (
          <li key={task.id}>
            <button
              type="button"
              className="k-fan-cell"
              data-slot="fan-cell"
              data-id={task.id}
              data-status={task.status}
              data-dim={filter !== null && filter !== task.status ? '' : undefined}
              aria-label={`${task.label}，${labels.status[task.status]}`}
              aria-describedby={detailsId}
              aria-pressed={pinned === task.id}
              tabIndex={index === current ? 0 : -1}
              onFocus={() => {
                setFocusIndex(index)
                setPeek(task.id)
              }}
              onPointerEnter={() => setPeek(task.id)}
              onPointerLeave={() => setPeek(null)}
              onClick={() => {
                const next = pinned === task.id ? null : task.id
                setPinned(next)
                onSelect?.(next === null ? null : task)
              }}
              onKeyDown={(event) => onKey(event, index, task)}
            />
          </li>
        ))}
      </ul>
      <p id={detailsId} className="k-fan-details" data-slot="fan-details">
        {shown === null ? (
          labels.hint
        ) : (
          <>
            <b>{shown.label}</b> · {labels.status[shown.status]}
            {shown.worker !== undefined && ` · ${labels.worker} ${shown.worker}`}
            {shown.start !== undefined &&
              shown.end !== undefined &&
              ` · ${labels.took} ${formatDuration(shown.end - shown.start)}`}
            {(shown.attempts ?? 1) > 1 && ` · ${labels.attempts} ${shown.attempts}`}
            {shown.cost !== undefined && ` · ${formatCost(shown.cost)}`}
            {shown.result !== undefined && ` · ${labels.result} ${shown.result}`}
            {shown.error !== undefined && (
              <span data-part="error">
                {' '}
                · {labels.error} {shown.error}
              </span>
            )}
          </>
        )}
      </p>
      <div className="k-fan-tray">
        <div className="k-fan-counts" role="group" aria-label={labels.filter}>
          {FAN_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              className="k-fan-count"
              data-status={status}
              aria-pressed={filter === status}
              onClick={() => setFilter(filter === status ? null : status)}
            >
              <i aria-hidden="true" />
              {labels.status[status]} <span>{counts[status]}</span>
            </button>
          ))}
        </div>
        {onRetry !== undefined && failedIds.length > 0 && (
          <Button size="sm" onClick={() => onRetry(failedIds)} data-slot="fan-retry">
            {labels.retry(failedIds.length)}
          </Button>
        )}
      </div>
      <span className="k-fan-live" aria-live="polite">
        {labels.live(Math.floor(progress * 10) * 10)}
      </span>
    </section>
  )
}

// SPDX-License-Identifier: MIT
/**
 * Agent queue: jobs waiting for workers, the worker slots, finished and failed jobs, and a backlog depth chart with an optional backpressure line.
 * 任务队列（KATANAview #1908 第二批）：抓取 / 回补任务的队列。四列：排队（高优先在前）、工位（并发槽，每槽一个在跑的任务，进度条、被限流时 warn 色倒计时）、完成、失败；
 * 头上四个数（排队、在跑、完成、失败，排队超过 backpressure 变 warn 色）、暂停 / 继续、并发步进（− N +，给了回调才有）；
 * 下面一张积压深度图（最近 window 毫秒，从任务记录推出来）与一道背压虚线，旁边写成字的摘要（现在、峰值、平均）。
 * 点一个任务或 Enter / Space 钉住它的详情（排了多久、跑了多久、第几次、错误），里面有「提到最前」「取消」（给了回调才有）。
 * 功能参照 affectUI 的 Agent Queue（affectui.com/components/agent-queue，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。
 * 跟它不同：件自己不走钟（now 由调用方给，不在渲染里取时间）；没有任务在区之间滑动的动画；详情是列下的内嵌区，不弹对话框。纯逻辑在 queue-model.ts。包里不带语言。
 */
import { MinusIcon, PauseIcon, PlayIcon, PlusIcon } from 'lucide-react'
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { assignSeries } from '../../lib/chart/chart-kit/series-colors.ts'
import { Button } from '../../primitives/button.tsx'
import {
  depthSummary,
  limitLeft,
  moveJob,
  queueCounts,
  queueDepth,
  queueOrder,
  workerSlots,
  type QueueJob,
  type QueueJobStatus,
} from './queue-model.ts'

/** Texts of AgentQueue (the package ships no text). */
export type AgentQueueLabels = {
  /** Status words; also the four counts and the column heads of queued, done and failed. */
  status: Record<QueueJobStatus, string>
  /** Column head of the worker slots, and the text of an empty slot. */
  workers: string
  idle: string
  /** Name of a job kind; defaults to the kind itself. */
  kind?: (kind: string) => string
  /** Tag on a high-priority job. */
  high: string
  /** Place in line (「第 3 位」). */
  place: (place: number) => string
  /** Attempt text (「第 2 / 3 次」). */
  attempt: (attempt: number, max: number | undefined) => string
  /** Rate-limit countdown on a running job. */
  limited: (left: string) => string
  /** Pause and resume button, the stepper group and its two buttons. */
  pause: string
  resume: string
  concurrency: string
  fewer: string
  more: string
  /** Depth chart: its name, the backpressure line, and the text summary. */
  depth: string
  backpressure: string
  depthSummary: (summary: { now: number; peak: number; average: number }) => string
  /** Live status line: how many jobs are rate limited, whether backpressure is crossed. */
  live: (limited: number, overBackpressure: boolean) => string
  /** Details area: its name, field names and actions. */
  details: string
  waited: string
  ran: string
  error: string
  promote: string
  cancel: string
  /** More finished jobs than shown (「还有 12 个」). */
  moreItems: (count: number) => string
}

export type AgentQueueProps = {
  /** Every job, in any order. */
  jobs: readonly QueueJob[]
  /** Concurrency: number of worker slots. */
  workers: number
  /** Clock in milliseconds; the component does not tick on its own. */
  now: number
  /** Heading. */
  title: ReactNode
  /** Muted queue name after the heading. */
  name?: string
  /** Waiting count above which the queue is under backpressure. */
  backpressure?: number
  /** Span of the depth chart in milliseconds. */
  window?: number
  /** Whether the queue is paused. */
  paused?: boolean
  /** Shows Pause / Resume; called with the new paused state. */
  onPausedChange?: (paused: boolean) => void
  /** Shows the concurrency stepper; called with the new worker count. */
  onConcurrencyChange?: (workers: number) => void
  /** Fewest workers the stepper allows. */
  minConcurrency?: number
  /** Most workers the stepper allows. */
  maxConcurrency?: number
  /** Controlled pinned job id; null when none. */
  openId?: string | null
  /** Pinned job when uncontrolled. */
  defaultOpenId?: string | null
  /** Called when the pinned job changes. */
  onOpenChange?: (id: string | null) => void
  /** Shows Move to front on queued jobs. */
  onPromote?: (job: QueueJob) => void
  /** Shows Cancel on queued and running jobs. */
  onCancel?: (job: QueueJob) => void
  /** Finished and failed jobs shown per column, newest first. */
  finishedLimit?: number
  /** How a duration in milliseconds is written. */
  formatDuration: (ms: number) => string
  /** Texts. */
  labels: AgentQueueLabels
  /** Extra class name on the root. */
  className?: string
}

export function AgentQueue({
  jobs,
  workers,
  now,
  title,
  name,
  backpressure,
  window = 120_000,
  paused = false,
  onPausedChange,
  onConcurrencyChange,
  minConcurrency = 1,
  maxConcurrency = 8,
  openId: openProp,
  defaultOpenId = null,
  onOpenChange,
  onPromote,
  onCancel,
  finishedLimit = 5,
  formatDuration,
  labels,
  className,
}: AgentQueueProps) {
  const [innerOpen, setInnerOpen] = useState<string | null>(defaultOpenId)
  const [focusId, setFocusId] = useState<string | null>(null)
  const items = useRef(new Map<string, HTMLButtonElement>())
  const detailsId = useId()
  const openId = openProp !== undefined ? openProp : innerOpen
  const queue = queueOrder(jobs)
  const slots = workerSlots(jobs, workers)
  const newest = (status: QueueJobStatus) =>
    jobs.filter((job) => job.status === status).toSorted((a, b) => (b.ended ?? 0) - (a.ended ?? 0))
  const done = newest('done')
  const failed = newest('failed')
  const counts = queueCounts(jobs)
  const running = slots.filter((job): job is QueueJob => job !== null)
  const order = [...running, ...queue, ...failed.slice(0, finishedLimit), ...done.slice(0, finishedLimit)].map(
    (job) => job.id,
  )
  const current = focusId !== null && order.includes(focusId) ? focusId : order[0]
  const depth = queueDepth(jobs, now - window, now)
  const summary = depthSummary(depth)
  const over = backpressure !== undefined && counts.queued > backpressure
  const limitedCount = running.filter((job) => limitLeft(job, now) > 0).length
  const tint = assignSeries([...new Set(jobs.map((job) => job.kind))])
  const kindName = labels.kind ?? ((kind: string) => kind)
  const open = jobs.find((job) => job.id === openId) ?? null

  const setOpen = (next: string | null) => {
    if (openProp === undefined) setInnerOpen(next)
    onOpenChange?.(next)
  }
  const focus = (id: string) => {
    setFocusId(id)
    items.current.get(id)?.focus()
  }
  const onItemKey = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    if (event.key === 'Escape' && openId !== null) {
      event.preventDefault()
      setOpen(null)
      return
    }
    const next = moveJob(order, id, event.key)
    if (next === undefined) return
    event.preventDefault()
    focus(next)
  }

  const item = (job: QueueJob) => {
    const left = limitLeft(job, now)
    const place = queue.indexOf(job) + 1
    const parts = [
      job.name,
      kindName(job.kind),
      labels.status[job.status],
      place > 0 ? labels.place(place) : null,
      job.priority === 'high' ? labels.high : null,
      (job.attempt ?? 1) > 1 ? labels.attempt(job.attempt!, job.maxAttempts) : null,
      left > 0 ? labels.limited(formatDuration(left)) : null,
    ]
    return (
      <button
        type="button"
        ref={(node) => {
          if (node) items.current.set(job.id, node)
          else items.current.delete(job.id)
        }}
        className="k-aq-job"
        data-slot="queue-job"
        data-id={job.id}
        data-status={job.status}
        data-limited={left > 0 ? '' : undefined}
        aria-label={parts.filter(Boolean).join('，')}
        aria-pressed={openId === job.id}
        aria-controls={detailsId}
        tabIndex={job.id === current ? 0 : -1}
        onFocus={() => setFocusId(job.id)}
        onClick={() => setOpen(openId === job.id ? null : job.id)}
        onKeyDown={(event) => onItemKey(event, job.id)}
      >
        <i className="k-aq-dot" aria-hidden="true" style={{ backgroundColor: tint[job.kind] }} />
        <span className="k-aq-job-name">{job.name}</span>
        {job.priority === 'high' && job.status === 'queued' && <small className="k-aq-tag">{labels.high}</small>}
        <span className="k-aq-job-meta" aria-hidden="true">
          {job.status === 'queued' && formatDuration(Math.max(0, now - job.enqueued))}
          {job.status === 'running' &&
            (left > 0 ? labels.limited(formatDuration(left)) : formatDuration(Math.max(0, now - (job.started ?? now))))}
          {job.status === 'failed' && (job.error ?? '')}
          {job.status === 'done' &&
            job.started !== undefined &&
            job.ended !== undefined &&
            formatDuration(job.ended - job.started)}
        </span>
        {job.status === 'running' && (
          <span className="k-aq-bar" aria-hidden="true">
            <b style={{ width: `${Math.round(Math.min(1, Math.max(0, job.progress ?? 0)) * 100)}%` }} />
          </span>
        )}
      </button>
    )
  }
  const column = (key: string, head: string, count: number, body: ReactNode) => (
    <section className="k-aq-col" data-col={key} aria-label={head}>
      <h5 className="k-aq-col-head">
        {head} <span>{count}</span>
      </h5>
      {body}
    </section>
  )
  const finished = (list: readonly QueueJob[]) => (
    <>
      <ul className="k-aq-list">
        {list.slice(0, finishedLimit).map((job) => (
          <li key={job.id}>{item(job)}</li>
        ))}
      </ul>
      {list.length > finishedLimit && <p className="k-aq-more">{labels.moreItems(list.length - finishedLimit)}</p>}
    </>
  )
  const top = Math.max(1, summary.peak, backpressure ?? 0) * 1.15
  const y = (value: number) => 32 - (value / top) * 30
  const x = (time: number) => ((time - (now - window)) / window) * 100
  const area = `M0,32 ${depth.map((point) => `L${x(point.time).toFixed(2)},${y(point.waiting).toFixed(2)}`).join(' ')} L100,32 Z`

  return (
    <section className={cn('k-aq', className)} data-slot="agent-queue" data-paused={paused ? '' : undefined}>
      <header className="k-aq-head">
        <h4 className="k-aq-title">{title}</h4>
        {name !== undefined && <span className="k-aq-name">{name}</span>}
        <dl className="k-aq-counts">
          {(['queued', 'running', 'done', 'failed'] as const).map((status) => (
            <div key={status} data-status={status} data-over={status === 'queued' && over ? '' : undefined}>
              <dt>{labels.status[status]}</dt>
              <dd>{counts[status]}</dd>
            </div>
          ))}
        </dl>
        <div className="k-aq-controls">
          {onPausedChange !== undefined && (
            <Button size="sm" aria-pressed={paused} onClick={() => onPausedChange(!paused)} data-slot="queue-pause">
              {paused ? <PlayIcon size={14} aria-hidden="true" /> : <PauseIcon size={14} aria-hidden="true" />}
              {paused ? labels.resume : labels.pause}
            </Button>
          )}
          {onConcurrencyChange !== undefined && (
            <div className="k-aq-stepper" role="group" aria-label={labels.concurrency}>
              <Button
                variant="icon"
                size="icon"
                aria-label={labels.fewer}
                disabled={workers <= minConcurrency}
                onClick={() => onConcurrencyChange(Math.max(minConcurrency, workers - 1))}
              >
                <MinusIcon aria-hidden="true" />
              </Button>
              <output aria-live="polite" data-slot="queue-workers">
                {workers}
              </output>
              <Button
                variant="icon"
                size="icon"
                aria-label={labels.more}
                disabled={workers >= maxConcurrency}
                onClick={() => onConcurrencyChange(Math.min(maxConcurrency, workers + 1))}
              >
                <PlusIcon aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </header>
      <div className="k-aq-flow">
        {column(
          'queued',
          labels.status.queued,
          queue.length,
          <ol className="k-aq-list">
            {queue.map((job) => (
              <li key={job.id}>{item(job)}</li>
            ))}
          </ol>,
        )}
        {column(
          'workers',
          labels.workers,
          running.length,
          <ol className="k-aq-list">
            {slots.map((job, n) => (
              <li key={job?.id ?? `idle-${n}`} data-slot="queue-slot">
                {job === null ? <span className="k-aq-idle">{labels.idle}</span> : item(job)}
              </li>
            ))}
          </ol>,
        )}
        {column('done', labels.status.done, done.length, finished(done))}
        {column('failed', labels.status.failed, failed.length, finished(failed))}
      </div>
      <div
        id={detailsId}
        className="k-aq-details"
        role="region"
        aria-label={labels.details}
        data-slot="queue-details"
        onKeyDown={(event) => {
          if (event.key !== 'Escape' || open === null) return
          event.preventDefault()
          setOpen(null)
          focus(open.id)
        }}
      >
        {open !== null && (
          <>
            <dl>
              <div>
                <dt>{open.name}</dt>
                <dd>
                  {kindName(open.kind)} · {labels.status[open.status]}
                  {open.detail !== undefined && ` · ${open.detail}`}
                </dd>
              </div>
              <div>
                <dt>{labels.waited}</dt>
                <dd>{formatDuration(Math.max(0, (open.started ?? now) - open.enqueued))}</dd>
              </div>
              {open.started !== undefined && (
                <div>
                  <dt>{labels.ran}</dt>
                  <dd>{formatDuration(Math.max(0, (open.ended ?? now) - open.started))}</dd>
                </div>
              )}
              {(open.attempt ?? 1) > 1 && (
                <div>
                  <dt>{labels.attempt(open.attempt!, open.maxAttempts)}</dt>
                  <dd />
                </div>
              )}
              {open.error !== undefined && (
                <div data-part="error">
                  <dt>{labels.error}</dt>
                  <dd>{open.error}</dd>
                </div>
              )}
            </dl>
            <div className="k-aq-actions">
              {onPromote !== undefined && open.status === 'queued' && queue[0]?.id !== open.id && (
                <Button size="sm" onClick={() => onPromote(open)}>
                  {labels.promote}
                </Button>
              )}
              {onCancel !== undefined && (open.status === 'queued' || open.status === 'running') && (
                <Button size="sm" variant="danger" onClick={() => onCancel(open)}>
                  {labels.cancel}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
      <figure className="k-aq-depth" data-slot="queue-depth">
        <figcaption>
          {labels.depth} · <span data-slot="queue-depth-summary">{labels.depthSummary(summary)}</span>
        </figcaption>
        <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
          <path d={area} data-part="area" />
          {backpressure !== undefined && (
            <line x1="0" x2="100" y1={y(backpressure)} y2={y(backpressure)} data-part="backpressure" />
          )}
        </svg>
        {backpressure !== undefined && <span className="k-aq-legend">{labels.backpressure}</span>}
      </figure>
      <p className="k-aq-live" aria-live="polite" data-slot="queue-live">
        {labels.live(limitedCount, over)}
      </p>
    </section>
  )
}

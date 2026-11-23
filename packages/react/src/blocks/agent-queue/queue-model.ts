// SPDX-License-Identifier: MIT
// 任务队列的纯逻辑（KATANAview #1908 第二批）：抓取 / 回补任务排队、进工位（并发槽）、落到完成或失败。
// 排队的次序：高优先在前，同级按入队时间；工位里的按开始时间占槽。积压深度从任务记录推出来：某一刻在排队的 = 已入队、还没开始的。
// 时间是毫秒（调用方的时钟），不带 React 与 DOM。

/** State of one job. */
export type QueueJobStatus = 'queued' | 'running' | 'done' | 'failed'

/** One job in the queue. */
export type QueueJob = {
  /** Stable key. */
  id: string
  /** Job name. */
  name: string
  /** Kind of work, such as backfill, news or factor; picks the tint. */
  kind: string
  /** Where the job is now. */
  status: QueueJobStatus
  /** High-priority jobs go to the front of the queue. */
  priority?: 'high' | 'normal'
  /** When it was put in the queue. */
  enqueued: number
  /** When its current attempt started. */
  started?: number
  /** When it finished or failed. */
  ended?: number
  /** Progress of a running job, 0 to 1. */
  progress?: number
  /** Attempt number, from 1. */
  attempt?: number
  /** Most attempts allowed. */
  maxAttempts?: number
  /** A running job held by a rate limit until this time. */
  limitedUntil?: number
  /** Muted text (the symbol range, the source). */
  detail?: string
  /** Error text of a failed job. */
  error?: string
}

/** 排队的次序：高优先在前，同级按入队早晚，再按 id。 */
export function queueOrder(jobs: readonly QueueJob[]): QueueJob[] {
  return jobs
    .filter((job) => job.status === 'queued')
    .toSorted(
      (a, b) =>
        Number(b.priority === 'high') - Number(a.priority === 'high') ||
        a.enqueued - b.enqueued ||
        a.id.localeCompare(b.id),
    )
}

/** 工位：按开始早晚占槽，槽数是并发数；并发调小后还在跑的照样列出（槽数取两者大的）。空槽是 null。 */
export function workerSlots(jobs: readonly QueueJob[], workers: number): (QueueJob | null)[] {
  const running = jobs
    .filter((job) => job.status === 'running')
    .toSorted((a, b) => (a.started ?? 0) - (b.started ?? 0) || a.id.localeCompare(b.id))
  const slots: (QueueJob | null)[] = running.slice()
  while (slots.length < workers) slots.push(null)
  return slots
}

/** 各状态的个数。 */
export function queueCounts(jobs: readonly QueueJob[]): Record<QueueJobStatus, number> {
  const counts = { queued: 0, running: 0, done: 0, failed: 0 }
  for (const job of jobs) counts[job.status]++
  return counts
}

/** 某一刻在排队的个数：已入队、还没开始（或开始在这一刻之后）。重试的任务按它当前这一次算。 */
export const waitingAt = (jobs: readonly QueueJob[], time: number) =>
  jobs.filter((job) => job.enqueued <= time && (job.started === undefined || job.started > time)).length

/** 积压深度曲线：from 到 to 等分 points 个点（含两端）。 */
export function queueDepth(
  jobs: readonly QueueJob[],
  from: number,
  to: number,
  points = 25,
): { time: number; waiting: number }[] {
  const count = Math.max(2, points)
  const step = (to - from) / (count - 1)
  return Array.from({ length: count }, (_, n) => {
    const time = from + step * n
    return { time, waiting: waitingAt(jobs, time) }
  })
}

/** 曲线的读数：现在、峰值、平均（读屏的文字摘要用）。 */
export function depthSummary(depth: readonly { waiting: number }[]): { now: number; peak: number; average: number } {
  if (depth.length === 0) return { now: 0, peak: 0, average: 0 }
  const values = depth.map((point) => point.waiting)
  return {
    now: values.at(-1)!,
    peak: Math.max(...values),
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
  }
}

/** 被限流的还剩多久（毫秒）；没限流是 0。 */
export const limitLeft = (job: QueueJob, now: number) =>
  job.status === 'running' && job.limitedUntil !== undefined ? Math.max(0, job.limitedUntil - now) : 0

/** 键盘在任务之间走：↓→ 下一个，↑← 上一个，Home / End 头尾；别的键返回 undefined。 */
export function moveJob(order: readonly string[], id: string, key: string): string | undefined {
  const index = order.indexOf(id)
  if (index < 0 || order.length === 0) return undefined
  switch (key) {
    case 'ArrowDown':
    case 'ArrowRight':
      return order[Math.min(order.length - 1, index + 1)]
    case 'ArrowUp':
    case 'ArrowLeft':
      return order[Math.max(0, index - 1)]
    case 'Home':
      return order[0]
    case 'End':
      return order.at(-1)
    default:
      return undefined
  }
}

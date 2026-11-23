// SPDX-License-Identifier: MIT
// 分发网格的纯逻辑（KATANAview #1908 第三批）：一个 Agent 把一件大活拆给很多 worker，每个子任务一格。
// 进度 = 跑完（成功或失败）的占比；剩余时间 = 没跑完的个数 × 跑完的平均耗时 ÷ 并行数（给了 worker 数用它，否则用正在跑的个数）。时间是毫秒。不带 React 与 DOM。

/** State of one sub-task. */
export type FanTaskStatus = 'queued' | 'running' | 'retrying' | 'done' | 'failed'

/** One sub-task of a fan-out job. */
export type FanTask = {
  /** Stable key. */
  id: string
  /** Short name (the symbol, the file). */
  label: string
  /** Queued, running, retrying, done or failed. */
  status: FanTaskStatus
  /** Worker that ran it. */
  worker?: string
  /** Start in milliseconds. */
  start?: number
  /** End in milliseconds. */
  end?: number
  /** Cost of the sub-task. */
  cost?: number
  /** Attempts so far. */
  attempts?: number
  /** Result text. */
  result?: string
  /** Error text. */
  error?: string
}

export const FAN_STATUSES: readonly FanTaskStatus[] = ['queued', 'running', 'retrying', 'done', 'failed']

/** 各状态的个数。 */
export function fanCounts(tasks: readonly FanTask[]): Record<FanTaskStatus, number> {
  const counts = { queued: 0, running: 0, retrying: 0, done: 0, failed: 0 }
  for (const task of tasks) counts[task.status]++
  return counts
}

/** 进度：跑完（成功或失败）的占比，没有任务是 0。 */
export function fanProgress(tasks: readonly FanTask[]): number {
  if (tasks.length === 0) return 0
  return tasks.filter((task) => task.status === 'done' || task.status === 'failed').length / tasks.length
}

/** 剩余时间（毫秒）：都跑完是 0；还没有跑完且有耗时的任务就是 null（估不出来）。 */
export function fanEta(tasks: readonly FanTask[], workers?: number): number | null {
  const remaining = tasks.filter((task) => task.status !== 'done' && task.status !== 'failed').length
  if (remaining === 0) return 0
  const took = tasks
    .filter((task) => task.status === 'done' && task.start !== undefined && task.end !== undefined)
    .map((task) => task.end! - task.start!)
  if (took.length === 0) return null
  const average = took.reduce((sum, value) => sum + value, 0) / took.length
  const running = tasks.filter((task) => task.status === 'running' || task.status === 'retrying').length
  const parallel = Math.max(1, workers ?? running)
  return (remaining * average) / parallel
}

/** 花费合计。 */
export const fanCost = (tasks: readonly FanTask[]) => tasks.reduce((sum, task) => sum + (task.cost ?? 0), 0)

/** 格子间的键盘：←→ 前后一格，↑↓ 上下一行（cols 是一行几格），Home / End 头尾；别的键返回 undefined。 */
export function moveCell(index: number, key: string, count: number, cols: number): number | undefined {
  const clamp = (value: number) => Math.min(count - 1, Math.max(0, value))
  switch (key) {
    case 'ArrowLeft':
      return clamp(index - 1)
    case 'ArrowRight':
      return clamp(index + 1)
    case 'ArrowUp':
      return index - cols >= 0 ? index - cols : index
    case 'ArrowDown':
      return index + cols < count ? index + cols : index
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return undefined
  }
}

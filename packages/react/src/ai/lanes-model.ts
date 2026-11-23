// SPDX-License-Identifier: MIT
// 多 Agent 泳道的纯逻辑（KATANAview #1908 第三批）：每个 Agent 一条泳道，最近 span 毫秒的窗口里画它的任务块；没有结束的块长到 now。
// 交接（handoff）画在交出那一块的结束处，从它的泳道连到接手的泳道。时间是调用方的毫秒时钟。不带 React 与 DOM。

/** One agent lane. */
export type LaneAgent = {
  /** Stable key, referenced by tasks. */
  id: string
  /** Agent name. */
  name: string
  /** Model or role, muted under the name. */
  model?: string
  /** Initials on the avatar; defaults to the first character of the name. */
  initials?: string
}

/** State of one task block. */
export type LaneTaskStatus = 'done' | 'running' | 'waiting' | 'failed'

/** One task on a lane. */
export type LaneTask = {
  /** Stable key. */
  id: string
  /** Lane (agent id). */
  agent: string
  /** Task name. */
  title: string
  /** Done, running, waiting on a person, or failed. */
  status: LaneTaskStatus
  /** Start, in milliseconds. */
  start: number
  /** End, in milliseconds; omit while it runs or waits. */
  end?: number
  /** Agent id that takes over when this task ends. */
  handoff?: string
  /** Question for the person on a waiting task. */
  ask?: string
  /** What the task did, shown on open. */
  summary?: string
  /** Tools it used. */
  tools?: readonly string[]
}

/** 块在窗口里的位置（0..1）；完全在窗口外是 null。没有结束的长到 now。 */
export function blockSpan(
  task: LaneTask,
  from: number,
  to: number,
  now: number,
): { left: number; width: number } | null {
  const end = Math.max(task.start, task.end ?? now)
  if (end < from || task.start > to) return null
  const span = to - from > 0 ? to - from : 1
  const left = (Math.max(from, task.start) - from) / span
  const right = (Math.min(to, end) - from) / span
  return { left, width: Math.max(0, right - left) }
}

/** 泳道的标签：有等人的是 needs；有在跑的是 busy；否则 idle。 */
export function agentTag(agent: string, tasks: readonly LaneTask[]): 'needs' | 'busy' | 'idle' {
  const own = tasks.filter((task) => task.agent === agent)
  if (own.some((task) => task.status === 'waiting')) return 'needs'
  return own.some((task) => task.status === 'running') ? 'busy' : 'idle'
}

/** 交接线：交出那一块的结束处（窗口内才画），从它的泳道到接手的泳道。泳道序号按 agents 的次序。 */
export function handoffLinks(
  tasks: readonly LaneTask[],
  agents: readonly LaneAgent[],
  from: number,
  to: number,
  now: number,
): { id: string; from: number; to: number; x: number }[] {
  const lane = (id: string) => agents.findIndex((agent) => agent.id === id)
  const span = to - from > 0 ? to - from : 1
  return tasks.flatMap((task) => {
    if (task.handoff === undefined) return []
    const a = lane(task.agent)
    const b = lane(task.handoff)
    const at = task.end ?? now
    if (a < 0 || b < 0 || a === b || at < from || at > to) return []
    return [{ id: task.id, from: a, to: b, x: (at - from) / span }]
  })
}

/** 要人处理的块数。 */
export const attentionCount = (tasks: readonly LaneTask[]) => tasks.filter((task) => task.status === 'waiting').length

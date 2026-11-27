// SPDX-License-Identifier: MIT
// 多角色小组的纯逻辑（KATANAview #1908 第三批）：一个主 Agent（lead）带几个子 Agent，子 Agent 还可以带子 Agent；成员一直在，状态在 在忙 / 空闲 / 暂停 / 等你 / 做完 / 失败 之间换。
// 上下文条：0–1 的占比，到 80% 变 warn、到 95% 变 danger（阈值照 affectUI Agent Crew 页写的「80% 变橙、95% 变红」，2026-11-23 读）。
// 交接：{ from, to }，新出现的 id 才点亮（打开时已有的不亮）。键盘是读的次序（前序）。不带 React 与 DOM。

/** State of one crew member. */
export type CrewStatus = 'working' | 'idle' | 'paused' | 'waiting' | 'done' | 'failed'

/** One crew member, with the members it leads. */
export type CrewAgent = {
  /** Stable key. */
  id: string
  /** Agent name or role. */
  name: string
  /** Working, idle, paused, waiting (needs you), done or failed. */
  status: CrewStatus
  /** What it is doing right now, in one line. */
  activity?: string
  /** Share of the context window in use, 0 to 1. */
  context?: number
  /** Context window size in tokens; shows 「136k / 200k」 next to the bar. */
  contextLimit?: number
  /** Model name. */
  model?: string
  /** Tool names. */
  tools?: readonly string[]
  /** Last hand-off it received. */
  last?: { from: string; text: string }
  /** Its task, in the details. */
  task?: string
  /** Start in milliseconds. */
  started?: number
  /** End in milliseconds. */
  ended?: number
  /** Cost so far. */
  cost?: number
  /** Tokens used so far. */
  tokens?: number
  /** Members it leads. */
  children?: readonly CrewAgent[]
}

/** One hand-off between two members; a new id lights the receiving card. */
export type CrewHandoff = { id: string; from: string; to: string; label?: string }

/** Steering action from the details. */
export type CrewSteer = 'message' | 'pause' | 'stop' | 'resume' | 'approve' | 'decline' | 'retry'

/** One project of the switcher, with its crew's counts. */
export type CrewProject = { id: string; name: string; working?: number; needsYou?: number }

/** 上下文条变色的阈值（见文件头的出处）。 */
export const CONTEXT_WARN = 0.8
export const CONTEXT_DANGER = 0.95

/** 上下文占比：不是有限数字是 undefined，其余夹到 0–1。 */
export function clampContext(ratio: number | undefined): number | undefined {
  if (ratio === undefined || !Number.isFinite(ratio)) return undefined
  return Math.min(1, Math.max(0, ratio))
}

/** 上下文条的档：ok / warn（≥ 80%）/ danger（≥ 95%）。 */
export function crewContextLevel(ratio: number): 'ok' | 'warn' | 'danger' {
  if (ratio >= CONTEXT_DANGER) return 'danger'
  if (ratio >= CONTEXT_WARN) return 'warn'
  return 'ok'
}

/** 详情里能用的引导动作：留言总在；在忙可暂停、停止；暂停可继续；等你可批准、拒绝；失败可重试。 */
export function steerActions(status: CrewStatus): CrewSteer[] {
  const actions: CrewSteer[] = ['message']
  if (status === 'working') actions.push('pause', 'stop')
  if (status === 'paused') actions.push('resume')
  if (status === 'waiting') actions.push('approve', 'decline')
  if (status === 'failed') actions.push('retry')
  return actions
}

/** 读的次序（前序）：方向键在卡之间走的次序。 */
export function crewOrder(root: CrewAgent): CrewAgent[] {
  const out: CrewAgent[] = []
  const walk = (agent: CrewAgent) => {
    out.push(agent)
    for (const child of agent.children ?? []) walk(child)
  }
  walk(root)
  return out
}

/** 头上的数：一共几个、几个在忙、几个等你。 */
export function crewCounts(root: CrewAgent): { total: number; working: number; waiting: number } {
  const all = crewOrder(root)
  return {
    total: all.length,
    working: all.filter((agent) => agent.status === 'working').length,
    waiting: all.filter((agent) => agent.status === 'waiting').length,
  }
}

/** 交接从哪一边进卡：从上级来的从上边进，从下级或旁人来的从下边进。 */
export function handoffEdge(root: CrewAgent, handoff: CrewHandoff): 'top' | 'bottom' {
  const parent = new Map<string, string>()
  for (const agent of crewOrder(root)) for (const child of agent.children ?? []) parent.set(child.id, agent.id)
  for (let at = parent.get(handoff.to); at !== undefined; at = parent.get(at)) if (at === handoff.from) return 'top'
  return 'bottom'
}

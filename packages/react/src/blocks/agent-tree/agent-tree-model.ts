// SPDX-License-Identifier: MIT
// Agent 树的纯逻辑（KATANAview #1908 第三批）：一个编排 Agent 派生子 Agent，子 Agent 又派生子 Agent，是一棵树；AgentTree、AgentFleet 共用。
// 花费：每个 Agent 的 cost 是它自己的，分支的花费是整棵子树加起来（不是有限数字的跳过）。耗时：开始到结束，没结束量到调用方给的 now；开始在将来算 0。
// 键盘照 APG 树，复用 TraceWaterfall 的 moveSpan（↑↓、→ 展开或到子、← 收起或回父、Home / End）。时间是毫秒。不带 React 与 DOM。
import { moveSpan, type SpanMove } from '../trace-waterfall/trace-model.ts'

/** State of one agent. */
export type AgentRunStatus = 'queued' | 'running' | 'waiting' | 'done' | 'failed' | 'stopped'

/** One step of a sub-agent, listed in its tasks window. */
export type AgentRunStep = {
  /** Step name. */
  title: string
  /** State of the step. */
  status: AgentRunStatus
  /** Tool the step used. */
  tool?: string
  /** Duration in milliseconds. */
  duration?: number
}

/** One agent of a run, with the agents it started. */
export type RunAgent = {
  /** Stable key. */
  id: string
  /** Agent name. */
  name: string
  /** What it is doing, in one line. */
  task: string
  /** Queued, running, waiting (needs you), done, failed or stopped. */
  status: AgentRunStatus
  /** Model name. */
  model?: string
  /** Tool names, shown as small tiles before the task. */
  tools?: readonly string[]
  /** The decision it waits for. */
  ask?: string
  /** Why it failed. */
  error?: string
  /** Its own cost; branch cards add up the children. */
  cost?: number
  /** Start in milliseconds. */
  started?: number
  /** End in milliseconds. */
  ended?: number
  /** Its steps, opened in a tasks window. */
  steps?: readonly AgentRunStep[]
  /** Sub-agents it started. */
  children?: readonly RunAgent[]
}

/** Answer to an agent that needs you or failed. */
export type AgentResolution = 'approve' | 'reject' | 'retry' | 'dismiss'

/** One visible row, in reading order. */
export type AgentRow = {
  agent: RunAgent
  depth: number
  parentId: string | null
  hasChildren: boolean
  expanded: boolean
}

export const AGENT_STATUSES: readonly AgentRunStatus[] = ['queued', 'running', 'waiting', 'done', 'failed', 'stopped']

/** 排队与停下的 Agent（与通向它的线）变淡。 */
export const agentMuted = (status: AgentRunStatus): boolean => status === 'queued' || status === 'stopped'

/** 要人回答的：等你决定的与失败的。 */
export const needsAnswer = (agent: RunAgent): boolean => agent.status === 'waiting' || agent.status === 'failed'

/** 分支花费：自己加整棵子树；没有一个有效数字是 undefined（NaN、无穷不算）。 */
export function branchCost(agent: RunAgent): number | undefined {
  let sum: number | undefined
  const walk = (node: RunAgent) => {
    if (node.cost !== undefined && Number.isFinite(node.cost)) sum = (sum ?? 0) + node.cost
    for (const child of node.children ?? []) walk(child)
  }
  walk(agent)
  return sum
}

/** 耗时：没开始是 undefined；没结束量到 now（没给 now 是 undefined）；开始在将来、结束早于开始都算 0。 */
export function agentElapsed(agent: Pick<RunAgent, 'started' | 'ended'>, now?: number): number | undefined {
  if (agent.started === undefined || !Number.isFinite(agent.started)) return undefined
  const end = agent.ended ?? now
  if (end === undefined || !Number.isFinite(end)) return undefined
  return Math.max(0, end - agent.started)
}

/** Totals over a set of trees. */
export type AgentTotals = {
  agents: number
  running: number
  waiting: number
  failed: number
  done: number
  cost: number | undefined
}

/** 合计：几个 Agent、在跑、要你、失败、做完，花费（整片森林）。 */
export function agentTotals(roots: readonly RunAgent[]): AgentTotals {
  const totals: AgentTotals = { agents: 0, running: 0, waiting: 0, failed: 0, done: 0, cost: undefined }
  const walk = (node: RunAgent) => {
    totals.agents++
    if (node.status === 'running') totals.running++
    if (node.status === 'waiting') totals.waiting++
    if (node.status === 'failed') totals.failed++
    if (node.status === 'done') totals.done++
    for (const child of node.children ?? []) walk(child)
  }
  roots.forEach(walk)
  for (const root of roots) {
    const cost = branchCost(root)
    if (cost !== undefined) totals.cost = (totals.cost ?? 0) + cost
  }
  return totals
}

/** 子孙合计（不含自己）：AgentFleet 主卡上的环与那句说明。 */
export const descendantTotals = (agent: RunAgent): AgentTotals => agentTotals(agent.children ?? [])

/** 前序展开成可见行：收起的分支不展开它的子。 */
export function visibleAgents(roots: readonly RunAgent[], collapsed: ReadonlySet<string>): AgentRow[] {
  const rows: AgentRow[] = []
  const walk = (agent: RunAgent, depth: number, parentId: string | null) => {
    const children = agent.children ?? []
    const expanded = children.length > 0 && !collapsed.has(agent.id)
    rows.push({ agent, depth, parentId, hasChildren: children.length > 0, expanded })
    if (expanded) for (const child of children) walk(child, depth + 1, agent.id)
  }
  for (const root of roots) walk(root, 0, null)
  return rows
}

/** 树里的键盘：交给 TraceWaterfall 的 moveSpan。 */
export function moveAgent(rows: readonly AgentRow[], id: string, key: string): SpanMove | undefined {
  return moveSpan(
    rows.map(({ agent, ...rest }) => ({ span: agent, ...rest })),
    id,
    key,
  )
}

/** 工具小方块：不多于 4 个全摆；多了摆前 3 个，再加一块「+N」。 */
export function toolTiles(tools: readonly string[] | undefined): { shown: readonly string[]; more: number } {
  const list = tools ?? []
  if (list.length <= 4) return { shown: list, more: 0 }
  return { shown: list.slice(0, 3), more: list.length - 3 }
}

// SPDX-License-Identifier: MIT
// 花费瀑布的纯逻辑（KATANAview #1908 第三批）：一次 Agent 会话的每一步（模型调用、工具调用、子 Agent）按调用次序排，
// 每步的条从前面各步的累计处起，长度是它的花费（或 token）；子 Agent 自己的数加上它所有子步的数，调用方不用预先加好。
// 负的花费是退款或抵扣，条往回走。折叠的子 Agent 整块算一步。不带 React 与 DOM。
import { niceTicks } from '../../lib/chart/series-geometry.ts'

/** Kind of step: a sub-agent, a model call or a tool call. */
export type CostStepKind = 'agent' | 'llm' | 'tool'

/** State of a step. */
export type CostStepStatus = 'running' | 'done' | 'failed'

/** One step of an agent run. */
export type CostStep = {
  /** Stable key. */
  id: string
  /** Step name. */
  name: string
  /** Sub-agent, model call or tool call. */
  kind: CostStepKind
  /** Running, done or failed; defaults to done. */
  status?: CostStepStatus
  /** Model name of a model call, or any muted text. */
  model?: string
  /** Cost of the step itself; sub-agents add their children on top. Negative is a credit. */
  cost?: number
  /** Prompt (input) tokens. */
  tokensIn?: number
  /** Completion (output) tokens. */
  tokensOut?: number
  /** Duration in milliseconds; a sub-agent without one sums its children. */
  duration?: number
  /** Prompt, task or tool input shown in the details. */
  input?: string
  /** Response, result or tool output shown in the details. */
  output?: string
  /** Error text of a failed step. */
  error?: string
  /** Steps of a sub-agent. */
  children?: readonly CostStep[]
}

/** What the bars measure. */
export type CostMode = 'cost' | 'tokens'

/** Totals of a step with its children. */
export type CostTotals = { cost: number; tokensIn: number; tokensOut: number; duration: number }

/** One visible row with its bar on the cumulative axis. */
export type CostRow = {
  step: CostStep
  depth: number
  parentId: string | null
  hasChildren: boolean
  expanded: boolean
  totals: CostTotals
  /** Bar from and to on the axis (from > to for a credit). */
  from: number
  to: number
}

/** 一步连同子步的合计：子 Agent 的数是它自己的加上所有子步的；时长没给就取子步之和。 */
export function stepTotals(step: CostStep): CostTotals {
  const kids = (step.children ?? []).map(stepTotals)
  const sum = (pick: (t: CostTotals) => number) => kids.reduce((total, t) => total + pick(t), 0)
  return {
    cost: (step.cost ?? 0) + sum((t) => t.cost),
    tokensIn: (step.tokensIn ?? 0) + sum((t) => t.tokensIn),
    tokensOut: (step.tokensOut ?? 0) + sum((t) => t.tokensOut),
    duration: step.duration ?? sum((t) => t.duration),
  }
}

/** 这一步在当前模式下的量。 */
export const measure = (totals: CostTotals, mode: CostMode) =>
  mode === 'cost' ? totals.cost : totals.tokensIn + totals.tokensOut

/** 整次会话的合计。 */
export const runTotals = (steps: readonly CostStep[]) =>
  stepTotals({ id: '', name: '', kind: 'agent', children: steps })

/**
 * 前序展开成可见行，每行带它在累计轴上的起止：叶子从当前累计处起、走它自己的量；子 Agent 的条盖住它自己的量加所有子步（展开时子步在它的条里依次排）。
 * 折叠的子 Agent 不展开子步，累计照样走完它整块。
 */
export function costRows(steps: readonly CostStep[], collapsed: ReadonlySet<string>, mode: CostMode): CostRow[] {
  const rows: CostRow[] = []
  let cursor = 0
  const walk = (step: CostStep, depth: number, parentId: string | null) => {
    const children = step.children ?? []
    const totals = stepTotals(step)
    const expanded = children.length > 0 && !collapsed.has(step.id)
    const from = cursor
    const row: CostRow = { step, depth, parentId, hasChildren: children.length > 0, expanded, totals, from, to: from }
    rows.push(row)
    if (expanded) {
      for (const child of children) walk(child, depth + 1, step.id)
      // 子 Agent 自己的量（编排那一次调用）排在它的子步之后。
      cursor += measure({ ...totals, ...ownTotals(step) }, mode)
    } else cursor += measure(totals, mode)
    row.to = cursor
  }
  for (const step of steps) walk(step, 0, null)
  return rows
}

const ownTotals = (step: CostStep) => ({
  cost: step.cost ?? 0,
  tokensIn: step.tokensIn ?? 0,
  tokensOut: step.tokensOut ?? 0,
})

/** 轴的范围与刻度：包住所有行的起止与 0，取整齐步长。 */
export function costAxis(rows: readonly CostRow[]): { lo: number; hi: number; ticks: readonly number[] } {
  const values = [0, ...rows.flatMap((row) => [row.from, row.to])]
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const nice = niceTicks(lo, hi > lo ? hi : lo + 1, 4)
  return { lo: nice.domain[0], hi: nice.domain[1], ticks: nice.ticks }
}

/** 最贵的一步：叶子里当前模式下量最大的（并列取先出现的），带它的祖先（跳过去时要展开）。没有正的就是 null。 */
export function priciestStep(steps: readonly CostStep[], mode: CostMode): { id: string; ancestors: string[] } | null {
  let best: { id: string; ancestors: string[]; value: number } | null = null
  const walk = (step: CostStep, ancestors: string[]) => {
    const children = step.children ?? []
    if (children.length === 0) {
      const value = measure(stepTotals(step), mode)
      if (value > 0 && (best === null || value > best.value)) best = { id: step.id, ancestors, value }
    }
    for (const child of children) walk(child, [...ancestors, step.id])
  }
  for (const step of steps) walk(step, [])
  const hit = best as { id: string; ancestors: string[] } | null
  return hit === null ? null : { id: hit.id, ancestors: hit.ancestors }
}

/** 会话的状态：有在跑的是 live；否则顶层有失败的是 failed；否则 done。调用方给了就用它的。 */
export function runState(
  steps: readonly CostStep[],
  override?: 'live' | 'done' | 'failed',
): 'live' | 'done' | 'failed' {
  if (override !== undefined) return override
  const running = (step: CostStep): boolean => step.status === 'running' || (step.children ?? []).some(running)
  if (steps.some(running)) return 'live'
  return steps.some((step) => step.status === 'failed') ? 'failed' : 'done'
}

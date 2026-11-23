// SPDX-License-Identifier: MIT
// 流程编排的纯逻辑（KATANAview #1908 第三批）：一条自上而下的流程是一列步骤，第一步总是触发（trigger）；条件步（branch）分出几条有名字的路，
// 每条路又是一列步骤。地址用步骤的 id；插入点是 { path：路的 id，最外层是 null；index：插在这一列的第几个 }。
// 读的次序（键盘上下走的次序）：一步；是条件步就依次走它每条路；再到下一步。删掉条件步时它第一条路的步骤留在原处，其余路一起删。
// 时间由调用方给（毫秒），件不取时间。不带 React 与 DOM。

/** Kind of a flow step; the first step of a flow is always the trigger. */
export type FlowStepKind = 'trigger' | 'action' | 'agent' | 'branch' | 'wait'

/** Test-run state of one step. */
export type FlowStepStatus = 'idle' | 'running' | 'done' | 'failed' | 'skipped'

/** One named path of a branch step, with its own steps. */
export type FlowPath = {
  /** Stable key. */
  id: string
  /** Path name, such as Yes, No or Above the limit. */
  label: string
  /** Steps on this path, top to bottom. */
  steps: readonly FlowStep[]
}

/** One step of a flow. */
export type FlowStep = {
  /** Stable key. */
  id: string
  /** Trigger, action, agent, branch or wait. */
  kind: FlowStepKind
  /** Step name. */
  title: string
  /** Muted second line, such as the source or the condition. */
  detail?: string
  /** Line shown while the step runs. */
  note?: string
  /** Paths of a branch step. */
  paths?: readonly FlowPath[]
}

/** Where a new step goes: the path (null for the top level) and the index in it. */
export type FlowSlot = {
  /** Path id, or null for the top level. */
  path: string | null
  /** Position in that list. */
  index: number
}

/** One entry of the add menu. */
export type FlowTemplate = {
  /** Stable key; new step ids start with it. */
  key: string
  /** Kind of the new step. */
  kind: FlowStepKind
  /** Name of the new step. */
  title: string
  /** Second line of the new step and of the menu entry. */
  detail?: string
  /** Note of the new step. */
  note?: string
  /** Path names of a new branch step. */
  paths?: readonly string[]
}

/** Test-run state of one step, with times in milliseconds from the caller's clock. */
export type FlowRun = {
  /** Idle, running, done, failed or skipped. */
  status: FlowStepStatus
  /** When the step started. */
  started?: number
  /** When the step ended. */
  ended?: number
}

/** 读的次序：一步；是条件步就依次走它每条路；再到下一步。 */
export function flowOrder(steps: readonly FlowStep[]): string[] {
  const out: string[] = []
  const walk = (list: readonly FlowStep[]) => {
    for (const step of list) {
      out.push(step.id)
      for (const path of step.paths ?? []) walk(path.steps)
    }
  }
  walk(steps)
  return out
}

/** 一共几步（含各条路里的）。 */
export const countSteps = (steps: readonly FlowStep[]): number => flowOrder(steps).length

/** 找一步：它所在那一列（路 id，最外层是 null）、在列里的位置与那一列。找不到是 null。 */
export function locateStep(
  steps: readonly FlowStep[],
  id: string,
  path: string | null = null,
): { step: FlowStep; path: string | null; index: number; siblings: readonly FlowStep[] } | null {
  for (const [index, step] of steps.entries()) {
    if (step.id === id) return { step, path, index, siblings: steps }
    for (const sub of step.paths ?? []) {
      const found = locateStep(sub.steps, id, sub.id)
      if (found) return found
    }
  }
  return null
}

/** 把 path 那一列（null 是最外层）换成 edit 的结果，其余不动（不改原数组）。 */
function editList(
  steps: readonly FlowStep[],
  path: string | null,
  edit: (list: readonly FlowStep[]) => FlowStep[],
): FlowStep[] {
  if (path === null) return edit(steps)
  return steps.map((step) =>
    step.paths === undefined
      ? step
      : {
          ...step,
          paths: step.paths.map((sub) =>
            sub.id === path ? { ...sub, steps: edit(sub.steps) } : { ...sub, steps: editList(sub.steps, path, edit) },
          ),
        },
  )
}

/** 最外层第一步是触发时，别的步不能插到它前面，它也不能挪。 */
const lockedTop = (list: readonly FlowStep[], path: string | null) => path === null && list[0]?.kind === 'trigger'

/** 在插入点放一步；最外层插不到触发前面（index 至少是 1）。 */
export function insertStep(steps: readonly FlowStep[], slot: FlowSlot, step: FlowStep): FlowStep[] {
  return editList(steps, slot.path, (list) => {
    const low = lockedTop(list, slot.path) ? 1 : 0
    const at = Math.min(list.length, Math.max(low, slot.index))
    return list.toSpliced(at, 0, step)
  })
}

/**
 * 删一步：条件步的第一条路的步骤留在原处，其余路一起删。触发后面还有步骤时不能删（流程第一步总是触发），返回 null。
 * focus 是读的次序里它前面那一步（删的是第一步就取删完后的第一步，删空了是 null）。
 */
export function removeStep(steps: readonly FlowStep[], id: string): { steps: FlowStep[]; focus: string | null } | null {
  const found = locateStep(steps, id)
  if (found === null) return null
  if (lockedTop(found.siblings, found.path) && found.index === 0 && found.siblings.length > 1) return null
  const keep = found.step.kind === 'branch' ? (found.step.paths?.[0]?.steps ?? []) : []
  const next = editList(steps, found.path, (list) => list.toSpliced(found.index, 1, ...keep))
  const order = flowOrder(steps)
  const before = order[order.indexOf(id) - 1]
  return { steps: next, focus: before ?? flowOrder(next)[0] ?? null }
}

/** 在自己那一列里上下挪一格；到头、触发、或会挪到触发前面时返回 null。 */
export function moveStep(steps: readonly FlowStep[], id: string, delta: -1 | 1): FlowStep[] | null {
  const found = locateStep(steps, id)
  if (found === null) return null
  const target = found.index + delta
  const low = lockedTop(found.siblings, found.path) ? 1 : 0
  if (found.index < low || target < low || target >= found.siblings.length) return null
  return editList(steps, found.path, (list) => {
    const copy = [...list]
    ;[copy[found.index], copy[target]] = [copy[target]!, copy[found.index]!]
    return copy
  })
}

/** 所有用过的 id（步骤与路）。 */
function usedIds(steps: readonly FlowStep[], into = new Set<string>()): Set<string> {
  for (const step of steps) {
    into.add(step.id)
    for (const path of step.paths ?? []) {
      into.add(path.id)
      usedIds(path.steps, into)
    }
  }
  return into
}

/** 没用过的 id：base-1、base-2……取第一个空着的。 */
export function freshId(steps: readonly FlowStep[], base: string): string {
  const taken = usedIds(steps)
  let n = 1
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

/** 从模板做一步：条件步按模板的路名（没给用 fallbackPaths）开出空路，路 id 是「步 id-p1」……。 */
export function fromTemplate(template: FlowTemplate, id: string, fallbackPaths: readonly string[]): FlowStep {
  const step: FlowStep = { id, kind: template.kind, title: template.title }
  if (template.detail !== undefined) step.detail = template.detail
  if (template.note !== undefined) step.note = template.note
  if (template.kind === 'branch')
    step.paths = (template.paths ?? fallbackPaths).map((label, n) => ({ id: `${id}-p${n + 1}`, label, steps: [] }))
  return step
}

/** 一条路整条被跳过：有步骤且每一步都是 skipped。 */
export function pathSkipped(path: FlowPath, run: Readonly<Record<string, FlowRun>> | undefined): boolean {
  return path.steps.length > 0 && path.steps.every((step) => run?.[step.id]?.status === 'skipped')
}

/** 一步跑了多久：没开始是 undefined；没结束量到 now（没给 now 也是 undefined）；不出负数。 */
export function flowElapsed(run: FlowRun | undefined, now?: number): number | undefined {
  if (run?.started === undefined) return undefined
  const end = run.ended ?? now
  if (end === undefined || !Number.isFinite(end) || !Number.isFinite(run.started)) return undefined
  return Math.max(0, end - run.started)
}

/** 一次测试运行的结果：通过、失败、跳过各几步（只数 run 里有的）。 */
export function runCounts(run: Readonly<Record<string, FlowRun>> | undefined): Record<FlowStepStatus, number> {
  const counts = { idle: 0, running: 0, done: 0, failed: 0, skipped: 0 }
  for (const entry of Object.values(run ?? {})) counts[entry.status]++
  return counts
}

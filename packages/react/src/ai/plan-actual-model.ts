// SPDX-License-Identifier: MIT
// 计划对实际的纯逻辑（KATANAview #1908 第三批）：Agent 动手前给一份按顺序走的计划（每步预计多久），做的时候记下每步实际的开始与结束。
// 推算完成时间：做完的步用实际结束；正在做的步按「实际开始 + 计划时长」与 now 取晚的；没开始的步接在上一步之后、按计划时长排。
// 时间单位由调用方定（毫秒或分钟都行），这里只做加减。不带 React 与 DOM。

/** One step of a plan. */
export type PlanStep = {
  /** Stable key. */
  id: string
  /** Step name. */
  name: string
  /** Planned start. */
  plannedStart: number
  /** Planned end. */
  plannedEnd: number
  /** Actual start; omit while not started. */
  actualStart?: number
  /** Actual end; omit or null while running. */
  actualEnd?: number | null
}

/** State of a step against its plan. */
export type StepState = 'pending' | 'running' | 'late' | 'done' | 'overrun'

/** One step with its projection. */
export type StepProjection = {
  step: PlanStep
  state: StepState
  /** Projected start and end (actual where known). */
  start: number
  end: number
  /** Time past the planned duration (0 when on time or early). */
  overrun: number
}

const plannedLength = (step: PlanStep) => Math.max(0, step.plannedEnd - step.plannedStart)

/** 逐步推算：返回每步的状态、推算的起止与超时。 */
export function projectPlan(steps: readonly PlanStep[], now: number): StepProjection[] {
  const out: StepProjection[] = []
  let cursor: number | null = null
  for (const step of steps) {
    const length = plannedLength(step)
    let start: number
    let end: number
    let state: StepState
    if (step.actualStart === undefined) {
      // 没开始：接在上一步推算的结束之后；第一步没开始时不早于 now 与计划开始。
      start = cursor ?? Math.max(step.plannedStart, now)
      start = Math.max(start, now)
      end = start + length
      state = 'pending'
    } else if (step.actualEnd === undefined || step.actualEnd === null) {
      start = step.actualStart
      end = Math.max(start + length, now)
      state = now - start > length ? 'late' : 'running'
    } else {
      start = step.actualStart
      end = Math.max(start, step.actualEnd)
      state = end - start > length ? 'overrun' : 'done'
    }
    out.push({ step, state, start, end, overrun: Math.max(0, end - start - length) })
    cursor = end
  }
  return out
}

/** 计划完成、推算完成与推移（推算 − 计划，正是晚了）。没有步时都是 0。 */
export function planShift(
  steps: readonly PlanStep[],
  now: number,
): { planned: number; projected: number; shift: number } {
  if (steps.length === 0) return { planned: 0, projected: 0, shift: 0 }
  const planned = Math.max(...steps.map((step) => step.plannedEnd))
  const projected = Math.max(...projectPlan(steps, now).map((item) => item.end))
  return { planned, projected, shift: projected - planned }
}

/** 时间轴的范围：所有计划与推算的起止，再把 now 包进去。 */
export function planDomain(steps: readonly PlanStep[], now: number): [number, number] {
  const times = [now, ...steps.flatMap((step) => [step.plannedStart, step.plannedEnd])]
  for (const item of projectPlan(steps, now)) times.push(item.start, item.end)
  const lo = Math.min(...times)
  const hi = Math.max(...times)
  return [lo, hi > lo ? hi : lo + 1]
}

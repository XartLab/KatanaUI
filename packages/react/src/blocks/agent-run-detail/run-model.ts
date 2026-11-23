// SPDX-License-Identifier: MIT
// Agent 单次运行详情的纯逻辑（KATANAview #1908 之后，KatanaUI #196）：状态怎么映射成语气、分段进度条哪几根亮、右上动作钮是什么、时间行写什么。
// 不带 React 与 DOM，不读钟：时间（毫秒）全由调用方给。
import type { SeverityExt } from '../../lib/severity.ts'

/** State of one run: running, blocked (waits for an answer), done, paused or failed. */
export type RunDetailStatus = 'running' | 'blocked' | 'done' | 'paused' | 'failed'

/** State of one step of a run. */
export type RunDetailStepStatus = 'done' | 'running' | 'pending' | 'blocked' | 'failed'

/** The button in the top right: it changes with the state of the run. */
export type RunDetailAction = 'pause' | 'resume' | 'cancel' | 'rerun'

/** One step of a run. */
export type RunDetailStep = {
  /** Stable key. */
  id: string
  /** Step name. */
  name: string
  /** State of the step. */
  status: RunDetailStepStatus
  /** How long the step took, in milliseconds; shown on a finished step. */
  duration?: number
}

/** The tone each state is drawn in: the ticks, the state word and the step icons read it. */
const TONE: Record<RunDetailStatus, SeverityExt> = {
  running: 'accent',
  blocked: 'warn',
  done: 'ok',
  paused: 'neutral',
  failed: 'danger',
}

/** Tone of a run state: running accent, blocked warn, done ok, paused neutral, failed danger. */
export const runTone = (status: RunDetailStatus): SeverityExt => TONE[status]

const STEP_TONE: Record<RunDetailStepStatus, SeverityExt> = {
  done: 'ok',
  running: 'accent',
  pending: 'off',
  blocked: 'warn',
  failed: 'danger',
}

/** Tone of a step state. */
export const runStepTone = (status: RunDetailStepStatus): SeverityExt => STEP_TONE[status]

const ACTION: Record<RunDetailStatus, RunDetailAction> = {
  running: 'pause',
  paused: 'resume',
  blocked: 'cancel',
  done: 'rerun',
  failed: 'rerun',
}

/** The header action of a state: pause while running, resume when paused, cancel when blocked, run again when done or failed. */
export const runHeaderAction = (status: RunDetailStatus): RunDetailAction => ACTION[status]

/** Progress as a fraction in [0, 1]; a missing or non-finite value is 0. */
export const clampRunProgress = (progress: number): number =>
  Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0

/** Progress as a whole percent, 0 to 100. */
export const runPercent = (progress: number): number => Math.round(clampRunProgress(progress) * 100)

/** How many ticks are lit, and which one is the current tick (-1 when none). */
export type RunSegments = { filled: number; current: number }

/**
 * Splits `ticks` into lit and dark: the lit ones are the whole ticks the progress has passed.
 * The current tick is the first dark one, only while running; a finished run lights all ticks.
 */
export function runSegments(progress: number, ticks: number, status: RunDetailStatus): RunSegments {
  const total = Math.max(1, Math.floor(ticks))
  const filled = status === 'done' ? total : Math.min(total, Math.floor(clampRunProgress(progress) * total))
  return { filled, current: status === 'running' && filled < total ? filled : -1 }
}

/** Which time line a state shows: the left text and whether the right text (time left) is shown. */
export type RunTimeLine = { left: 'elapsed' | 'blocked' | 'completed'; remaining: boolean }

const TIME: Record<RunDetailStatus, RunTimeLine> = {
  running: { left: 'elapsed', remaining: true },
  paused: { left: 'elapsed', remaining: false },
  failed: { left: 'elapsed', remaining: false },
  blocked: { left: 'blocked', remaining: false },
  done: { left: 'completed', remaining: false },
}

/** The time line of a state: elapsed and time left while running; blocked says how long ago; done says how long it took. */
export const runTimeLine = (status: RunDetailStatus): RunTimeLine => TIME[status]

/** Collapsible parts of the detail, in reading order. */
export type RunDetailSection = 'next' | 'details' | 'steps'

/** The step to point at: the first step that is running or blocked (undefined when none). */
export const currentRunStep = (steps: readonly RunDetailStep[]): RunDetailStep | undefined =>
  steps.find((step) => step.status === 'running' || step.status === 'blocked')

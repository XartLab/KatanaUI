// SPDX-License-Identifier: MIT
// 并行尝试的纯逻辑（KATANAview #1908）：同一件事（一次参数扫描）几组同时跑，跑完的打分，分最好的是「最优」。
// 分数的方向由调用方给（越大越好或越小越好）；没跑完或失败的不参与最优。不带 React 与 DOM。

/** State of one attempt. */
export type AttemptStatus = 'queued' | 'running' | 'done' | 'failed'

/** One attempt (parameter set) of the same task. */
export type Attempt = {
  /** Stable key. */
  id: string
  /** Attempt name, such as the parameter set. */
  name: string
  /** One line on how this attempt differs (the parameters). */
  approach?: string
  /** Queued, running, done or failed; defaults to queued. */
  status?: AttemptStatus
  /** Progress 0..1 while running (or where a failed attempt stopped). */
  progress?: number
  /** Current step while running (「第 3 / 8 年」). */
  step?: string
  /** Score of a finished attempt. */
  score?: number | null
  /** Outcome or error note. */
  note?: string
  /** Wall time in milliseconds. */
  took?: number
}

/** 跑完、有有限分数的才算得上最优；并列取靠前的。没有就是 null。 */
export function bestAttempt(attempts: readonly Attempt[], lowerIsBetter = false): Attempt | null {
  let best: Attempt | null = null
  for (const attempt of attempts) {
    if (attempt.status !== 'done' || typeof attempt.score !== 'number' || !Number.isFinite(attempt.score)) continue
    const top = best?.score as number | undefined
    if (best === null || (lowerIsBetter ? attempt.score < top! : attempt.score > top!)) best = attempt
  }
  return best
}

/** 进度条长度（0..1）：跑完是 1；排队是 0；运行中与失败按 progress，越界夹住，没给是 0。 */
export function attemptFill(attempt: Pick<Attempt, 'status' | 'progress'>): number {
  if (attempt.status === 'done') return 1
  if (attempt.status !== 'running' && attempt.status !== 'failed') return 0
  const value = attempt.progress ?? 0
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
}

/** 各状态的个数（头里的「3 跑完 · 1 运行 · 1 失败」）。 */
export function countAttempts(attempts: readonly Attempt[]): Record<AttemptStatus, number> {
  const counts: Record<AttemptStatus, number> = { queued: 0, running: 0, done: 0, failed: 0 }
  for (const attempt of attempts) counts[attempt.status ?? 'queued'] += 1
  return counts
}

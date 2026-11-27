// SPDX-License-Identifier: MIT
// 回落链的纯逻辑（KATANAview #1908 第二批）：一次请求按顺序试一串数据源（腾讯三个入口、新浪 → 东财 …），失败了走下一级，
// 有一级答上就停，后面的是「不需要」。不带 React 与 DOM。

/** State of one source in the chain. */
export type FallbackStatus = 'waiting' | 'trying' | 'failed' | 'answered' | 'skipped'

/** One source in try order. */
export type FallbackAttempt = {
  /** Stable key. */
  id: string
  /** Source name. */
  name: string
  /** Provider or entry point (「腾讯 · qt 入口」). */
  provider?: string
  /** Waiting, trying, failed, answered or skipped (not needed). */
  status: FallbackStatus
  /** Time spent on this source in milliseconds. */
  took?: number
  /** Why it failed (「限流 · 456」), written by the caller. */
  reason?: string
  /** Any other short note. */
  note?: string
}

/** Where a chain stands. */
export type FallbackOutcome = {
  /** Source that answered, or null. */
  answeredId: string | null
  /** Sources that failed. */
  failed: number
  /** Sources tried so far (failed, trying or answered). */
  tried: number
  /** One source is still being tried. */
  running: boolean
  /** Every source failed and none is left to try. */
  exhausted: boolean
  /** Time spent across tried sources, in milliseconds. */
  elapsed: number
}

export function chainOutcome(attempts: readonly FallbackAttempt[]): FallbackOutcome {
  const answered = attempts.find((attempt) => attempt.status === 'answered') ?? null
  const failed = attempts.filter((attempt) => attempt.status === 'failed').length
  const running = attempts.some((attempt) => attempt.status === 'trying')
  return {
    answeredId: answered?.id ?? null,
    failed,
    tried: attempts.filter((a) => a.status === 'failed' || a.status === 'trying' || a.status === 'answered').length,
    running,
    exhausted: answered === null && !running && attempts.length > 0 && failed === attempts.length,
    elapsed: attempts.reduce((sum, attempt) => sum + (attempt.took ?? 0), 0),
  }
}

/** 第几级答上的（从 1 数）；没答上是 null。读屏与摘要写「第 2 级」用。 */
export function answeredLevel(attempts: readonly FallbackAttempt[]): number | null {
  const index = attempts.findIndex((attempt) => attempt.status === 'answered')
  return index < 0 ? null : index + 1
}

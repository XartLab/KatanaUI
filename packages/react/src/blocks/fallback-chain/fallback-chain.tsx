// SPDX-License-Identifier: MIT
/**
 * Fallback chain: one request routed through an ordered list of sources; failures are labelled, the source that answers connects to the response.
 * 回落链（KATANAview #1908 第二批）：一次取数按顺序试一串数据源：请求节点在上，每个源一行（第几级、状态灯、源名与入口、状态字与原因、耗时），
 * 响应节点在下。失败的行写原因（「限流 · 456」）且竖线变 danger；正在试的行灯亮强调色；答上的那一级竖线一直亮到响应；后面没用上的写「不需要」。
 * 全部失败时响应节点写「全部失败」，有 onRetry 就出「重试」。状态都写成字，不只靠颜色。
 * 功能参照 affectUI 的 Fallback Chain（affectui.com/components/fallback-chain，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创）。
 * 跟它不同：竖排有序列表，不画分叉图：面板窄，回落本来就是一条线；不写花费。纯逻辑在 fallback-model.ts。包里不带语言。
 */
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { Led } from '../../katana/led.tsx'
import { Button } from '../../primitives/button.tsx'
import {
  answeredLevel,
  chainOutcome,
  type FallbackAttempt,
  type FallbackOutcome,
  type FallbackStatus,
} from './fallback-model.ts'

/** Texts of FallbackChain (the package ships no text). */
export type FallbackChainLabels = {
  /** Status words. */
  status: Record<FallbackStatus, string>
  /** Accessible name of the source list. */
  sources: string
  /** Response node text while waiting, after an answer and after every source failed. */
  pending: string
  answered: (attempt: FallbackAttempt, level: number) => string
  exhausted: string
  /** Summary in the header, built by the caller (levels tried, failures, time). */
  summary: (outcome: FallbackOutcome) => string
  /** Retry button label. */
  retry: string
}

export type FallbackChainProps = {
  /** Sources in try order. */
  attempts: readonly FallbackAttempt[]
  /** Heading. */
  title: ReactNode
  /** The request node: what is being fetched, such as a symbol and period. */
  request: ReactNode
  /** Route or policy name next to the request. */
  route?: ReactNode
  /** How milliseconds are written. */
  formatMs: (ms: number) => string
  /** Called by the retry button after every source failed; omit to show no button. */
  onRetry?: () => void
  /** Texts. */
  labels: FallbackChainLabels
  /** Extra class name on the root. */
  className?: string
}

// 灯的语气：正在试的亮强调色（进行中），答上 ok、失败 danger，等待与不需要都熄灭（字里写明是哪一种）。
const TONE_OF = { waiting: 'off', trying: 'accent', failed: 'danger', answered: 'ok', skipped: 'neutral' } as const

export function FallbackChain({
  attempts,
  title,
  request,
  route,
  formatMs,
  onRetry,
  labels,
  className,
}: FallbackChainProps) {
  const outcome = chainOutcome(attempts)
  const level = answeredLevel(attempts)
  const answered = attempts.find((attempt) => attempt.id === outcome.answeredId) ?? null
  const answeredIndex = level === null ? -1 : level - 1
  const state = answered ? 'answered' : outcome.exhausted ? 'exhausted' : outcome.running ? 'running' : 'waiting'
  return (
    <section className={cn('k-fc', className)} data-slot="fallback-chain" data-state={state}>
      <header className="k-fc-head">
        <h4 className="k-fc-title">{title}</h4>
        <span className="k-fc-summary" role="status" data-slot="fallback-summary">
          {labels.summary(outcome)}
        </span>
      </header>
      <div className="k-fc-node" data-part="request">
        <span className="k-fc-request">{request}</span>
        {route !== undefined && <span className="k-fc-route">{route}</span>}
      </div>
      <ol className="k-fc-list" aria-label={labels.sources}>
        {attempts.map((attempt, index) => (
          <li
            key={attempt.id}
            className="k-fc-row"
            data-slot="fallback-attempt"
            data-id={attempt.id}
            data-status={attempt.status}
            // 答上那一级之前（含它）的竖线点亮：请求一路走到了这里。
            data-lit={answeredIndex >= 0 && index <= answeredIndex ? '' : undefined}
          >
            <span className="k-fc-level" aria-hidden="true">
              {index + 1}
            </span>
            <Led tone={TONE_OF[attempt.status]} label={labels.status[attempt.status]} small />
            <span className="k-fc-name">
              {attempt.name}
              {attempt.provider !== undefined && <small>{attempt.provider}</small>}
            </span>
            <span className="k-fc-state">
              {labels.status[attempt.status]}
              {attempt.reason !== undefined && ` · ${attempt.reason}`}
              {attempt.note !== undefined && ` · ${attempt.note}`}
            </span>
            <span className="k-fc-took">{attempt.took === undefined ? '' : formatMs(attempt.took)}</span>
          </li>
        ))}
      </ol>
      <div className="k-fc-node" data-part="response" data-state={state} data-slot="fallback-response">
        <span>
          {answered !== null && level !== null
            ? labels.answered(answered, level)
            : outcome.exhausted
              ? labels.exhausted
              : labels.pending}
        </span>
        {outcome.exhausted && onRetry !== undefined && (
          <Button size="sm" onClick={onRetry} data-slot="fallback-retry">
            {labels.retry}
          </Button>
        )}
      </div>
    </section>
  )
}

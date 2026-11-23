// SPDX-License-Identifier: MIT
/**
 * Agent recap: what background agents did while the person was away, in three lanes (needs you, failed, done) under a strip of when it happened.
 * 离开期间回顾（KATANAview #1908 第三批）：隔夜或离开几小时回来，Agent 在后台做了什么。上面一条离开期间的分布（每段几件，每件一个点；装饰，对读屏隐藏，卡里都有），
 * 下面三列：要你拍板、失败、做完，列头写总数（含超出显示上限的）。每张卡写标题、小注、数量、状态字、动作：要你的有主动作（批准）与查看，失败的有重试与查看，
 * 做完的有查看与撤销（给了 onUndo）。动作可以返回 Promise：等的时候按钮写「处理中」，失败就退回原状；做完换成状态字加撤销，撤销后可重做。悬停或聚焦一张卡，分布条上它的点变亮。
 * 卡等高，动作前后不挤动别的卡。功能参照 affectUI 的 Agent Recap（affectui.com/components/agent-recap，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。
 * 跟它不同：不做开场回放动画；时间写法由调用方给。产品底线：Agent 的产出是建议，主动作只把人的决定回调出去，件不替人做。纯逻辑在 recap-model.ts。包里不带语言。
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { Button } from '../primitives/button.tsx'
import { RECAP_KINDS, recapBuckets, recapCounts, recapLanes, type RecapEvent, type RecapKind } from './recap-model.ts'

/** Texts of AgentRecap (the package ships no text). */
export type AgentRecapLabels = {
  /** Lane heads. */
  lanes: Record<RecapKind, string>
  /** Text of an empty lane. */
  empty: Record<RecapKind, string>
  /** State tag on each card. */
  tag: Record<RecapKind, string>
  /** Default main action of a needs-you card and of a failed card. */
  action: Record<'needs' | 'failed', string>
  review: string
  undo: string
  redo: string
  /** Text on a button while its promise is pending. */
  working: string
  /** Tag after the main action, unless the event has its own; and after an undo. */
  acted: string
  undone: string
  /** Lane footer when items are hidden (「还有 4 件」). */
  more: (count: number) => string
  /** Accessible name of an action button, built from the verb and the item title. */
  named: (verb: string, title: string) => string
  /** Live announcement after an action is done. */
  announce: (verb: string, title: string) => string
}

/** Which action a card button runs. */
export type RecapAction = 'primary' | 'review'

export type AgentRecapProps = {
  /** Everything that happened, in any order. */
  events: readonly RecapEvent[]
  /** When the person left, in milliseconds. */
  since: number
  /** End of the strip (usually now), in milliseconds. */
  until: number
  /** Runs the main action or Review; may return a promise. */
  onAction?: (event: RecapEvent, action: RecapAction) => unknown
  /** Shows Undo on acted-on and done cards; may return a promise. */
  onUndo?: (event: RecapEvent) => unknown
  /** Shows Redo after an undo; may return a promise. */
  onRedo?: (event: RecapEvent) => unknown
  /** Most cards per lane. */
  limit?: number
  /** Heading. */
  title: ReactNode
  /** How a time is written on a card. */
  formatTime: (time: number) => string
  /** Texts. */
  labels: AgentRecapLabels
  /** Extra class name on the root. */
  className?: string
}

type CardState = 'idle' | 'working' | 'acted' | 'undone'

export function AgentRecap({
  events,
  since,
  until,
  onAction,
  onUndo,
  onRedo,
  limit = 3,
  title,
  formatTime,
  labels,
  className,
}: AgentRecapProps) {
  const [states, setStates] = useState<Readonly<Record<string, CardState>>>({})
  const [hot, setHot] = useState<string | null>(null)
  const [said, setSaid] = useState('')
  const root = useRef<HTMLElement>(null)
  const focusNext = useRef<string | null>(null)
  const headingId = useId()
  const lanes = recapLanes(events)
  const counts = recapCounts(events)
  const buckets = recapBuckets(events, since, until)
  const top = Math.max(1, ...buckets)
  const span = until - since > 0 ? until - since : 1

  useEffect(() => {
    if (focusNext.current === null) return
    root.current
      ?.querySelector<HTMLElement>(`[data-slot="recap-card"][data-id="${focusNext.current}"] [data-next]`)
      ?.focus()
    focusNext.current = null
  })

  const stateOf = (id: string): CardState => states[id] ?? 'idle'
  // 一次动作：查看、主动作、撤销、重做；Promise 失败退回原状。只在点击里调。
  const act = async (event: RecapEvent, op: 'review' | 'primary' | 'undo' | 'redo') => {
    const before = stateOf(event.id)
    const verb =
      op === 'review'
        ? labels.review
        : op === 'undo'
          ? labels.undo
          : op === 'redo'
            ? labels.redo
            : event.kind === 'done'
              ? ''
              : (event.action ?? labels.action[event.kind])
    const next: CardState =
      op === 'review' ? before : op === 'undo' ? 'undone' : op === 'redo' && event.kind === 'done' ? 'idle' : 'acted'
    setStates((all) => ({ ...all, [event.id]: 'working' }))
    try {
      if (op === 'review' || op === 'primary') await onAction?.(event, op)
      else if (op === 'undo') await onUndo?.(event)
      else await onRedo?.(event)
      setStates((all) => ({ ...all, [event.id]: next }))
      setSaid(labels.announce(verb, event.title))
      focusNext.current = event.id
    } catch {
      setStates((all) => ({ ...all, [event.id]: before }))
    }
  }

  const card = (event: RecapEvent) => {
    const state = stateOf(event.id)
    const working = state === 'working'
    const verb = event.kind === 'done' ? null : event.action === undefined ? labels.action[event.kind] : event.action
    const button = (text: string, op: 'review' | 'primary' | 'undo' | 'redo', next = false) => (
      <Button
        size="sm"
        variant={text === verb ? 'primary' : 'default'}
        aria-label={labels.named(text, event.title)}
        aria-busy={working || undefined}
        aria-disabled={working || undefined}
        data-next={next ? '' : undefined}
        onClick={() => !working && void act(event, op)}
      >
        {working ? labels.working : text}
      </Button>
    )
    const tag =
      state === 'acted'
        ? (event.doneLabel ?? labels.acted)
        : state === 'undone'
          ? labels.undone
          : labels.tag[event.kind]
    return (
      <li
        key={event.id}
        className="k-rc-card"
        data-slot="recap-card"
        data-id={event.id}
        data-kind={event.kind}
        data-state={state}
        onPointerEnter={() => setHot(event.id)}
        onPointerLeave={() => setHot(null)}
        onFocus={() => setHot(event.id)}
        onBlur={() => setHot(null)}
      >
        <div className="k-rc-card-top">
          <span className="k-rc-tag">{tag}</span>
          <time dateTime={new Date(event.time).toISOString()}>{formatTime(event.time)}</time>
        </div>
        <span className="k-rc-card-title">{event.title}</span>
        <span className="k-rc-card-detail">
          {event.detail}
          {event.count !== undefined && <b>{event.count}</b>}
        </span>
        {/* 次序照参照：先「查看」，再主动作（做完换撤销，撤销后换重做）。 */}
        <div className="k-rc-actions">
          {onAction !== undefined && button(labels.review, 'review')}
          {state === 'undone'
            ? onRedo !== undefined && button(labels.redo, 'redo', true)
            : state === 'acted' || event.kind === 'done'
              ? onUndo !== undefined && button(labels.undo, 'undo', true)
              : onAction !== undefined && verb !== null && button(verb, 'primary')}
        </div>
      </li>
    )
  }

  return (
    <section ref={root} className={cn('k-rc', className)} data-slot="agent-recap" aria-labelledby={headingId}>
      <h4 id={headingId} className="k-rc-title">
        {title}
      </h4>
      <svg className="k-rc-strip" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
        {buckets.map((count, n) => (
          <rect
            key={n}
            x={(n / buckets.length) * 100 + 0.4}
            width={100 / buckets.length - 0.8}
            y={22 - (count / top) * 16}
            height={(count / top) * 16}
            data-part="bucket"
          />
        ))}
        {events
          .filter((event) => event.time >= since && event.time <= until)
          .map((event) => (
            <circle
              key={event.id}
              cx={((event.time - since) / span) * 100}
              cy={3}
              r={hot === event.id ? 2.2 : 1.2}
              data-kind={event.kind}
              data-hot={hot === event.id ? '' : undefined}
            />
          ))}
      </svg>
      <div className="k-rc-strip-axis" aria-hidden="true">
        <span>{formatTime(since)}</span>
        <span>{formatTime(until)}</span>
      </div>
      <div className="k-rc-lanes">
        {RECAP_KINDS.map((kind) => (
          <section key={kind} className="k-rc-lane" data-kind={kind} aria-label={labels.lanes[kind]}>
            <h5 className="k-rc-lane-head">
              {labels.lanes[kind]} <span data-slot="recap-count">{counts[kind]}</span>
            </h5>
            {lanes[kind].length === 0 ? (
              <p className="k-rc-empty">{labels.empty[kind]}</p>
            ) : (
              <ul>{lanes[kind].slice(0, limit).map(card)}</ul>
            )}
            {lanes[kind].length > limit && <p className="k-rc-more">{labels.more(lanes[kind].length - limit)}</p>}
          </section>
        ))}
      </div>
      <p className="k-rc-live" aria-live="polite">
        {said}
      </p>
    </section>
  )
}

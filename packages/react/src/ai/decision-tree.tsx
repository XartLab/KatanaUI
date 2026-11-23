// SPDX-License-Identifier: MIT
/**
 * Decision tree: an agent's options at a decision point as branches with their consequences; risky consequences are flagged, the agent's pick is marked, and the person picks a branch or writes an instruction.
 * 决策树（KATANAview #1908 第三批）：Agent 走到岔口要人拍板（清洗规则、回补范围、调仓幅度）。左边是问题、背景、Agent 名与风险标（高 / 中）；中间是两到四个分支（编号 1–4，Agent 倾向的那支标出来）；
 * 每个分支右边是它的后果，一行一条，有风险的打标，聚焦或悬停（或按 F 依次跳过去）看注释与出处。最后一支可以是「其他…」：写一句指示，Enter 发出，Shift+Enter 换行，Agent 的回话写在下面。
 * 选了分支这个决定就离开清单，接着看下一个；←→（或 K / J）在几个待定的决定之间走。每次选择与回话在读屏里播报。
 * 功能参照 affectUI 的 Decision Tree（affectui.com/components/decision-tree，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。
 * 跟它不同：没有命令式句柄（ref 上的 hover / choose …）；连线是 CSS 画的轨道。产品底线：件只把人的选择回调出去，Agent 不会因为倾向某支就自动执行。包里不带语言。
 */
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { Button } from '../primitives/button.tsx'

/** A consequence line: plain text, or flagged with a note and an optional source. */
export type DecisionEffect = string | { text: string; note: string; source?: string }

/** One branch of a decision. */
export type DecisionOption = {
  /** Stable key. */
  id: string
  /** What the branch does. */
  label: string
  /** Consequences, one line each. */
  effects?: readonly DecisionEffect[]
  /** The agent's preferred branch. */
  pick?: boolean
}

/** One pending decision. */
export type Decision = {
  /** Stable key. */
  id: string
  /** The question. */
  question: string
  /** Background under the question. */
  context?: string
  /** Agent that asks. */
  agent: string
  /** Model label after the agent name. */
  model?: string
  /** Risk tag shown for high and medium. */
  risk?: 'high' | 'medium' | 'low'
  /** Two to four branches. */
  options: readonly DecisionOption[]
}

/** What the person chose. */
export type DecisionChoice = { option: DecisionOption } | { other: string }

/** Texts of DecisionTree (the package ships no text). */
export type DecisionTreeLabels = {
  /** Tag on the agent's pick. */
  agentPick: string
  /** Risk tags. */
  risk: Record<'high' | 'medium', string>
  /** The Other branch, its field name, and the send button. */
  other: string
  otherField: string
  send: string
  /** Position among pending decisions (「1 / 3」), and the two step buttons. */
  position: (index: number, count: number) => string
  previous: string
  next: string
  /** Live announcements. */
  chose: (question: string, choice: string) => string
  sent: (question: string) => string
  /** Text when nothing is pending. */
  empty: string
}

export type DecisionTreeProps = {
  /** Pending decisions; new ones go at the end. */
  decisions: readonly Decision[]
  /** Called with a branch pick or a written instruction; for an instruction it may return (a promise of) the agent's short reply. */
  onChoose?: (decision: Decision, choice: DecisionChoice) => unknown
  /** Shows the Other branch. */
  allowOther?: boolean
  /** Heading. */
  title: ReactNode
  /** Texts. */
  labels: DecisionTreeLabels
  /** Extra class name on the root. */
  className?: string
}

const effectText = (effect: DecisionEffect) => (typeof effect === 'string' ? effect : effect.text)

export function DecisionTree({ decisions, onChoose, allowOther = true, title, labels, className }: DecisionTreeProps) {
  const [resolved, setResolved] = useState<readonly string[]>([])
  const [index, setIndex] = useState(0)
  const [otherOpen, setOtherOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [replies, setReplies] = useState<Readonly<Record<string, string>>>({})
  const [said, setSaid] = useState('')
  const root = useRef<HTMLElement>(null)
  const baseId = useId()
  const pending = decisions.filter((decision) => !resolved.includes(decision.id))
  const at = Math.min(index, Math.max(0, pending.length - 1))
  const decision = pending[at]

  const step = (delta: number) => {
    setIndex(Math.min(pending.length - 1, Math.max(0, at + delta)))
    setOtherOpen(false)
  }
  const choose = (option: DecisionOption) => {
    if (decision === undefined) return
    void onChoose?.(decision, { option })
    setResolved([...resolved, decision.id])
    setSaid(labels.chose(decision.question, option.label))
    setOtherOpen(false)
  }
  const send = async () => {
    if (decision === undefined || draft.trim() === '') return
    const text = draft.trim()
    setDraft('')
    setSaid(labels.sent(decision.question))
    const reply = await onChoose?.(decision, { other: text })
    if (typeof reply === 'string') {
      setReplies((all) => ({ ...all, [decision.id]: reply }))
      setSaid(reply)
    }
  }
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || decision === undefined) return
    const typing = event.target instanceof HTMLTextAreaElement
    if (event.key === 'Escape') {
      if (otherOpen) {
        event.preventDefault()
        setOtherOpen(false)
        root.current?.querySelector<HTMLElement>('[data-slot="decision-other"]')?.focus()
      } else if (document.activeElement?.hasAttribute('data-flag')) (document.activeElement as HTMLElement).blur()
      return
    }
    if (typing) return
    const n = Number(event.key)
    if (Number.isInteger(n) && n >= 1 && n <= decision.options.length) {
      event.preventDefault()
      choose(decision.options[n - 1]!)
      return
    }
    if (allowOther && n === decision.options.length + 1) {
      event.preventDefault()
      setOtherOpen(true)
      return
    }
    const key = event.key.toLowerCase()
    if (event.key === 'ArrowLeft' || key === 'k') {
      event.preventDefault()
      step(-1)
    } else if (event.key === 'ArrowRight' || key === 'j') {
      event.preventDefault()
      step(1)
    } else if (key === 'f') {
      // 依次跳到下一条有风险的后果，聚焦即显示注释。
      const flags = [...(root.current?.querySelectorAll<HTMLElement>('[data-flag]') ?? [])]
      if (flags.length === 0) return
      event.preventDefault()
      const current = flags.indexOf(document.activeElement as HTMLElement)
      flags[(current + 1) % flags.length]!.focus()
    }
  }

  return (
    <section ref={root} className={cn('k-dt', className)} data-slot="decision-tree" onKeyDown={onKeyDown}>
      <header className="k-dt-head">
        <h4 className="k-dt-title">{title}</h4>
        {pending.length > 1 && (
          <span className="k-dt-nav">
            <Button
              size="sm"
              variant="ghost"
              aria-keyshortcuts="ArrowLeft K"
              disabled={at === 0}
              onClick={() => step(-1)}
            >
              {labels.previous}
            </Button>
            <span>{labels.position(at + 1, pending.length)}</span>
            <Button
              size="sm"
              variant="ghost"
              aria-keyshortcuts="ArrowRight J"
              disabled={at === pending.length - 1}
              onClick={() => step(1)}
            >
              {labels.next}
            </Button>
          </span>
        )}
      </header>
      {decision === undefined ? (
        <p className="k-dt-empty">{labels.empty}</p>
      ) : (
        <div className="k-dt-body" data-slot="decision" data-id={decision.id}>
          <div className="k-dt-question">
            <p className="k-dt-ask">{decision.question}</p>
            {decision.context !== undefined && <p className="k-dt-context">{decision.context}</p>}
            <p className="k-dt-agent">
              <span>{decision.agent}</span>
              {decision.model !== undefined && <small>{decision.model}</small>}
              {(decision.risk === 'high' || decision.risk === 'medium') && (
                <small className="k-dt-risk" data-risk={decision.risk}>
                  {labels.risk[decision.risk]}
                </small>
              )}
            </p>
          </div>
          <ol className="k-dt-branches">
            {decision.options.map((option, n) => (
              <li key={option.id} className="k-dt-branch" data-pick={option.pick ? '' : undefined}>
                <Button
                  size="sm"
                  variant={option.pick ? 'primary' : 'default'}
                  className="k-dt-choose"
                  data-slot="decision-option"
                  aria-keyshortcuts={String(n + 1)}
                  aria-label={option.pick ? `${option.label}，${labels.agentPick}` : option.label}
                  onClick={() => choose(option)}
                >
                  <kbd aria-hidden="true">{n + 1}</kbd>
                  {option.label}
                </Button>
                {option.pick && <small className="k-dt-pick">{labels.agentPick}</small>}
                {option.effects !== undefined && option.effects.length > 0 && (
                  <ul className="k-dt-effects">
                    {option.effects.map((effect, e) => {
                      if (typeof effect === 'string') return <li key={e}>{effect}</li>
                      const noteId = `${baseId}-${option.id}-${e}`
                      return (
                        <li key={e} className="k-dt-flagged">
                          <span tabIndex={0} data-flag="" aria-describedby={noteId}>
                            {effectText(effect)}
                          </span>
                          <span id={noteId} role="tooltip" className="k-dt-note">
                            {effect.note}
                            {effect.source !== undefined && <small> · {effect.source}</small>}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            ))}
            {allowOther && (
              <li className="k-dt-branch" data-other="">
                <Button
                  size="sm"
                  variant="ghost"
                  className="k-dt-choose"
                  data-slot="decision-other"
                  aria-expanded={otherOpen}
                  aria-keyshortcuts={String(decision.options.length + 1)}
                  onClick={() => setOtherOpen(!otherOpen)}
                >
                  <kbd aria-hidden="true">{decision.options.length + 1}</kbd>
                  {labels.other}
                </Button>
                {otherOpen && (
                  <div className="k-dt-other">
                    <label htmlFor={`${baseId}-other`}>{labels.otherField}</label>
                    <textarea
                      id={`${baseId}-other`}
                      rows={2}
                      value={draft}
                      // 用户刚点开「其他…」就是要写字，焦点直接进框。
                      autoFocus
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                          event.preventDefault()
                          void send()
                        }
                      }}
                    />
                    <Button size="sm" onClick={() => void send()} disabled={draft.trim() === ''}>
                      {labels.send}
                    </Button>
                  </div>
                )}
                {replies[decision.id] !== undefined && (
                  <p className="k-dt-reply" data-slot="decision-reply">
                    {replies[decision.id]}
                  </p>
                )}
              </li>
            )}
          </ol>
        </div>
      )}
      <p className="k-dt-live" aria-live="polite">
        {said}
      </p>
    </section>
  )
}

// SPDX-License-Identifier: MIT
/**
 * Away summary: a short "while you were away" card for a chat thread or a panel, folding into a one-line divider once read.
 * 离开摘要（KATANAview #1908 第三批）：回到对话或面板时的一张小卡：头一行写离开了多久（或从几点起）与各类计数，下面一行一件：状态字（要你 / 失败 / 做完）、标题、小注、一个动作
 * （默认决定 / 重试 / 打开，可改字或不要）。要你的排最前、失败其次、做完最后；超过 limit 的收进「再看 n 件」。「知道了」把卡折成一行分隔条，点分隔条再展开。
 * 动作可以返回 Promise，等的时候按钮写「处理中」、仍可聚焦。行等高，状态变了不挤动别的行。
 * 功能参照 affectUI 的 Away Summary（affectui.com/components/away-summary，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。
 * 跟它不同：件不走钟（now 由调用方给）；离开多久怎么写（时长或钟点）由调用方的 heading 决定。要看图与三列的整夜回顾用 AgentRecap。排序在 recap-model.ts。包里不带语言。
 */
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../lib/cn.ts'
import { Button } from '../primitives/button.tsx'
import { recapCounts, recapOrder, type RecapEvent, type RecapKind } from './recap-model.ts'

/** Texts of AwaySummary (the package ships no text). */
export type AwaySummaryLabels = {
  /** Heading from the time the person left and now (「你离开了 2 小时 14 分」「9:40 以来」). */
  heading: (since: number, now: number) => string
  /** Count line (「2 件要你 · 1 件失败 · 5 件做完」). */
  counts: (counts: Record<RecapKind, number>) => string
  /** Status word per kind, written on each row. */
  mark: Record<RecapKind, string>
  /** Default action per kind. */
  action: Record<RecapKind, string>
  /** Text on a button while its promise is pending. */
  working: string
  /** Accessible name of an action button, from the verb and the item title. */
  named: (verb: string, title: string) => string
  /** Show more and show less. */
  more: (count: number) => string
  less: string
  /** Dismiss button, and the text of the folded divider. */
  gotIt: string
  divider: (since: number, now: number) => string
}

export type AwaySummaryProps = {
  /** When the person left, in milliseconds. */
  since: number
  /** Current time, in milliseconds; the component does not tick on its own. */
  now: number
  /** What happened, in any order. */
  items: readonly RecapEvent[]
  /** Runs a row's action; may return a promise. */
  onAction?: (item: RecapEvent) => unknown
  /** Called by Got it, so the caller can record that the card was seen. */
  onDismiss?: () => void
  /** Controlled folded state. */
  collapsed?: boolean
  /** Folded state when uncontrolled. */
  defaultCollapsed?: boolean
  /** Called when the card folds or opens. */
  onCollapsedChange?: (collapsed: boolean) => void
  /** Rows shown before Show more. */
  limit?: number
  /** Texts. */
  labels: AwaySummaryLabels
  /** Extra class name on the root. */
  className?: string
}

export function AwaySummary({
  since,
  now,
  items,
  onAction,
  onDismiss,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  limit = 5,
  labels,
  className,
}: AwaySummaryProps) {
  const [innerCollapsed, setInnerCollapsed] = useState(defaultCollapsed)
  const [all, setAll] = useState(false)
  const [working, setWorking] = useState<readonly string[]>([])
  const root = useRef<HTMLElement>(null)
  const lastUsed = useRef<string | null>(null)
  const focusNext = useRef<string | null>(null)
  const headingId = useId()
  const collapsed = collapsedProp ?? innerCollapsed
  const ordered = recapOrder(items)
  const shown = all ? ordered : ordered.slice(0, limit)
  const counts = recapCounts(items)

  useEffect(() => {
    if (focusNext.current === null) return
    root.current?.querySelector<HTMLElement>(focusNext.current)?.focus()
    focusNext.current = null
  })

  const setCollapsed = (next: boolean, focusTarget: string) => {
    if (collapsedProp === undefined) setInnerCollapsed(next)
    onCollapsedChange?.(next)
    focusNext.current = focusTarget
  }
  const fold = () => setCollapsed(true, '[data-slot="away-divider"]')
  const unfold = () =>
    setCollapsed(
      false,
      lastUsed.current === null
        ? '[data-slot="away-action"]'
        : `[data-slot="away-action"][data-id="${lastUsed.current}"]`,
    )
  const act = async (item: RecapEvent) => {
    if (onAction === undefined || working.includes(item.id)) return
    lastUsed.current = item.id
    setWorking((list) => [...list, item.id])
    try {
      await onAction(item)
    } finally {
      setWorking((list) => list.filter((id) => id !== item.id))
    }
  }

  return (
    <section
      ref={root}
      className={cn('k-away', className)}
      data-slot="away-summary"
      data-collapsed={collapsed ? '' : undefined}
      aria-labelledby={collapsed ? undefined : headingId}
      aria-label={collapsed ? labels.divider(since, now) : undefined}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || collapsed) return
        event.preventDefault()
        fold()
      }}
    >
      {collapsed ? (
        <button
          type="button"
          className="k-away-divider"
          data-slot="away-divider"
          aria-expanded={false}
          onClick={unfold}
        >
          <span>{labels.divider(since, now)}</span>
        </button>
      ) : (
        <>
          <header className="k-away-head">
            <h4 id={headingId} className="k-away-title">
              {labels.heading(since, now)}
            </h4>
            <span className="k-away-counts">{labels.counts(counts)}</span>
          </header>
          <ul className="k-away-list">
            {shown.map((item) => {
              const verb = item.action === undefined ? labels.action[item.kind] : item.action
              const busy = working.includes(item.id)
              return (
                <li key={item.id} className="k-away-row" data-slot="away-row" data-kind={item.kind}>
                  <span className="k-away-mark">{labels.mark[item.kind]}</span>
                  <span className="k-away-text">
                    <span className="k-away-row-title" title={item.title}>
                      {item.title}
                    </span>
                    {item.detail !== undefined && <span className="k-away-detail">{item.detail}</span>}
                  </span>
                  {verb !== null && onAction !== undefined && (
                    <Button
                      size="sm"
                      variant={item.kind === 'needs' ? 'primary' : 'default'}
                      data-slot="away-action"
                      data-id={item.id}
                      aria-label={labels.named(verb, item.title)}
                      aria-busy={busy || undefined}
                      aria-disabled={busy || undefined}
                      onClick={() => void act(item)}
                    >
                      {busy ? labels.working : verb}
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
          <footer className="k-away-foot">
            {ordered.length > limit && (
              <Button
                size="sm"
                variant="ghost"
                aria-expanded={all}
                onClick={() => {
                  if (!all)
                    focusNext.current = `[data-slot="away-row"]:nth-child(${limit + 1}) [data-slot="away-action"]`
                  setAll(!all)
                }}
              >
                {all ? labels.less : labels.more(ordered.length - limit)}
              </Button>
            )}
            <Button
              size="sm"
              aria-expanded
              onClick={() => {
                onDismiss?.()
                fold()
              }}
              data-slot="away-dismiss"
            >
              {labels.gotIt}
            </Button>
          </footer>
        </>
      )}
    </section>
  )
}

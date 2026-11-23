// SPDX-License-Identifier: MIT
/**
 * Root cause tree: a fault tree for why something failed; each hypothesis is checked, ruled out or confirmed, and a confirmed leaf lights the path back to the failure.
 * 排查树（KATANAview #1908 第一批）：数据异常（缺 K、断流、对不上账）的排查。故障在最上一行（标题加一行小注），下面一层层假设，
 * 每行：门（或 / 且，父行才有）、状态字、标题、涉及的文件或数据源；已排除的行变淡、左线变虚，已确认且没有子假设的是根因，从它到故障的一条线点亮。
 * Enter / Space 打开这一行的证据（结论一句、证据种类、证据原文、涉及的文件、检查时间），再按一次收起；有 onAction 时根因的证据下面有「修复」「从这里重跑」。
 * 功能参照 affectUI 的 Root Cause Tree（affectui.com/components/root-cause-tree，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创）。
 * 跟它不同：只画缩进树（它宽屏画成分叉图、窄了才退成缩进列表）：面板里宽度常常不够，一种版式不跳。状态是字加线型，不只靠颜色。
 * 键盘是 APG 树：一个 Tab 停点，↑↓ 上下一行、← 父、→ 第一个子、Home / End；Esc 收起证据回到树上。纯逻辑在 root-cause-model.ts。包里不带语言。
 */
import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { Button } from '../../primitives/button.tsx'
import {
  countCauses,
  flattenCauses,
  isRootCause,
  litPath,
  moveCause,
  type Cause,
  type CauseFailure,
  type CauseGate,
  type CauseStatus,
} from './root-cause-model.ts'

/** Actions offered on a root cause. */
export type RootCauseAction = 'fix' | 'retry'

/** Texts of RootCauseTree (the package ships no text). */
export type RootCauseTreeLabels = {
  /** Status words. */
  status: Record<CauseStatus, string>
  /** Gate words on a parent row (「任一」「同时」). */
  gate: Record<CauseGate, string>
  /** Tag on a root cause (「根因」). */
  rootCause: string
  /** Header counts, built by the caller. */
  counts: (counts: Record<CauseStatus, number>) => string
  /** Accessible name of the evidence panel. */
  evidence: string
  /** Evidence panel text when nothing is open (「选一行看证据」). */
  pick: string
  /** Evidence panel text when the open row has no evidence yet. */
  noEvidence: string
  /** Action button labels. */
  fix: string
  retry: string
}

export type RootCauseTreeProps = {
  /** The failure and its hypotheses. */
  failure: CauseFailure
  /** Heading. */
  title: ReactNode
  /** Accessible name of the tree. */
  label: string
  /** Controlled open row id; null when no evidence is open. */
  openId?: string | null
  /** Row opened first when uncontrolled. */
  defaultOpenId?: string | null
  /** Called when the open row changes. */
  onOpenChange?: (id: string | null) => void
  /** Called with a root cause and the chosen action; omit to keep the evidence read-only. */
  onAction?: (cause: Cause, action: RootCauseAction) => void
  /** How a check time in milliseconds is written; omit to hide times. */
  formatTime?: (at: number) => string
  /** Texts. */
  labels: RootCauseTreeLabels
  /** Extra class name on the root. */
  className?: string
}

export function RootCauseTree({
  failure,
  title,
  label,
  openId: openProp,
  defaultOpenId = null,
  onOpenChange,
  onAction,
  formatTime,
  labels,
  className,
}: RootCauseTreeProps) {
  const rows = flattenCauses(failure)
  const lit = litPath(failure)
  const [innerOpen, setInnerOpen] = useState<string | null>(defaultOpenId)
  const [focusId, setFocusId] = useState<string>(failure.id)
  const items = useRef(new Map<string, HTMLElement>())
  const panelId = useId()
  const openId = openProp !== undefined ? openProp : innerOpen
  const current = rows.some((row) => row.id === focusId) ? focusId : failure.id
  const open = rows.find((row) => row.id === openId)?.cause ?? null

  const setOpen = (next: string | null) => {
    if (openProp === undefined) setInnerOpen(next)
    onOpenChange?.(next)
  }
  const focus = (id: string) => {
    setFocusId(id)
    items.current.get(id)?.focus()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLElement>, id: string) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (id !== failure.id) setOpen(openId === id ? null : id)
      return
    }
    if (event.key === 'Escape') {
      if (openId === null) return
      event.preventDefault()
      setOpen(null)
      return
    }
    const next = moveCause(rows, id, event.key)
    if (next === undefined) return
    event.preventDefault()
    focus(next)
  }
  const onPanelKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || openId === null) return
    event.preventDefault()
    const back = openId
    setOpen(null)
    focus(back)
  }

  return (
    <section className={cn('k-rct', className)} data-slot="root-cause-tree">
      <header className="k-rct-head">
        <h4 className="k-rct-title">{title}</h4>
        <span className="k-rct-counts" data-slot="root-cause-counts">
          {labels.counts(countCauses(failure))}
        </span>
      </header>
      <div className="k-rct-body">
        <ul className="k-rct-tree" role="tree" aria-label={label}>
          {rows.map((row) => {
            const cause = row.cause
            const status = cause?.status ?? 'open'
            const root = cause !== null && isRootCause(cause)
            const gate = row.hasChildren ? (cause ? (cause.gate ?? 'or') : (failure.gate ?? 'or')) : null
            const name = cause
              ? [cause.title, labels.status[status], root ? labels.rootCause : null, gate ? labels.gate[gate] : null]
              : [failure.title, failure.detail, gate ? labels.gate[gate] : null]
            return (
              <li
                key={row.id}
                ref={(node) => {
                  if (node) items.current.set(row.id, node)
                  else items.current.delete(row.id)
                }}
                role="treeitem"
                aria-level={row.depth + 1}
                aria-label={name.filter(Boolean).join('，')}
                aria-selected={cause !== null && openId === row.id}
                aria-controls={cause !== null ? panelId : undefined}
                tabIndex={row.id === current ? 0 : -1}
                className="k-rct-row"
                data-slot={cause ? 'root-cause-item' : 'root-cause-failure'}
                data-id={row.id}
                data-status={cause ? status : 'failure'}
                data-root={root ? '' : undefined}
                data-lit={lit.has(row.id) ? '' : undefined}
                style={{ '--k-rct-depth': row.depth } as CSSProperties}
                onFocus={() => setFocusId(row.id)}
                onClick={() => {
                  focus(row.id)
                  if (cause) setOpen(openId === row.id ? null : row.id)
                }}
                onKeyDown={(event) => onKeyDown(event, row.id)}
              >
                {gate !== null && (
                  <span className="k-rct-gate" data-gate={gate} aria-hidden="true">
                    {labels.gate[gate]}
                  </span>
                )}
                {cause ? (
                  <>
                    <span className="k-rct-status" data-status={status} aria-hidden="true">
                      {root ? labels.rootCause : labels.status[status]}
                    </span>
                    <span className="k-rct-name">{cause.title}</span>
                    {cause.files?.map((file) => (
                      <code key={file} className="k-rct-file" aria-hidden="true">
                        {file}
                      </code>
                    ))}
                  </>
                ) : (
                  <>
                    <span className="k-rct-name" data-part="failure">
                      {failure.title}
                    </span>
                    {failure.detail !== undefined && (
                      <span className="k-rct-detail" aria-hidden="true">
                        {failure.detail}
                      </span>
                    )}
                  </>
                )}
              </li>
            )
          })}
        </ul>
        <div
          id={panelId}
          className="k-rct-evidence"
          role="region"
          aria-label={labels.evidence}
          aria-live="polite"
          data-slot="root-cause-evidence"
          onKeyDown={onPanelKeyDown}
        >
          {open === null ? (
            <p className="k-rct-pick">{labels.pick}</p>
          ) : (
            <>
              <p className="k-rct-ev-title">
                <span className="k-rct-status" data-status={open.status ?? 'open'}>
                  {isRootCause(open) ? labels.rootCause : labels.status[open.status ?? 'open']}
                </span>
                {open.title}
              </p>
              {open.verdict !== undefined && <p className="k-rct-verdict">{open.verdict}</p>}
              {open.evidence ? (
                <>
                  <span className="k-rct-kind">{open.evidence.kind}</span>
                  {/* 证据原文可能比面板宽、比面板长：给一个 Tab 停点，方向键能滚。 */}
                  <pre className="k-rct-code" tabIndex={0}>
                    {open.evidence.content}
                  </pre>
                </>
              ) : (
                <p className="k-rct-pick">{labels.noEvidence}</p>
              )}
              {(open.files?.length ?? 0) > 0 && (
                <p className="k-rct-files">
                  {open.files!.map((file) => (
                    <code key={file} className="k-rct-file">
                      {file}
                    </code>
                  ))}
                </p>
              )}
              {open.at !== undefined && formatTime !== undefined && (
                <p className="k-rct-at">{formatTime(open.at)}</p>
              )}
              {onAction !== undefined && isRootCause(open) && (
                <p className="k-rct-actions">
                  <Button size="sm" variant="primary" onClick={() => onAction(open, 'fix')}>
                    {labels.fix}
                  </Button>
                  <Button size="sm" onClick={() => onAction(open, 'retry')}>
                    {labels.retry}
                  </Button>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

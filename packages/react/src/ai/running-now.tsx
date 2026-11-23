// SPDX-License-Identifier: MIT
/**
 * Running now: a pill in a header or status bar that sums up live background agent tasks and opens into a list with pause, resume and open per task.
 * 正在跑（KATANAview #1908 第三批）：放在标题栏或状态栏的一颗胶囊，写「3 个在跑 · 2 个要你」；点开是任务清单，每行写标题、当前步、进度环与「第几 / 共几步」，
 * 一个图标钮：在跑的暂停、暂停的继续、要你的打开（带标记）；点行本身也打开。行的次序不跟着状态变，行等高。底下可选「打开任务」。
 * 键盘：在胶囊上 Enter / Space / ↓ 打开并聚焦第一行，清单里 ↑↓ 在行间走、Home / End 头尾、Tab 先到这一行的钮再到下一行，Esc 关上、焦点回胶囊。
 * 功能参照 affectUI 的 Running Now（affectui.com/components/running-now，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。
 * 弹层用我们的 Popover（Radix，点外面与焦点离开就关）。包里不带语言。
 */
import { ExternalLinkIcon, PauseIcon, PlayIcon } from 'lucide-react'
import { useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { Button } from '../primitives/button.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover.tsx'

/** State of a live task. */
export type RunningTaskState = 'running' | 'paused' | 'needs' | 'done'

/** One live background task. */
export type RunningTask = {
  /** Stable key. */
  id: string
  /** Task name. */
  title: string
  /** Current step text. */
  step?: string
  /** Steps done. */
  done: number
  /** Steps in all. */
  total: number
  /** Running, paused, waiting on a person, or done. */
  state: RunningTaskState
}

/** Texts of RunningNow (the package ships no text). */
export type RunningNowLabels = {
  /** Full summary on the pill and its accessible name (「3 个在跑 · 2 个要你」); the caller handles plurals. */
  summary: (counts: Record<RunningTaskState, number>) => string
  /** Numbers-only summary for very narrow pills. */
  short: (counts: Record<RunningTaskState, number>) => string
  /** Accessible name of the list. */
  list: string
  /** State words read on each row. */
  state: Record<RunningTaskState, string>
  /** Step count (「4 / 9」). */
  steps: (done: number, total: number) => string
  /** Icon button names, built with the task title. */
  pause: (title: string) => string
  resume: (title: string) => string
  open: (title: string) => string
  /** Footer link. */
  openAll: string
  /** Live announcement of tasks that need you or finished. */
  live: (counts: Record<RunningTaskState, number>) => string
}

export type RunningNowProps = {
  /** Live tasks, in a stable order. */
  tasks: readonly RunningTask[]
  /** Pauses a running task. */
  onPause?: (task: RunningTask) => void
  /** Resumes a paused task. */
  onResume?: (task: RunningTask) => void
  /** Opens a task (row click, or the button of a task that needs you). */
  onOpen?: (task: RunningTask) => void
  /** Shows the footer link. */
  onOpenAll?: () => void
  /** Whether the list starts open when uncontrolled. */
  defaultOpen?: boolean
  /** Controlled open state. */
  open?: boolean
  /** Called when the list opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Which edge of the pill the list lines up with. */
  align?: 'start' | 'end'
  /** Texts. */
  labels: RunningNowLabels
  /** Extra class name on the root. */
  className?: string
}

/** 各状态的个数。 */
export function runningCounts(tasks: readonly RunningTask[]): Record<RunningTaskState, number> {
  const counts = { running: 0, paused: 0, needs: 0, done: 0 }
  for (const task of tasks) counts[task.state]++
  return counts
}

const RING = 2 * Math.PI * 8

export function RunningNow({
  tasks,
  onPause,
  onResume,
  onOpen,
  onOpenAll,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  align = 'end',
  labels,
  className,
}: RunningNowProps) {
  const [innerOpen, setInnerOpen] = useState(defaultOpen)
  const list = useRef<HTMLUListElement>(null)
  const open = openProp ?? innerOpen
  const counts = runningCounts(tasks)
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setInnerOpen(next)
    onOpenChange?.(next)
  }
  const onListKey = (event: KeyboardEvent<HTMLUListElement>) => {
    const rows = [...(list.current?.querySelectorAll<HTMLElement>('[data-slot="running-row"]') ?? [])]
    const index = rows.indexOf(document.activeElement as HTMLElement)
    if (rows.length === 0 || index < 0) return
    const next =
      event.key === 'ArrowDown'
        ? Math.min(rows.length - 1, index + 1)
        : event.key === 'ArrowUp'
          ? Math.max(0, index - 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? rows.length - 1
              : -1
    if (next < 0) return
    event.preventDefault()
    rows[next]!.focus()
  }

  const action = (task: RunningTask) => {
    if (task.state === 'running' && onPause !== undefined)
      return (
        <Button variant="icon" size="icon" aria-label={labels.pause(task.title)} onClick={() => onPause(task)}>
          <PauseIcon aria-hidden="true" />
        </Button>
      )
    if (task.state === 'paused' && onResume !== undefined)
      return (
        <Button variant="icon" size="icon" aria-label={labels.resume(task.title)} onClick={() => onResume(task)}>
          <PlayIcon aria-hidden="true" />
        </Button>
      )
    if (task.state === 'needs' && onOpen !== undefined)
      return (
        <Button variant="icon" size="icon" aria-label={labels.open(task.title)} onClick={() => onOpen(task)}>
          <ExternalLinkIcon aria-hidden="true" />
        </Button>
      )
    return <span className="k-rn-gap" aria-hidden="true" />
  }

  return (
    <div className={cn('k-rn', className)} data-slot="running-now">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="k-rn-pill"
            data-slot="running-trigger"
            data-needs={counts.needs > 0 ? '' : undefined}
            data-idle={tasks.length === 0 ? '' : undefined}
            aria-label={labels.summary(counts)}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowDown' || open) return
              event.preventDefault()
              setOpen(true)
            }}
          >
            <i className="k-rn-pulse" aria-hidden="true" />
            <span className="k-rn-long" aria-hidden="true">
              {labels.summary(counts)}
            </span>
            <span className="k-rn-short" aria-hidden="true">
              {labels.short(counts)}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align={align} className="k-rn-pop" aria-label={labels.list}>
          <ul ref={list} className="k-rn-list" aria-label={labels.list} onKeyDown={onListKey}>
            {tasks.map((task) => {
              const share = task.total > 0 ? Math.min(1, task.done / task.total) : 0
              return (
                <li key={task.id} className="k-rn-item" data-state={task.state}>
                  <button
                    type="button"
                    className="k-rn-row"
                    data-slot="running-row"
                    data-id={task.id}
                    aria-label={[task.title, labels.state[task.state], task.step, labels.steps(task.done, task.total)]
                      .filter(Boolean)
                      .join('，')}
                    onClick={() => onOpen?.(task)}
                  >
                    <svg className="k-rn-ring" viewBox="0 0 20 20" aria-hidden="true">
                      <circle cx="10" cy="10" r="8" data-part="track" />
                      <circle
                        cx="10"
                        cy="10"
                        r="8"
                        data-part="fill"
                        strokeDasharray={`${(share * RING).toFixed(2)} ${RING.toFixed(2)}`}
                      />
                    </svg>
                    <span className="k-rn-text">
                      <span className="k-rn-title">{task.title}</span>
                      <span className="k-rn-step">
                        {task.state === 'running' ? (task.step ?? '') : labels.state[task.state]}
                      </span>
                    </span>
                    <span className="k-rn-count">{labels.steps(task.done, task.total)}</span>
                    {task.state === 'needs' && <i className="k-rn-badge" aria-hidden="true" />}
                  </button>
                  {action(task)}
                </li>
              )
            })}
          </ul>
          {onOpenAll !== undefined && (
            <div className="k-rn-foot">
              <Button size="sm" variant="link" onClick={onOpenAll}>
                {labels.openAll}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <span className="k-rn-live" aria-live="polite">
        {labels.live(counts)}
      </span>
    </div>
  )
}

// SPDX-License-Identifier: MIT
/**
 * Scheduled runs: a week of quota-limited sessions; booked tasks sit in day × session cells, the rest wait in a stack that auto mode sorts into the week.
 * 定时运行（KATANAview #1908 第二批）：一周的定时任务（回补、新闻、因子重算）按「天 × 时段」排，每个时段一份额度（数据源配额、Agent 会话用量）。
 * 左边是待排栈，右边是周格子；自动模式按栈的次序往后填，放不下就拆成几块（每块不小于 minPiece），手动模式栈里的不排、订好的与挪过的不动。
 * 卡能拖进格子或在格子间拖；键盘：Space 拿起、方向键瞄准（←→ 前后一天，↑↓ 上下一个时段）、Space 放下、Esc 放回原处，Enter 开合详情；每一步在底栏播报有没有空位、落在哪。
 * 过去的时段变淡、不收新卡、里面的卡不能挪；当前时段顶上一道红线。
 * 功能参照 affectUI 的 Scheduled Runs（affectui.com/components/scheduled-runs，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）。
 * 跟它不同：没有 Agent 头像组的筛选、没有循环演示与自动开跑的计时；一格的卡数上限可配（它固定两张）。纯逻辑在 schedule-model.ts。包里不带语言。
 */
import { useEffect, useId, useRef, useState, type CSSProperties, type DragEvent, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn.ts'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group.tsx'
import {
  buildSchedule,
  canDrop,
  firstOpenSlot,
  isPast,
  moveSlot,
  sameSlot,
  slotIndex,
  type SchedulePiece,
  type SchedulePin,
  type ScheduledTask,
  type Slot,
} from './schedule-model.ts'

/** Texts of ScheduledRuns (the package ships no text). */
export type ScheduledRunsLabels = {
  /** Accessible name of the mode switch, and its two options. */
  mode: string
  auto: string
  manual: string
  /** Heading of the stack, and its text when empty. */
  stack: string
  stackEmpty: string
  /** Accessible name of the week. */
  week: string
  /** Card hint read after its name (「Enter 看详情，Space 拿起」). */
  hint: string
  /** Word on cards in past sessions. */
  locked: string
  /** Piece mark on a split task (「1/2」). */
  piece: (index: number, count: number) => string
  /** Announcements while moving a card by keyboard or pointer. */
  aimed: (task: string, cell: string, room: boolean) => string
  dropped: (task: string, cell: string) => string
  noRoom: (task: string, cell: string) => string
  cancelled: (task: string) => string
}

/** A move of one card, for the caller to save. */
export type ScheduleMove = { taskId: string; usage: number; from: Slot | null; to: Slot }

export type ScheduledRunsProps = {
  /** Tasks in stack order; booked ones carry `at`. */
  tasks: readonly ScheduledTask[]
  /** Day column names, left to right. */
  days: readonly string[]
  /** Session row names, top to bottom (start times). */
  sessions: readonly string[]
  /** Current session; earlier ones are past. */
  now?: Slot
  /** Quota per session, in the unit of task usage. */
  limit?: number
  /** Smallest piece when auto mode splits a task. */
  minPiece?: number
  /** Most cards in one session. */
  maxPerSession?: number
  /** Controlled mode. */
  mode?: 'auto' | 'manual'
  /** Mode when uncontrolled. */
  defaultMode?: 'auto' | 'manual'
  /** Called when the mode switch changes. */
  onModeChange?: (mode: 'auto' | 'manual') => void
  /** Called after a card is dropped somewhere new; use it to save. */
  onMove?: (move: ScheduleMove) => void
  /** Heading. */
  title: string
  /** Quiet note after the heading, such as the session length. */
  note?: string
  /** How a usage is written (「35%」). */
  formatUsage: (usage: number) => string
  /** Texts. */
  labels: ScheduledRunsLabels
  /** Extra class name on the root. */
  className?: string
}

type Held = { id: string; target: Slot }

export function ScheduledRuns({
  tasks,
  days,
  sessions,
  now,
  limit = 100,
  minPiece = 15,
  maxPerSession = 2,
  mode: modeProp,
  defaultMode = 'auto',
  onModeChange,
  onMove,
  title,
  note,
  formatUsage,
  labels,
  className,
}: ScheduledRunsProps) {
  const [innerMode, setInnerMode] = useState(defaultMode)
  const [pins, setPins] = useState<readonly SchedulePin[]>([])
  const [moved, setMoved] = useState<Readonly<Record<string, Slot>>>({})
  const [held, setHeld] = useState<Held | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [open, setOpen] = useState<readonly string[]>([])
  const [said, setSaid] = useState('')
  const cards = useRef(new Map<string, HTMLButtonElement>())
  const focusNext = useRef<string | null>(null)
  const pinCount = useRef(0)
  const hintId = useId()
  const mode = modeProp ?? innerMode
  const shape = { limit, maxPerSession, sessions: sessions.length, now }
  const pieces = buildSchedule({
    tasks,
    pins,
    moved,
    mode,
    days: days.length,
    sessions: sessions.length,
    limit,
    minPiece,
    maxPerSession,
    now,
  })
  const taskOf = (piece: SchedulePiece) => tasks.find((task) => task.id === piece.taskId)!
  const cellName = (slot: Slot) => `${days[slot.day]} ${sessions[slot.session]}`
  const locked = (piece: SchedulePiece) => piece.slot !== null && isPast(piece.slot, sessions.length, now)

  useEffect(() => {
    if (focusNext.current === null) return
    cards.current.get(focusNext.current)?.focus()
    focusNext.current = null
  })

  const setMode = (next: 'auto' | 'manual') => {
    if (modeProp === undefined) setInnerMode(next)
    onModeChange?.(next)
  }

  const place = (piece: SchedulePiece, target: Slot): boolean => {
    const name = taskOf(piece).title
    if (!canDrop(pieces, piece, target, shape)) {
      setSaid(labels.noRoom(name, cellName(target)))
      return false
    }
    let id = piece.id
    if (piece.kind === 'booked') setMoved({ ...moved, [piece.taskId]: target })
    else if (piece.kind === 'pinned') setPins(pins.map((pin) => (pin.id === piece.id ? { ...pin, slot: target } : pin)))
    else {
      id = `${piece.taskId}:p${pinCount.current++}`
      setPins([...pins, { id, taskId: piece.taskId, usage: piece.usage, slot: target }])
    }
    focusNext.current = id
    setSaid(labels.dropped(name, cellName(target)))
    onMove?.({ taskId: piece.taskId, usage: piece.usage, from: piece.slot, to: target })
    return true
  }

  const onCardKey = (event: KeyboardEvent<HTMLButtonElement>, piece: SchedulePiece) => {
    const name = taskOf(piece).title
    if (event.key === 'Enter') {
      event.preventDefault()
      setOpen(open.includes(piece.id) ? open.filter((id) => id !== piece.id) : [...open, piece.id])
      return
    }
    if (event.key === 'Escape') {
      if (held?.id === piece.id) {
        event.preventDefault()
        setHeld(null)
        setSaid(labels.cancelled(name))
      } else if (open.includes(piece.id)) {
        event.preventDefault()
        setOpen(open.filter((id) => id !== piece.id))
      }
      return
    }
    if (event.key === ' ') {
      event.preventDefault()
      if (locked(piece)) {
        setSaid(`${name} · ${labels.locked}`)
        return
      }
      if (held?.id === piece.id) {
        if (place(piece, held.target)) setHeld(null)
        return
      }
      const target = piece.slot ?? firstOpenSlot(sessions.length, now)
      setHeld({ id: piece.id, target })
      setSaid(labels.aimed(name, cellName(target), canDrop(pieces, piece, target, shape)))
      return
    }
    if (held?.id !== piece.id) return
    const target = moveSlot(held.target, event.key, days.length, sessions.length)
    if (target === undefined) return
    event.preventDefault()
    setHeld({ id: piece.id, target })
    setSaid(labels.aimed(name, cellName(target), canDrop(pieces, piece, target, shape)))
  }

  const dragged = dragId === null ? null : (pieces.find((piece) => piece.id === dragId) ?? null)
  const heldPiece = held === null ? null : (pieces.find((piece) => piece.id === held.id) ?? null)
  const onCellDragOver = (event: DragEvent<HTMLElement>, slot: Slot) => {
    if (dragged !== null && canDrop(pieces, dragged, slot, shape)) event.preventDefault()
  }
  const onCellDrop = (event: DragEvent<HTMLElement>, slot: Slot) => {
    event.preventDefault()
    if (dragged !== null) place(dragged, slot)
    setDragId(null)
  }

  const card = (piece: SchedulePiece) => {
    const task = taskOf(piece)
    const siblings = pieces.filter((item) => item.taskId === piece.taskId)
    const isLocked = locked(piece)
    const isOpen = open.includes(piece.id)
    return (
      <li key={piece.id} className="k-sched-item">
        <button
          type="button"
          ref={(node) => {
            if (node) cards.current.set(piece.id, node)
            else cards.current.delete(piece.id)
          }}
          className="k-sched-card"
          data-slot="schedule-card"
          data-id={piece.id}
          data-kind={piece.kind}
          data-locked={isLocked ? '' : undefined}
          data-held={held?.id === piece.id ? '' : undefined}
          aria-expanded={task.detail === undefined ? undefined : isOpen}
          aria-describedby={hintId}
          draggable={!isLocked}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move'
            setDragId(piece.id)
          }}
          onDragEnd={() => setDragId(null)}
          onClick={() =>
            task.detail !== undefined && setOpen(isOpen ? open.filter((id) => id !== piece.id) : [...open, piece.id])
          }
          onKeyDown={(event) => onCardKey(event, piece)}
        >
          <span className="k-sched-card-title">{task.title}</span>
          <span className="k-sched-card-meta">
            {task.owner !== undefined && <span>{task.owner}</span>}
            <span className="k-sched-usage">{formatUsage(piece.usage)}</span>
            {siblings.length > 1 && <span>{labels.piece(siblings.indexOf(piece) + 1, siblings.length)}</span>}
            {isLocked && <span>{labels.locked}</span>}
          </span>
          {isOpen && task.detail !== undefined && <span className="k-sched-card-detail">{task.detail}</span>}
        </button>
      </li>
    )
  }

  const stack = pieces.filter((piece) => piece.slot === null)
  return (
    <section className={cn('k-sched', className)} data-slot="scheduled-runs" data-mode={mode}>
      <header className="k-sched-head">
        <h4 className="k-sched-title">{title}</h4>
        {note !== undefined && <span className="k-sched-note">{note}</span>}
        <ToggleGroup
          size="sm"
          aria-label={labels.mode}
          value={mode}
          onValueChange={(next) => setMode(next as 'auto' | 'manual')}
          className="k-sched-mode"
        >
          <ToggleGroupItem value="auto">{labels.auto}</ToggleGroupItem>
          <ToggleGroupItem value="manual">{labels.manual}</ToggleGroupItem>
        </ToggleGroup>
      </header>
      <div className="k-sched-body">
        <section className="k-sched-stack" aria-label={labels.stack} data-slot="schedule-stack">
          <h5 className="k-sched-stack-title">
            {labels.stack} · {stack.length}
          </h5>
          {stack.length === 0 ? <p className="k-sched-empty">{labels.stackEmpty}</p> : <ul>{stack.map(card)}</ul>}
        </section>
        <div
          className="k-sched-week"
          role="group"
          aria-label={labels.week}
          style={{ '--k-sched-days': days.length, '--k-sched-sessions': sessions.length } as CSSProperties}
        >
          <span className="k-sched-corner" aria-hidden="true" />
          {days.map((day, d) => (
            <span key={day} className="k-sched-day" aria-hidden="true" style={{ gridColumn: d + 2 }}>
              {day}
            </span>
          ))}
          {sessions.map((session, s) => (
            <span key={session} className="k-sched-session" aria-hidden="true" style={{ gridRow: s + 2 }}>
              {session}
            </span>
          ))}
          {/* 格子按天优先排进 DOM：Tab 先走完一天的几个时段再到下一天。 */}
          {days.flatMap((_, d) =>
            sessions.map((_, s) => {
              const slot = { day: d, session: s }
              const inCell = pieces.filter((piece) => sameSlot(piece.slot, slot))
              const used = inCell.reduce((sum, piece) => sum + piece.usage, 0)
              const aimed = held !== null && sameSlot(held.target, slot) && heldPiece !== null
              return (
                <div
                  key={`${d}:${s}`}
                  role="group"
                  aria-label={`${cellName(slot)} · ${formatUsage(used)}`}
                  className="k-sched-cell"
                  data-slot="schedule-cell"
                  data-cell={`${d}:${s}`}
                  data-past={isPast(slot, sessions.length, now) ? '' : undefined}
                  data-now={
                    now !== undefined && slotIndex(now, sessions.length) === slotIndex(slot, sessions.length)
                      ? ''
                      : undefined
                  }
                  data-aim={aimed ? (canDrop(pieces, heldPiece, slot, shape) ? 'room' : 'full') : undefined}
                  style={{ gridColumn: d + 2, gridRow: s + 2 }}
                  onDragOver={(event) => onCellDragOver(event, slot)}
                  onDrop={(event) => onCellDrop(event, slot)}
                >
                  <i
                    className="k-sched-fill"
                    aria-hidden="true"
                    style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
                  />
                  {inCell.length > 0 && <ul>{inCell.map(card)}</ul>}
                </div>
              )
            }),
          )}
        </div>
      </div>
      <p id={hintId} className="k-sched-hint">
        {labels.hint}
      </p>
      <p className="k-sched-live" aria-live="polite" data-slot="schedule-live">
        {said}
      </p>
    </section>
  )
}

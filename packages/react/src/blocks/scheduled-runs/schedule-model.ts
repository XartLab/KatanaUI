// SPDX-License-Identifier: MIT
// 定时运行的纯逻辑（KATANAview #1908 第二批）：一周按「天 × 时段」排的格子，每个时段有一份额度（limit，比如数据源的请求配额、Agent 一个会话的用量上限，单位由调用方定），
// 一格最多放 maxPerSession 张卡（格子等高）。任务三种来处：调用方订好的（at）、用户挪过的（pin）、还在待排栈里的。
// 自动模式按栈的次序从当前时段起往后填：放不下就拆，每块不小于 minPiece（最后一块剩多少放多少）；手动模式栈里的不排。过去的时段不收新卡、里面的卡不能挪。
// 不带 React 与 DOM。

/** A place in the week: day column and session row, both from 0. */
export type Slot = {
  /** Day column, from 0. */
  day: number
  /** Session row, from 0. */
  session: number
}

/** One task to schedule. */
export type ScheduledTask = {
  /** Stable key. */
  id: string
  /** Task name. */
  title: string
  /** Quota the task uses, in the unit of the limit. */
  usage: number
  /** Who runs it (an agent, a service); muted text on the card. */
  owner?: string
  /** Text shown when the card's details are open. */
  detail?: string
  /** Booked place; omit to leave the task in the stack. */
  at?: Slot
}

/** A piece of a task moved by hand; keeps its usage and place. */
export type SchedulePin = {
  /** Stable key of the piece. */
  id: string
  /** Task it belongs to. */
  taskId: string
  /** Quota the piece uses. */
  usage: number
  /** Where it was put. */
  slot: Slot
}

/** Where a card came from. */
export type PieceKind = 'booked' | 'pinned' | 'auto' | 'stack'

/** One card on the board: a whole task or a piece of a split one; slot is null while it waits in the stack. */
export type SchedulePiece = {
  /** Stable key of the card. */
  id: string
  /** Task it belongs to. */
  taskId: string
  /** Quota the card uses. */
  usage: number
  /** Where it sits; null while it waits in the stack. */
  slot: Slot | null
  /** Booked, moved by hand, sorted in by auto mode, or waiting in the stack. */
  kind: PieceKind
}

export type ScheduleInput = {
  /** Tasks in stack order. */
  tasks: readonly ScheduledTask[]
  /** Pieces moved by hand. */
  pins: readonly SchedulePin[]
  /** Booked tasks moved by hand: task id → new place. */
  moved: Readonly<Record<string, Slot>>
  /** Auto sorts the stack into the week; manual leaves it. */
  mode: 'auto' | 'manual'
  /** Number of day columns. */
  days: number
  /** Number of session rows. */
  sessions: number
  /** Quota per session. */
  limit: number
  /** Smallest piece when a task is split. */
  minPiece: number
  /** Most cards in one session. */
  maxPerSession: number
  /** Current session; sessions before it are past. */
  now?: Slot
}

/** 时段的线性序号：先天后时段。 */
export const slotIndex = (slot: Slot, sessions: number) => slot.day * sessions + slot.session
export const slotKey = (slot: Slot) => `${slot.day}:${slot.session}`
export const sameSlot = (a: Slot | null, b: Slot | null) =>
  a !== null && b !== null && a.day === b.day && a.session === b.session

/** 过去的时段：早于 now 的那一格（now 本身不算过去）。没给 now 就没有过去。 */
export const isPast = (slot: Slot, sessions: number, now?: Slot) =>
  now !== undefined && slotIndex(slot, sessions) < slotIndex(now, sessions)

/** 每格已用的额度与卡数。 */
export function occupancy(pieces: readonly SchedulePiece[]): Map<string, { usage: number; count: number }> {
  const map = new Map<string, { usage: number; count: number }>()
  for (const piece of pieces) {
    if (piece.slot === null) continue
    const key = slotKey(piece.slot)
    const cell = map.get(key) ?? { usage: 0, count: 0 }
    map.set(key, { usage: cell.usage + piece.usage, count: cell.count + 1 })
  }
  return map
}

/** 排一周：订好的与挪过的先占位，栈里的按模式自动填或留在栈里。 */
export function buildSchedule(input: ScheduleInput): SchedulePiece[] {
  const { tasks, pins, moved, mode, days, sessions, limit, minPiece, maxPerSession, now } = input
  const pieces: SchedulePiece[] = []
  for (const task of tasks) {
    if (task.at === undefined) continue
    pieces.push({ id: task.id, taskId: task.id, usage: task.usage, slot: moved[task.id] ?? task.at, kind: 'booked' })
  }
  for (const pin of pins)
    pieces.push({ id: pin.id, taskId: pin.taskId, usage: pin.usage, slot: pin.slot, kind: 'pinned' })
  const used = occupancy(pieces)
  const first = now === undefined ? 0 : Math.max(0, slotIndex(now, sessions))
  for (const task of tasks) {
    if (task.at !== undefined) continue
    let remaining = task.usage - pins.filter((pin) => pin.taskId === task.id).reduce((sum, pin) => sum + pin.usage, 0)
    if (remaining <= 0) continue
    let n = 0
    if (mode === 'auto') {
      for (let index = first; index < days * sessions && remaining > 0; index++) {
        const slot = { day: Math.floor(index / sessions), session: index % sessions }
        const cell = used.get(slotKey(slot)) ?? { usage: 0, count: 0 }
        const room = limit - cell.usage
        if (cell.count >= maxPerSession || room <= 0) continue
        let piece = Math.min(remaining, room)
        // 拆出去之后剩下的不能小于 minPiece：留够 minPiece 给后面；这块本身也不能小于 minPiece（整块放完的除外）。
        if (remaining - piece > 0 && remaining - piece < minPiece) piece = remaining - minPiece
        if (piece < remaining && piece < minPiece) continue
        if (piece <= 0) continue
        pieces.push({ id: `${task.id}:a${n++}`, taskId: task.id, usage: piece, slot, kind: 'auto' })
        used.set(slotKey(slot), { usage: cell.usage + piece, count: cell.count + 1 })
        remaining -= piece
      }
    }
    if (remaining > 0) pieces.push({ id: `${task.id}:s`, taskId: task.id, usage: remaining, slot: null, kind: 'stack' })
  }
  return pieces
}

/** 一张卡能不能放到 target：不是过去、卡数没满、额度够（它本来就在那格的不重复算）。 */
export function canDrop(
  pieces: readonly SchedulePiece[],
  piece: SchedulePiece,
  target: Slot,
  { limit, maxPerSession, sessions, now }: Pick<ScheduleInput, 'limit' | 'maxPerSession' | 'sessions' | 'now'>,
): boolean {
  if (isPast(target, sessions, now)) return false
  const others = pieces.filter((item) => item.id !== piece.id && sameSlot(item.slot, target))
  const usage = others.reduce((sum, item) => sum + item.usage, 0)
  return others.length < maxPerSession && usage + piece.usage <= limit
}

/** 拿着卡时的方向键：←→ 前后一天，↑↓ 同一天的上下一个时段；夹在格子里。别的键返回 undefined。 */
export function moveSlot(slot: Slot, key: string, days: number, sessions: number): Slot | undefined {
  const clamp = (value: number, max: number) => Math.min(max - 1, Math.max(0, value))
  switch (key) {
    case 'ArrowLeft':
      return { day: clamp(slot.day - 1, days), session: slot.session }
    case 'ArrowRight':
      return { day: clamp(slot.day + 1, days), session: slot.session }
    case 'ArrowUp':
      return { day: slot.day, session: clamp(slot.session - 1, sessions) }
    case 'ArrowDown':
      return { day: slot.day, session: clamp(slot.session + 1, sessions) }
    default:
      return undefined
  }
}

/** 从栈里拿起一张卡时先瞄准的格：now 那一格，没给 now 是第一格。 */
export const firstOpenSlot = (sessions: number, now?: Slot): Slot =>
  now === undefined ? { day: 0, session: 0 } : { day: now.day, session: Math.min(sessions - 1, now.session) }

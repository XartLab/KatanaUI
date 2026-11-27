// SPDX-License-Identifier: MIT
// 异动时间流（MoveFeed，#110）的纯函数：异动类型的色调、按时间排（新的在顶上）、多选筛、数值写法。

import { formatCnAmount } from './format.ts'
import { parseClock } from './session.ts'
import { DASH } from './value.ts'

/** 异动类型的色调：涨 / 跌 / 量 / 板。涨跌跟 data-updown，量是中性强调，板是警示色。 */
export type MoveTone = 'up' | 'down' | 'volume' | 'board'

/** 随包认识的异动类型与它们的色调；类型名（key）是稳定标识，写什么字由 labels.types 给。调用方也可以传自己的类型表。 */
export const MOVE_TYPE_TONES: Readonly<Record<string, MoveTone>> = {
  rocket: 'up',
  rebound: 'up',
  dive: 'down',
  plunge: 'down',
  bigBuy: 'volume',
  bigSell: 'volume',
  volumeSurge: 'volume',
  sealUp: 'board',
  sealDown: 'board',
  openUp: 'board',
  openDown: 'board',
  // 加密市场的异动（OKX 市场异动：「5 分钟涨幅 / 跌幅」，2026-11-26 读，#245）；别的窗口（15 分钟、1 小时）用 types 自定。
  rise5m: 'up',
  fall5m: 'down',
}

/** 调用方自定的异动类型：key、显示的字与色调。盖掉随包的同名类型。 */
export type MoveTypeDef = {
  /** Stable key of the move type. */
  key: string
  /** Text written on the capsule. */
  label: string
  /** Up, down, volume or board. */
  tone: MoveTone
}

export type MoveItem = {
  /** Stable id; new rows are told from old ones by it. */
  id: string
  /** Time of the move ("09:31" or "09:31:05"); one that cannot be read sinks to the bottom. */
  time: string
  /** Stock name. */
  name: string
  /** Stock code. */
  code?: string
  /**
   * Symbol the row belongs to (`BTC-USDT-SWAP`), compared with `currentSymbol` when only the current symbol is shown.
   * Falls back to `code`, then `name`. 这一行属于哪个品种；不给就用 code，再不给用 name。
   */
  symbol?: string
  /** Key of the move type. */
  type: string
  /** The figure; a dash when missing. */
  value?: number | null
  /** How the figure is written: percent (signed, with direction colour), amount (wan / yi) or price; percent by default. */
  unit?: 'percent' | 'amount' | 'price'
}

/** 一个类型的色调：先看调用方的类型表，再看随包的，都不认识按 volume（中性）。 */
export function moveTone(type: string, defs?: readonly MoveTypeDef[]): MoveTone {
  return defs?.find((def) => def.key === type)?.tone ?? MOVE_TYPE_TONES[type] ?? 'volume'
}

/** 时刻写成「HH:MM:SS」（只有分钟的补 :00）；写不对原样返回。 */
export function clockText(time: string): string {
  const minutes = parseClock(time)
  if (minutes === null) return time
  const whole = Math.floor(minutes)
  const seconds = Math.round((minutes - whole) * 60)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(whole / 60))}:${pad(whole % 60)}:${pad(seconds)}`
}

/** 按时间从新到旧排；同一时刻后传入的在上（新来的从顶上进）；时刻写不对的沉到底。不改原数组。 */
export function sortFeed(items: readonly MoveItem[]): MoveItem[] {
  return items
    .map((item, index) => ({ item, index, at: parseClock(item.time) ?? -1 }))
    .sort((a, b) => b.at - a.at || b.index - a.index)
    .map((entry) => entry.item)
}

/** 只留属于 symbol 的行（不分大小写、前后空白不计）；symbol 为空时不筛，原样给出。一行属于哪个品种看 symbol，没有就看 code，再没有就看 name。 */
export function filterBySymbol(items: readonly MoveItem[], symbol: string | null | undefined): MoveItem[] {
  const want = symbol?.trim().toLowerCase()
  if (!want) return [...items]
  return items.filter((item) => (item.symbol ?? item.code ?? item.name).trim().toLowerCase() === want)
}

/** 按选中的类型筛；一个都没选是全部。 */
export function filterMoves(items: readonly MoveItem[], selected: readonly string[]): MoveItem[] {
  return selected.length === 0 ? [...items] : items.filter((item) => selected.includes(item.type))
}

/** 各类型的条数：先按随包类型表与调用方类型表的次序，再按首次出现的次序；没出现的不列。 */
export function typeCounts(
  items: readonly MoveItem[],
  defs?: readonly MoveTypeDef[],
): { type: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const item of items) counts.set(item.type, (counts.get(item.type) ?? 0) + 1)
  const order = [...(defs?.map((def) => def.key) ?? []), ...Object.keys(MOVE_TYPE_TONES)]
  const known = order.filter((key, i) => order.indexOf(key) === i && counts.has(key))
  const rest = [...counts.keys()].filter((key) => !known.includes(key))
  return [...known, ...rest].map((type) => ({ type, count: counts.get(type)! }))
}

/** 切换一个类型的选中状态；返回新的选中表（保持点选次序）。 */
export function toggleType(selected: readonly string[], type: string): string[] {
  return selected.includes(type) ? selected.filter((key) => key !== type) : [...selected, type]
}

/** 数值的字与方向：取不到写「—」、方向 flat；percent 带正负号。 */
export function moveValue(item: Pick<MoveItem, 'value' | 'unit'>): { text: string; direction: 'up' | 'down' | 'flat' } {
  const { value } = item
  if (typeof value !== 'number' || !Number.isFinite(value)) return { text: DASH, direction: 'flat' }
  const unit = item.unit ?? 'percent'
  if (unit === 'amount') return { text: formatCnAmount(value), direction: 'flat' }
  if (unit === 'price') return { text: value.toFixed(2), direction: 'flat' }
  const fixed = value.toFixed(2)
  const zero = Number(fixed) === 0
  return {
    text: zero ? '0.00%' : `${value > 0 ? '+' : ''}${fixed}%`,
    direction: zero ? 'flat' : value > 0 ? 'up' : 'down',
  }
}

/** 这一轮新出现的 id（上一轮没有的）；上一轮是 null（首次渲染）时没有新的。 */
export function freshIds(previous: ReadonlySet<string> | null, items: readonly MoveItem[]): Set<string> {
  if (previous === null) return new Set()
  return new Set(items.filter((item) => !previous.has(item.id)).map((item) => item.id))
}

// SPDX-License-Identifier: MIT
// 区间时间轴（RangeScrubber，KatanaUI #11）的纯函数：时刻与 09:30–15:00 时段轴上第几个交易分钟互换（午休不占宽度）、区间夹在「现在」之前、整段平移、近 N 分钟、背景柱的位置。
// 轴上的单位是交易分钟（0 是 09:30，120 是 11:30 与 13:00 贴在一起的那一点，240 是 15:00），所以拖一格就是一分钟。

import { clamp } from '../lib/num.ts'
import { FLOW_MINUTES, FLOW_START } from './flow-race-model.ts'
import { cnTradingMinutesBetween, formatClock, parseClock } from './session.ts'

/** 上午收盘在轴上的位置（交易分钟）：11:30 与 13:00 是同一点。 */
export const SCRUB_LUNCH = 120

/** 「09:45」→ 轴上第几个交易分钟（0 到 240）；午休里的时刻贴到 11:30，09:25–09:30 贴到 09:30；09:25 之前、15:00 之后或写不对返回 null。 */
export function scrubIndex(clock: string | null | undefined): number | null {
  const span = cnTradingMinutesBetween(FLOW_START, parseClock(clock))
  return span === null ? null : Math.round(span)
}

/**
 * 轴上第几个交易分钟 → 「HH:MM」。正好在午休那一点时，区间起点写 13:00（从下午开盘算起），终点写 11:30（算到上午收盘）。
 * 越界夹到 0 到 240。
 */
export function scrubClock(index: number, side: 'low' | 'high' = 'high'): string {
  const at = clamp(Math.round(index), 0, FLOW_MINUTES)
  if (at === SCRUB_LUNCH) return side === 'low' ? '13:00' : '11:30'
  return formatClock(at < SCRUB_LUNCH ? FLOW_START + at : 13 * 60 + (at - SCRUB_LUNCH))
}

/** 「现在」在轴上的位置：给了就按它（写不对按全天），没给就是全天（240）。 */
export function scrubNow(now: string | null | undefined): number {
  if (now === undefined || now === null) return FLOW_MINUTES
  return scrubIndex(now) ?? FLOW_MINUTES
}

/** 整理区间：两端按先后排好，夹在 0 到 now 之间（还没到的时刻选不了）。 */
export function scrubRange(range: readonly [number, number], now: number): [number, number] {
  const top = clamp(now, 0, FLOW_MINUTES)
  const a = clamp(Math.round(range[0]), 0, top)
  const b = clamp(Math.round(range[1]), 0, top)
  return a <= b ? [a, b] : [b, a]
}

/** 时刻写的区间 → 轴上的区间；写不对的一端取轴的端点（起点取 0，终点取 now）。 */
export function scrubRangeOf(value: readonly [string, string], now: number): [number, number] {
  return scrubRange([scrubIndex(value[0]) ?? 0, scrubIndex(value[1]) ?? now], now)
}

/** 整段平移 delta 个交易分钟，宽度不变，撞到 0 或 now 就停。 */
export function shiftRange(range: readonly [number, number], delta: number, now: number): [number, number] {
  const top = clamp(now, 0, FLOW_MINUTES)
  const width = Math.max(0, range[1] - range[0])
  const from = clamp(Math.round(range[0] + delta), 0, Math.max(0, top - width))
  return [from, Math.min(top, from + width)]
}

/** 「近 N 分钟」：从 now 往回数 N 个交易分钟（午休不算），不早于 09:30。 */
export function presetRange(minutes: number, now: number): [number, number] {
  const top = clamp(now, 0, FLOW_MINUTES)
  return [Math.max(0, top - Math.max(0, Math.round(minutes))), top]
}

export type ScrubPoint = {
  /** Clock time of the bucket start, such as "09:31". */
  time: string
  /** The bar height (turnover, volume and the like); null leaves a gap. */
  value: number | null
}

export type ScrubBar = {
  /** 柱在轴上的起点与终点（0 到 1）。 */
  x0: number
  x1: number
  /** 柱高占最高那根的比例（0 到 1）。 */
  share: number
  /** 柱的起点（交易分钟），判断在不在选区里用。 */
  index: number
}

/**
 * 背景柱：每个点从它的时刻画到下一个点的时刻（最后一个画一分钟），高度按最高那根归一。
 * 时刻写不对或不在 09:30–15:00 的点丢掉，取不到的值不画，负数按绝对值。
 */
export function scrubBars(points: readonly ScrubPoint[]): ScrubBar[] {
  const placed = points
    .map((point) => ({ index: scrubIndex(point.time), value: point.value }))
    .filter((item): item is { index: number; value: number | null } => item.index !== null)
    .sort((a, b) => a.index - b.index)
  const peak = Math.max(0, ...placed.map((item) => (Number.isFinite(item.value) ? Math.abs(item.value!) : 0)))
  const bars: ScrubBar[] = []
  placed.forEach((item, i) => {
    if (item.value === null || !Number.isFinite(item.value) || peak === 0) return
    const next = placed[i + 1]?.index ?? Math.min(FLOW_MINUTES, item.index + 1)
    const end = next > item.index ? next : Math.min(FLOW_MINUTES, item.index + 1)
    bars.push({
      x0: item.index / FLOW_MINUTES,
      x1: end / FLOW_MINUTES,
      share: Math.abs(item.value) / peak,
      index: item.index,
    })
  })
  return bars
}

/** 轴下的刻度：每半小时一根，整点与 11:30/13:00 写字。位置是 0 到 1。 */
export const SCRUB_TICKS: readonly { at: number; major: boolean }[] = Array.from({ length: 9 }, (_, i) => ({
  at: (i * 30) / FLOW_MINUTES,
  major: i % 2 === 0,
}))

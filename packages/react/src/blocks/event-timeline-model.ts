// SPDX-License-Identifier: MIT
// 事件时间线（EventTimeline）的排布规则（纯函数，组件与单测共用）。出处：设计稿 EventTimeline 卡（design/katana-console/project/components/EventTimeline/README.md）：
// 轴按交易时段排，午休压成一小段（看的是顺序不是斜率）；同一分钟的事件聚成一个带计数的标记；可见标记 ≤ 60，更多先聚合；标签上下交错。
// 时区由调用方传（应用的显示时区，IANA 名）：同一刻在上海与纽约可能落在不同的「天」，件里不猜、不读系统时区。

import { dayKeyIn } from '../lib/date.ts'
import { fontFor, measureText } from '../lib/text-measure.ts'

/** 类别：异动 / 公告 / 成交 / 警报 / run；形状与状态色见 event-timeline.css。 */
export type EventKind = 'anomaly' | 'notice' | 'fill' | 'alert' | 'run'

export const EVENT_KINDS: readonly EventKind[] = ['anomaly', 'notice', 'fill', 'alert', 'run']

export type TimelineEvent = {
  /** 稳定的 id（React key 与选中回调用）。 */
  id: string
  /** 事件发生的时刻（毫秒时间戳）。 */
  at: number
  kind: EventKind
  /** 标记旁的短标签与 tooltip 的内容。 */
  label: string
  /** 成交的方向：买 = 向上三角（--bid），卖 = 向下三角（--ask）。 */
  side?: 'buy' | 'sell'
  /** 关联对象（FillLog 行、公告、RunInspector 的 run……）：tooltip 里显示。 */
  ref?: string
  symbol?: string
  account?: string
}

/** 交易时段：一天里的若干段，单位是该天零点起的分钟数（时区内），如 A 股 [[570, 690], [780, 900]]。 */
export type SessionMinutes = readonly (readonly [number, number])[]

/** 段与段之间的空档压成轴长的这一比例（午休「压缩成一段短带」；3% 是目测定的，待定）。 */
export const GAP_FRACTION = 0.03
/** 一条轴上最多画这么多标记（卡里的 ≤ 60）。 */
export const MAX_MARKERS = 60

const clockFormats = new Map<string, Intl.DateTimeFormat>()

/** 某一刻在时区 timeZone 里是哪一天：YYYY-MM-DD。 */
export const dayKey = (at: number, timeZone: string): string => dayKeyIn(at, timeZone)

/** 某一刻在时区 timeZone 里的钟点：HH:mm:ss（24 小时制）。 */
export function clock(at: number, timeZone: string): string {
  let format = clockFormats.get(timeZone)
  if (!format) {
    format = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    clockFormats.set(timeZone, format)
  }
  return format.format(at)
}

/** 某一刻在时区里是当天的第几分钟（含小数：秒折进去）。 */
export function minuteOfDay(at: number, timeZone: string): number {
  const [h, m, s] = clock(at, timeZone).split(':').map(Number) as [number, number, number]
  return h * 60 + m + s / 60
}

/** 某一天（YYYY-MM-DD）的某一分钟在时区里是哪一刻。不处理夏令时切换日（A 股与大多数品种无夏令时，待核对）。 */
export function dayMinuteToTime(day: string, minute: number, timeZone: string): number {
  const noon = Date.parse(`${day}T12:00:00Z`)
  let offset = minuteOfDay(noon, timeZone) - 720
  if (offset > 720) offset -= 1440
  if (offset < -720) offset += 1440
  return Date.parse(`${day}T00:00:00Z`) + (minute - offset) * 60_000
}

/** 当天的分钟 → 轴上的位置 0..1；时段外的钳到最近的边，空档里按比例落在压缩带内。 */
export function minuteToFraction(minute: number, session: SessionMinutes): number {
  const gaps = session.length - 1
  const gapTotal = gaps * GAP_FRACTION
  const length = session.reduce((sum, [from, to]) => sum + (to - from), 0)
  let x = 0
  for (const [i, [from, to]] of session.entries()) {
    const width = ((to - from) / length) * (1 - gapTotal)
    if (minute <= from) return x
    if (minute < to) return x + ((minute - from) / (to - from)) * width
    x += width
    const next = session[i + 1]
    if (next) {
      if (minute < next[0]) return x + ((minute - to) / (next[0] - to)) * GAP_FRACTION
      x += GAP_FRACTION
    }
  }
  return 1
}

/** 轴上的位置 0..1 → 当天的分钟（拖选用；落在压缩带里取带的前一段末尾）。 */
export function fractionToMinute(fraction: number, session: SessionMinutes): number {
  const gaps = session.length - 1
  const gapTotal = gaps * GAP_FRACTION
  const length = session.reduce((sum, [from, to]) => sum + (to - from), 0)
  const f = Math.min(1, Math.max(0, fraction))
  let x = 0
  for (const [i, [from, to]] of session.entries()) {
    const width = ((to - from) / length) * (1 - gapTotal)
    if (f <= x + width || i === session.length - 1) return from + Math.min(1, (f - x) / width) * (to - from)
    x += width
    if (f < x + GAP_FRACTION) return to
    x += GAP_FRACTION
  }
  return session[0]?.[0] ?? 0
}

/** 空档在轴上的区间（画 bg-100 短带）。 */
export function gapBands(session: SessionMinutes): { from: number; to: number }[] {
  return session.slice(1).map(([from], i) => {
    const prevEnd = session[i]![1]
    const x = minuteToFraction(prevEnd, session)
    return { from: x, to: minuteToFraction(from, session) }
  })
}

export type Marker = {
  key: string
  /** 轴上的位置 0..1。 */
  x: number
  /** 标记的类别：一类就是它，混合时取优先级最高的（异动 > 警报 > 成交 > run > 公告）。 */
  kind: EventKind
  events: TimelineEvent[]
}

const PRIORITY: readonly EventKind[] = ['anomaly', 'alert', 'fill', 'run', 'notice']

/** 把一天的事件聚成标记：同一分钟聚成一个；还多于 MAX_MARKERS 就把桶加倍再聚，直到放得下。 */
export function clusterMarkers(
  events: readonly TimelineEvent[],
  timeZone: string,
  session: SessionMinutes,
  max = MAX_MARKERS,
): Marker[] {
  // 与 modern-web-guidance js/copying-array-methods：toSorted 直接返回排好的新数组，不必先展开复制再原地排。
  const sorted = events.toSorted((a, b) => a.at - b.at)
  for (let bucket = 1; ; bucket *= 2) {
    const buckets = new Map<number, TimelineEvent[]>()
    for (const event of sorted) {
      const slot = Math.floor(minuteOfDay(event.at, timeZone) / bucket)
      const list = buckets.get(slot)
      if (list) list.push(event)
      else buckets.set(slot, [event])
    }
    if (buckets.size <= max || bucket > 1440) {
      return [...buckets.entries()].map(([slot, list]) => {
        const minutes = list.map((e) => minuteOfDay(e.at, timeZone))
        const mean = minutes.reduce((a, b) => a + b, 0) / minutes.length
        return {
          key: `${bucket}:${slot}`,
          x: minuteToFraction(mean, session),
          kind: PRIORITY.find((k) => list.some((e) => e.kind === k)) ?? list[0]!.kind,
          events: list,
        }
      })
    }
  }
}

export type LabelSide = 'up' | 'down'

export type LabelItem = {
  key: string
  /** 标记中心的横坐标（px，轴左端为 0）。 */
  center: number
  /** 标签的宽度（px）；聚合标记没有标签，给 0 并带 badge。 */
  width: number
  /** 聚合标记：计数徽标占上层的这么宽（px），标签避让要让开。 */
  badge?: number
}

/** 标签之间留的空隙（px）。 */
export const LABEL_GAP = 6

/** 9px 标签的宽度：用 pretext 量真实字宽（2026-11-17），不再按汉字 9、其余 6 估；量不了的环境（单测、SSR）里 measureText 自己退回估计。 */
export function estimateLabelWidth(text: string): number {
  return Math.ceil(measureText(text, fontFor(400, 9, '--font-sans')))
}

/**
 * 标签避让（一维，按 x 排序）：每个标签先试它的偏好层（交错），重叠就换另一层，两层都放不下就省略（返回 null，悬停看全文）。
 * blocked 是不许压的区间（「现在」线与它的字、聚合徽标）；bounds 是标签能伸到的左右极限（px）。
 */
export function placeLabels(
  items: readonly LabelItem[],
  blocked: { up: readonly (readonly [number, number])[]; down: readonly (readonly [number, number])[] },
  bounds: readonly [number, number],
): Map<string, LabelSide | null> {
  const taken: Record<LabelSide, [number, number][]> = {
    up: blocked.up.map(([a, b]) => [a, b]),
    down: blocked.down.map(([a, b]) => [a, b]),
  }
  for (const item of items) if (item.badge) taken.up.push([item.center - item.badge / 2, item.center + item.badge / 2])
  const result = new Map<string, LabelSide | null>()
  const sorted = [...items].filter((i) => i.width > 0).sort((a, b) => a.center - b.center)
  let preferred: LabelSide = 'up'
  for (const item of sorted) {
    const span: [number, number] = [item.center - item.width / 2, item.center + item.width / 2]
    const free = (side: LabelSide) =>
      span[0] >= bounds[0] &&
      span[1] <= bounds[1] &&
      taken[side].every(([a, b]) => span[1] + LABEL_GAP <= a || span[0] - LABEL_GAP >= b)
    const other: LabelSide = preferred === 'up' ? 'down' : 'up'
    const side: LabelSide | null = free(preferred) ? preferred : free(other) ? other : null
    result.set(item.key, side)
    if (side) {
      taken[side].push(span)
      preferred = side === 'up' ? 'down' : 'up'
    }
  }
  return result
}

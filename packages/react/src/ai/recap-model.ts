// SPDX-License-Identifier: MIT
// 离开期间摘要的纯逻辑（KATANAview #1908 第三批）：Agent 在后台做的事分三类：要人拍板的（needs）、失败的（failed）、做完的（done）。
// AgentRecap 按类分三列、每列新的在前；AwaySummary 一张清单，要人的在前、失败其次、做完的最后。时间是调用方的毫秒时钟。不带 React 与 DOM。

/** Kind of a recap item: waiting on a person, failed, or done. */
export type RecapKind = 'needs' | 'failed' | 'done'

/** One thing an agent did or asked for while the person was away. */
export type RecapEvent = {
  /** Stable key. */
  id: string
  /** When it happened, in milliseconds. */
  time: number
  /** Needs you, failed or done. */
  kind: RecapKind
  /** What happened. */
  title: string
  /** Muted second line. */
  detail?: string
  /** A count shown on the card (「12 个品种」), written by the caller. */
  count?: string
  /** Label of the main action; null hides it; omit for the kind's default. */
  action?: string | null
  /** Tag shown after the main action is done (「已批准」). */
  doneLabel?: string
}

export const RECAP_KINDS: readonly RecapKind[] = ['needs', 'failed', 'done']

const newestFirst = (a: RecapEvent, b: RecapEvent) => b.time - a.time || a.id.localeCompare(b.id)

/** 按类分开，每类新的在前。 */
export function recapLanes(events: readonly RecapEvent[]): Record<RecapKind, RecapEvent[]> {
  const lanes: Record<RecapKind, RecapEvent[]> = { needs: [], failed: [], done: [] }
  for (const event of events) lanes[event.kind].push(event)
  for (const kind of RECAP_KINDS) lanes[kind].sort(newestFirst)
  return lanes
}

/** 各类的个数（含超出显示上限的）。 */
export function recapCounts(events: readonly RecapEvent[]): Record<RecapKind, number> {
  const counts = { needs: 0, failed: 0, done: 0 }
  for (const event of events) counts[event.kind]++
  return counts
}

/** 一张清单的次序：要人的在前、失败其次、做完的最后；同类新的在前。 */
export function recapOrder(events: readonly RecapEvent[]): RecapEvent[] {
  return events.toSorted((a, b) => RECAP_KINDS.indexOf(a.kind) - RECAP_KINDS.indexOf(b.kind) || newestFirst(a, b))
}

/** since 到 until 等分 buckets 段，每段发生了几件（离开期间的分布图用）；范围外的不算。 */
export function recapBuckets(events: readonly RecapEvent[], since: number, until: number, buckets = 24): number[] {
  const counts = Array.from({ length: Math.max(1, buckets) }, () => 0)
  const span = until - since
  if (!(span > 0)) return counts
  for (const event of events) {
    if (event.time < since || event.time > until) continue
    const index = Math.min(counts.length - 1, Math.floor(((event.time - since) / span) * counts.length))
    counts[index]!++
  }
  return counts
}

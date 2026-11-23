// SPDX-License-Identifier: MIT
// 链路瀑布的纯逻辑（KATANAview #1908 第二批）：一次请求是一棵 span 树，每个 span 有开始与结束（毫秒，从这次请求开始算）；
// 运行中的 span 没有结束，长到 now。可见行跟着折叠走；最慢的是跑完的叶子里耗时最长的那个。键盘照 APG 树（带展开收起）。不带 React 与 DOM。
import { niceTicks } from '../../lib/chart/series-geometry.ts'

/** State of one span. */
export type SpanStatus = 'running' | 'done' | 'failed'

/** One step of a traced request: a source call, a retry, a parse, a cache read. */
export type TraceSpan = {
  /** Stable key. */
  id: string
  /** Step name. */
  name: string
  /** Kind of step, such as fetch, retry, parse or cache; picks the bar tint. */
  kind: string
  /** Running, done or failed; defaults to done. */
  status?: SpanStatus
  /** Start in milliseconds from the start of the request. */
  start: number
  /** End in milliseconds from the start of the request; omit while running. */
  end?: number
  /** Muted text after the name (the URL, the symbol). */
  detail?: string
  /** One short figure written by the caller, such as rows, bytes or the HTTP status. */
  metric?: string
  /** Error text of a failed span. */
  error?: string
  /** Child steps. */
  children?: readonly TraceSpan[]
}

/** One visible row. */
export type SpanRow = {
  span: TraceSpan
  depth: number
  parentId: string | null
  hasChildren: boolean
  expanded: boolean
}

/** span 的结束：有 end 用 end；运行中用 now（没给 now 就当刚开始）；不早于开始。 */
export function spanEnd(span: TraceSpan, now?: number): number {
  const end = span.end ?? (span.status === 'running' && now !== undefined ? now : span.start)
  return Math.max(span.start, end)
}

/** 整棵树最晚的结束。 */
export function traceExtent(root: TraceSpan, now?: number): number {
  let top = spanEnd(root, now)
  for (const child of root.children ?? []) top = Math.max(top, traceExtent(child, now))
  return top
}

/** 时间轴的范围与刻度：0 到 max(最晚结束, minRange)，取整齐步长（series-geometry 的 niceTicks）。 */
export function traceAxis(extent: number, minRange = 0): { range: number; ticks: readonly number[] } {
  const top = Math.max(extent, minRange, 1)
  const nice = niceTicks(0, top, 5)
  return { range: nice.domain[1], ticks: nice.ticks }
}

/** 前序展开成可见行：折叠的 span 不展开它的子。 */
export function visibleSpans(root: TraceSpan, collapsed: ReadonlySet<string>): SpanRow[] {
  const rows: SpanRow[] = []
  const walk = (span: TraceSpan, depth: number, parentId: string | null) => {
    const children = span.children ?? []
    const expanded = children.length > 0 && !collapsed.has(span.id)
    rows.push({ span, depth, parentId, hasChildren: children.length > 0, expanded })
    if (expanded) for (const child of children) walk(child, depth + 1, span.id)
  }
  walk(root, 0, null)
  return rows
}

/** 最慢的一步：跑完的叶子里耗时最长的（并列取先出现的）；没有就是 null。父 span 的耗时含子，不算。 */
export function slowestSpan(root: TraceSpan): string | null {
  let best: { id: string; took: number } | null = null
  const walk = (span: TraceSpan) => {
    const children = span.children ?? []
    if (children.length === 0 && (span.status ?? 'done') === 'done' && span.end !== undefined) {
      const took = span.end - span.start
      if (best === null || took > best.took) best = { id: span.id, took }
    }
    children.forEach(walk)
  }
  walk(root)
  return (best as { id: string } | null)?.id ?? null
}

/** 整次请求的状态：根标了失败就是失败（子步失败后重试成功不算失败）；还有运行中的 span 是运行中；否则跑完。 */
export function traceStatus(root: TraceSpan): SpanStatus {
  if ((root.status ?? 'done') === 'failed') return 'failed'
  const running = (span: TraceSpan): boolean => span.status === 'running' || (span.children ?? []).some(running)
  return running(root) ? 'running' : 'done'
}

/** Result of a key in the waterfall: move focus, or fold / unfold a span. */
export type SpanMove = { focus: string } | { toggle: string }

/**
 * 键盘：↑↓ 上下一行；→ 收着的先展开、展开的到第一个子；← 展开的先收起、否则回父；Home / End 头尾。别的键返回 undefined。
 */
export function moveSpan(rows: readonly SpanRow[], id: string, key: string): SpanMove | undefined {
  const index = rows.findIndex((row) => row.span.id === id)
  if (index < 0) return undefined
  const row = rows[index]!
  switch (key) {
    case 'ArrowUp':
      return { focus: rows[Math.max(0, index - 1)]!.span.id }
    case 'ArrowDown':
      return { focus: rows[Math.min(rows.length - 1, index + 1)]!.span.id }
    case 'ArrowRight':
      if (!row.hasChildren) return { focus: id }
      return row.expanded ? { focus: rows[index + 1]!.span.id } : { toggle: id }
    case 'ArrowLeft':
      if (row.expanded) return { toggle: id }
      return { focus: row.parentId ?? id }
    case 'Home':
      return { focus: rows[0]!.span.id }
    case 'End':
      return { focus: rows[rows.length - 1]!.span.id }
    default:
      return undefined
  }
}

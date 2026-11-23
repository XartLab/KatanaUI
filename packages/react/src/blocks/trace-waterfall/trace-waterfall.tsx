// SPDX-License-Identifier: MIT
/**
 * Trace waterfall: one traced request as a span tree on a time axis, with durations, a short figure per span and the slowest step marked.
 * 链路瀑布（KATANAview #1908 第二批）：一次数据请求的链路：哪个源慢、哪次重试、解析花了多久。左边是 span 树（可折叠），右边是时间轴上的条，
 * 再右是耗时与调用方写的一个小数（行数、字节、HTTP 状态）。运行中的条长到 now 并画斜纹，失败的条是 danger 色，跑完的叶子里最慢的标「最慢」。
 * Enter / Space 打开这一步的详情（种类、状态、开始、耗时、说明、错误），再按一次收起。
 * 功能参照 affectUI 的 Trace Waterfall（affectui.com/components/trace-waterfall，2026-11-23 读，Pro 件，页上没写许可证：只读说明、实现原创）。
 * 跟它不同：不写 token 与花费（数据请求没有），换成调用方写的 metric；详情是表下的内嵌区，不弹对话框；轴的最小范围默认不设（它默认 10 秒，数据请求多在 1 秒内）。
 * 键盘是 APG 树：一个 Tab 停点，↑↓、→ 展开或到子、← 收起或回父、Home / End，Esc 收起详情。纯逻辑在 trace-model.ts。包里不带语言。
 */
import { ChevronRightIcon } from 'lucide-react'
import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { assignSeries } from '../../lib/chart/chart-kit/series-colors.ts'
import {
  moveSpan,
  slowestSpan,
  spanEnd,
  traceAxis,
  traceExtent,
  traceStatus,
  visibleSpans,
  type SpanStatus,
  type TraceSpan,
} from './trace-model.ts'

/** Texts of TraceWaterfall (the package ships no text). */
export type TraceWaterfallLabels = {
  /** Status words, for spans and for the whole request. */
  status: Record<SpanStatus, string>
  /** Tag on the slowest step (「最慢」). */
  slowest: string
  /** Name of a span kind (「抓取」「重试」); defaults to the kind itself. */
  kind?: (kind: string) => string
  /** Column heads. */
  name: string
  duration: string
  metric: string
  /** Field names in the details area. */
  start: string
  detail: string
  error: string
  /** Accessible name of the details area. */
  details: string
}

export type TraceWaterfallProps = {
  /** The request as a span tree. */
  root: TraceSpan
  /** Heading. */
  title: ReactNode
  /** Accessible name of the tree. */
  label: string
  /** Clock in milliseconds from the start of the request; running spans grow to it. */
  now?: number
  /** Smallest axis range in milliseconds; defaults to the extent of the trace. */
  minRange?: number
  /** How milliseconds are written (durations and axis ticks). */
  formatMs: (ms: number) => string
  /** Mark the slowest finished leaf. */
  markSlowest?: boolean
  /** Controlled folded span ids. */
  collapsed?: readonly string[]
  /** Folded span ids when uncontrolled. */
  defaultCollapsed?: readonly string[]
  /** Called with the folded span ids after a fold or unfold. */
  onCollapsedChange?: (collapsed: readonly string[]) => void
  /** Controlled span id whose details are open; null when closed. */
  openId?: string | null
  /** Span id open first when uncontrolled. */
  defaultOpenId?: string | null
  /** Called when the open span changes. */
  onOpenChange?: (id: string | null) => void
  /** Texts. */
  labels: TraceWaterfallLabels
  /** Extra class name on the root. */
  className?: string
}

const percent = (value: number, range: number) => `${(Math.min(1, Math.max(0, value / range)) * 100).toFixed(3)}%`

export function TraceWaterfall({
  root,
  title,
  label,
  now,
  minRange,
  formatMs,
  markSlowest = true,
  collapsed: collapsedProp,
  defaultCollapsed = [],
  onCollapsedChange,
  openId: openProp,
  defaultOpenId = null,
  onOpenChange,
  labels,
  className,
}: TraceWaterfallProps) {
  const [innerCollapsed, setInnerCollapsed] = useState<readonly string[]>(defaultCollapsed)
  const [innerOpen, setInnerOpen] = useState<string | null>(defaultOpenId)
  const [focusId, setFocusId] = useState(root.id)
  const items = useRef(new Map<string, HTMLElement>())
  const detailsId = useId()
  const collapsed = collapsedProp ?? innerCollapsed
  const openId = openProp !== undefined ? openProp : innerOpen
  const rows = visibleSpans(root, new Set(collapsed))
  const current = rows.some((row) => row.span.id === focusId) ? focusId : root.id
  const { range, ticks } = traceAxis(traceExtent(root, now), minRange)
  const slowest = markSlowest ? slowestSpan(root) : null
  const runStatus = traceStatus(root)
  const kinds: string[] = []
  const collect = (span: TraceSpan) => {
    if (!kinds.includes(span.kind)) kinds.push(span.kind)
    span.children?.forEach(collect)
  }
  collect(root)
  const tint = assignSeries(kinds)
  const kindName = labels.kind ?? ((kind: string) => kind)
  const find = (span: TraceSpan, id: string | null): TraceSpan | null =>
    id === null ? null : span.id === id ? span : (span.children ?? []).reduce<TraceSpan | null>((hit, c) => hit ?? find(c, id), null)
  const open = find(root, openId)

  const toggle = (id: string) => {
    const next = collapsed.includes(id) ? collapsed.filter((item) => item !== id) : [...collapsed, id]
    if (collapsedProp === undefined) setInnerCollapsed(next)
    onCollapsedChange?.(next)
  }
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
      setOpen(openId === id ? null : id)
      return
    }
    if (event.key === 'Escape') {
      if (openId === null) return
      event.preventDefault()
      setOpen(null)
      return
    }
    const move = moveSpan(rows, id, event.key)
    if (move === undefined) return
    event.preventDefault()
    if ('toggle' in move) toggle(move.toggle)
    else focus(move.focus)
  }

  return (
    <section className={cn('k-tw', className)} data-slot="trace-waterfall" data-status={runStatus}>
      <header className="k-tw-head">
        <h4 className="k-tw-title">{title}</h4>
        <span className="k-tw-name">{root.name}</span>
        <span className="k-tw-run" data-slot="trace-status" data-status={runStatus} aria-live="polite">
          {labels.status[runStatus]} · {formatMs(spanEnd(root, now) - root.start)}
        </span>
      </header>
      <div className="k-tw-grid">
        <div className="k-tw-cols" aria-hidden="true">
          <span>{labels.name}</span>
          <span className="k-tw-axis">
            {ticks.map((tick, index) => (
              <i
                key={tick}
                style={{ left: percent(tick, range) }}
                data-align={index === 0 ? 'start' : index === ticks.length - 1 ? 'end' : 'mid'}
              >
                {formatMs(tick)}
              </i>
            ))}
          </span>
          <span>{labels.duration}</span>
          <span>{labels.metric}</span>
        </div>
        <ul className="k-tw-tree" role="tree" aria-label={label}>
          {rows.map((row) => {
            const span = row.span
            const status = span.status ?? 'done'
            const end = spanEnd(span, now)
            const took = end - span.start
            const name = [
              span.name,
              kindName(span.kind),
              labels.status[status],
              formatMs(took),
              span.metric,
              span.id === slowest ? labels.slowest : null,
            ]
            return (
              <li
                key={span.id}
                ref={(node) => {
                  if (node) items.current.set(span.id, node)
                  else items.current.delete(span.id)
                }}
                role="treeitem"
                aria-level={row.depth + 1}
                aria-expanded={row.hasChildren ? row.expanded : undefined}
                aria-selected={openId === span.id}
                aria-controls={detailsId}
                aria-label={name.filter(Boolean).join('，')}
                tabIndex={span.id === current ? 0 : -1}
                className="k-tw-row"
                data-slot="trace-span"
                data-id={span.id}
                data-status={status}
                data-slowest={span.id === slowest ? '' : undefined}
                style={{ '--k-tw-depth': row.depth } as CSSProperties}
                onFocus={() => setFocusId(span.id)}
                onClick={() => {
                  focus(span.id)
                  setOpen(openId === span.id ? null : span.id)
                }}
                onKeyDown={(event) => onKeyDown(event, span.id)}
              >
                <span className="k-tw-label">
                  {row.hasChildren ? (
                    <ChevronRightIcon
                      className="k-tw-fold"
                      data-open={row.expanded ? '' : undefined}
                      aria-hidden="true"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggle(span.id)
                      }}
                    />
                  ) : (
                    <i className="k-tw-fold-gap" aria-hidden="true" />
                  )}
                  <span className="k-tw-span-name">{span.name}</span>
                  {span.detail !== undefined && <span className="k-tw-detail">{span.detail}</span>}
                  {span.id === slowest && <small className="k-tw-slow">{labels.slowest}</small>}
                </span>
                <span className="k-tw-track" aria-hidden="true">
                  {ticks.map((tick) => (
                    <b key={tick} className="k-tw-gridline" style={{ left: percent(tick, range) }} />
                  ))}
                  {now !== undefined && runStatus === 'running' && (
                    <b className="k-tw-nowline" style={{ left: percent(now, range) }} />
                  )}
                  <i
                    className="k-tw-bar"
                    data-slot="trace-bar"
                    style={{
                      left: percent(span.start, range),
                      width: `max(2px, ${percent(took, range)})`,
                      backgroundColor: status === 'failed' ? undefined : tint[span.kind],
                    }}
                  />
                </span>
                <span className="k-tw-took">{formatMs(took)}</span>
                <span className="k-tw-metric">{span.metric ?? ''}</span>
              </li>
            )
          })}
        </ul>
      </div>
      <div id={detailsId} className="k-tw-details" role="region" aria-label={labels.details} data-slot="trace-details">
        {open !== null && (
          <dl>
            <div>
              <dt>{labels.name}</dt>
              <dd>
                {open.name} · {kindName(open.kind)}
              </dd>
            </div>
            <div>
              <dt>{labels.start}</dt>
              <dd>{formatMs(open.start)}</dd>
            </div>
            <div>
              <dt>{labels.duration}</dt>
              <dd>
                {formatMs(spanEnd(open, now) - open.start)} · {labels.status[open.status ?? 'done']}
              </dd>
            </div>
            {open.metric !== undefined && (
              <div>
                <dt>{labels.metric}</dt>
                <dd>{open.metric}</dd>
              </div>
            )}
            {open.detail !== undefined && (
              <div>
                <dt>{labels.detail}</dt>
                <dd>{open.detail}</dd>
              </div>
            )}
            {open.error !== undefined && (
              <div data-part="error">
                <dt>{labels.error}</dt>
                <dd>{open.error}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </section>
  )
}

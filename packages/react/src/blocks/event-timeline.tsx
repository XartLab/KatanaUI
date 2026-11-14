// SPDX-License-Identifier: MIT
import { useId, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import {
  EVENT_KINDS,
  clock,
  clusterMarkers,
  dayKey,
  dayMinuteToTime,
  fractionToMinute,
  gapBands,
  minuteOfDay,
  minuteToFraction,
  type EventKind,
  type SessionMinutes,
  type TimelineEvent,
} from './event-timeline-model'

// 照设计稿 EventTimeline 卡（design/katana-console/project/components/EventTimeline/README.md，2026-11-14 读）：
// 一条 2px 的轴按交易时段排（午休压成短带），形状 + 状态色区分类别，同一分钟聚成带计数的标记，标签上下交错，
// 「现在」橙竖线，跨日一天一条泳道；悬停 / 聚焦出 LCD 风 tooltip，点击选中，拖选一段。发光只给异动。
// 事件从哪来由调用方定，件只合并排序；字（类别名、「现在」、表格列）都由调用方给，包里没有语言。

export type EventTimelineLabels = {
  kinds: Record<EventKind, string>
  now: string
  /** 顶行的事件数，如「共 8 条」。 */
  count: (n: number) => string
  /** 聚合标记的读屏名，如「3 个事件」。 */
  cluster: (n: number) => string
  /** 买 / 卖 / 时间 / 类别 / 内容 / 关联：tooltip 与表格视图用。 */
  buy: string
  sell: string
  time: string
  kind: string
  content: string
  ref: string
  /** 切到表格视图 / 切回时间线的按钮名。 */
  showTable: string
  showTimeline: string
  /** 一天的标题，如「11-14」。 */
  day: (day: string, count: number) => ReactNode
  empty: ReactNode
}

export type EventTimelineProps = {
  events: readonly TimelineEvent[]
  /** 显示时区（IANA 名，如 Asia/Shanghai）：决定每个事件落在哪一天、钟点写几点。 */
  timeZone: string
  /** 交易时段（当天零点起的分钟）：段与段之间的空档压成一小段。 */
  session: SessionMinutes
  /** 「现在」：画一条橙竖线（回放时是回放的当前刻）。 */
  now?: number
  /** 顶行左侧的范围说明（品种 + 账户），由调用方按联动上下文写。 */
  scope?: ReactNode
  labels: EventTimelineLabels
  /** 整条时间线的读屏名。 */
  label: string
  /** 点击事件（聚合标记给其中最早的一条）：调用方去定位回放与高亮对应面板。 */
  onPick?: (event: TimelineEvent) => void
  /** 拖选一段轴松手后给出起止时刻。 */
  onBrush?: (range: { from: number; to: number }) => void
  className?: string
}

const SHAPES: Record<EventKind, ReactNode> = {
  anomaly: <circle cx="5" cy="5" r="4" />,
  notice: <rect x="1" y="1" width="8" height="8" />,
  fill: <path d="M5 1 9 9H1Z" />,
  alert: <rect x="1" y="1" width="8" height="8" />,
  run: <path d="M5 0.5 9.5 5 5 9.5 0.5 5Z" />,
}

function Glyph({ kind, side }: { kind: EventKind; side?: 'buy' | 'sell' }) {
  return (
    <svg
      className="k-tl-glyph"
      viewBox="0 0 10 10"
      width="8"
      height="8"
      aria-hidden="true"
      data-kind={kind}
      data-side={kind === 'fill' ? (side ?? 'buy') : undefined}
    >
      {SHAPES[kind]}
    </svg>
  )
}

function sideOf(events: readonly TimelineEvent[]): 'buy' | 'sell' | undefined {
  const sides = new Set(events.filter((e) => e.kind === 'fill').map((e) => e.side ?? 'buy'))
  return sides.size === 1 ? [...sides][0] : undefined
}

function Lane({
  day,
  events,
  props,
  active,
}: {
  day: string
  events: readonly TimelineEvent[]
  props: EventTimelineProps
  active: ReadonlySet<EventKind>
}) {
  const { timeZone, session, now, labels, onPick, onBrush } = props
  const markers = clusterMarkers(
    events.filter((e) => active.has(e.kind)),
    timeZone,
    session,
  )
  const [hover, setHover] = useState<string | null>(null)
  const [brush, setBrush] = useState<{ a: number; b: number } | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const nowX =
    now !== undefined && dayKey(now, timeZone) === day ? minuteToFraction(minuteOfDay(now, timeZone), session) : null
  const frac = (e: PointerEvent) => {
    const box = trackRef.current!.getBoundingClientRect()
    return Math.min(1, Math.max(0, (e.clientX - box.left) / box.width))
  }
  const finishBrush = () => {
    if (brush && onBrush && Math.abs(brush.a - brush.b) > 0.01) {
      const [lo, hi] = brush.a < brush.b ? [brush.a, brush.b] : [brush.b, brush.a]
      onBrush({
        from: dayMinuteToTime(day, fractionToMinute(lo, session), timeZone),
        to: dayMinuteToTime(day, fractionToMinute(hi, session), timeZone),
      })
    }
    setBrush(null)
  }
  const open = markers.find((m) => m.key === hover)
  return (
    <div className="k-tl-lane" data-day={day}>
      <div
        ref={trackRef}
        className="k-tl-track"
        onPointerDown={(e) => {
          if (!onBrush || e.target !== e.currentTarget) return
          e.currentTarget.setPointerCapture(e.pointerId)
          setBrush({ a: frac(e), b: frac(e) })
        }}
        onPointerMove={(e) => brush && setBrush({ a: brush.a, b: frac(e) })}
        onPointerUp={finishBrush}
        onPointerCancel={() => setBrush(null)}
      >
        <div className="k-tl-axis" aria-hidden="true" />
        {gapBands(session).map((band) => (
          <div
            key={band.from}
            className="k-tl-gap"
            aria-hidden="true"
            style={{ left: `${band.from * 100}%`, width: `${(band.to - band.from) * 100}%` }}
          />
        ))}
        {nowX !== null && (
          <div className="k-tl-now" style={{ left: `${nowX * 100}%` }} data-slot="event-timeline-now">
            <span>{labels.now}</span>
          </div>
        )}
        {brush && (
          <div
            className="k-tl-brush"
            aria-hidden="true"
            style={{ left: `${Math.min(brush.a, brush.b) * 100}%`, width: `${Math.abs(brush.a - brush.b) * 100}%` }}
          />
        )}
        {markers.map((marker, index) => {
          const first = marker.events[0]!
          const many = marker.events.length > 1
          const name = many
            ? labels.cluster(marker.events.length)
            : `${clock(first.at, timeZone).slice(0, 5)} ${first.label}`
          return (
            <button
              key={marker.key}
              type="button"
              className="k-tl-marker"
              data-kind={marker.kind}
              data-side={index % 2 === 0 ? 'up' : 'down'}
              style={{ left: `${marker.x * 100}%` }}
              aria-label={`${labels.kinds[marker.kind]} ${name}`}
              onPointerEnter={() => setHover(marker.key)}
              onPointerLeave={() => setHover((h) => (h === marker.key ? null : h))}
              onFocus={() => setHover(marker.key)}
              onBlur={() => setHover((h) => (h === marker.key ? null : h))}
              onClick={() => onPick?.(first)}
            >
              <Glyph kind={marker.kind} side={sideOf(marker.events)} />
              {many ? (
                <span className="k-tl-count">{marker.events.length}</span>
              ) : (
                <span className="k-tl-label" aria-hidden="true">
                  {first.label}
                </span>
              )}
            </button>
          )
        })}
        {open && (
          <div className="k-tl-tip" role="tooltip" style={{ left: `clamp(88px, ${open.x * 100}%, calc(100% - 88px))` }}>
            {open.events.slice(0, 6).map((e) => (
              <div key={e.id} className="k-tl-tip-row">
                <span className="k-tl-tip-time">{clock(e.at, timeZone)}</span>
                <Glyph kind={e.kind} side={e.side} />
                <span className="k-tl-tip-text">
                  {e.kind === 'fill' ? `${e.side === 'sell' ? labels.sell : labels.buy} ` : ''}
                  {e.label}
                </span>
                {(e.ref ?? e.symbol ?? e.account) && (
                  <span className="k-tl-tip-ref">{[e.symbol, e.account, e.ref].filter(Boolean).join(' · ')}</span>
                )}
              </div>
            ))}
            {open.events.length > 6 && <div className="k-tl-tip-more">+{open.events.length - 6}</div>}
          </div>
        )}
      </div>
    </div>
  )
}

export function EventTimeline(props: EventTimelineProps) {
  const { events, timeZone, labels, label, scope, className } = props
  const [active, setActive] = useState<ReadonlySet<EventKind>>(() => new Set(EVENT_KINDS))
  const [table, setTable] = useState(false)
  const id = useId()
  const visible = events.filter((e) => active.has(e.kind))
  const days = [
    ...new Set([...events.map((e) => dayKey(e.at, timeZone)), ...(props.now ? [dayKey(props.now, timeZone)] : [])]),
  ].sort()
  const toggle = (kind: EventKind) =>
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  return (
    <div className={cn('k-tl', className)} role="region" aria-label={label} data-slot="event-timeline">
      <div className="k-tl-top">
        {scope && <span className="k-tl-scope">{scope}</span>}
        <div className="k-tl-kinds" role="group" aria-label={labels.kind}>
          {EVENT_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              className="k-tl-kind"
              aria-pressed={active.has(kind)}
              data-kind={kind}
              onClick={() => toggle(kind)}
            >
              <Glyph kind={kind} side={kind === 'fill' ? 'buy' : undefined} />
              {labels.kinds[kind]}
            </button>
          ))}
        </div>
        <output className="k-tl-total" htmlFor={id}>
          {labels.count(visible.length)}
        </output>
        <button type="button" className="k-tl-view" onClick={() => setTable((t) => !t)}>
          {table ? labels.showTimeline : labels.showTable}
        </button>
      </div>
      <div id={id} className="k-tl-body">
        {events.length === 0 ? (
          <p className="k-tl-empty" role="status">
            {labels.empty}
          </p>
        ) : table ? (
          <table className="k-tl-table">
            <thead>
              <tr>
                <th>{labels.time}</th>
                <th>{labels.kind}</th>
                <th>{labels.content}</th>
                <th>{labels.ref}</th>
              </tr>
            </thead>
            <tbody>
              {[...visible]
                .sort((a, b) => a.at - b.at)
                .map((e) => (
                  <tr key={e.id}>
                    <td className="k-tl-num">
                      {dayKey(e.at, timeZone).slice(5)} {clock(e.at, timeZone)}
                    </td>
                    <td>{labels.kinds[e.kind]}</td>
                    <td>{e.label}</td>
                    <td className="k-tl-num">{[e.symbol, e.account, e.ref].filter(Boolean).join(' · ')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          days.map((day) => (
            <div key={day} className="k-tl-day">
              {days.length > 1 && (
                <h3 className="k-tl-head">
                  {labels.day(day, events.filter((e) => dayKey(e.at, timeZone) === day).length)}
                </h3>
              )}
              <Lane
                day={day}
                events={events.filter((e) => dayKey(e.at, timeZone) === day)}
                props={props}
                active={active}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

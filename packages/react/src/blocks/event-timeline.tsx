// SPDX-License-Identifier: MIT
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { clock, groupByDay, type TimelineEvent } from './event-timeline-model'

// 功能参照 Arc Timeline（uiarc.dev，2026-11-14 读：按天分组、新的在前），实现原创；外观在 theme/event-timeline.css。
// 对设计稿的 EventTimeline 卡（发现区的统一事件流：公告、告警、成交、数据源事件）。件只管排版与分组：事件从哪来、怎么翻页由应用决定；
// 时区由调用方传（应用的显示时区），日标题与空态的字、来源标签都由调用方给，包里没有语言。

export type EventTimelineProps = {
  events: readonly TimelineEvent[]
  /** 显示时区（IANA 名，如 Asia/Shanghai）：决定每个事件落在哪一天、钟点写几点。 */
  timeZone: string
  /** 整条时间线的读屏名。 */
  label: string
  /** 一天的标题：day 是 YYYY-MM-DD，count 是这天的事件数；日期怎么写（今天 / 昨天 / 周几）由调用方定。 */
  dayLabel: (day: string, count: number) => ReactNode
  /** 没有事件时写的字。 */
  emptyText: ReactNode
  /** 给了，每个事件变成按钮，点击回调；不给就是纯展示。 */
  onSelect?: (event: TimelineEvent) => void
  className?: string
}

function Body({ event }: { event: TimelineEvent }) {
  return (
    <>
      <span className="k-tl-title">
        <span>{event.title}</span>
        {event.source && <span className="k-tl-source">{event.source}</span>}
      </span>
      {event.detail && <span className="k-tl-detail">{event.detail}</span>}
    </>
  )
}

export function EventTimeline({
  events,
  timeZone,
  label,
  dayLabel,
  emptyText,
  onSelect,
  className,
}: EventTimelineProps) {
  const groups = groupByDay(events, timeZone)
  if (groups.length === 0)
    return (
      <p className={cn('k-tl-empty', className)} role="status" data-slot="event-timeline">
        {emptyText}
      </p>
    )
  return (
    <div className={cn('k-tl', className)} role="region" aria-label={label} data-slot="event-timeline">
      {groups.map((group) => (
        <section key={group.day} className="k-tl-day" aria-labelledby={`k-tl-${group.day}`}>
          <h3 className="k-tl-head" id={`k-tl-${group.day}`}>
            {dayLabel(group.day, group.events.length)}
          </h3>
          <ol className="k-tl-list">
            {group.events.map((event) => (
              <li key={event.id} className="k-tl-item" data-tone={event.tone ?? 'neutral'}>
                <time className="k-tl-time" dateTime={new Date(event.at).toISOString()}>
                  {clock(event.at, timeZone)}
                </time>
                <span className="k-tl-dot" aria-hidden="true" />
                {onSelect ? (
                  <button type="button" className="k-tl-body k-tl-action" onClick={() => onSelect(event)}>
                    <Body event={event} />
                  </button>
                ) : (
                  <div className="k-tl-body">
                    <Body event={event} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

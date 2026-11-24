// SPDX-License-Identifier: MIT
/**
 * Optional event dots and an insight line for the package's calendars (Calendar, DateTimeInput, DateRangePicker, TradingDatePicker).
 * 日历的可选能力（#226）：有事件的日子在格子下画小点，悬停或键盘聚焦读出当天的事，日历底部一条「洞察」（图标加一句话）。
 * 交互借自 Jamie Merrill 的 Date picker 洞察（x.com/Jamie_Merrill/status/2111541583782780961，2026-11-24 逐帧看：格子下小点、底栏图标加一句说明），
 * 只借交互；样子沿用日历皮肤（theme/date-time.css 的 .k-cal*），加的规则在 theme/calendar-events.css。
 * 不新建日历：四个日历各调一次 useCalendarEvents，把原来的 <CalendarCell> 换成 events.cell(day)、在格子表后面放 events.foot。
 * 不传 events 与 insight 时，cell 返回的就是原来的 <CalendarCell>，foot 是 null，DOM 与截图都不变。
 * 事件与文字全由调用方给（财报、宏观数据、除权、期权到期、半日市这类；包里不带语言，日期与列表的写法按 locale 由 Intl 出）；件里不读时钟。
 * 读屏：有事件的格子经 aria-describedby 读到当天的事；格子下的点与读数行是给眼睛的，对读屏隐藏，免得念两遍。
 */
import type { CalendarDate } from '@internationalized/date'
import { Sparkles } from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'
import { CalendarCell } from 'react-aria-components'
import { statusColor } from '../lib/severity.ts'
import {
  dayLabel,
  describeEvents,
  dotsOf,
  moreOf,
  eventsOn,
  type CalendarDayEvent,
  type CalendarEventSource,
  type CalendarInsight,
} from './calendar-events-model.ts'

export type { CalendarDayEvent, CalendarEventSource, CalendarInsight } from './calendar-events-model.ts'

/** 四个日历共有的两个可选 prop。 */
export type CalendarEventProps = {
  /** Events by day (a YYYY-MM-DD table or a lookup function): days with events get dots, hover or focus reads them out. */
  events?: CalendarEventSource
  /** One line under the calendar: an icon and a sentence, for example "Avoided the 11-27 half day". */
  insight?: CalendarInsight
}

type Options = CalendarEventProps & {
  /** BCP 47 locale for the day and the list wording. */
  locale: string
  /** The selected day (YYYY-MM-DD): its events show in the read-out while nothing is hovered or focused. */
  selected?: string | null
}

/** What `useCalendarEvents` gives a calendar. */
export type CalendarEventsView = {
  /** Replaces `<CalendarCell date className="k-cal-cell" />`; extra props (data-*) go to the cell. */
  cell: (date: CalendarDate, extra?: Record<string, unknown>) => ReactElement
  /** Goes right after the calendar grid(s); null when neither events nor insight was passed. */
  foot: ReactNode
}

const toneStyle = (tone: Parameters<typeof statusColor>[0]) => ({ '--k-cal-dot': statusColor(tone) }) as CSSProperties

/** 一格的内容：日期数字、事件点；悬停与聚焦时把「我是哪天」报给读数行。 */
function EventCellBody({
  day,
  number,
  events,
  describedBy,
  hovered,
  focused,
  onHover,
  onFocus,
}: {
  day: string
  number: string
  events: readonly CalendarDayEvent[]
  /** 读当天事件的那个屏外节点的 id。 */
  describedBy: string
  hovered: boolean
  focused: boolean
  onHover: (day: string | null) => void
  onFocus: (day: string | null) => void
}) {
  // CalendarCell 不把 aria-describedby 交给里面可聚焦的那个 div（只转发 data-*），所以在这里挂上去。
  // react-aria 自己也往这个属性写（区间日历里聚焦着的格子写「开始 / 结束选择区间」的提示 id，单月日历里不合法时写错误 id），
  // React 改它时会把我们的 id 冲掉，所以每次渲染后都合并一次：读出现有的 id、没有自己的就补上；卸载时只摘自己的那个。
  const anchor = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const target = anchor.current?.closest('[role="button"]')
    if (!target) return
    const ids = (target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
    if (!ids.includes(describedBy)) target.setAttribute('aria-describedby', [...ids, describedBy].join(' '))
  })
  useEffect(() => {
    const target = anchor.current?.closest('[role="button"]')
    return () => {
      const rest = (target?.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter((id) => id && id !== describedBy)
      if (rest.length > 0) target?.setAttribute('aria-describedby', rest.join(' '))
      else target?.removeAttribute('aria-describedby')
    }
  }, [describedBy])
  // 离开时只清自己：别的格子已经接上就不动。
  useEffect(() => {
    if (!hovered) return
    onHover(day)
    return () => onHover(null)
  }, [hovered, day, onHover])
  useEffect(() => {
    if (!focused) return
    onFocus(day)
    return () => onFocus(null)
  }, [focused, day, onFocus])
  return (
    <>
      {number}
      <span ref={anchor} className="k-cal-dots" aria-hidden="true">
        {dotsOf(events).map((tone, index) => (
          <span key={index} className="k-cal-dot" data-tone={tone} style={toneStyle(tone)} />
        ))}
        {moreOf(events) ? (
          <span className="k-cal-more" data-slot="calendar-more">
            +
          </span>
        ) : null}
      </span>
    </>
  )
}

/** Event dots, hover and focus read-out, and an insight line for a calendar; see the file comment. */
export function useCalendarEvents({ events, insight, locale, selected }: Options): CalendarEventsView {
  const id = useId()
  const [hover, setHover] = useState<string | null>(null)
  const [focus, setFocus] = useState<string | null>(null)

  const cell: CalendarEventsView['cell'] = (date, extra) => {
    const day = date.toString()
    const found = eventsOn(events, day)
    if (found.length === 0) return <CalendarCell date={date} className="k-cal-cell" {...extra} />
    const describedBy = `${id}-${day}`
    return (
      <CalendarCell date={date} className="k-cal-cell" data-has-events="" {...extra}>
        {({ formattedDate, isHovered, isFocused, isOutsideMonth }) =>
          // 月外的格子（双月日历里两个月各画一份、被 display:none 藏起来）不画点、不挂描述，免得同一天出现两个同 id 的节点。
          isOutsideMonth ? (
            formattedDate
          ) : (
            <>
              <EventCellBody
                day={day}
                number={formattedDate}
                events={found}
                describedBy={describedBy}
                hovered={isHovered}
                focused={isFocused}
                onHover={setHover}
                onFocus={setFocus}
              />
              <span id={describedBy} className="sr-only">
                {describeEvents(found, locale)}
              </span>
            </>
          )
        }
      </CalendarCell>
    )
  }

  if (!events && !insight) return { cell, foot: null }

  const shownDay = hover ?? focus ?? selected ?? null
  const shown = shownDay ? eventsOn(events, shownDay) : []
  const foot = (
    <div className="k-cal-foot" data-slot="calendar-foot">
      {events ? (
        <p
          className="k-cal-readout"
          data-slot="calendar-readout"
          aria-hidden="true"
          title={shownDay && shown.length > 0 ? describeEvents(shown, locale) : undefined}
        >
          {shownDay && shown.length > 0 ? (
            <>
              <span className="k-cal-readout-day">{dayLabel(shownDay, locale)}</span>
              <span className="k-cal-readout-items">
                {shown.map((event) => (
                  <span key={event.id ?? event.label} className="k-cal-readout-item">
                    <span
                      className="k-cal-dot"
                      data-tone={event.tone ?? 'neutral'}
                      style={toneStyle(event.tone ?? 'neutral')}
                    />
                    {event.label}
                  </span>
                ))}
              </span>
            </>
          ) : null}
        </p>
      ) : null}
      {insight ? (
        <p className="k-cal-insight" data-slot="calendar-insight" data-tone={insight.tone ?? 'neutral'}>
          <span className="k-cal-insight-icon" aria-hidden="true" style={toneStyle(insight.tone ?? 'neutral')}>
            {insight.icon ?? <Sparkles size={14} />}
          </span>
          <span>{insight.text}</span>
        </p>
      ) : null}
    </div>
  )
  return { cell, foot }
}

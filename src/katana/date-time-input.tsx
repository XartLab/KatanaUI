// SPDX-License-Identifier: AGPL-3.0-only
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import {
  Button as AriaButton,
  Calendar,
  CalendarCell,
  CalendarGrid,
  DateField,
  DateInput,
  DateSegment,
  Heading,
  I18nProvider,
  TimeField,
  type DateSegmentProps,
} from 'react-aria-components'
import { fromCalendarDate, fromTime, toCalendarDate, toTime } from './date-time-model'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'

// 搬自 src/ui/DateTimeInput.tsx（#1860）：样子与行为没改，皮肤在 ../theme/date-time.css；包里不带文字，各段的读屏名由 labels 给，语言由 locale 给。
// 日期时间输入（#368）：回放起点、转到日期、自定义区间、日志过滤、补录成交共用这一个，换掉浏览器自带的 date / time 框
// （它们的格式随浏览器与系统语言变，中文界面里也会显示 mm/dd/yyyy）。
// 分段输入用 react-aria 的 DateField / TimeField（Apache-2.0）：每段能打字、方向键加减、Backspace 清空、Tab 到下一段；
// 24 小时制、补零，日期按「年-月-日」排、分隔是「-」，所以不管浏览器语言是什么都写成 2026-01-05 09:30。各段的读屏名与占位跟界面语言走：
// 中文界面用 zh-CN（日期分隔原是「/」，换成「-」），英文界面用 en-CA（本来就是 yyyy-mm-dd），浏览器语言不参与。
// 范围外的日期当场标红（validationBehavior="aria"），不等表单提交：各调用方的表单都不走浏览器校验，自己写原因。
// 「选日期」照 TradingView / ATAS 转到日期里的日历：日期框右边一个日历按钮，点开是 react-aria 的 Calendar（出处待核对）。
// 值是字符串（日期 YYYY-MM-DD、时刻 HH:mm 或 HH:mm:ss，空串 = 没填完），按哪个时区解读由调用方定；外观在 ui.css 的 .k-dt。

/** 读屏名与按钮名：包里不带文字，调用方按界面语言给。label 是调用方给的字段名（「起点」）。 */
export type DateTimeLabels = {
  date: (label: string) => string
  pickDate: (label: string) => string
  calendar: (label: string) => string
  time: (label: string) => string
  previousMonth: string
  nextMonth: string
}

function Segments({ segment }: { segment: DateSegmentProps['segment'] }) {
  // zh-CN 的日期分隔是「/」，统一写成「-」（YYYY-MM-DD）；时刻两边的方向隔离符号不画。
  if (segment.type === 'literal') {
    const text = segment.text.replace('/', '-').replace(/[⁦-⁩]/g, '')
    return text ? (
      <span className="k-dt-sep" aria-hidden="true">
        {text}
      </span>
    ) : null
  }
  return <DateSegment segment={segment} className="k-dt-seg" />
}

export function DateTimeInput({
  label,
  date,
  onDate,
  time,
  onTime,
  seconds = false,
  min,
  max,
  size,
  autoFocus,
  className,
  labels,
  locale,
}: {
  /** 读屏用的名字：日期叫「<label>的日期」，时刻叫「<label>的时刻」。 */
  label: string
  date: string
  onDate: (value: string) => void
  /** 不给就只有日期。 */
  time?: string
  onTime?: (value: string) => void
  /** 时刻带秒（补录成交）。 */
  seconds?: boolean
  /** 能选的最早、最晚日期（YYYY-MM-DD）：日历里范围外的日子灰着点不了，框里打了范围外的日期标成不合法。 */
  min?: string
  max?: string
  size?: 'sm'
  autoFocus?: boolean
  className?: string
  labels: DateTimeLabels
  /** 给 react-aria 的语言（年-月-日的顺序）：中文界面 zh-CN（分隔由下面换成「-」），英文界面 en-CA。 */
  locale: string
}) {
  const [open, setOpen] = useState(false)
  const day = toCalendarDate(date)
  const minValue = toCalendarDate(min ?? '')
  const maxValue = toCalendarDate(max ?? '')
  return (
    <I18nProvider locale={locale}>
      <span className={`k-dt${size ? ` ${size}` : ''}${className ? ` ${className}` : ''}`}>
        <DateField
          aria-label={labels.date(label)}
          className="k-dt-field k-dt-date"
          value={day}
          minValue={minValue}
          maxValue={maxValue}
          validationBehavior="aria"
          onChange={(value) => onDate(fromCalendarDate(value))}
          shouldForceLeadingZeros
          autoFocus={autoFocus}
        >
          <DateInput className="k-dt-input">{(segment) => <Segments segment={segment} />}</DateInput>
        </DateField>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger className="k-dt-pick" aria-label={labels.pickDate(label)}>
            <CalendarDays size={14} aria-hidden />
          </PopoverTrigger>
          <PopoverContent
            variant="menu"
            side="bottom"
            align="start"
            sideOffset={4}
            className="k-dt-pop"
            aria-label={labels.calendar(label)}
          >
            <Calendar
              className="k-cal"
              value={day}
              minValue={minValue}
              maxValue={maxValue}
              autoFocus
              onChange={(value) => {
                onDate(fromCalendarDate(value))
                setOpen(false)
              }}
            >
              <header className="k-cal-head">
                <AriaButton slot="previous" className="k-cal-nav" aria-label={labels.previousMonth}>
                  <ChevronLeft size={14} aria-hidden />
                </AriaButton>
                <Heading className="k-cal-title" />
                <AriaButton slot="next" className="k-cal-nav" aria-label={labels.nextMonth}>
                  <ChevronRight size={14} aria-hidden />
                </AriaButton>
              </header>
              <CalendarGrid className="k-cal-grid">
                {(value) => <CalendarCell date={value} className="k-cal-cell" />}
              </CalendarGrid>
            </Calendar>
          </PopoverContent>
        </Popover>
        {onTime && (
          <TimeField
            aria-label={labels.time(label)}
            className="k-dt-field k-dt-time"
            value={toTime(time ?? '')}
            onChange={(value) => onTime(fromTime(value, seconds))}
            hourCycle={24}
            granularity={seconds ? 'second' : 'minute'}
            shouldForceLeadingZeros
          >
            <DateInput className="k-dt-input">{(segment) => <Segments segment={segment} />}</DateInput>
          </TimeField>
        )}
      </span>
    </I18nProvider>
  )
}

// SPDX-License-Identifier: MIT
import { createDateInputController, DateInput, DateInputSegment } from '@ui-sdk/react/date-input'
import { TimeInput, TimeInputSegment } from '@ui-sdk/react/time-input'
import { CalendarDays } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { MonthCalendar, renderSegments, useCalendarFocus } from './date-parts.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover.tsx'

// 搬自 src/ui/DateTimeInput.tsx（#1860）：样子与行为没改，皮肤在 ../theme/date-time.css；包里不带文字，各段的读屏名由 UI SDK 按 locale 写，按钮名由 labels 给。
// 日期时间输入（#368）：回放起点、转到日期、自定义区间、日志过滤、补录成交共用这一个，换掉浏览器自带的 date / time 框
// （它们的格式随浏览器与系统语言变，中文界面里也会显示 mm/dd/yyyy）。
// 分段输入用 UI SDK 的 DateInput / TimeInput（@ui-sdk/react，Apache-2.0，#263 从 react-aria 换来）：每段能打字、方向键加减、Backspace 清空、Tab 到下一段；
// 24 小时制、补零，日期按「年-月-日」排、分隔是「-」，所以不管浏览器语言是什么都写成 2026-01-05 09:30。各段的读屏名与占位跟界面语言走：
// 中文界面用 zh-CN（日期分隔原是「/」，换成「-」），英文界面用 en-CA（本来就是 yyyy-mm-dd），浏览器语言不参与。
// 范围外的日期当场标红（DateInput 的 min / max，根上写 data-invalid）：各调用方的表单都不走浏览器校验，自己写原因。
// 「选日期」照 TradingView / ATAS 转到日期里的日历：日期框右边一个日历按钮，点开是 UI SDK 的 Calendar（出处待核对）。
// 没用 UI SDK 的 DatePicker：它的输入是一整个文本框，不是逐段打字，样子要变；日期框与日历分开用，弹层仍是我们的 Popover。
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

/** Date (and optional time) field typed segment by segment, with a calendar button. Values are YYYY-MM-DD and HH:mm(:ss) strings. */
export type DateTimeInputProps = {
  /**
   * Field name used to build the accessible names: the date is read as "<label> date", the time as "<label> time".
   * 读屏用的名字：日期叫「<label>的日期」，时刻叫「<label>的时刻」。
   */
  label: string
  /** The date as YYYY-MM-DD. */
  date: string
  /** Called with the new date. */
  onDate: (value: string) => void
  /**
   * The time as HH:mm or HH:mm:ss; omit it (and onTime) for a date-only field.
   * 不给就只有日期。
   */
  time?: string
  /** Called with the new time. */
  onTime?: (value: string) => void
  /**
   * Include seconds in the time.
   * 时刻带秒（补录成交）。
   */
  seconds?: boolean
  /**
   * Earliest selectable date (YYYY-MM-DD); days outside the range are disabled and typed dates outside it are marked invalid.
   * 能选的最早、最晚日期（YYYY-MM-DD）：日历里范围外的日子灰着点不了，框里打了范围外的日期标成不合法。
   */
  min?: string
  /** Latest selectable date (YYYY-MM-DD). */
  max?: string
  /** sm is 26px high; md (the default) is 30px. */
  size?: 'sm' | 'md'
  /** Focus the field on mount, like the native attribute. */
  autoFocus?: boolean
  /** Extra class name on the root. */
  className?: string
  /** Accessible names and button names (the package ships no text; the caller passes them in the UI language). */
  labels: DateTimeLabels
  /**
   * Locale for the date and time segments: zh-CN or en-CA, both year-month-day.
   * 给分段输入与日历的语言（年-月-日的顺序）：中文界面 zh-CN（分隔由下面换成「-」），英文界面 en-CA。
   */
  locale: string
}

/** Date and time field: year-month-day segments, a calendar popover and an optional 24-hour time field. */
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
}: DateTimeInputProps) {
  const [open, setOpen] = useState(false)
  const calendarFocus = useCalendarFocus()
  const dateInput = useMemo(() => createDateInputController(), [])
  useEffect(() => {
    if (autoFocus) dateInput.focus()
  }, [autoFocus, dateInput])
  return (
    <span className={`k-dt${size === 'sm' ? ' sm' : ''}${className ? ` ${className}` : ''}`}>
      <DateInput
        aria-label={labels.date(label)}
        className="k-dt-field k-dt-date k-dt-input"
        locale={locale}
        controller={dateInput}
        value={date || null}
        min={min || undefined}
        max={max || undefined}
        onValueChange={(value) => onDate(value ?? '')}
      >
        {({ segments }) => renderSegments(segments, DateInputSegment, labels.date(label))}
      </DateInput>
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
          onOpenAutoFocus={calendarFocus.onOpenAutoFocus}
        >
          <MonthCalendar
            locale={locale}
            labels={labels}
            controller={calendarFocus.controller}
            value={date || null}
            min={min || undefined}
            max={max || undefined}
            onValueChange={(value) => {
              onDate(typeof value === 'string' ? value : '')
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      {onTime && (
        <TimeInput
          aria-label={labels.time(label)}
          className="k-dt-field k-dt-time k-dt-input"
          locale={locale}
          value={time || null}
          hourCycle={24}
          granularity={seconds ? 'second' : 'minute'}
          onValueChange={(value) => onTime(value ?? '')}
        >
          {({ segments }) => renderSegments(segments, TimeInputSegment, labels.time(label))}
        </TimeInput>
      )}
    </span>
  )
}

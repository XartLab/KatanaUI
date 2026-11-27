// SPDX-License-Identifier: MIT
/**
 * A month calendar that sits on the page: pick one day, step months, grey out days that cannot be picked.
 * 可以单独摆在页上的月历（#104 对照 Salt：日历原来只在 DateTimeInput 与 DateRangePicker 的弹层里）。
 * 用处：TradingView「转到日期」对话框里的那张日历（出处页待核对）、回放从哪天开始、复盘选交易日；非交易日（周末、休市）用 unavailable 灰掉、点不了。
 * 结构照 Salt Calendar（@salt-ds/lab，Apache-2.0：头部上一月 / 月份标题 / 下一月，下面一张日格表；只取结构，没有搬代码）。
 * 行为底座是 UI SDK 的 Calendar（@ui-sdk/react/calendar，Apache-2.0，#263；grid 角色；方向键按天移、PageUp / PageDown 按月、Shift + PageUp / PageDown 按年、Home / End 到周首周尾，Enter / Space 选），
 * 日期运算与读屏都是它的；样子与 DateTimeInput 弹层里的日历同一套（theme/date-time.css 的 .k-cal*），外面多一圈卡片的边与底（theme/calendar.css）。
 * 日期一律是 YYYY-MM-DD 字符串，包里不带语言：月份名与星期名按 locale 由 UI SDK 写，两个翻页钮的读屏名由 labels 给。
 */
import { MonthCalendar } from './date-parts.tsx'
import type { WeekStart } from './date-range-model.ts'
import { cn } from '../lib/cn.ts'

/** Texts of Calendar (the package ships no text). */
export type CalendarLabels = {
  /** Accessible name of the previous-month button. */
  previousMonth: string
  /** Accessible name of the next-month button. */
  nextMonth: string
}

export type CalendarProps = {
  /** Selected day, YYYY-MM-DD (controlled); '' for none. */
  value?: string
  /** Selected day at first (uncontrolled). */
  defaultValue?: string
  /** Called with the picked day, YYYY-MM-DD. */
  onValueChange?: (day: string) => void
  /** Earliest day that can be picked (YYYY-MM-DD); earlier days are disabled and the previous button stops there. */
  min?: string
  /** Latest day that can be picked (YYYY-MM-DD). */
  max?: string
  /** Days that are shown but cannot be picked (non-trading days, holidays): return true for YYYY-MM-DD to grey it out. */
  unavailable?: (day: string) => boolean
  /** Which month opens when nothing is selected (YYYY-MM-DD of any day in it); defaults to today's month. */
  defaultFocusedValue?: string
  /** First column of the week: mon (default) or sun. */
  weekStart?: WeekStart
  /** BCP 47 locale for month and weekday names, for example 'zh-CN'. */
  locale: string
  /** Accessible name of the calendar. */
  label: string
  /** Accessible names of the two month buttons. */
  labels: CalendarLabels
  /** Disable the whole calendar. */
  disabled?: boolean
  /** Extra class names on the calendar's outer element. */
  className?: string
}

/** A standalone month calendar (one day), on the UI SDK Calendar, in the DateTimeInput calendar skin. */
export function Calendar({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  unavailable,
  defaultFocusedValue,
  weekStart = 'mon',
  locale,
  label,
  labels,
  disabled,
  className,
}: CalendarProps) {
  const valueProps = value === undefined ? {} : { value: value || null }
  const defaultProps = defaultValue === undefined ? {} : { defaultValue: defaultValue || null }
  return (
    <MonthCalendar
      aria-label={label}
      className={cn('k-cal-card', className)}
      {...valueProps}
      {...defaultProps}
      defaultMonth={defaultFocusedValue ? defaultFocusedValue.slice(0, 7) : undefined}
      min={min || undefined}
      max={max || undefined}
      unavailable={unavailable}
      weekStartsOn={weekStart === 'sun' ? 0 : 1}
      locale={locale}
      labels={labels}
      disabled={disabled}
      onValueChange={onValueChange ? (day) => onValueChange(typeof day === 'string' ? day : '') : undefined}
    />
  )
}

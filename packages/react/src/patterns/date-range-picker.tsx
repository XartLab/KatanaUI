// SPDX-License-Identifier: MIT
import { DateInput, DateInputSegment } from '@ui-sdk/react/date-input'
import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/cn.ts'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover.tsx'
import { MonthCalendar, renderSegments, useCalendarFocus } from './date-parts.tsx'
import {
  matchPreset,
  presetRange,
  RANGE_PRESETS,
  type DateRange,
  type RangePreset,
  type WeekStart,
} from './date-range-model.ts'

// 功能参照 Arc Date range picker（uiarc.dev，2026-11-14 读：双月日历加预设），实现原创；样子沿用 DateTimeInput 的日历皮肤（theme/date-time.css 的 .k-cal*）加 theme/date-range.css。
// 行为底座是 UI SDK 的 DateInput 与 Calendar（mode="range"，双月；@ui-sdk/react，Apache-2.0，#263 从 react-aria 换来；键盘、读屏、日期运算都是它的）。没有用它的整件 DatePicker：
// 它的输入是整个文本框、不是逐段打字，样子要变；浮层材质、入场动效、焦点归还也是我们的 Popover 管。
// 值是字符串（YYYY-MM-DD 一对，起止都含），按哪个时区解读由调用方定；今天由调用方传，件里不读时钟。

export type DateRangeLabels = {
  /** 起点、终点日期框的读屏名。 */
  start: string
  end: string
  /** 日历按钮的读屏名与日历弹层的名字。 */
  pickRange: string
  calendar: string
  previousMonth: string
  nextMonth: string
  /** 预设组的读屏名，与每个预设、「自定义」的字。 */
  presets: string
  preset: Readonly<Record<RangePreset, string>>
  custom: string
}

export type DateRangePickerProps = {
  /** The current range (inclusive YYYY-MM-DD pair); null means nothing picked. */
  value: DateRange | null
  /** Called with a valid range once both ends are filled and start ≤ end (typing, calendar or a preset). */
  onValueChange?: (range: DateRange) => void
  /** Old name of onValueChange, kept for one release. @deprecated Use onValueChange. */
  onValue?: (range: DateRange) => void
  /** 今天（YYYY-MM-DD，按应用的显示时区算好）：预设从它算。 */
  today: string
  /** 一周从哪天起，默认周一。 */
  weekStart?: WeekStart
  /** 能选的最早、最晚日期（YYYY-MM-DD）。 */
  min?: string
  max?: string
  labels: DateRangeLabels
  /** 给日期各段与日历的语言（顺序）：中文界面 zh-CN，英文界面 en-CA。 */
  locale: string
  className?: string
}

/** Date range field: two typed date fields, a two-month calendar and presets (today, this week, this month, year to date). */
export function DateRangePicker({
  value,
  onValueChange,
  onValue: legacyOnValue,
  today,
  weekStart = 'mon',
  min,
  max,
  labels,
  locale,
  className,
}: DateRangePickerProps) {
  const onValue = (range: DateRange) => (onValueChange ?? legacyOnValue)?.(range)
  const [open, setOpen] = useState(false)
  // 两个框是分开打字的：只填了一头、或起点晚于终点时，先存在这里，凑成合法区间才上报。
  const [pending, setPending] = useState<{ start: string; end: string } | null>(null)
  const calendarFocus = useCalendarFocus()
  const start = pending ? pending.start : (value?.start ?? '')
  const end = pending ? pending.end : (value?.end ?? '')
  const active = matchPreset(value, today, weekStart)

  // YYYY-MM-DD 字符串按字典序就是日期序。
  const edit = (next: { start: string; end: string }) => {
    if (next.start && next.end && next.start <= next.end) {
      setPending(null)
      onValue({ start: next.start, end: next.end })
    } else setPending(next)
  }
  const choose = (range: DateRange) => {
    setPending(null)
    onValue(range)
    setOpen(false)
  }

  return (
    <span className={cn('k-dr', className)}>
      <DateInput
        aria-label={labels.start}
        className="k-dt-field k-dt-input"
        locale={locale}
        value={start || null}
        min={min || undefined}
        max={end || max || undefined}
        onValueChange={(day) => edit({ start: day ?? '', end })}
      >
        {({ segments }) => renderSegments(segments, DateInputSegment)}
      </DateInput>
      <span className="k-dr-dash" aria-hidden="true">
        –
      </span>
      <DateInput
        aria-label={labels.end}
        className="k-dt-field k-dt-input"
        locale={locale}
        value={end || null}
        min={start || min || undefined}
        max={max || undefined}
        onValueChange={(day) => edit({ start, end: day ?? '' })}
      >
        {({ segments }) => renderSegments(segments, DateInputSegment)}
      </DateInput>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="k-dt-pick" aria-label={labels.pickRange}>
          <CalendarDays size={14} aria-hidden />
        </PopoverTrigger>
        <PopoverContent
          variant="menu"
          side="bottom"
          align="start"
          sideOffset={4}
          className="k-dr-pop"
          aria-label={labels.calendar}
          onOpenAutoFocus={calendarFocus.onOpenAutoFocus}
        >
          <div className="k-dr-presets" role="group" aria-label={labels.presets}>
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className="k-dr-preset"
                aria-pressed={active === preset}
                onClick={() => {
                  const range = presetRange(preset, today, weekStart)
                  if (range) choose(range)
                }}
              >
                {labels.preset[preset]}
              </button>
            ))}
            {value && active === null && (
              <span className="k-dr-preset" data-custom aria-current="true">
                {labels.custom}
              </span>
            )}
          </div>
          <MonthCalendar
            className="k-rcal"
            mode="range"
            months={2}
            locale={locale}
            labels={labels}
            aria-label={labels.calendar}
            controller={calendarFocus.controller}
            value={start && end ? [start, end] : null}
            defaultMonth={start ? start.slice(0, 7) : undefined}
            min={min || undefined}
            max={max || undefined}
            weekStartsOn={weekStart === 'sun' ? 0 : 1}
            onValueChange={(range) => {
              if (Array.isArray(range) && range.length === 2) choose({ start: range[0]!, end: range[1]! })
            }}
          />
        </PopoverContent>
      </Popover>
    </span>
  )
}

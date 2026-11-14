// SPDX-License-Identifier: MIT
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import {
  Button as AriaButton,
  CalendarCell,
  CalendarGrid,
  DateField,
  DateInput,
  DateSegment,
  Heading,
  I18nProvider,
  RangeCalendar,
  type DateSegmentProps,
} from 'react-aria-components'
import type { CalendarDate } from '@internationalized/date'
import { cn } from '../lib/cn'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'
import {
  matchPreset,
  presetRange,
  RANGE_PRESETS,
  toDay,
  type DateRange,
  type RangePreset,
  type WeekStart,
} from './date-range-model'

// 功能参照 Arc Date range picker（uiarc.dev，2026-11-14 读：双月日历加预设），实现原创；样子沿用 DateTimeInput 的日历皮肤（theme/date-time.css 的 .k-cal*）加 theme/date-range.css。
// 行为底座是 react-aria-components 的 DateField 与 RangeCalendar（键盘、读屏、日期运算都是它的）。没有用它的整件 DateRangePicker：
// 整件自带 RAC 的 Popover，浮层材质、入场动效、静态预览（InlineOverlays）、焦点归还都是我们的 Popover 管，两个浮层体系并存会打架。
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
  value: DateRange | null
  onValue: (range: DateRange) => void
  /** 今天（YYYY-MM-DD，按应用的显示时区算好）：预设从它算。 */
  today: string
  /** 一周从哪天起，默认周一。 */
  weekStart?: WeekStart
  /** 能选的最早、最晚日期（YYYY-MM-DD）。 */
  min?: string
  max?: string
  labels: DateRangeLabels
  /** 给 react-aria 的语言（日期各段的顺序）：中文界面 zh-CN，英文界面 en-CA。 */
  locale: string
  className?: string
}

function Segments({ segment }: { segment: DateSegmentProps['segment'] }) {
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

export function DateRangePicker({
  value,
  onValue,
  today,
  weekStart = 'mon',
  min,
  max,
  labels,
  locale,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  // 两个框是分开打字的：只填了一头、或起点晚于终点时，先存在这里，凑成合法区间才上报。
  const [pending, setPending] = useState<{ start: CalendarDate | null; end: CalendarDate | null } | null>(null)
  const start = pending ? pending.start : value ? toDay(value.start) : null
  const end = pending ? pending.end : value ? toDay(value.end) : null
  const minValue = toDay(min ?? '')
  const maxValue = toDay(max ?? '')
  const active = matchPreset(value, today, weekStart)

  const edit = (next: { start: CalendarDate | null; end: CalendarDate | null }) => {
    if (next.start && next.end && next.start.compare(next.end) <= 0) {
      setPending(null)
      onValue({ start: next.start.toString(), end: next.end.toString() })
    } else setPending(next)
  }
  const choose = (range: DateRange) => {
    setPending(null)
    onValue(range)
    setOpen(false)
  }

  return (
    <I18nProvider locale={locale}>
      <span className={cn('k-dr', className)}>
        <DateField
          aria-label={labels.start}
          className="k-dt-field"
          value={start}
          minValue={minValue}
          maxValue={end ?? maxValue}
          validationBehavior="aria"
          shouldForceLeadingZeros
          onChange={(day) => edit({ start: day, end })}
        >
          <DateInput className="k-dt-input">{(segment) => <Segments segment={segment} />}</DateInput>
        </DateField>
        <span className="k-dr-dash" aria-hidden="true">
          –
        </span>
        <DateField
          aria-label={labels.end}
          className="k-dt-field"
          value={end}
          minValue={start ?? minValue}
          maxValue={maxValue}
          validationBehavior="aria"
          shouldForceLeadingZeros
          onChange={(day) => edit({ start, end: day })}
        >
          <DateInput className="k-dt-input">{(segment) => <Segments segment={segment} />}</DateInput>
        </DateField>
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
            <RangeCalendar
              className="k-cal k-rcal"
              aria-label={labels.calendar}
              value={start && end ? { start, end } : null}
              minValue={minValue}
              maxValue={maxValue}
              defaultFocusedValue={start ?? undefined}
              visibleDuration={{ months: 2 }}
              pageBehavior="visible"
              autoFocus
              onChange={(range) => choose({ start: range.start.toString(), end: range.end.toString() })}
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
              <div className="k-rcal-months">
                <CalendarGrid className="k-cal-grid">
                  {(day) => <CalendarCell date={day} className="k-cal-cell" />}
                </CalendarGrid>
                <CalendarGrid className="k-cal-grid" offset={{ months: 1 }}>
                  {(day) => <CalendarCell date={day} className="k-cal-cell" />}
                </CalendarGrid>
              </div>
            </RangeCalendar>
          </PopoverContent>
        </Popover>
      </span>
    </I18nProvider>
  )
}

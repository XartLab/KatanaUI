// SPDX-License-Identifier: MIT
/**
 * Shared pieces of the date family (Calendar, DateTimeInput, DateRangePicker, TradingDatePicker) on the UI SDK.
 * 日期类件共用的零件（#263）：月历的头与格、分段输入的段。行为（键盘、焦点、读屏、日期运算）都是 UI SDK 的
 * （@ui-sdk/react 的 calendar、date-input、time-input，Apache-2.0，见 NOTICE）；这里只把它的零件摆成我们已有的类名与结构（theme/date-time.css 的 .k-cal*、.k-dt-*），
 * 所以样子不变、四个件不各抄一份。不进出口。
 */
import {
  Calendar as UiCalendar,
  CalendarDay,
  CalendarGrid,
  CalendarHeading,
  CalendarNext,
  CalendarPrevious,
  CalendarWeekday,
  CalendarWeekdays,
  CalendarWeeks,
  createCalendarController,
} from '@ui-sdk/react/calendar'
import { DateInputSegment } from '@ui-sdk/react/date-input'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, type ComponentProps } from 'react'
import { cn } from '../lib/cn.ts'

/** 两个翻页钮的读屏名（包里不带文字，调用方按界面语言给）。 */
export type MonthCalendarLabels = { previousMonth: string; nextMonth: string }

type CalendarOptions = Omit<ComponentProps<typeof UiCalendar>, 'children' | 'className' | 'locale' | 'months'>

export type MonthCalendarProps = CalendarOptions & {
  /** BCP 47 语言：月份名、星期头、日期读屏名。 */
  locale: string
  labels: MonthCalendarLabels
  /** 并排几个月（默认 1；双月时翻页按整页翻，格子放进 .k-rcal-months）。 */
  months?: number
  className?: string
}

/** 日格里的数字：本地数字、不带「日」字（UI SDK 的默认文字在中文里是「16日」，我们原来只画数字）。 */
const dayText = (date: string, locale: string) => new Intl.NumberFormat(locale).format(Number(date.slice(8)))

/** 头（上一月 / 标题 / 下一月）加一到两个月的格子，类名同 DateTimeInput 弹层里的日历。 */
export function MonthCalendar({ labels, locale, months = 1, className, ...options }: MonthCalendarProps) {
  const grids = Array.from({ length: months }, (_, offset) => (
    <CalendarGrid key={offset} offset={offset} className="k-cal-grid">
      <CalendarWeekdays>{(index) => <CalendarWeekday index={index} />}</CalendarWeekdays>
      <CalendarWeeks>
        {(cell) => (
          <CalendarDay value={cell.date} className="k-cal-cell">
            {() => dayText(cell.date, locale)}
          </CalendarDay>
        )}
      </CalendarWeeks>
    </CalendarGrid>
  ))
  return (
    <UiCalendar
      {...options}
      locale={locale}
      months={months}
      pageBy={months > 1 ? 'page' : 'month'}
      weekdayFormat="narrow"
      showOutsideDays={false}
      className={cn('k-cal', className)}
    >
      <header className="k-cal-head">
        <CalendarPrevious className="k-cal-nav" aria-label={labels.previousMonth}>
          <ChevronLeft size={14} aria-hidden />
        </CalendarPrevious>
        <CalendarHeading className="k-cal-title" />
        <CalendarNext className="k-cal-nav" aria-label={labels.nextMonth}>
          <ChevronRight size={14} aria-hidden />
        </CalendarNext>
      </header>
      {months > 1 ? <div className="k-rcal-months">{grids}</div> : grids}
    </UiCalendar>
  )
}

/**
 * 弹层里的日历打开时把焦点放到日格上（选中的日子、没有就今天）：弹层自己的「打开时聚焦」会落在翻页钮上。
 * 用法：controller 给 MonthCalendar，onOpenAutoFocus 给弹层内容。
 */
export function useCalendarFocus() {
  return useMemo(() => {
    const controller = createCalendarController()
    return {
      controller,
      onOpenAutoFocus: (event: Event) => {
        event.preventDefault()
        // 日格在弹层挂载后的下一帧才有 Tab 停靠点。
        requestAnimationFrame(() => controller.focus())
      },
    }
  }, [])
}

type Segment = ComponentProps<typeof DateInputSegment>['segment']

// 空段的占位：原来（react-aria）中文是「年 月 日」、英文是 yyyy / mm / dd；UI SDK 默认一律画「––」。时、分、秒仍用它的默认。
const LATIN_PLACEHOLDER: Partial<Record<Segment['type'], string>> = { year: 'yyyy', month: 'mm', day: 'dd' }
const placeholderOf = (segment: Segment) =>
  /^\P{ASCII}$/u.test(segment.label) ? segment.label : LATIN_PLACEHOLDER[segment.type]

/**
 * 分段输入的各段（DateInput 与 TimeInput 共用）：能打字的段是 .k-dt-seg；段与段之间的字是 .k-dt-sep。
 * 中文的日期分隔是「/」，统一写成「-」（YYYY-MM-DD）；时刻两边的方向隔离符号不画。
 */
export function renderSegments(segments: readonly Segment[], Part: typeof DateInputSegment) {
  return segments.map((segment) => {
    if (segment.editable)
      return (
        <Part
          key={segment.key}
          segment={segment}
          className="k-dt-seg"
          // 占位在段自己的属性里写死（传 placeholder 会被盖掉）：用 render 换一个带占位的 input。
          render={(props) => <input {...(props as ComponentProps<'input'>)} placeholder={placeholderOf(segment)} />}
        />
      )
    const text = segment.text.replace('/', '-').replace(/[⁦-⁩]/g, '')
    return text ? (
      <Part key={segment.key} segment={segment} className="k-dt-sep">
        {text}
      </Part>
    ) : null
  })
}

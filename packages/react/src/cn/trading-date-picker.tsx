// SPDX-License-Identifier: MIT
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Button as AriaButton, Calendar, CalendarGrid, Heading, I18nProvider } from 'react-aria-components'
import { cn } from '../lib/cn.ts'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover.tsx'
import { useCalendarEvents, type CalendarEventProps } from '../patterns/calendar-events.tsx'
import { toDay } from '../patterns/date-range-model.ts'
import { cnLabelsZh, type TradingDatePickerLabels } from './labels.ts'
import { shiftTradingDay, tradingDayTest, type TradingCalendar } from './trading-date-model.ts'

// 交易日选择（#110，复盘页的日期切换）：只能选交易日。左右两个按钮跳到上一个 / 下一个交易日（跳过周末与休市），中间的按钮打开日历，休市的日子灰着点不了。
// 交易日历由调用方传（一组 YYYY-MM-DD 或判定函数），包里不带日历数据，也不读时钟。日历外观沿用 DateTimeInput 的 .k-cal（行为底座是 react-aria 的 Calendar：键盘、读屏都是它的）。
// 值是 YYYY-MM-DD 字符串。不带打字框：打字会进「半截日期」状态，选日交给日历与前后键，键盘与读屏都能走通。

export type TradingDatePickerProps = CalendarEventProps & {
  /**
   * The selected trading day as YYYY-MM-DD; null means nothing picked.
   * 选中的交易日（YYYY-MM-DD）；null 是还没选。
   */
  value: string | null
  /**
   * Called with a trading day only; closed days are never reported.
   * 选了交易日才回调；休市的日子不会回调。
   */
  onValueChange: (date: string) => void
  /**
   * The trading calendar: a set or array of open days (YYYY-MM-DD), or a function that says whether a day is open.
   * 交易日历：一组开市日期，或判定函数。
   */
  calendar: TradingCalendar
  /**
   * Earliest selectable day (YYYY-MM-DD); earlier days are disabled and the previous button stops there.
   * 能选的最早日期。
   */
  min?: string
  /**
   * Latest selectable day (YYYY-MM-DD); later days are disabled and the next button stops there.
   * 能选的最晚日期。
   */
  max?: string
  /**
   * Text pack; the Simplified Chinese default is used when omitted.
   * 文案；不传用简体中文默认。
   */
  labels?: TradingDatePickerLabels
  /**
   * Locale for react-aria (month names, week start): zh-CN by default.
   * 给 react-aria 的语言（月份名、周起始）；默认 zh-CN。
   */
  locale?: string
  /** Extra class names. */
  className?: string
}

export function TradingDatePicker({
  value,
  onValueChange,
  calendar,
  min,
  max,
  labels = cnLabelsZh.tradingDate,
  locale = 'zh-CN',
  className,
  events,
  insight,
}: TradingDatePickerProps) {
  const [open, setOpen] = useState(false)
  const view = useCalendarEvents({ events, insight, locale, selected: value })
  const isTrading = tradingDayTest(calendar)
  const day = value === null ? null : toDay(value)
  const minValue = toDay(min ?? '')
  const maxValue = toDay(max ?? '')
  const previous = value === null ? null : shiftTradingDay(value, calendar, -1, { min, max })
  const next = value === null ? null : shiftTradingDay(value, calendar, 1, { min, max })
  const closed = value !== null && !isTrading(value)
  return (
    <I18nProvider locale={locale}>
      <span className={cn('k-tdp', className)} data-slot="trading-date-picker" data-closed={closed || undefined}>
        <button
          type="button"
          className="k-tdp-step"
          data-slot="trading-date-prev"
          aria-label={labels.previousDay}
          disabled={previous === null}
          onClick={() => previous && onValueChange(previous)}
        >
          <ChevronLeft size={14} aria-hidden />
        </button>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger className="k-tdp-pick" aria-label={labels.pick} data-slot="trading-date-trigger">
            <CalendarDays size={14} aria-hidden />
            <span className="k-tdp-value" data-slot="trading-date-value">
              {value ?? labels.placeholder}
            </span>
          </PopoverTrigger>
          <PopoverContent
            variant="menu"
            side="bottom"
            align="start"
            sideOffset={4}
            className="k-dt-pop k-tdp-pop"
            aria-label={labels.calendar}
          >
            <Calendar
              className="k-cal"
              aria-label={labels.calendar}
              value={day}
              minValue={minValue}
              maxValue={maxValue}
              isDateUnavailable={(date) => !isTrading(date.toString())}
              autoFocus
              onChange={(date) => {
                onValueChange(date.toString())
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
              <CalendarGrid className="k-cal-grid">{(date) => view.cell(date)}</CalendarGrid>
              {view.foot}
            </Calendar>
          </PopoverContent>
        </Popover>
        <button
          type="button"
          className="k-tdp-step"
          data-slot="trading-date-next"
          aria-label={labels.nextDay}
          disabled={next === null}
          onClick={() => next && onValueChange(next)}
        >
          <ChevronRight size={14} aria-hidden />
        </button>
      </span>
    </I18nProvider>
  )
}

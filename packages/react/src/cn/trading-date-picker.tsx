// SPDX-License-Identifier: MIT
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/cn.ts'
import { MonthCalendar, useCalendarFocus } from '../patterns/date-parts.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover.tsx'
import { cnLabelsZh, type TradingDatePickerLabels } from './labels.ts'
import { shiftTradingDay, tradingDayTest, type TradingCalendar } from './trading-date-model.ts'

// 交易日选择（#110，复盘页的日期切换）：只能选交易日。左右两个按钮跳到上一个 / 下一个交易日（跳过周末与休市），中间的按钮打开日历，休市的日子灰着点不了。
// 交易日历由调用方传（一组 YYYY-MM-DD 或判定函数），包里不带日历数据，也不读时钟。日历外观沿用 DateTimeInput 的 .k-cal（行为底座是 UI SDK 的 Calendar，#263 从 react-aria 换来：键盘、读屏都是它的）。
// 值是 YYYY-MM-DD 字符串。不带打字框：打字会进「半截日期」状态，选日交给日历与前后键，键盘与读屏都能走通。

export type TradingDatePickerProps = {
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
   * Locale for month names and week start: zh-CN by default.
   * 月份名、周起始的语言；默认 zh-CN。
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
}: TradingDatePickerProps) {
  const [open, setOpen] = useState(false)
  const isTrading = tradingDayTest(calendar)
  const calendarFocus = useCalendarFocus()
  const previous = value === null ? null : shiftTradingDay(value, calendar, -1, { min, max })
  const next = value === null ? null : shiftTradingDay(value, calendar, 1, { min, max })
  const closed = value !== null && !isTrading(value)
  return (
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
          onOpenAutoFocus={calendarFocus.onOpenAutoFocus}
        >
          <MonthCalendar
            aria-label={labels.calendar}
            locale={locale}
            labels={labels}
            controller={calendarFocus.controller}
            value={value}
            min={min || undefined}
            max={max || undefined}
            unavailable={(date) => !isTrading(date)}
            onValueChange={(date) => {
              if (typeof date !== 'string') return
              onValueChange(date)
              setOpen(false)
            }}
          />
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
  )
}

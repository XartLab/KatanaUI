// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TradingDatePicker } from '../../src/cn'

// The calendar is yours: a set of open days, or a function. Here weekends are closed.
const isOpen = (date: string) => {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  return weekday !== 0 && weekday !== 6
}

export function TradingDatePickerUsage() {
  const [date, setDate] = useState<string | null>('2026-11-20')
  return (
    <TradingDatePicker
      value={date}
      onValueChange={setDate}
      calendar={isOpen}
      locale="en-CA"
      labels={{
        pick: 'Pick a trading day',
        calendar: 'Trading calendar',
        previousMonth: 'Previous month',
        nextMonth: 'Next month',
        previousDay: 'Previous trading day',
        nextDay: 'Next trading day',
        placeholder: 'Pick a day',
        closed: 'Closed',
      }}
    />
  )
}

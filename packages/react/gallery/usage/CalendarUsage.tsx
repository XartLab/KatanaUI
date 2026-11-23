// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Calendar } from '../../src/index'

/** Weekends cannot be picked (an example; pass your own trading calendar). */
const isWeekend = (day: string) => [0, 6].includes(new Date(`${day}T00:00:00Z`).getUTCDay())

export function CalendarUsage() {
  const [day, setDay] = useState('2026-11-20')
  return (
    <Calendar
      label="Go to date"
      locale="en-US"
      labels={{ previousMonth: 'Previous month', nextMonth: 'Next month' }}
      value={day}
      onValueChange={setDay}
      unavailable={isWeekend}
    />
  )
}

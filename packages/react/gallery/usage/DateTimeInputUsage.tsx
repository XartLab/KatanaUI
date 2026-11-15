// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { DateTimeInput, type DateTimeLabels } from '../../src/index'

const LABELS: DateTimeLabels = {
  date: (label) => `${label} date`,
  pickDate: (label) => `Pick ${label} date`,
  calendar: (label) => `${label} calendar`,
  time: (label) => `${label} time`,
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
}

export function DateTimeInputUsage() {
  const [date, setDate] = useState('2026-11-14')
  const [time, setTime] = useState('09:30')
  return (
    <DateTimeInput
      label="Start"
      labels={LABELS}
      locale="en-CA"
      date={date}
      onDate={setDate}
      time={time}
      onTime={setTime}
    />
  )
}

// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { fromCalendarDate, fromTime, toCalendarDate, toTime } from './date-time-model.ts'

describe('日期时间输入的值', () => {
  it('日期：YYYY-MM-DD 来回不变，空串和不合法是 null', () => {
    expect(fromCalendarDate(toCalendarDate('2026-01-05'))).toBe('2026-01-05')
    expect(toCalendarDate('')).toBeNull()
    expect(toCalendarDate('2026-02-30')).toBeNull()
    expect(toCalendarDate('2026/01/05')).toBeNull()
    expect(fromCalendarDate(null)).toBe('')
  })

  it('时刻：HH:mm 来回不变，要秒时写成 HH:mm:ss；空串和不合法是 null', () => {
    expect(fromTime(toTime('09:05'))).toBe('09:05')
    expect(fromTime(toTime('09:05:07'), true)).toBe('09:05:07')
    expect(fromTime(toTime('09:05'), true)).toBe('09:05:00')
    expect(toTime('')).toBeNull()
    expect(toTime('24:00')).toBeNull()
    expect(fromTime(null)).toBe('')
  })
})

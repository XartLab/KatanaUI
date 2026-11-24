// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  DOT_LIMIT,
  dayLabel,
  describeEvents,
  dotsOf,
  eventsOn,
  moreOf,
  type CalendarDayEvent,
} from './calendar-events-model.ts'

const cpi: CalendarDayEvent = { label: 'CPI', tone: 'warn' }
const fomc: CalendarDayEvent = { label: 'FOMC', tone: 'danger' }
const earn: CalendarDayEvent = { label: 'AAPL earnings' }

describe('eventsOn', () => {
  it('从表里按日取；没有的日子是空数组，不是 undefined', () => {
    const table = { '2026-11-27': [cpi] }
    expect(eventsOn(table, '2026-11-27')).toEqual([cpi])
    expect(eventsOn(table, '2026-11-28')).toEqual([])
    expect(eventsOn(undefined, '2026-11-27')).toEqual([])
  })
  it('函数来源：按日算；返回 undefined 也当没有', () => {
    const source = (day: string) => (day === '2026-12-02' ? [fomc] : undefined)
    expect(eventsOn(source, '2026-12-02')).toEqual([fomc])
    expect(eventsOn(source, '2026-12-03')).toEqual([])
  })
})

describe('dotsOf', () => {
  it('一件事一个点，缺省 neutral，次序照给', () => {
    expect(dotsOf([earn, cpi])).toEqual(['neutral', 'warn'])
  })
  it(`正好 ${DOT_LIMIT} 件事画满，没有「+」`, () => {
    expect(dotsOf([cpi, fomc, earn])).toHaveLength(DOT_LIMIT)
    expect(moreOf([cpi, fomc, earn])).toBe(false)
    expect(dotsOf([])).toEqual([])
  })
  it(`多于 ${DOT_LIMIT} 件：只画 ${DOT_LIMIT - 1} 个点，第 ${DOT_LIMIT} 个位置换成「+」`, () => {
    expect(dotsOf([cpi, fomc, earn, cpi, fomc])).toEqual(['warn', 'danger'])
    expect(moreOf([cpi, fomc, earn, cpi])).toBe(true)
  })
})

describe('describeEvents', () => {
  it('按语言连起来', () => {
    expect(describeEvents([cpi, fomc], 'en')).toBe('CPI and FOMC')
    expect(describeEvents([cpi], 'en')).toBe('CPI')
    expect(describeEvents([cpi, fomc, earn], 'en')).toBe('CPI, FOMC, and AAPL earnings')
  })
  it('不认识的语言标签不抛错', () => {
    expect(describeEvents([cpi, fomc], 'not a locale')).toBe('CPI, FOMC')
  })
})

describe('dayLabel', () => {
  it('固定按 UTC 排，月日按语言', () => {
    expect(dayLabel('2026-11-27', 'en')).toBe('Nov 27')
    expect(dayLabel('2026-01-05', 'en')).toBe('Jan 5')
  })
  it('不合法的日期原样返回', () => {
    expect(dayLabel('', 'en')).toBe('')
    expect(dayLabel('11-27', 'en')).toBe('11-27')
  })
})

// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import { filterEvents, surprisePercent, toneOfSign, weekDays, type EconomicEvent } from './event-calendar-model.ts'

const base: EconomicEvent = {
  id: 'x',
  at: Date.UTC(2026, 10, 13, 8),
  region: 'US',
  regionName: 'US',
  name: 'x',
  importance: 1,
}
const filter = {
  range: { start: '2026-11-13', end: '2026-11-13' },
  highOnly: false,
  category: '' as const,
  regions: [],
  timeZone: 'UTC',
}

describe('surprisePercent', () => {
  it('(实际 − 预期) / |预期|，负预期按绝对值', () => {
    expect(surprisePercent(1.1, 1)).toBeCloseTo(10)
    expect(surprisePercent(0.9, 1)).toBeCloseTo(-10)
    expect(surprisePercent(-0.2, -0.4)).toBeCloseTo(50)
  })
  it('缺值或预期为 0 不算', () => {
    expect(surprisePercent(undefined, 1)).toBeUndefined()
    expect(surprisePercent(1, 0)).toBeUndefined()
  })
  it('方向：舍入成 0.00 的不上色', () => {
    expect(toneOfSign(0.001)).toBe('flat')
    expect(toneOfSign(2)).toBe('up')
    expect(toneOfSign(-2)).toBe('down')
  })
})

describe('weekDays', () => {
  it('周一到周日（2026-11-15 是周日，周从 11-09 起）', () => {
    expect(weekDays('2026-11-15')).toEqual([
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ])
  })
})

describe('filterEvents', () => {
  const events: EconomicEvent[] = [
    { ...base, id: 'a', importance: 3, category: 'prices' },
    { ...base, id: 'b', importance: 1, category: 'labor' },
    { ...base, id: 'c', region: 'CN', importance: 2, category: 'prices' },
    { ...base, id: 'd', at: Date.UTC(2026, 10, 14, 8) },
  ]
  it('只看这一天', () => expect(filterEvents(events, filter).map((e) => e.id)).toEqual(['a', 'b', 'c']))
  it('高重要只留三档', () =>
    expect(filterEvents(events, { ...filter, highOnly: true }).map((e) => e.id)).toEqual(['a']))
  it('类别与国家', () => {
    expect(filterEvents(events, { ...filter, category: 'prices' }).map((e) => e.id)).toEqual(['a', 'c'])
    expect(filterEvents(events, { ...filter, regions: ['CN'] }).map((e) => e.id)).toEqual(['c'])
  })
})

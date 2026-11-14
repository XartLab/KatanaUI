// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import { eventTone, leadingNumber, type EconomicEvent } from './event-calendar-model.ts'

const base: EconomicEvent = { id: 'x', at: 0, region: 'US', regionName: 'US', name: 'x', importance: 1 }

describe('eventTone', () => {
  it('默认：实际高于预期涨色、低于跌色，包括负数（-0.2 高于 -0.3）', () => {
    expect(eventTone({ ...base, actual: '0.4%', forecast: '0.3%' })).toBe('up')
    expect(eventTone({ ...base, actual: '-0.2万亿', forecast: '-0.3万亿' })).toBe('up')
    expect(eventTone({ ...base, actual: '0.2%', forecast: '0.4%' })).toBe('down')
  })
  it('higherIsBetter 为 false 时反转，相等仍不上色', () => {
    expect(eventTone({ ...base, actual: '0.4%', forecast: '0.3%', higherIsBetter: false })).toBe('down')
    expect(eventTone({ ...base, actual: '0.2%', forecast: '0.4%', higherIsBetter: false })).toBe('up')
    expect(eventTone({ ...base, actual: '0.3%', forecast: '0.3%', higherIsBetter: false })).toBe('flat')
  })
  it('没有预期或没有实际不上色；数值字段优先于文字', () => {
    expect(eventTone({ ...base, actual: '0.4%' })).toBe('flat')
    expect(eventTone({ ...base, forecast: '0.4%' })).toBe('flat')
    expect(eventTone({ ...base, actual: '—', forecast: '1', actualValue: 2 })).toBe('up')
  })
  it('leadingNumber', () => {
    expect(leadingNumber('−1.5%')).toBe(-1.5)
    expect(leadingNumber('abc')).toBeUndefined()
  })
})

// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  CN_AXIS_MINUTES,
  cnAxisPosition,
  cnPhaseOf,
  cnTradingMinutesBetween,
  formatClock,
  parseClock,
} from './session.ts'

const at = (text: string) => parseClock(text)

describe('A 股时段轴', () => {
  it('总宽 250 分钟：竞价 10 + 上午 120 + 下午 120', () => {
    expect(CN_AXIS_MINUTES).toBe(250)
    expect(cnAxisPosition(at('09:15'))).toBe(0)
    expect(cnAxisPosition(at('15:00'))).toBe(1)
    expect(cnAxisPosition(at('09:25'))).toBeCloseTo(10 / 250)
    expect(cnAxisPosition(at('09:30'))).toBeCloseTo(10 / 250)
    expect(cnAxisPosition(at('11:30'))).toBeCloseTo(130 / 250)
  })

  it('午休与 09:25–09:30 不占宽度：11:30 与 13:00 同一位置，两头的距离是 0', () => {
    expect(cnAxisPosition(at('13:00'))).toBeCloseTo(cnAxisPosition(at('11:30'))!)
    expect(cnAxisPosition(at('12:15'))).toBeCloseTo(cnAxisPosition(at('11:30'))!)
    expect(cnAxisPosition(at('09:27'))).toBeCloseTo(cnAxisPosition(at('09:25'))!)
    expect(cnTradingMinutesBetween(at('11:30'), at('13:00'))).toBe(0)
    expect(cnTradingMinutesBetween(at('11:00'), at('13:30'))).toBe(60)
    expect(cnTradingMinutesBetween(at('09:30'), at('15:00'))).toBe(240)
  })

  it('时段之外返回 null，不硬凑', () => {
    expect(cnAxisPosition(at('09:14'))).toBeNull()
    expect(cnAxisPosition(at('15:01'))).toBeNull()
    expect(cnAxisPosition(null)).toBeNull()
    expect(cnTradingMinutesBetween(at('14:00'), at('10:00'))).toBeNull()
    expect(cnPhaseOf(at('08:00'))).toBeNull()
  })

  it('四段：竞价 / 早盘 / 午盘 / 尾盘（14:30 起）', () => {
    expect(cnPhaseOf(at('09:20'))).toBe('auction')
    expect(cnPhaseOf(at('09:30'))).toBe('morning')
    expect(cnPhaseOf(at('11:30'))).toBe('morning')
    expect(cnPhaseOf(at('13:11'))).toBe('afternoon')
    expect(cnPhaseOf(at('14:29'))).toBe('afternoon')
    expect(cnPhaseOf(at('14:30'))).toBe('late')
    expect(cnPhaseOf(at('15:00'))).toBe('late')
  })

  it('时刻解析：HH:MM、HH:MM:SS，写法不对是 null', () => {
    expect(parseClock('09:31')).toBe(571)
    expect(parseClock('9:31:30')).toBe(571.5)
    expect(parseClock('25:00')).toBeNull()
    expect(parseClock('abc')).toBeNull()
    expect(parseClock(undefined)).toBeNull()
    expect(formatClock(571.5)).toBe('09:31')
  })
})

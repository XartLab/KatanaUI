// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { countdownTo, formatCountdown, formatRate, fundingBars, rateTone } from './funding-model.ts'

const T = Date.UTC(2026, 10, 22, 8, 0, 0)

describe('countdownTo', () => {
  it('拆成时分秒，向下取整到秒', () => {
    const c = countdownTo(T, T - (2 * 3600 + 3 * 60 + 4) * 1000 - 900)
    expect([c.hours, c.minutes, c.seconds]).toEqual([2, 3, 4])
    expect(c.due).toBe(false)
  })
  it('到点与过点都是 0 且 due', () => {
    expect(countdownTo(T, T).due).toBe(true)
    const past = countdownTo(T, T + 5000)
    expect(past.remaining).toBe(0)
    expect(past.due).toBe(true)
  })
  it('时间不是有限数时当作到点', () => {
    expect(countdownTo(Number.NaN, T).due).toBe(true)
  })
  it('少于一秒的剩余不跳到 1 秒', () => {
    const c = countdownTo(T, T - 999)
    expect(c.seconds).toBe(0)
    expect(c.due).toBe(false)
  })
})

describe('formatCountdown', () => {
  it('补零写成 HH:MM:SS', () => {
    expect(formatCountdown(countdownTo(T, T - 5000))).toBe('00:00:05')
    expect(formatCountdown(countdownTo(T, T - (7 * 3600 + 59 * 60 + 9) * 1000))).toBe('07:59:09')
  })
  it('小时不按 24 折', () => {
    expect(formatCountdown(countdownTo(T, T - 100 * 3600 * 1000))).toBe('100:00:00')
  })
})

describe('rateTone / formatRate', () => {
  it('正为涨、负为跌、零为平', () => {
    expect(rateTone(0.01)).toBe('up')
    expect(rateTone(-0.01)).toBe('down')
    expect(rateTone(0)).toBe('flat')
  })
  it('带符号固定位数；舍入成零不带号', () => {
    expect(formatRate(0.01)).toBe('+0.0100%')
    expect(formatRate(-0.0253)).toBe('-0.0253%')
    expect(formatRate(0.00001)).toBe('0.0000%')
    expect(formatRate(0.5, 2)).toBe('+0.50%')
  })
})

describe('fundingBars', () => {
  it('按最大绝对值归一，正负分开着色', () => {
    const bars = fundingBars([
      { time: 1, rate: 0.01 },
      { time: 2, rate: -0.02 },
      { time: 3, rate: 0 },
    ])
    expect(bars.map((bar) => bar.ratio)).toEqual([0.5, -1, 0])
    expect(bars.map((bar) => bar.tone)).toEqual(['up', 'down', 'flat'])
  })
  it('全是零时不除零；非有限数丢掉', () => {
    expect(fundingBars([{ time: 1, rate: 0 }])[0]!.ratio).toBe(0)
    expect(fundingBars([{ time: 1, rate: Number.NaN }])).toEqual([])
    expect(fundingBars([])).toEqual([])
  })
})

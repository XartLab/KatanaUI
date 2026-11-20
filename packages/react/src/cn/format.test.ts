// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { formatCnAmount } from './format.ts'

// #110 第 0 层：万 / 亿。
describe('formatCnAmount', () => {
  it('≥1 亿写 x.xx亿，≥1 万写 x万，否则原样', () => {
    expect(formatCnAmount(123_456_789)).toBe('1.23亿')
    expect(formatCnAmount(98_765_432_100)).toBe('987.65亿')
    expect(formatCnAmount(1e8)).toBe('1.00亿')
    expect(formatCnAmount(12_500)).toBe('1.3万')
    expect(formatCnAmount(10_000)).toBe('1万')
    expect(formatCnAmount(678_900)).toBe('67.9万')
    expect(formatCnAmount(38_600_000)).toBe('3,860万')
    expect(formatCnAmount(9_999)).toBe('9,999')
    expect(formatCnAmount(0)).toBe('0')
    expect(formatCnAmount(12.5)).toBe('12.50')
  })

  it('取不到写 —，不写 0；负数带 -，signed 给正数带 +', () => {
    expect(formatCnAmount(null)).toBe('—')
    expect(formatCnAmount(undefined)).toBe('—')
    expect(formatCnAmount(Number.NaN)).toBe('—')
    expect(formatCnAmount(-5.4e7)).toBe('-5,400万')
    expect(formatCnAmount(-2.5e8)).toBe('-2.50亿')
    expect(formatCnAmount(3.2e8, { signed: true })).toBe('+3.20亿')
  })

  it('进位到下一档：9999.96 万写成 1.00 亿；digits 与 abbreviate 听调用方的', () => {
    expect(formatCnAmount(99_999_600)).toBe('1.00亿')
    expect(formatCnAmount(123_456_789, { digits: 1 })).toBe('1.2亿')
    expect(formatCnAmount(12_345, { digits: 2 })).toBe('1.23万')
    expect(formatCnAmount(123_456_789, { abbreviate: false })).toBe('123,456,789')
    expect(formatCnAmount(2e8, undefined, { wan: '萬', yi: '億' })).toBe('2.00億')
  })
})

// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { decimalsOfTick, formatPercentChange, formatPrice, toneOf } from './index.ts'

describe('formatPrice：三类市场', () => {
  it('A 股（tick 0.01）：恒两位小数，千分位', () => {
    expect(formatPrice(1688, { tick: 0.01 })).toBe('1,688.00')
    expect(formatPrice(9.5, { tick: 0.01 })).toBe('9.50')
    expect(formatPrice(1688.126, { precision: 2 })).toBe('1,688.13')
  })

  it('期货（自定 tick）：小数位跟 tick 走，0.25 两位、0.2 一位、5 零位', () => {
    expect(formatPrice(4500.25, { tick: 0.25 })).toBe('4,500.25')
    expect(formatPrice(4500.2, { tick: 0.2 })).toBe('4,500.2')
    expect(formatPrice(4500, { tick: 0.2 })).toBe('4,500.0')
    expect(formatPrice(3250, { tick: 5 })).toBe('3,250')
    expect(decimalsOfTick(0.25)).toBe(2)
    expect(decimalsOfTick(0.2)).toBe(1)
    expect(decimalsOfTick(5)).toBe(0)
  })

  it('加密（8 位）：小 tick 在 String() 里是科学计数，也要数对位数；写出来的价格永远没有指数', () => {
    expect(String(1e-8)).toBe('1e-8')
    expect(decimalsOfTick(1e-8)).toBe(8)
    expect(decimalsOfTick(2.5e-7)).toBe(8)
    expect(decimalsOfTick(0.00001)).toBe(5)
    expect(formatPrice(0.00000123, { tick: 1e-8 })).toBe('0.00000123')
    expect(formatPrice(1e-7, { precision: 8 })).toBe('0.00000010')
    // 小于最小位的写成 0.00000000，不是 1e-9。
    expect(formatPrice(1e-9, { precision: 8 })).toBe('0.00000000')
    expect(formatPrice(67123.456789, { precision: 8 })).toBe('67,123.45678900')
    for (const value of [1e-7, 1e-9, 5e-324, 1e21]) expect(formatPrice(value, { precision: 8 })).not.toMatch(/e/i)
  })

  it('精度与 tick 都没给：按 fallback（默认最多 10 位小数，也可以写 N 位有效数字）', () => {
    expect(formatPrice(96500.123456789, { precision: null })).toBe('96,500.123456789')
    expect(formatPrice(96500.5, {})).toBe('96,500.5')
    expect(formatPrice(0.000123456789, { fallback: { significant: 6 } })).toBe('0.000123457')
  })

  it('不是有限数写 —；tick 不是正数报错', () => {
    expect(formatPrice(Number.NaN, { precision: 2 })).toBe('—')
    expect(formatPrice(Number.POSITIVE_INFINITY)).toBe('—')
    expect(() => decimalsOfTick(0)).toThrow(RangeError)
    expect(() => decimalsOfTick(-0.01)).toThrow(RangeError)
  })
})

describe('涨跌的写法与方向', () => {
  it('正数带 +，负数带 -，位数由调用方传', () => {
    expect(formatPercentChange(1.5)).toBe('+1.50%')
    expect(formatPercentChange(-0.37)).toBe('-0.37%')
    expect(formatPercentChange(12.3456, 1)).toBe('+12.3%')
  })

  it('舍入成零不带号、不着色：写 0.00% 的就是平', () => {
    expect(formatPercentChange(0)).toBe('0.00%')
    expect(formatPercentChange(-0.004)).toBe('0.00%')
    expect(toneOf(-0.004, 2)).toBe('flat')
    expect(toneOf(0.004, 2)).toBe('flat')
    expect(toneOf(0.006, 2)).toBe('up')
  })

  it('toneOf：字符串里的「−」（U+2212）当负号，没有值、不是数是平', () => {
    expect(toneOf('−3.5')).toBe('down')
    expect(toneOf('+12.5')).toBe('up')
    expect(toneOf('0')).toBe('flat')
    expect(toneOf(null)).toBe('flat')
    expect(toneOf(undefined)).toBe('flat')
    expect(toneOf('abc')).toBe('flat')
  })
})

// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { decimalsOf, formatDecimal, formatUnits, fromUnits, toUnits } from './scaled-decimal.ts'

describe('十进制整数运算', () => {
  it('小数位：普通、科学计数、整数', () => {
    expect(decimalsOf(0.25)).toBe(2)
    expect(decimalsOf(1e-7)).toBe(7)
    expect(decimalsOf(5)).toBe(0)
    expect(decimalsOf(0)).toBe(0)
  })
  it('乘成整数时吃掉浮点误差', () => {
    expect(0.1 * 3).not.toBe(0.3)
    expect(toUnits(0.1 * 3, 1)).toBe(3)
    expect(fromUnits(1234, 2)).toBe(12.34)
  })
  it('写成字符串不经 toFixed，负数与零', () => {
    expect(formatUnits(-5, 2)).toBe('-0.05')
    expect(formatUnits(0, 2)).toBe('0.00')
    expect(formatUnits(-0, 2)).toBe('0.00')
    expect(formatUnits(123456789, 2)).toBe('1,234,567.89')
    expect(formatUnits(123456789, 2, false)).toBe('1234567.89')
    expect(formatDecimal(0.1 + 0.2, 2)).toBe('0.30')
    expect(formatDecimal(Number.NaN, 2)).toBe('—')
  })
})

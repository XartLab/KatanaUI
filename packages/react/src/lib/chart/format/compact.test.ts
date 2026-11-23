// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { formatCnAmount } from './cn-amount.ts'
import { compactNumber, formatCompactNumber } from './compact.ts'

// 数字缩写（#90）：缩写字跟 locale 走，两位小数，数字与缩写字之间空一格；zh 用 formatCnAmount 的写法（#158）。
describe('compactNumber', () => {
  it('en-US 是 K / M / B / T，两位小数', () => {
    expect(compactNumber(835_490)).toEqual({ number: '835.49', suffix: 'K' })
    expect(formatCompactNumber(4.53e12)).toBe('4.53 T')
    expect(formatCompactNumber(2.95e6)).toBe('2.95 M')
    expect(formatCompactNumber(-7.29e9)).toBe('-7.29 B')
  })
  it('zh-CN 是 万 / 亿，写法就是 formatCnAmount（#158）', () => {
    for (const value of [9_999, 45_600, 88_000_000, -12_345_678, 99_999_999, 123_456_789, 5e8, 5.2e8, 4.53e12]) {
      expect(formatCompactNumber(value, { locale: 'zh-CN' })).toBe(formatCnAmount(value))
    }
    expect(formatCompactNumber(123_456_789, { locale: 'zh-CN' })).toBe('1.23亿')
    expect(formatCompactNumber(88_000_000, { locale: 'zh-CN' })).toBe('8,800万')
    expect(formatCompactNumber(45_600, { locale: 'zh-CN' })).toBe('4.6万')
    expect(formatCompactNumber(3.2e8, { locale: 'zh-CN', digits: 1 })).toBe('3.2亿')
    expect(compactNumber(5.2e8, { locale: 'zh-CN' })).toEqual({ number: '5.20', suffix: '亿' })
    expect(compactNumber(9_999, { locale: 'zh-CN' })).toEqual({ number: '9,999', suffix: '' })
    expect(formatCompactNumber(Number.NaN, { locale: 'zh-CN' })).toBe('—')
    expect(formatCompactNumber(2e6)).toBe('2.00 M')
  })
  it('不到第一档照写（不补零），小数位可换，不是有限数写 —', () => {
    expect(formatCompactNumber(835)).toBe('835')
    expect(formatCompactNumber(12.5)).toBe('12.5')
    expect(formatCompactNumber(1_234_567, { digits: 1 })).toBe('1.2 M')
    expect(formatCompactNumber(Number.NaN)).toBe('—')
  })
})

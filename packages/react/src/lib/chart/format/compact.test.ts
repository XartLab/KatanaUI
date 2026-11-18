// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { compactNumber, formatCompactNumber } from './compact.ts'

// 数字缩写（#90）：缩写字跟 locale 走，两位小数，数字与缩写字之间空一格。
describe('compactNumber', () => {
  it('en-US 是 K / M / B / T，两位小数', () => {
    expect(compactNumber(835_490)).toEqual({ number: '835.49', suffix: 'K' })
    expect(formatCompactNumber(4.53e12)).toBe('4.53 T')
    expect(formatCompactNumber(2.95e6)).toBe('2.95 M')
    expect(formatCompactNumber(-7.29e9)).toBe('-7.29 B')
  })
  it('zh-CN 是 万 / 亿 / 万亿，由调用方的 locale 给', () => {
    expect(formatCompactNumber(123_456_789, { locale: 'zh-CN' })).toBe('1.23 亿')
    expect(formatCompactNumber(45_600, { locale: 'zh-CN' })).toBe('4.56 万')
    expect(formatCompactNumber(4.53e12, { locale: 'zh-CN' })).toBe('4.53 万亿')
  })
  it('不到第一档照写（不补零），小数位可换，不是有限数写 —', () => {
    expect(formatCompactNumber(835)).toBe('835')
    expect(formatCompactNumber(12.5)).toBe('12.5')
    expect(formatCompactNumber(1_234_567, { digits: 1 })).toBe('1.2 M')
    expect(formatCompactNumber(Number.NaN)).toBe('—')
  })
})

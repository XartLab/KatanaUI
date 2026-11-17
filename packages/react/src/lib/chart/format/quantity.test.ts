// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { compactParts, formatCompact, formatCount, formatQuantity, formatVolume } from './quantity.ts'

describe('表格面板的数量写法', () => {
  it('自动：K 留 1 位、M 留 2 位；美元从 1,000 起缩写，币从 10,000 起', () => {
    expect(formatQuantity(30_000, 'usd')).toBe('$30.0K')
    expect(formatQuantity(2_400_000, 'usd')).toBe('$2.40M')
    expect(formatQuantity(1_234, 'base')).toBe('1,234')
    expect(formatQuantity(25_000, 'base')).toBe('25.0K')
    expect(formatQuantity(0.0123, 'base')).toBe('0.0123')
  })

  it('负数按绝对值写、前面加负号；零写 0', () => {
    expect(formatQuantity(-25_000, 'base')).toBe('-25.0K')
    expect(formatQuantity(-0.5, 'base')).toBe('-0.500')
    expect(formatQuantity(-1_234, 'base', { abbreviate: false, digits: 1 })).toBe('-1,234.0')
    expect(formatQuantity(0, 'base')).toBe('0')
  })

  it('个数是整数加千分位；缩写从 10,000 起', () => {
    expect(formatCount(9_876, true)).toBe('9,876')
    expect(formatCount(12_345, true)).toBe('12.3K')
    expect(formatCount(2_345_678, true)).toBe('2.35M')
    expect(formatCount(12_345, false)).toBe('12,345')
  })

  it('统计面板的大字：一位小数，K / M / B 拆出来', () => {
    expect(compactParts(13_200_000_000)).toEqual({ number: '$13.2', suffix: 'B' })
    expect(compactParts(865_140_000)).toEqual({ number: '$865.1', suffix: 'M' })
    expect(compactParts(4_840)).toEqual({ number: '$4.8', suffix: 'K' })
    expect(compactParts(512.34)).toEqual({ number: '$512.3', suffix: '' })
    expect(compactParts(-2_500_000, 'base')).toEqual({ number: '-2.5', suffix: 'M' })
    expect(formatCompact(415_130_000)).toBe('$415.1M')
  })
})

describe('列表里的量与金额（TradingView 涨幅榜的写法）', () => {
  it('K / M / B 两位小数，数字与单位之间空一格；小数不进位到下一档之外', () => {
    expect(formatVolume(835_490)).toBe('835.49 K')
    expect(formatVolume(2_950_000)).toBe('2.95 M')
    expect(formatVolume(7_290_000_000)).toBe('7.29 B')
    expect(formatVolume(520_000_000)).toBe('520.00 M')
  })

  it('不到 1,000 取整照写，负数前加负号', () => {
    expect(formatVolume(0)).toBe('0')
    expect(formatVolume(412.6)).toBe('413')
    expect(formatVolume(-2_950_000)).toBe('-2.95 M')
  })
})

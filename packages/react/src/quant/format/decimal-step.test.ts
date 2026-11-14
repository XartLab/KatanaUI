// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { stepDecimal } from './decimal-step.ts'

describe('stepDecimal：十进制字符串走一格', () => {
  it('不经浮点：0.1 + 0.1 是 0.2，0.1 + 0.2 的格子也是精确的', () => {
    expect(stepDecimal('0.1', null, '0.1', 1)).toBe('0.2')
    expect(stepDecimal('0.2', null, '0.1', 1)).toBe('0.3')
    expect(stepDecimal('0.3', null, '0.1', -1)).toBe('0.2')
    expect(stepDecimal('0.1', null, '0.2', 1)).toBe('0.2')
  })
  it('空框从参考价起，不在格子上的先对齐，走不到 0 以下', () => {
    expect(stepDecimal('', '100.05', '0.1', 1)).toBe('100.1')
    expect(stepDecimal('', '100.05', '0.1', -1)).toBe('100')
    expect(stepDecimal('', '100.1', '0.1', 1)).toBe('100.2')
    expect(stepDecimal('', '100', '1', -1)).toBe('99')
    expect(stepDecimal('100.1', null, '0.1', 1)).toBe('100.2')
    expect(stepDecimal('100.13', null, '0.1', 1)).toBe('100.2')
    expect(stepDecimal('100.13', null, '0.1', -1)).toBe('100.1')
    expect(stepDecimal('67000.3', null, '0.5', 1)).toBe('67000.5')
    expect(stepDecimal('0.01', null, '0.01', -1)).toBeNull()
    expect(stepDecimal('', null, '1', 1)).toBeNull()
    expect(stepDecimal('abc', null, '0.01', 1)).toBeNull()
    expect(stepDecimal('5', null, 'x', 1)).toBeNull()
    expect(stepDecimal('5', null, '0', 1)).toBe('6')
  })
  it('multiplier：Shift 十格；不在格子上时先对齐再补足', () => {
    expect(stepDecimal('100', null, '0.5', 1, 10)).toBe('105')
    expect(stepDecimal('100', null, '0.5', -1, 10)).toBe('95')
    expect(stepDecimal('100.2', null, '0.5', 1, 10)).toBe('105')
    expect(stepDecimal('100.2', null, '0.5', -1, 10)).toBe('95.5')
    expect(stepDecimal('3', null, '1', -1, 10)).toBeNull()
  })
  it('超长小数也精确，不出科学计数', () => {
    expect(stepDecimal('0.00000001', null, '0.00000001', 1)).toBe('0.00000002')
    expect(stepDecimal('1', null, '0.00000001', -1)).toBe('0.99999999')
  })
})

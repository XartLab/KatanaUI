// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import { scrubSnap, scrubValueAt } from './scrubber.tsx'

describe('scrubSnap', () => {
  it('夹进范围并吸附到步长', () => {
    expect(scrubSnap(7, 0, 100, 10)).toBe(10)
    expect(scrubSnap(-5, 0, 100, 10)).toBe(0)
    expect(scrubSnap(130, 0, 100, 10)).toBe(100)
  })
  it('去掉浮点尾巴', () => {
    expect(scrubSnap(0.30000000000000004, 0, 1, 0.1)).toBe(0.3)
  })
})
describe('scrubValueAt', () => {
  it('横坐标换成值，宽为 0 返回 null', () => {
    expect(scrubValueAt(50, 100, 0, 1000, 10)).toBe(500)
    expect(scrubValueAt(-20, 100, 0, 1000, 10)).toBe(0)
    expect(scrubValueAt(10, 0, 0, 1000, 10)).toBeNull()
  })
})

// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { defaultScaleMax, marginLevel, marginRatioOf, riskBands, riskPosition } from './account-equity-model.ts'

const higher = { warn: 50, danger: 80 }
const lower = { warn: 200, danger: 120, direction: 'lower' } as const

describe('marginRatioOf', () => {
  it('已用保证金占权益的百分比', () => {
    expect(marginRatioOf(25, 100)).toBeCloseTo(25)
  })
  it('权益不是正数是 null', () => {
    expect(marginRatioOf(25, 0)).toBeNull()
    expect(marginRatioOf(25, -5)).toBeNull()
    expect(marginRatioOf(Number.NaN, 100)).toBeNull()
  })
})

describe('marginLevel（越高越危险）', () => {
  it('分三档，阈值上的值算更危险的一档', () => {
    expect(marginLevel(49.9, higher)).toBe('safe')
    expect(marginLevel(50, higher)).toBe('warn')
    expect(marginLevel(79.9, higher)).toBe('warn')
    expect(marginLevel(80, higher)).toBe('danger')
    expect(marginLevel(130, higher)).toBe('danger')
  })
  it('没有比率是 null', () => {
    expect(marginLevel(null, higher)).toBeNull()
    expect(marginLevel(Number.NaN, higher)).toBeNull()
  })
})

describe('marginLevel（越低越危险）', () => {
  it('维持保证金率口径：低于阈值才危险', () => {
    expect(marginLevel(250, lower)).toBe('safe')
    expect(marginLevel(200, lower)).toBe('warn')
    expect(marginLevel(121, lower)).toBe('warn')
    expect(marginLevel(120, lower)).toBe('danger')
    expect(marginLevel(80, lower)).toBe('danger')
  })
})

describe('riskBands', () => {
  it('越高越危险：安全、警告、危险依次排开，首尾相接', () => {
    expect(riskBands(higher, 120)).toEqual([
      { level: 'safe', from: 0, to: 50 },
      { level: 'warn', from: 50, to: 80 },
      { level: 'danger', from: 80, to: 120 },
    ])
  })
  it('越低越危险：危险在低端', () => {
    expect(riskBands(lower, 400)).toEqual([
      { level: 'danger', from: 0, to: 120 },
      { level: 'warn', from: 120, to: 200 },
      { level: 'safe', from: 200, to: 400 },
    ])
  })
  it('阈值超出刻度时夹在刻度内', () => {
    const bands = riskBands(higher, 60)
    expect(bands[1]).toEqual({ level: 'warn', from: 50, to: 60 })
    expect(bands[2]).toEqual({ level: 'danger', from: 60, to: 60 })
  })
})

describe('riskPosition / defaultScaleMax', () => {
  it('指针位置按刻度归一，越界贴边', () => {
    expect(riskPosition(60, 120)).toBeCloseTo(0.5)
    expect(riskPosition(500, 120)).toBe(1)
    expect(riskPosition(-5, 120)).toBe(0)
    expect(riskPosition(null, 120)).toBeNull()
    expect(riskPosition(10, 0)).toBeNull()
  })
  it('缺省刻度上限', () => {
    expect(defaultScaleMax(higher)).toBe(120)
    expect(defaultScaleMax(lower)).toBe(400)
  })
})

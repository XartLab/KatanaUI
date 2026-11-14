// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { matchPreset, presetRange } from './date-range-model.ts'

describe('presetRange', () => {
  // 2026-11-14 是周六。
  it('截至今天：今天、本周（周一起）、本月、年初至今', () => {
    expect(presetRange('today', '2026-11-14')).toEqual({ start: '2026-11-14', end: '2026-11-14' })
    expect(presetRange('week', '2026-11-14')).toEqual({ start: '2026-11-09', end: '2026-11-14' })
    expect(presetRange('month', '2026-11-14')).toEqual({ start: '2026-11-01', end: '2026-11-14' })
    expect(presetRange('ytd', '2026-11-14')).toEqual({ start: '2026-01-01', end: '2026-11-14' })
  })
  it('周一当天本周就是一天；周日起始时本周从周日起；跨月、跨年', () => {
    expect(presetRange('week', '2026-11-09')).toEqual({ start: '2026-11-09', end: '2026-11-09' })
    expect(presetRange('week', '2026-11-14', 'sun')).toEqual({ start: '2026-11-08', end: '2026-11-14' })
    expect(presetRange('week', '2026-01-01')).toEqual({ start: '2025-12-29', end: '2026-01-01' })
  })
  it('today 不合法是 null', () => {
    expect(presetRange('today', '2026-13-40')).toBeNull()
    expect(presetRange('today', '')).toBeNull()
  })
})

describe('matchPreset', () => {
  it('认出预设；不是预设是 null；1 号时今天优先于本月', () => {
    expect(matchPreset({ start: '2026-11-09', end: '2026-11-14' }, '2026-11-14')).toBe('week')
    expect(matchPreset({ start: '2026-11-02', end: '2026-11-14' }, '2026-11-14')).toBeNull()
    expect(matchPreset(null, '2026-11-14')).toBeNull()
    expect(matchPreset({ start: '2026-11-01', end: '2026-11-01' }, '2026-11-01')).toBe('today')
  })
})

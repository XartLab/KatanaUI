// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  canApplyRange,
  formatDays,
  matchPreset,
  NO_PICK,
  presetRange,
  rangeDays,
  rangeStatus,
} from './date-range-model.ts'

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

describe('rangeDays', () => {
  it('含首尾按日历日算：同一天是 1，跨月、跨年、闰日都对', () => {
    expect(rangeDays({ start: '2026-12-07', end: '2026-12-07' })).toBe(1)
    expect(rangeDays({ start: '2026-12-07', end: '2026-12-18' })).toBe(12)
    expect(rangeDays({ start: '2026-11-28', end: '2026-12-03' })).toBe(6)
    expect(rangeDays({ start: '2025-12-31', end: '2026-01-01' })).toBe(2)
    expect(rangeDays({ start: '2028-02-28', end: '2028-03-01' })).toBe(3)
  })
  it('空、不合法、起点晚于终点都是 0', () => {
    expect(rangeDays(null)).toBe(0)
    expect(rangeDays({ start: '2026-12-18', end: '2026-12-07' })).toBe(0)
    expect(rangeDays({ start: 'x', end: '2026-12-07' })).toBe(0)
  })
})

describe('rangeStatus 与 canApplyRange', () => {
  const draft = { start: '2026-11-09', end: '2026-11-14' }
  it('还没点：选第一天，应用禁用', () => {
    expect(rangeStatus(null, NO_PICK)).toEqual({ kind: 'first' })
    expect(canApplyRange(null, NO_PICK)).toBe(false)
  })
  it('点了起点：已选 1 天；悬停到 18 号：12 天；都不能应用', () => {
    const one = { anchor: '2026-12-07', preview: { start: '2026-12-07', end: '2026-12-07' } }
    const hover = { anchor: '2026-12-07', preview: { start: '2026-12-07', end: '2026-12-18' } }
    expect(rangeStatus(null, one)).toEqual({ kind: 'days', days: 1 })
    expect(rangeStatus(null, hover)).toEqual({ kind: 'days', days: 12 })
    expect(canApplyRange(null, hover)).toBe(false)
  })
  it('悬停在起点之前也按区间算；拿不到预览时当 1 天', () => {
    expect(rangeStatus(null, { anchor: '2026-12-07', preview: { start: '2026-12-01', end: '2026-12-07' } })).toEqual({
      kind: 'days',
      days: 7,
    })
    expect(rangeStatus(null, { anchor: '2026-12-07', preview: null })).toEqual({ kind: 'days', days: 1 })
  })
  it('点了终点：看草稿，应用可点', () => {
    expect(rangeStatus(draft, NO_PICK)).toEqual({ kind: 'days', days: 6 })
    expect(canApplyRange(draft, NO_PICK)).toBe(true)
  })
  it('草稿已有、又在半途重挑：以挑选为准，应用禁用', () => {
    const pick = { anchor: '2026-11-20', preview: { start: '2026-11-20', end: '2026-11-20' } }
    expect(rangeStatus(draft, pick)).toEqual({ kind: 'days', days: 1 })
    expect(canApplyRange(draft, pick)).toBe(false)
  })
})

describe('formatDays', () => {
  it('字符串换 {days}，函数形式交给调用方处理复数', () => {
    expect(formatDays('{days} days selected', 12)).toBe('12 days selected')
    expect(formatDays((n) => (n === 1 ? '1 day selected' : `${n} days selected`), 1)).toBe('1 day selected')
    expect(formatDays((n) => (n === 1 ? '1 day selected' : `${n} days selected`), 3)).toBe('3 days selected')
  })
})

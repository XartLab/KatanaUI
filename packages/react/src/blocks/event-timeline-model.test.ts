// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { clock, dayKey, groupByDay, type TimelineEvent } from './event-timeline-model'

const at = (iso: string) => Date.parse(iso)

describe('dayKey / clock', () => {
  it('同一刻在不同时区落在不同的天', () => {
    const t = at('2026-11-13T17:30:00Z')
    expect(dayKey(t, 'UTC')).toBe('2026-11-13')
    expect(dayKey(t, 'Asia/Shanghai')).toBe('2026-11-14')
    expect(dayKey(t, 'America/New_York')).toBe('2026-11-13')
    expect(clock(t, 'Asia/Shanghai')).toBe('01:30:00')
    expect(clock(t, 'UTC')).toBe('17:30:00')
  })
  it('午夜是 00:00:00 不是 24:00:00', () => {
    expect(clock(at('2026-11-13T16:00:00Z'), 'Asia/Shanghai')).toBe('00:00:00')
  })
})

describe('groupByDay', () => {
  const ev = (id: string, iso: string): TimelineEvent => ({ id, at: at(iso), title: id })
  it('天与天、同一天里都是新的在前，按显示时区分天', () => {
    const groups = groupByDay(
      [
        ev('old', '2026-11-12T03:00:00Z'),
        ev('late', '2026-11-13T17:30:00Z'), // 上海已是 11-14
        ev('mid', '2026-11-13T02:00:00Z'),
        ev('new', '2026-11-14T01:00:00Z'),
      ],
      'Asia/Shanghai',
    )
    expect(groups.map((g) => [g.day, g.events.map((e) => e.id)])).toEqual([
      ['2026-11-14', ['new', 'late']],
      ['2026-11-13', ['mid']],
      ['2026-11-12', ['old']],
    ])
  })
  it('同一刻保持传入的先后；空输入是空', () => {
    const same = [ev('a', '2026-11-14T01:00:00Z'), ev('b', '2026-11-14T01:00:00Z')]
    expect(groupByDay(same, 'UTC')[0]!.events.map((e) => e.id)).toEqual(['a', 'b'])
    expect(groupByDay([], 'UTC')).toEqual([])
  })
  it('不改传进来的数组', () => {
    const input = [ev('a', '2026-11-13T01:00:00Z'), ev('b', '2026-11-14T01:00:00Z')]
    groupByDay(input, 'UTC')
    expect(input.map((e) => e.id)).toEqual(['a', 'b'])
  })
})

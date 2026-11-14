// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  GAP_FRACTION,
  clock,
  clusterMarkers,
  dayKey,
  dayMinuteToTime,
  fractionToMinute,
  gapBands,
  minuteOfDay,
  minuteToFraction,
  type SessionMinutes,
  type TimelineEvent,
} from './event-timeline-model'

const at = (iso: string) => Date.parse(iso)
const CN: SessionMinutes = [
  [570, 690],
  [780, 900],
]

describe('dayKey / clock / minuteOfDay', () => {
  it('同一刻在不同时区落在不同的天', () => {
    const t = at('2026-11-13T17:30:00Z')
    expect(dayKey(t, 'Asia/Shanghai')).toBe('2026-11-14')
    expect(dayKey(t, 'America/New_York')).toBe('2026-11-13')
    expect(clock(t, 'Asia/Shanghai')).toBe('01:30:00')
  })
  it('午夜是 00:00:00 不是 24:00:00；分钟数含秒', () => {
    expect(clock(at('2026-11-13T16:00:00Z'), 'Asia/Shanghai')).toBe('00:00:00')
    expect(minuteOfDay(at('2026-11-13T01:30:30Z'), 'Asia/Shanghai')).toBeCloseTo(570.5, 6)
  })
  it('dayMinuteToTime 是 minuteOfDay 的反函数', () => {
    const t = dayMinuteToTime('2026-11-13', 600, 'Asia/Shanghai')
    expect(t).toBe(at('2026-11-13T02:00:00Z'))
    expect(minuteOfDay(t, 'Asia/Shanghai')).toBe(600)
    expect(dayKey(dayMinuteToTime('2026-11-13', 30, 'Asia/Shanghai'), 'Asia/Shanghai')).toBe('2026-11-13')
  })
})

describe('轴：交易时段与压缩的午休', () => {
  it('开盘 0、收盘 1，时段外钳到边', () => {
    expect(minuteToFraction(570, CN)).toBe(0)
    expect(minuteToFraction(900, CN)).toBeCloseTo(1, 9)
    expect(minuteToFraction(500, CN)).toBe(0)
    expect(minuteToFraction(1000, CN)).toBe(1)
  })
  it('午休只占 GAP_FRACTION，上午下午各按分钟数等比', () => {
    const [band] = gapBands(CN)
    expect(band!.to - band!.from).toBeCloseTo(GAP_FRACTION, 9)
    expect(minuteToFraction(690, CN)).toBeCloseTo((1 - GAP_FRACTION) / 2, 9)
    expect(minuteToFraction(780, CN)).toBeCloseTo((1 - GAP_FRACTION) / 2 + GAP_FRACTION, 9)
    expect(minuteToFraction(735, CN)).toBeGreaterThan(minuteToFraction(690, CN))
    expect(minuteToFraction(735, CN)).toBeLessThan(minuteToFraction(780, CN))
  })
  it('位置与分钟互为反函数（时段内）', () => {
    for (const m of [570, 600, 689, 781, 840, 899]) {
      expect(fractionToMinute(minuteToFraction(m, CN), CN)).toBeCloseTo(m, 6)
    }
  })
  it('单段时段没有空档', () => {
    expect(gapBands([[0, 1440]])).toEqual([])
    expect(minuteToFraction(720, [[0, 1440]])).toBeCloseTo(0.5, 9)
  })
})

describe('clusterMarkers', () => {
  const ev = (id: string, iso: string, kind: TimelineEvent['kind'] = 'fill'): TimelineEvent => ({
    id,
    at: at(iso),
    kind,
    label: id,
  })
  it('同一分钟聚成一个，类别按优先级（异动 > 警报 > 成交 > run > 公告）', () => {
    const markers = clusterMarkers(
      [
        ev('a', '2026-11-13T01:43:05Z'),
        ev('b', '2026-11-13T01:43:40Z', 'anomaly'),
        ev('c', '2026-11-13T01:44:00Z', 'notice'),
      ],
      'Asia/Shanghai',
      CN,
    )
    expect(markers.map((m) => [m.events.map((e) => e.id), m.kind])).toEqual([
      [['a', 'b'], 'anomaly'],
      [['c'], 'notice'],
    ])
  })
  it('超过上限就把桶加倍再聚，直到放得下；事件一个不丢', () => {
    const events = Array.from({ length: 120 }, (_, i) =>
      ev(`e${i}`, new Date(at('2026-11-13T01:30:00Z') + i * 60_000).toISOString()),
    )
    const markers = clusterMarkers(events, 'Asia/Shanghai', CN, 60)
    expect(markers.length).toBeLessThanOrEqual(60)
    expect(markers.reduce((n, m) => n + m.events.length, 0)).toBe(120)
  })
  it('空输入没有标记；标记按时间升序给出位置', () => {
    expect(clusterMarkers([], 'Asia/Shanghai', CN)).toEqual([])
    const xs = clusterMarkers(
      [ev('late', '2026-11-13T06:00:00Z'), ev('early', '2026-11-13T01:40:00Z')],
      'Asia/Shanghai',
      CN,
    ).map((m) => m.x)
    expect(xs[0]!).toBeLessThan(xs[1]!)
  })
})

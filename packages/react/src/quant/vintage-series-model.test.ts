// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import { knownAt, knownValue, normalizeVintages, revisionStats, vintageExtent } from './vintage-series-model.ts'

// 虚构数据：统计期用 1、2、3 代替时间戳，发布时刻用 10、20…… 代替。
const ROWS = normalizeVintages([
  {
    period: 2,
    releases: [
      { at: 40, value: 2.2 },
      { at: 25, value: 2 },
    ],
  },
  { period: 1, releases: [{ at: 10, value: 1 }] },
  {
    period: 3,
    releases: [
      { at: 50, value: 3 },
      { at: 60, value: 2.5 },
      { at: 70, value: 2.9 },
      { at: 71, value: Number.NaN },
    ],
  },
  { period: 4, releases: [] },
])

describe('normalizeVintages', () => {
  it('统计期从旧到新，发布值按时刻排，丢掉空期与非有限数', () => {
    expect(ROWS.map((row) => row.period)).toEqual([1, 2, 3])
    expect(ROWS[1]!.steps.map((step) => step.at)).toEqual([25, 40])
    expect(ROWS[2]!.steps).toHaveLength(3)
  })
  it('每一步写相对上一次的变化，首次是 null；修订 = 最新 − 首次，只发布过一次是 null 而不是 0', () => {
    const deltas = ROWS[2]!.steps.map((step) => step.delta)
    expect(deltas[0]).toBeNull()
    expect(deltas[1]).toBeCloseTo(-0.5)
    expect(deltas[2]).toBeCloseTo(0.4)
    expect(ROWS[2]!.revision).toBeCloseTo(-0.1)
    expect(ROWS[1]!.revision).toBeCloseTo(0.2)
    expect(ROWS[0]!.revision).toBeNull()
  })
  it('同一统计期给两次会合并', () => {
    const merged = normalizeVintages([
      { period: 1, releases: [{ at: 1, value: 1 }] },
      { period: 1, releases: [{ at: 2, value: 3 }] },
    ])
    expect(merged).toHaveLength(1)
    expect(merged[0]!.revision).toBe(2)
  })
})

describe('knownAt / knownValue', () => {
  it('截至某一刻只用当时已发布的：发布前不存在，修订前是旧值', () => {
    const third = ROWS[2]!
    expect(knownAt(third, 49)).toBeNull()
    expect(knownAt(third, 55)!.value).toBe(3)
    expect(knownAt(third, 65)!.value).toBe(2.5)
    expect(knownAt(third, 1000)!.value).toBe(2.9)
  })
  it('不给 asOf 取首次发布值；给了按 asOf', () => {
    expect(knownValue(ROWS[2]!)!.value).toBe(3)
    expect(knownValue(ROWS[2]!, 65)!.value).toBe(2.5)
    expect(knownValue(ROWS[2]!, 10)).toBeNull()
  })
})

describe('revisionStats / vintageExtent', () => {
  it('只统计修订过的期：平均绝对修订、方向偏差、最大一次', () => {
    const stats = revisionStats(ROWS)
    expect(stats.revised).toBe(2)
    expect(stats.meanAbs).toBeCloseTo(0.15)
    expect(stats.bias).toBeCloseTo(0.05)
    expect(stats.largest).toEqual({ period: 2, revision: ROWS[1]!.revision })
    expect(revisionStats([ROWS[0]!])).toEqual({ revised: 0, meanAbs: null, bias: null, largest: null })
  })
  it('纵向范围把中间的发布值也包进去', () => {
    expect(vintageExtent(ROWS)).toEqual([1, 3])
    expect(vintageExtent([])).toEqual([0, 1])
  })
})

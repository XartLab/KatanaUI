// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  DEFAULT_PERIODS,
  alignedAxes,
  basisOf,
  formatClock,
  formatPercentTick,
  hasData,
  lastFinite,
  longShare,
  longShortRatioOf,
  signedBars,
  symmetricAxis,
  timeLabelIndexes,
} from './derivatives-model.ts'

describe('hasData：卡有没有东西可画', () => {
  it('没给、空序列、全是缺失值都是空态', () => {
    expect(hasData('fundingRate', undefined)).toBe(false)
    expect(hasData('fundingRate', null)).toBe(false)
    expect(hasData('fundingRate', [])).toBe(false)
    expect(
      hasData('fundingRate', [
        { time: 1, rate: null },
        { time: 2, rate: Number.NaN },
      ]),
    ).toBe(false)
    expect(hasData('basis', [{ time: 1, contract: null, index: undefined }])).toBe(false)
  })
  it('有一个点有有限值就不是空态，0 也算数', () => {
    expect(
      hasData('fundingRate', [
        { time: 1, rate: null },
        { time: 2, rate: 0 },
      ]),
    ).toBe(true)
    expect(hasData('openInterestVolume', [{ time: 1, openInterest: null, volume: 3 }])).toBe(true)
  })
})

describe('alignedAxes：左右双轴共用网格', () => {
  it('两边刻度个数相同，少的那边按整步往上补，仍盖得住数据', () => {
    const [left, right] = alignedAxes([0, 1500], [51000, 54000], 4)
    expect(left.ticks).toHaveLength(right.ticks.length)
    expect(left.domain[0]).toBeLessThanOrEqual(0)
    expect(left.domain[1]).toBeGreaterThanOrEqual(1500)
    expect(right.domain[0]).toBeLessThanOrEqual(51000)
    expect(right.domain[1]).toBeGreaterThanOrEqual(54000)
  })
  it('补出来的刻度间隔等于原来的步长', () => {
    const [, right] = alignedAxes([0, 1000], [0, 10], 4)
    const steps = right.ticks.slice(1).map((tick, i) => +(tick - right.ticks[i]!).toFixed(8))
    expect(new Set(steps).size).toBe(1)
  })
  it('lockLeft：左轴（百分比）不动，右轴放粗到放得下再补', () => {
    const [left, right] = alignedAxes([0, 100], [0.8, 3.7], 5, true)
    expect(left.domain).toEqual([0, 100])
    expect(right.ticks).toHaveLength(left.ticks.length)
    expect(right.domain[0]).toBeLessThanOrEqual(0.8)
    expect(right.domain[1]).toBeGreaterThanOrEqual(3.7)
  })
  it('lockLeft：右轴刻度比左轴多时放粗到跟左轴一样多，右轴的字落在左轴的网格线上，数据盖得住', () => {
    const [left, right] = alignedAxes([0, 100], [0.8, 3.7], 3, true)
    expect(left.ticks).toEqual([0, 50, 100])
    // 不锁左轴时右轴要 8 档以上；锁了之后只能放粗到 3 档
    expect(alignedAxes([0, 100], [0.8, 3.7], 5)[1].ticks.length).toBeGreaterThan(left.ticks.length)
    expect(right.ticks).toHaveLength(left.ticks.length)
    const step = (right.domain[1] - right.domain[0]) / (right.ticks.length - 1)
    right.ticks.forEach((tick, i) => expect(tick).toBeCloseTo(right.domain[0] + step * i, 8))
    expect(right.domain[0]).toBeLessThanOrEqual(0.8)
    expect(right.domain[1]).toBeGreaterThanOrEqual(3.7)
  })
  it('lockLeft：左轴只有两档、右轴跨过零点，整步凑不齐，就在数据范围里均分，仍不多于左轴、不切数据', () => {
    const [left, right] = alignedAxes([0, 1], [-0.1, 1.1], 2, true)
    expect(left.ticks).toHaveLength(2)
    expect(right.ticks).toEqual([-0.1, 1.1])
    expect(right.domain).toEqual([-0.1, 1.1])
  })
  it('右轴的数据一样高也不崩（上下各留 1）', () => {
    const [, right] = alignedAxes([0, 10], [5, 5], 4)
    expect(right.domain[0]).toBeLessThan(5)
    expect(right.domain[1]).toBeGreaterThan(5)
  })
})

describe('symmetricAxis：以零为中心', () => {
  it('盖住最大绝对值，刻度对称且含 0', () => {
    const axis = symmetricAxis([0.012, -0.03, null, undefined, 0.01], 5)
    expect(axis.domain[0]).toBe(-axis.domain[1])
    expect(axis.domain[1]).toBeGreaterThanOrEqual(0.03)
    expect(axis.ticks).toContain(0)
  })
  it('全空或全零给 ±1', () => {
    expect(symmetricAxis([], 5).domain).toEqual([-1, 1])
    expect(symmetricAxis([0, 0], 5).domain).toEqual([-1, 1])
  })
})

describe('signedBars：正负分色', () => {
  it('正数 up、负数 down、零 flat，缺失值没有柱', () => {
    expect(signedBars([0.01, -0.02, 0, null, undefined, Number.NaN])).toEqual([
      { index: 0, value: 0.01, tone: 'up' },
      { index: 1, value: -0.02, tone: 'down' },
      { index: 2, value: 0, tone: 'flat' },
    ])
  })
})

describe('多空占比与比值', () => {
  it('longShare 是多头占 0 到 1；缺值、负数、两边零给 null', () => {
    expect(longShare({ long: 3, short: 1 })).toBe(0.75)
    expect(longShare({ long: 0, short: 5 })).toBe(0)
    expect(longShare({ long: 0, short: 0 })).toBeNull()
    expect(longShare({ long: null, short: 1 })).toBeNull()
    expect(longShare({ long: -1, short: 2 })).toBeNull()
  })
  it('longShortRatioOf 是多 / 空；空头不是正数给 null', () => {
    expect(longShortRatioOf({ long: 3, short: 2 })).toBe(1.5)
    expect(longShortRatioOf({ long: 3, short: 0 })).toBeNull()
    expect(longShortRatioOf({ long: undefined, short: 2 })).toBeNull()
  })
})

describe('basisOf 与小工具', () => {
  it('基差是合约价减指数价，缺一个给 null', () => {
    expect(basisOf({ contract: 67025, index: 67000 })).toBe(25)
    expect(basisOf({ contract: 66990, index: 67000 })).toBe(-10)
    expect(basisOf({ contract: null, index: 67000 })).toBeNull()
  })
  it('lastFinite 从后往前找有限值', () => {
    expect(lastFinite([1, 2, null, Number.NaN])).toBe(2)
    expect(lastFinite([null])).toBeNull()
  })
  it('formatPercentTick 带符号、去尾零；formatClock 是 UTC', () => {
    expect(formatPercentTick(0.01)).toBe('+0.01%')
    expect(formatPercentTick(-0.0253)).toBe('-0.0253%')
    expect(formatPercentTick(0)).toBe('0%')
    expect(formatClock(Date.UTC(2026, 10, 24, 5, 7))).toBe('11-24 05:07')
  })
  it('timeLabelIndexes：头、中、尾；短序列去重', () => {
    expect(timeLabelIndexes(24)).toEqual([0, 11, 23])
    expect(timeLabelIndexes(2)).toEqual([0, 1])
    expect(timeLabelIndexes(1)).toEqual([0])
    expect(timeLabelIndexes(0)).toEqual([])
  })
  it('资金费率默认只有近 7 / 14 天', () => {
    expect(DEFAULT_PERIODS.fundingRate).toEqual(['7d', '14d'])
  })
})

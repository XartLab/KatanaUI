// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { segmentGraphemes, splitLines, staggerStep } from './split.ts'

describe('staggerStep', () => {
  it('forward 就是下标', () => {
    expect([0, 1, 2, 3].map((i) => staggerStep(i, 4, 'forward'))).toEqual([0, 1, 2, 3])
  })
  it('center：中间最先，两端最后', () => {
    expect([0, 1, 2, 3, 4].map((i) => staggerStep(i, 5, 'center'))).toEqual([2, 1, 0, 1, 2])
  })
  it('edges：两端最先，中间最后', () => {
    expect([0, 1, 2, 3, 4].map((i) => staggerStep(i, 5, 'edges'))).toEqual([0, 1, 2, 1, 0])
  })
})

describe('segmentGraphemes / splitLines', () => {
  it('emoji 与带音标的字不被劈开', () => {
    expect(segmentGraphemes('a👍🏽é')).toHaveLength(3)
  })
  it('lines 优先于文字', () => {
    expect(splitLines('a\nb', ['x'])).toEqual(['x'])
    expect(splitLines('a\nb', undefined)).toEqual(['a', 'b'])
    expect(splitLines(undefined, undefined)).toEqual([])
  })
})

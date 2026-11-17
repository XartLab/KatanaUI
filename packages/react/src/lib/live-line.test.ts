// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { easeOf, lerpPoints, lineGrowth, padPoints } from './live-line.ts'
import { parseReadout } from './live-readout.tsx'

describe('走势线延伸的纯函数', () => {
  it('lineGrowth：末尾追加与窗口左移才算延伸，换区间、重算不算', () => {
    expect(lineGrowth([1, 2, 3], [1, 2, 3, 4])).toBe('append')
    expect(lineGrowth([1, 2, 3], [2, 3, 4])).toBe('slide')
    expect(lineGrowth([1, 2, 3], [9, 9, 9])).toBeNull()
    expect(lineGrowth([1, 2, 3], [1, 2, 3])).toBeNull()
    expect(lineGrowth([1], [1, 2])).toBeNull()
  })

  it('padPoints 用最后一点补齐，lerpPoints 按 t 插值', () => {
    expect(
      padPoints(
        [
          [0, 0],
          [10, 4],
        ],
        3,
      ),
    ).toEqual([
      [0, 0],
      [10, 4],
      [10, 4],
    ])
    expect(
      lerpPoints(
        [
          [0, 0],
          [10, 10],
        ],
        [
          [10, 20],
          [20, 30],
        ],
        0.5,
      ),
    ).toEqual([
      [5, 10],
      [15, 20],
    ])
  })

  it('easeOf 读 linear() 缓动：端点 0 与 1，中间按停靠点线性；读不出来就线性', () => {
    const ease = easeOf('linear(0, 0.5, 1)')
    expect(ease(0)).toBe(0)
    expect(ease(0.25)).toBeCloseTo(0.25)
    expect(ease(0.5)).toBeCloseTo(0.5)
    expect(ease(1)).toBe(1)
    expect(easeOf('')(0.3)).toBe(0.3)
  })
})

describe('parseReadout：读数文字开头的数', () => {
  it('吃掉币种符号、千分位、正负号与后缀', () => {
    expect(parseReadout('1,284.50')).toBe(1284.5)
    expect(parseReadout('+1.20%')).toBe(1.2)
    expect(parseReadout('−3.1%')).toBe(-3.1)
    expect(parseReadout('¥ 12.5万')).toBe(12.5)
    expect(parseReadout('2.42M')).toBe(2.42)
    expect(parseReadout(7)).toBe(7)
  })
  it('取不出数就是 null', () => {
    expect(parseReadout('—')).toBeNull()
    expect(parseReadout('已断开')).toBeNull()
    expect(parseReadout(null)).toBeNull()
    expect(parseReadout(Number.NaN)).toBeNull()
  })
})

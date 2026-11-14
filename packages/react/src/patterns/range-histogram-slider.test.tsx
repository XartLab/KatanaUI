// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import {
  histogramBins,
  moveThumb,
  nearestThumb,
  ratioOf,
  snapValue,
  stepValue,
  valueAt,
} from './range-histogram-model.ts'
import { RangeHistogramSlider } from './range-histogram-slider.tsx'

describe('histogramBins', () => {
  it('等宽分箱，最后一箱含 max，范围外与非有限数丢掉', () => {
    expect(histogramBins([0, 1, 2, 3, 4, 5, 10, -1, 11, NaN], 0, 10, 5)).toEqual([2, 2, 2, 0, 1])
  })
  it('空范围与零箱不炸', () => {
    expect(histogramBins([1], 5, 5, 3)).toEqual([0, 0, 0])
    expect(histogramBins([1], 0, 10, 0)).toEqual([])
  })
})

describe('snapValue 与位置互换', () => {
  it('取整到步长并夹住，浮点误差按步长小数位收掉', () => {
    expect(snapValue(0.34, 0, 1, 0.1)).toBe(0.3)
    expect(snapValue(7.2, 0, 10, 5)).toBe(5)
    expect(snapValue(-3, 0, 10, 1)).toBe(0)
    expect(snapValue(99, 0, 10, 1)).toBe(10)
  })
  it('ratioOf 与 valueAt 互为逆，越界夹住', () => {
    expect(ratioOf(25, 0, 100)).toBe(0.25)
    expect(valueAt(0.25, 0, 100)).toBe(25)
    expect(ratioOf(-5, 0, 100)).toBe(0)
    expect(valueAt(2, 0, 100)).toBe(100)
  })
})

describe('把手', () => {
  it('nearestThumb：近的动；一样近时看落在哪一侧', () => {
    expect(nearestThumb(0.1, 0.2, 0.8)).toBe('low')
    expect(nearestThumb(0.7, 0.2, 0.8)).toBe('high')
    expect(nearestThumb(0.5, 0.25, 0.75)).toBe('high')
    expect(nearestThumb(0.1, 0.5, 0.5)).toBe('low')
  })
  it('moveThumb：两个把手不交叉', () => {
    expect(moveThumb([2, 8], 'low', 9)).toEqual([8, 8])
    expect(moveThumb([2, 8], 'high', 1)).toEqual([2, 2])
    expect(moveThumb([2, 8], 'low', 4)).toEqual([4, 8])
  })
  it('stepValue：方向键一步、Page 十步、Home / End 去端点、其他键 null', () => {
    expect(stepValue(5, 'ArrowRight', 0, 100, 1)).toBe(6)
    expect(stepValue(5, 'ArrowDown', 0, 100, 1)).toBe(4)
    expect(stepValue(5, 'PageUp', 0, 100, 1)).toBe(15)
    expect(stepValue(5, 'PageDown', 0, 100, 1)).toBe(0)
    expect(stepValue(5, 'Home', 0, 100, 1)).toBe(0)
    expect(stepValue(5, 'End', 0, 100, 1)).toBe(100)
    expect(stepValue(5, 'x', 0, 100, 1)).toBeNull()
  })
})

describe('RangeHistogramSlider', () => {
  const html = renderToStaticMarkup(
    <RangeHistogramSlider
      counts={[1, 4, 8, 4, 1]}
      min={0}
      max={100}
      defaultValue={[20, 60]}
      labels={{ low: '涨幅下限', high: '涨幅上限' }}
      label="涨幅"
      formatValue={(value) => `${value}%`}
    />,
  )
  it('两个 slider，各自带范围、当前值与可读值', () => {
    expect(html.match(/role="slider"/g)).toHaveLength(2)
    expect(html).toContain('aria-label="涨幅下限"')
    expect(html).toContain('aria-valuemin="0"')
    expect(html).toContain('aria-valuemax="60"')
    expect(html).toContain('aria-valuenow="20"')
    expect(html).toContain('aria-valuetext="60%"')
  })
  it('区间内的箱亮、区间外的暗，读数行写两端', () => {
    // 5 箱的中心在 10、30、50、70、90：区间 20 到 60 里是第 2、3 箱。
    expect(html.match(/data-in="true"/g)).toHaveLength(2)
    expect(html.match(/data-in="false"/g)).toHaveLength(3)
    expect(html).toContain('20% – 60%')
  })
})

// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { ValuationBand } from './valuation-band.tsx'
import {
  finiteValues,
  lastIndexWithValue,
  normalizePercentiles,
  valuationLevels,
  valuationPercentile,
  type ValuationPoint,
} from './valuation-band-model.ts'

// 估值带（#260）：示例数据（1 到 101 的 101 个点），不是行情。
const HISTORY: ValuationPoint[] = Array.from({ length: 101 }, (_, i) => ({ time: `T${i}`, value: 1 + i }))

describe('估值分位', () => {
  it('分位线按线性插值：1..101 的 20 / 50 / 80 分位是 21 / 51 / 81', () => {
    expect(valuationLevels(HISTORY).map((l) => [l.p, l.value])).toEqual([
      [20, 21],
      [50, 51],
      [80, 81],
    ])
    expect(valuationLevels(HISTORY, [90, 10, 10]).map((l) => l.p)).toEqual([10, 90])
  })

  it('分位只收 0–100 之间的有限数；缺值不进分位；一个有限值也没有就没有线', () => {
    expect(normalizePercentiles([0, 100, -5, Number.NaN, 25, 25, 75])).toEqual([25, 75])
    const gappy: ValuationPoint[] = [
      { time: 'a', value: 10 },
      { time: 'b', value: null },
      { time: 'c', value: Number.NaN },
      { time: 'd', value: 30 },
    ]
    expect(finiteValues(gappy)).toEqual([10, 30])
    expect(valuationLevels(gappy, [50])[0]!.value).toBe(20)
    expect(valuationLevels([{ time: 'a', value: null }])).toEqual([])
    expect(lastIndexWithValue(gappy)).toBe(3)
    expect(lastIndexWithValue([{ time: 'a', value: null }])).toBe(-1)
  })

  it('一个值的分位名次是历史里不大于它的点占的百分比（含自己）', () => {
    expect(valuationPercentile(HISTORY, 51)).toBeCloseTo((51 / 101) * 100, 10)
    expect(valuationPercentile(HISTORY, 101)).toBe(100)
    expect(valuationPercentile(HISTORY, 0)).toBe(0)
    expect(valuationPercentile(HISTORY, null)).toBeNull()
    expect(valuationPercentile([], 5)).toBeNull()
  })
})

describe('ValuationBand', () => {
  const render = (extra: Record<string, unknown> = {}) =>
    renderToStaticMarkup(<ValuationBand points={HISTORY} label="CSI 300 PE" {...extra} />)

  it('分位带 4 块（三条线隔出）、三条分位线与右边的标注；当前点标估值与分位', () => {
    const html = render()
    expect(html.match(/data-slot="valuation-bandfill"/g)).toHaveLength(4)
    expect(html.match(/data-slot="valuation-level"/g)).toHaveLength(3)
    expect(html).toMatch(/data-slot="valuation-ptick" data-p="20"[^>]*>P20 <b>21.00<\/b>/)
    // 当前点：最后一点 101，分位 100。
    expect(html).toContain('101.00 · P100')
    expect(html).toContain('Now 101.00, at percentile 100 of the history')
  })

  it('分位可配：给 [10, 90] 就两条线三块带；缺值断线，不当 0', () => {
    expect(render({ percentiles: [10, 90] }).match(/data-slot="valuation-level"/g)).toHaveLength(2)
    const gappy: ValuationPoint[] = [
      { time: 'a', value: 10 },
      { time: 'b', value: null },
      { time: 'c', value: 12 },
      { time: 'd', value: 14 },
    ]
    const html = renderToStaticMarkup(<ValuationBand points={gappy} label="PE" />)
    const path = /data-slot="valuation-line" d="([^"]+)"/.exec(html)![1]!
    expect(path.match(/M/g)).toHaveLength(2)
  })

  it('文字由调用方给：labels 与格式函数；没有数据写空态不画样本', () => {
    const html = render({
      formatValue: (value: number) => `${value.toFixed(1)}x`,
      labels: { percentile: (p: number) => `分位${p}`, current: (v: string, r: number) => `${v} 分位${Math.round(r)}` },
    })
    expect(html).toContain('分位20 <b>21.0x</b>')
    expect(html).toContain('101.0x 分位100')
    const empty = renderToStaticMarkup(<ValuationBand points={[{ time: 'a', value: null }]} label="PE" />)
    expect(empty).toContain('data-empty="true"')
    expect(empty).toContain('No data')
  })
})

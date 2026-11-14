// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { SlopeChart } from './slope-chart'
import { ranks, slopeLayout, spreadLabels } from './slope-model'

describe('ranks', () => {
  it('值大的排前，从 1 起；相同按输入顺序', () => {
    expect(ranks([10, 30, 20])).toEqual([3, 1, 2])
    expect(ranks([5, 5, 7])).toEqual([2, 3, 1])
    expect(ranks([])).toEqual([])
  })
})

describe('spreadLabels', () => {
  it('已经够开的不动', () => {
    expect(spreadLabels([10, 40, 80], 16, 0, 100)).toEqual([10, 40, 80])
  })
  it('挤在一起的推开到至少 gap，保持上下次序与输入顺序', () => {
    const out = spreadLabels([50, 52, 51, 10], 16, 0, 100)
    expect(out[3]).toBe(10)
    const sorted = [out[3]!, out[0]!, out[2]!, out[1]!]
    for (let i = 1; i < sorted.length; i++) expect(sorted[i]! - sorted[i - 1]!).toBeGreaterThanOrEqual(16 - 1e-9)
    expect(out[0]!).toBeLessThan(out[2]!)
    expect(out[2]!).toBeLessThan(out[1]!)
  })
  it('推到边界外时拉回范围里', () => {
    const out = spreadLabels([95, 96, 97, 98], 10, 0, 100)
    expect(Math.max(...out)).toBeLessThanOrEqual(100)
    expect(Math.min(...out)).toBeGreaterThanOrEqual(0)
    const sorted = out.toSorted((a, b) => a - b)
    for (let i = 1; i < 4; i++) expect(sorted[i]! - sorted[i - 1]!).toBeGreaterThanOrEqual(10 - 1e-9)
  })
  it('装不下就均匀铺满', () => {
    expect(spreadLabels([1, 2, 3], 80, 0, 100)).toEqual([0, 50, 100])
    expect(spreadLabels([], 10, 0, 1)).toEqual([])
  })
})

describe('slopeLayout', () => {
  const items = [
    { id: 'a', label: 'A', before: 10, after: 30 },
    { id: 'b', label: 'B', before: 30, after: 10 },
    { id: 'c', label: 'C', before: 20, after: 20 },
  ]
  it('value 模式：值大在上，端点按最小到最大线性，涨跌看 after − before', () => {
    const rows = slopeLayout(items, { mode: 'value', top: 0, bottom: 100, labelGap: 10 })
    expect(rows.map((row) => [row.y0, row.y1])).toEqual([
      [100, 0],
      [0, 100],
      [50, 50],
    ])
    expect(rows.map((row) => row.tone)).toEqual(['up', 'down', 'flat'])
    expect(rows.map((row) => row.change)).toEqual([20, -20, 0])
  })
  it('rank 模式：第 1 名在上、等距，名次升了是涨', () => {
    const rows = slopeLayout(items, { mode: 'rank', top: 0, bottom: 100, labelGap: 10 })
    expect(rows.map((row) => [row.y0, row.y1])).toEqual([
      [100, 0],
      [0, 100],
      [50, 50],
    ])
    expect(rows.map((row) => row.change)).toEqual([2, -2, 0])
    expect(rows.map((row) => row.tone)).toEqual(['up', 'down', 'flat'])
  })
  it('一项也不炸', () => {
    expect(
      slopeLayout([{ id: 'x', label: 'X', before: 1, after: 1 }], {
        mode: 'value',
        top: 0,
        bottom: 10,
        labelGap: 5,
      })[0]!.y0,
    ).toBe(5)
  })
})

describe('SlopeChart', () => {
  const html = renderToStaticMarkup(
    <SlopeChart
      label="再平衡前后权重"
      columns={{ before: '调整前', after: '调整后' }}
      items={[
        { id: 'a', label: '甲', before: 10, after: 30 },
        { id: 'b', label: '乙', before: 30, after: 10 },
      ]}
      describe={(item, change) => `${item.label}：${change > 0 ? '+' : ''}${change}`}
    />,
  )
  it('每项一个带整句名的图形，只有一个在 Tab 序里，涨跌写在 data-tone，两列有列头', () => {
    expect(html.match(/role="img"/g)).toHaveLength(2)
    expect(html).toContain('aria-label="甲：+20"')
    expect(html.match(/tabindex="0"/g)).toHaveLength(1)
    expect(html).toContain('data-tone="up"')
    expect(html).toContain('data-tone="down"')
    expect(html).toContain('调整前')
    expect(html).toContain('调整后')
  })
})

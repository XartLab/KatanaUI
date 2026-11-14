// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { linearScale, niceTicks, quantileSorted } from './chart-scale'
import { Ridgeline } from './ridgeline'
import { gaussianKde, ridgelines, ridgeStats, silvermanBandwidth } from './ridgeline-model'

const view = {
  actionLabels: { group: '操作', table: '表格视图', exportCsv: '导出', fullscreen: '全屏' },
  tableLabel: '表',
  tableHead: ['名称', '值'],
}

describe('chart-scale', () => {
  it('quantileSorted 线性插值（type 7）', () => {
    expect(quantileSorted([1, 2, 3, 4], 0.5)).toBe(2.5)
    expect(quantileSorted([1, 2, 3, 4], 0.25)).toBe(1.75)
    expect(quantileSorted([5], 0.9)).toBe(5)
    expect(quantileSorted([], 0.5)).toBeNaN()
  })
  it('niceTicks 步长取 1、2、5 乘 10 的幂，刻度都在范围里', () => {
    expect(niceTicks(0, 10, 5)).toEqual([0, 2, 4, 6, 8, 10])
    expect(niceTicks(-3, 4, 7)).toEqual([-3, -2, -1, 0, 1, 2, 3, 4])
    expect(niceTicks(0, 1, 4)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1])
    expect(niceTicks(5, 5, 4)).toEqual([5])
  })
  it('linearScale 两端对上，退化的 domain 取中点', () => {
    const scale = linearScale([0, 10], [100, 200])
    expect(scale(0)).toBe(100)
    expect(scale(10)).toBe(200)
    expect(scale(5)).toBe(150)
    expect(linearScale([3, 3], [0, 10])(3)).toBe(5)
  })
})

describe('Silverman 带宽', () => {
  it('等于 0.9 · min(σ, IQR/1.34) · n^(−1/5)（手算：1..9）', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const sd = Math.sqrt(7.5) // 样本方差 60 / 8
    const iqr = 7 - 3
    expect(silvermanBandwidth(values)).toBeCloseTo(0.9 * Math.min(sd, iqr / 1.34) * Math.pow(9, -0.2), 10)
  })
  it('少于两个数或全相等取不出来', () => {
    expect(silvermanBandwidth([])).toBeNull()
    expect(silvermanBandwidth([3])).toBeNull()
    expect(silvermanBandwidth([2, 2, 2])).toBeNull()
  })
})

describe('gaussianKde', () => {
  const values = Array.from({ length: 200 }, (_, i) => Math.sin(i * 12.9898) * 3 + 1)
  const h = silvermanBandwidth(values)!
  const xs = Array.from({ length: 801 }, (_, i) => -12 + (24 * i) / 800)
  const density = gaussianKde(values, xs, h)
  it('积分约等于 1', () => {
    let area = 0
    for (let i = 1; i < xs.length; i++) area += ((density[i]! + density[i - 1]!) / 2) * (xs[i]! - xs[i - 1]!)
    expect(area).toBeCloseTo(1, 2)
  })
  it('单点数据的峰在那个点上，空数据与非正带宽全是 0', () => {
    const d = gaussianKde([2], [0, 1, 2, 3, 4], 0.5)
    expect(d.indexOf(Math.max(...d))).toBe(2)
    expect(gaussianKde([], [1, 2], 1)).toEqual([0, 0])
    expect(gaussianKde([1], [1], 0)).toEqual([0])
  })
})

describe('ridgelines', () => {
  const groups = [
    { id: 'a', label: 'A', values: [-2, -1, 0, 1, 2, -1, 0, 1] },
    { id: 'b', label: 'B', values: [3, 4, 5, 6, 5, 4, 5] },
    { id: 'c', label: 'C', values: [7] },
  ]
  const { domain, ridges, peak } = ridgelines(groups)
  it('范围盖住全体数据，每组有同样的取样点，最高的密度就是 peak', () => {
    expect(domain[0]).toBeLessThan(-2)
    expect(domain[1]).toBeGreaterThan(7)
    expect(ridges.map((ridge) => ridge.density.length)).toEqual([96, 96, 96])
    expect(peak).toBe(Math.max(...ridges.flatMap((ridge) => ridge.density)))
  })
  it('取不出带宽的组（C）用范围的 1/50 兜底，峰仍在 7 附近', () => {
    expect(ridges[2]!.bandwidth).toBeCloseTo((domain[1] - domain[0]) / 50, 10)
    const c = ridges[2]!
    const top = c.xs[c.density.indexOf(Math.max(...c.density))]!
    expect(Math.abs(top - 7)).toBeLessThan(0.5)
  })
  it('ridgeStats 写中位数与均值', () => {
    expect(ridgeStats([1, 2, 3, 4, NaN])).toEqual({ n: 4, mean: 2.5, median: 2.5, min: 1, max: 4 })
    expect(ridgeStats([]).n).toBe(0)
  })
})

describe('Ridgeline', () => {
  const html = renderToStaticMarkup(
    <Ridgeline
      {...view}
      label="分层收益分布"
      groups={[
        { id: 'lo', label: '第 1 层', values: [-3, -2, -1, -2, -1] },
        { id: 'hi', label: '第 2 层', values: [1, 2, 3, 2, 1] },
      ]}
      describe={(group, stats) => `${group.label}：中位数 ${stats.median}`}
      baseline={0}
    />,
  )
  it('每组一个带整句名的图形，只有一个在 Tab 序里，颜色按条的次序取 seq 色阶、不用涨跌色', () => {
    expect(html.match(/role="img"/g)).toHaveLength(2)
    expect(html).toContain('aria-label="第 1 层：中位数 -2"')
    expect(html.match(/tabindex="0"/g)).toHaveLength(1)
    expect(html).toContain('stroke:var(--seq-200)')
    expect(html).toContain('stroke:var(--seq-600)')
    expect(html).not.toContain('pnl-')
    expect(html).not.toContain('data-tone')
    expect(html).toContain('k-ridge-baseline')
  })
})

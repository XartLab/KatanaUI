// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { QuantileLayers } from './quantile-layers'
import { isMonotonic, layerLevel, quantileRange, type QuantileLayer } from './quantile-model'

const layer = (rank: number, final: number): QuantileLayer => ({
  rank,
  label: `Q${rank}`,
  points: [0, final / 2, final],
})
const ascending = [layer(1, -1), layer(2, 0.5), layer(3, 2)]

describe('quantile-model', () => {
  it('单调：期末累计收益随层号严格递增；乱序入参也按层号排；有缺值或少于两层不算', () => {
    expect(isMonotonic(ascending)).toBe(true)
    expect(isMonotonic([...ascending].reverse())).toBe(true)
    expect(isMonotonic([layer(1, 1), layer(2, 1)])).toBe(false)
    expect(isMonotonic([layer(1, -1), layer(2, 2), layer(3, 1)])).toBe(false)
    expect(isMonotonic([layer(1, 1)])).toBe(false)
    expect(isMonotonic([{ rank: 1, label: 'Q1', points: [Number.NaN] }, layer(2, 1)])).toBe(false)
  })
  it('颜色档：最低层 0、最高层 4，中间等分；一层取最亮', () => {
    expect([0, 1, 2, 3, 4].map((i) => layerLevel(i, 5))).toEqual([0, 1, 2, 3, 4])
    expect([0, 1, 2].map((i) => layerLevel(i, 3))).toEqual([0, 2, 4])
    expect(layerLevel(0, 1)).toBe(4)
  })
  it('纵轴范围包进 0', () => {
    expect(quantileRange([layer(1, 1), layer(2, 3)], [0.5])).toEqual([0, 3])
    expect(quantileRange([layer(1, -2)], [])).toEqual([-2, 0])
  })
})

describe('QuantileLayers', () => {
  const labels = {
    chart: '图',
    actions: { group: '操作', table: '表格视图', exportCsv: '导出', fullscreen: '全屏' },
    x: '日期',
    layers: '分层',
    table: '表',
    monotonicPass: '通过',
    monotonicFail: '未通过',
    monotonic: '单调性',
    tooMany: '分层太多',
  }
  const render = (layers: QuantileLayer[]) =>
    renderToStaticMarkup(
      <QuantileLayers
        layers={layers}
        longShort={[0, 1, 3]}
        longShortLabel="多空"
        labels={labels}
        formatValue={String}
        formatX={(i) => `d${i}`}
        stats={[{ key: 'n', label: '样本', value: '3' }]}
      />,
    )
  it('线色按序数取 seq，最低层最暗、最高层最亮；不出现涨跌色；多空差是点阵面', () => {
    const html = render(ascending)
    expect(html).toContain('stroke:var(--seq-200)')
    expect(html).toContain('stroke:var(--seq-600)')
    expect(html).not.toContain('pnl-')
    expect(html).toContain('url(#ql-fill-')
    expect(html).toContain('data-monotonic="true"')
    expect(html).toContain('通过')
  })
  it('结论行：单调不通过写「未通过」，统计写在后面', () => {
    const html = render([layer(1, 2), layer(2, 1)])
    expect(html).toContain('data-monotonic="false"')
    expect(html).toContain('未通过')
    expect(html).toContain('样本')
  })
  it('分层多于 10 不画线，只给表格', () => {
    const many = Array.from({ length: 11 }, (_, i) => layer(i + 1, i))
    const html = render(many)
    expect(html).not.toContain('data-slot="quantile-line"')
    expect(html).toContain('quantile-table')
    expect(html).toContain('分层太多')
  })
})

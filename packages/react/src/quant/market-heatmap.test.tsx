// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { MarketHeatmap, type HeatmapItem, type MarketHeatmapLabels } from './market-heatmap.tsx'
import {
  formatLegend,
  formatMetric,
  formatRange,
  neighbour,
  niceUnit,
  stepCenter,
  stepOf,
  stepRange,
} from './market-heatmap-model.ts'

const labels: MarketHeatmapLabels = {
  sizeBy: '大小',
  colorBy: '颜色',
  view: '视图',
  grouped: '分组',
  flat: '平铺',
  all: '全部',
  other: '其他',
  price: '价格',
  group: '行业',
  summary: { count: '只数', up: '上涨', down: '下跌' },
  segment: (range) => `隐藏 ${range}`,
  list: '热力图',
  empty: '没有数据',
}

const item = (symbol: string, group: string | undefined, cap: number, day: number | null): HeatmapItem => ({
  symbol,
  name: `名${symbol}`,
  group,
  size: { cap },
  value: { day },
})

describe('热力图的色阶', () => {
  it('档宽取最大绝对值除以 3 再向上取好数', () => {
    expect(niceUnit([1, -2.9, 0.5])).toBe(1)
    expect(niceUnit([8.7, -4])).toBe(3)
    expect(niceUnit([0, null, Number.NaN])).toBe(1)
    expect(niceUnit([0.02, -0.011])).toBe(0.008)
  })

  it('值落在以档宽为单位的七档里，边界在半档处，没有数是 null', () => {
    expect(stepOf(0.49, 1)).toBe(0)
    expect(stepOf(0.51, 1)).toBe(1)
    expect(stepOf(-1.6, 1)).toBe(-2)
    expect(stepOf(99, 1)).toBe(3)
    expect(stepOf(-99, 1)).toBe(-3)
    expect(stepOf(null, 1)).toBeNull()
    expect(stepOf(-0.2, 1)).toBe(0)
  })

  it('图例的值边界：最外两档一头开口', () => {
    expect(stepRange(-3, 1)).toEqual({ from: null, to: -2.5 })
    expect(stepRange(0, 1)).toEqual({ from: -0.5, to: 0.5 })
    expect(stepRange(3, 2)).toEqual({ from: 5, to: null })
    expect(stepCenter(2, 0.5)).toBe(1)
    expect(formatRange(1, 1, { unit: '%' })).toBe('+0.5% ~ +1.5%')
    expect(formatRange(-3, 1, { unit: '%' })).toBe('< -2.5%')
    expect(formatLegend(0, { unit: '%' })).toBe('0%')
  })

  it('指标值默认带正负号两位小数，没有数写 —', () => {
    expect(formatMetric(10, { unit: '%' })).toBe('+10.00%')
    expect(formatMetric(-0.5, { unit: '%' })).toBe('-0.50%')
    expect(formatMetric(0.001, { unit: '%' })).toBe('0.00%')
    expect(formatMetric(null, { unit: '%' })).toBe('—')
    expect(formatMetric(3, { format: (v) => `${v}x` })).toBe('3x')
  })
})

describe('方向键找邻居', () => {
  const boxes = [
    { code: 'a', x0: 0, y0: 0, x1: 10, y1: 10 },
    { code: 'b', x0: 10, y0: 0, x1: 20, y1: 10 },
    { code: 'c', x0: 0, y0: 10, x1: 10, y1: 20 },
  ]
  it('取那个方向上最近的，没有就是 null', () => {
    expect(neighbour(boxes, 'a', 'right')).toBe('b')
    expect(neighbour(boxes, 'a', 'down')).toBe('c')
    expect(neighbour(boxes, 'a', 'left')).toBeNull()
    expect(neighbour(boxes, 'b', 'left')).toBe('a')
  })
})

describe('MarketHeatmap 渲染结构', () => {
  const items = [item('A1', '甲', 100, 2), item('A2', '甲', 50, -1), item('B1', '乙', 80, null)]
  const html = renderToStaticMarkup(
    <MarketHeatmap
      items={items}
      sizeBy={[{ key: 'cap', label: '市值' }]}
      colorBy={[{ key: 'day', label: '涨跌', unit: '%', step: 1 }]}
      labels={labels}
    />,
  )
  it('每个品种一格，每组一个组名，图例七档', () => {
    expect(html.match(/data-slot="heatmap-cell"/g)).toHaveLength(3)
    expect(html.match(/data-slot="heatmap-group"/g)).toHaveLength(2)
    expect(html.match(/data-slot="heatmap-segment"/g)).toHaveLength(7)
  })
  it('没有数的格子是 na 档', () => {
    expect(html).toContain('data-step="na"')
  })
  it('没有数据画空态', () => {
    const empty = renderToStaticMarkup(
      <MarketHeatmap
        items={[]}
        sizeBy={[{ key: 'cap', label: '市值' }]}
        colorBy={[{ key: 'day', label: '涨跌' }]}
        labels={labels}
      />,
    )
    expect(empty).toContain('没有数据')
  })
  it('旧字段名 code（@deprecated）照样认：映射到 symbol', () => {
    const legacy = renderToStaticMarkup(
      <MarketHeatmap
        items={[{ code: 'OLD', name: '旧名', size: { cap: 1 }, value: { day: 1 } }]}
        sizeBy={[{ key: 'cap', label: '市值' }]}
        colorBy={[{ key: 'day', label: '涨跌' }]}
        labels={labels}
      />,
    )
    expect(legacy).toContain('data-code="OLD"')
  })
  it('复制图（#87）：给了 onCopyImage 与 labels.copyImage 才出相机钮，它与全屏钮不进截图', () => {
    const render = (extra: object) =>
      renderToStaticMarkup(
        <MarketHeatmap
          items={items}
          sizeBy={[{ key: 'cap', label: '市值' }]}
          colorBy={[{ key: 'day', label: '涨跌' }]}
          labels={{ ...labels, fullscreen: '全屏', copyImage: '复制图片' }}
          {...extra}
        />,
      )
    expect(render({})).not.toContain('data-slot="heatmap-copy-image"')
    const html = render({ onCopyImage: () => {} })
    expect(html).toMatch(/data-slot="heatmap-copy-image" data-copy-image="skip"/)
    expect(html).toMatch(/data-copy-image="skip"[^>]*data-slot="heatmap-fullscreen"/)
  })
})

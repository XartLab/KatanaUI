// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { SeriesExplorer } from './series-explorer'
import {
  changeRatio,
  chartExtent,
  previousWindow,
  rangeWindow,
  reduceWindow,
  stackPoint,
  type SeriesPoint,
} from './series-explorer-model'

// #1917：SeriesExplorer 的纯逻辑与结构。区间切换、开关、扫读、刷选联动在 e2e/ui-gallery.spec.ts 里用真浏览器验。

const month = (y: number, m: number) => Date.UTC(y, m - 1, 1)
// 2026-01 到 2026-08 共 8 个月，每月一个点。
const points: SeriesPoint[] = Array.from({ length: 8 }, (_, i) => ({
  at: month(2026, i + 1),
  values: { a: (i + 1) * 10, b: i % 2 === 0 ? -5 : 5, net: (i + 1) * 10 + (i % 2 === 0 ? -5 : 5), eq: (i + 1) * 100 },
}))

describe('区间', () => {
  it('最近 N 个日历月：从最后一点往前推 N 个月之后的第一个点起', () => {
    expect(rangeWindow(points, 3)).toEqual([5, 8])
    expect(rangeWindow(points, 6)).toEqual([2, 8])
    expect(rangeWindow(points, null)).toEqual([0, 8])
  })

  it('点不够长的区间是全部；只有一个点时窗口就是它；没有点是空窗口', () => {
    expect(rangeWindow(points, 12)).toEqual([0, 8])
    expect(rangeWindow([points[0]!], 3)).toEqual([0, 1])
    expect(rangeWindow([], 3)).toEqual([0, 0])
  })

  it('上一期紧挨在前面、一样长；前面不够长就没有', () => {
    expect(previousWindow([5, 8])).toEqual([2, 5])
    expect(previousWindow([4, 8])).toEqual([0, 4])
    expect(previousWindow([3, 8])).toBeNull()
    expect(previousWindow([0, 8])).toBeNull()
  })
})

describe('KPI', () => {
  it('求和、末值、平均只算有值的点；一个有值的点都没有是 null', () => {
    expect(reduceWindow(points, [5, 8], 'a', 'sum')).toBe(60 + 70 + 80)
    expect(reduceWindow(points, [5, 8], 'a', 'last')).toBe(80)
    expect(reduceWindow(points, [5, 8], 'a', 'avg')).toBe(70)
    expect(reduceWindow(points, [5, 8], 'nope', 'sum')).toBeNull()
    expect(reduceWindow([{ at: 0, values: { a: Number.NaN } }], [0, 1], 'a', 'sum')).toBeNull()
  })

  it('相对上一期：(这期 - 上期) / |上期|；上期没有或为 0 不编百分比', () => {
    expect(changeRatio(150, 100)).toBe(0.5)
    expect(changeRatio(50, -100)).toBe(1.5)
    expect(changeRatio(-50, 100)).toBe(-1.5)
    expect(changeRatio(10, 0)).toBeNull()
    expect(changeRatio(10, null)).toBeNull()
    expect(changeRatio(null, 10)).toBeNull()
  })
})

describe('堆叠', () => {
  it('正的从 0 往上按序列次序叠，负的从 0 往下叠，缺的与 0 不占位置', () => {
    const point: SeriesPoint = { at: 0, values: { a: 3, b: -2, c: 4, d: 0, e: -1 } }
    expect(stackPoint(point, ['a', 'b', 'c', 'd', 'e', 'missing'])).toEqual([
      { key: 'a', from: 0, to: 3 },
      { key: 'b', from: 0, to: -2 },
      { key: 'c', from: 3, to: 7 },
      { key: 'e', from: -2, to: -3 },
    ])
  })

  it('图的范围包住所有堆叠的两端、折线的值、额外的值与 0', () => {
    expect(chartExtent(points, [0, 8], ['a', 'b'], ['eq'])).toEqual([-5, 800])
    expect(chartExtent(points, [0, 2], ['b'], [], [-30])).toEqual([-30, 5])
    expect(chartExtent([], [0, 0], [], [])).toEqual([0, 0])
  })
})

describe('SeriesExplorer 渲染', () => {
  const labels = {
    chart: '图',
    ranges: '区间',
    series: '序列',
    compare: '对比上一期',
    previous: '上一期',
    table: '明细',
    time: '月份',
    empty: '没有数据',
    brush: { start: '起', end: '止', window: '窗' },
  }
  const render = (extra: Partial<Parameters<typeof SeriesExplorer>[0]> = {}) =>
    renderToStaticMarkup(
      <SeriesExplorer
        points={points}
        series={[
          { key: 'a', label: '甲', kind: 'bar' },
          { key: 'b', label: '乙', kind: 'bar' },
          { key: 'eq', label: '权益', kind: 'line' },
        ]}
        ranges={[
          { key: '3m', label: '3M', months: 3 },
          { key: 'all', label: '全部', months: null },
        ]}
        kpis={[
          { key: 'a', label: '甲合计', series: 'a', reduce: 'sum', format: String },
          { key: 'net', label: '净', series: 'net', reduce: 'sum', format: String },
        ]}
        columns={[{ key: 'a', label: '甲', text: (p) => String(p.values.a) }]}
        labels={labels}
        formatAt={(at) => new Date(at).toISOString().slice(0, 7)}
        formatValue={String}
        formatChange={(r) => `${(r * 100).toFixed(0)}%`}
        {...extra}
      />,
    )

  it('默认取最后一个区间（全部）：八个月的明细、每个月两根柱段、一条权益线', () => {
    const html = render()
    expect(html).toContain('data-range="all"')
    expect(html.match(/<tr/g)).toHaveLength(8 + 1)
    expect(html.match(/data-slot="series-bar"/g)).toHaveLength(16)
    expect(html.match(/data-slot="series-line"/g)).toHaveLength(1)
    expect(html).not.toContain('data-slot="series-compare"')
  })

  it('指定区间：3M 只有三个月；明细表最新的在最上面', () => {
    const html = render({ defaultRange: '3m' })
    expect(html.match(/<tr/g)).toHaveLength(3 + 1)
    const body = html.slice(html.indexOf('<tbody>'))
    expect(body.indexOf('2026-08')).toBeLessThan(body.indexOf('2026-07'))
  })

  it('KPI：值写好格式，变化相对上一期；上一期不够长（全部）写破折号', () => {
    const three = render({ defaultRange: '3m' })
    // 甲：最近三月 60+70+80 = 210，前三月 30+40+50 = 120，涨 75%。
    expect(three).toContain('data-key="a"')
    expect(three).toContain('data-tone="up">75%<')
    const all = render()
    expect(all).toMatch(/data-slot="series-kpi-change" data-tone="flat">—</)
  })

  it('没有点：只写空态', () => {
    const html = render({ points: [] })
    expect(html).toContain('data-empty="true"')
    expect(html).toContain('没有数据')
  })
})

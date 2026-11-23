// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { SeriesExplorer } from './series-explorer.tsx'
import {
  changeRatio,
  chartExtent,
  previousWindow,
  rangeWindow,
  reconcileWindow,
  reduceWindow,
  regimeAt,
  regimeScale,
  stackPoint,
  type SeriesPoint,
} from './series-explorer-model.ts'

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

describe('对账', () => {
  const ledger: SeriesPoint[] = [
    { at: 1, values: { net: 100, eq: 1100 } },
    { at: 2, values: { net: -30, eq: 1070 } },
    { at: 3, values: { net: 50, eq: 1620, cash: 500 } },
  ]
  const keys = { net: 'net', equity: 'eq', cashflow: 'cash' }

  it('期末 − 期初 = Σ净盈亏 + 出入金：对得上差额是 0；窗口从第一个点起用期初权益', () => {
    expect(reconcileWindow(ledger, [0, 3], keys, 1000)).toEqual({
      open: 1000,
      close: 1620,
      net: 120,
      cashflow: 500,
      diff: 0,
    })
    // 窗口 [1, 3)：期初是第一个点的权益 1100。
    expect(reconcileWindow(ledger, [1, 3], keys, 1000)!.diff).toBe(0)
  })

  it('没记的入金让差额不是 0；没有出入金序列就当 0', () => {
    expect(reconcileWindow(ledger, [0, 3], { net: 'net', equity: 'eq' }, 1000)!.diff).toBe(500)
    expect(reconcileWindow(ledger, [2, 2], keys, 1000)).toBeNull()
  })
})

describe('SeriesExplorer 渲染', () => {
  const labels = {
    chart: '图',
    ranges: '区间',
    metrics: '指标',
    compare: '对比上一期',
    previous: '上一期',
    table: '明细',
    time: '月份',
    empty: '没有数据',
    spark: (metric: string) => `${metric}走势`,
    limit: '限额',
    actions: { group: '图工具', table: '表格视图', exportCsv: '导出', fullscreen: '全屏' },
    brush: { start: '起', end: '止', window: '窗' },
    reconcile: { open: '期初', close: '期末', diff: '差额', ok: '一致', warn: '有差' },
    source: '来源 / 测试',
  }
  const render = (extra: Partial<Parameters<typeof SeriesExplorer>[0]> = {}) =>
    renderToStaticMarkup(
      <SeriesExplorer
        points={points}
        series={[
          { key: 'a', label: '甲', kind: 'bar' },
          { key: 'b', label: '乙', kind: 'bar', cost: true },
          { key: 'eq', label: '权益', kind: 'line' },
        ]}
        ranges={[
          { key: '3m', label: '3M', months: 3 },
          { key: 'all', label: '全部', months: null },
        ]}
        kpis={[
          { key: 'a', label: '甲合计', series: 'a', reduce: 'sum', format: String },
          { key: 'eq', label: '权益', series: 'eq', reduce: 'last', format: String, limit: 900 },
        ]}
        columns={[{ key: 'a', label: '甲', text: (p) => String(p.values.a) }]}
        labels={labels}
        formatAt={(at) => new Date(at).toISOString().slice(0, 7)}
        formatValue={String}
        formatChange={(r) => `${(r * 100).toFixed(0)}%`}
        {...extra}
      />,
    )

  it('默认展开第一个指标（甲：柱）：八个月八根柱，中性灰 ink-200；瓦片带 aria-expanded，指标按钮选中', () => {
    const html = render()
    expect(html).toContain('data-range="all"')
    expect(html.match(/data-slot="series-bar"/g)).toHaveLength(8)
    expect(html).toContain('fill:var(--k-content-body-foreground)')
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('data-slot="series-tab"')
    expect(html).toContain('data-slot="toolbar"')
    expect(html).toContain('role="slider"')
    expect(html).not.toContain('data-slot="series-compare"')
    expect(html).toContain('来源 / 测试')
  })

  it('线类指标：一条线、末点、限额红虚线；收起时没有面板', () => {
    const html = render({ defaultMetric: 'eq' })
    expect(html.match(/data-slot="series-line"/g)).toHaveLength(1)
    expect(html).toContain('data-slot="series-limit"')
    expect(html).toContain('data-slot="end-marker"')
    const closed = render({ defaultMetric: null })
    expect(closed).not.toContain('data-slot="series-panel"')
    expect(closed).toContain('aria-expanded="false"')
  })

  it('成本类序列的柱用更暗的 ink-300，不着色', () => {
    const html = render({
      kpis: [{ key: 'b', label: '乙', series: 'b', reduce: 'sum', format: String }],
    })
    expect(html).toContain('fill:var(--k-content-secondary-foreground)')
  })

  it('指定区间：3M 的瓦片值与变化相对上一期；上一期不够长（全部）没有变化数据，变化行不渲染', () => {
    const three = render({ defaultRange: '3m', defaultMetric: null })
    // 甲：最近三月 60+70+80 = 210，前三月 30+40+50 = 120，涨 75%。
    expect(three).toContain('data-key="a"')
    expect(three).toContain('+75.00%')
    const all = render({ defaultMetric: null })
    expect(all).not.toContain('data-slot="change-text"')
  })

  it('没有点：只写空态', () => {
    const html = render({ points: [] })
    expect(html).toContain('data-empty="true"')
    expect(html).toContain('没有数据')
  })
})

describe('状态带（#109）', () => {
  const ats = points.map((point) => point.at)
  const segments = [
    { from: month(2026, 1), to: month(2026, 4), state: 'calm' },
    { from: month(2026, 4), to: month(2026, 9), state: 'hot', estimated: true },
  ]
  const states = [
    { id: 'calm', name: '平静', color: 1 as const },
    { id: 'hot', name: '过热', color: 4 as const },
  ]

  it('比例尺：段是左闭右开，相邻的段严丝合缝，跟一格一点的横轴同一份刻度', () => {
    const scale = regimeScale(ats)
    expect(scale(month(2026, 1))).toBe(0)
    expect(scale(month(2026, 4))).toBe(3 / 8)
    expect(scale(month(2026, 9))).toBe(1)
    expect(scale(month(2025, 1))).toBe(0)
    expect(regimeScale([])(5)).toBe(0)
    expect(regimeAt(segments, month(2026, 3))).toBe('calm')
    expect(regimeAt(segments, month(2026, 4))).toBe('hot')
    expect(regimeAt(segments, month(2026, 9))).toBeNull()
  })

  const render = (extra: Record<string, unknown> = {}) =>
    renderToStaticMarkup(
      <SeriesExplorer
        points={points}
        series={[{ key: 'a', label: '甲', kind: 'bar' }]}
        ranges={[{ key: 'all', label: '全部', months: null }]}
        kpis={[{ key: 'a', label: '甲合计', series: 'a', reduce: 'sum', format: String }]}
        columns={[{ key: 'a', label: '甲', text: (p) => String(p.values.a) }]}
        labels={{
          chart: '图',
          ranges: '区间',
          metrics: '指标',
          compare: '对比',
          previous: '上期',
          table: '表',
          time: '时间',
          empty: '没有数据',
          spark: (metric: string) => metric,
          limit: '限额',
          actions: { group: '操作', table: '表格视图', exportCsv: '导出', fullscreen: '全屏' },
          brush: { start: '起', end: '止', window: '窗' },
        }}
        formatAt={(at) => new Date(at).toISOString().slice(0, 7)}
        formatValue={String}
        formatChange={String}
        {...extra}
      />,
    )

  it('给了 regimes 就在图和时间轴下画状态带与图例，段的位置按窗口里的格子算；不给就没有这一块', () => {
    const html = render({ regimes: { segments, states, label: '情绪状态' } })
    expect(html).toContain('data-slot="series-regimes"')
    expect(html).toContain('role="img" aria-label="情绪状态"')
    expect(html).toContain('data-state="calm"')
    expect(html).toContain('left:0%;width:37.5%')
    expect(html).toContain('left:37.5%;width:62.5%')
    expect(html).toContain('平静')
    expect(html).toContain('过热')
    expect(render()).not.toContain('series-regimes')
    // 表格视图里没有图，也就没有状态带（展开的是图面板，这里用收起指标检查：没有面板就没有带）。
    expect(render({ regimes: { segments, states, label: 'x' }, defaultMetric: null })).not.toContain('series-regimes')
  })
})

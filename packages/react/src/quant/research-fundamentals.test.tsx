// SPDX-License-Identifier: MIT
// 投研三件（KATANAview #2395）：财务报表表、同业对比表、估值带的模型与结构。
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { CompsTable, type CompsMetric } from './comps-table.tsx'
import { columnMedian, goodness, goodnessLimit, median, orderComps, type CompsRow } from './comps-model.ts'
import { StatementTable, type StatementTableLabels } from './statement-table.tsx'
import { changeAt, statementRows, type StatementItem, type StatementPeriod } from './statement-model.ts'
import { ValuationBand, type ValuationBandLabels } from './valuation-band.tsx'
import { bandLine, bandMultiples, bandQuantile, currentPercentile, usableMultiples } from './valuation-band-model.ts'

const items: StatementItem[] = [
  { id: 'rev', label: '营业收入' },
  { id: 'cogs', label: '营业成本' },
  { id: 'gross', label: '毛利', kind: 'subtotal' },
  { id: 'opex', label: '期间费用' },
  { id: 'sell', label: '销售费用', parent: 'opex' },
  { id: 'admin', label: '管理费用', parent: 'opex' },
  { id: 'net', label: '净利润', kind: 'total' },
]
const periods: StatementPeriod[] = ['2025Q1', '2025Q2', '2025Q3', '2025Q4', '2026Q1'].map((id) => ({ id, label: id }))
const values = {
  rev: {
    '2025Q1': 100,
    '2025Q2': 110,
    '2025Q3': 120,
    '2025Q4': 130,
    '2026Q1': { value: 150, revision: 2, note: '更正' },
  },
  net: { '2025Q1': -10, '2025Q2': 5, '2025Q3': 8, '2025Q4': 12, '2026Q1': -5 },
}
const stLabels: StatementTableLabels = {
  table: '利润表',
  item: '科目',
  modeGroup: '口径',
  value: '原值',
  yoy: '同比',
  qoq: '环比',
  collapse: (item) => `收起 ${item.label}`,
  expand: (item) => `展开 ${item.label}`,
  revised: (revision) => `第 ${revision} 版`,
  empty: '没有科目',
}

describe('statement-model', () => {
  it('先序排行，子科目缩进一级；收起父科目，子孙不出现', () => {
    const rows = statementRows(items, new Set())
    expect(rows.map((row) => row.item.id)).toEqual(['rev', 'cogs', 'gross', 'opex', 'sell', 'admin', 'net'])
    expect(rows.find((row) => row.item.id === 'sell')?.level).toBe(2)
    expect(rows.find((row) => row.item.id === 'opex')?.hasChildren).toBe(true)
    const folded = statementRows(items, new Set(['opex']))
    expect(folded.map((row) => row.item.id)).toEqual(['rev', 'cogs', 'gross', 'opex', 'net'])
    expect(folded.find((row) => row.item.id === 'opex')?.expanded).toBe(false)
  })
  it('父科目不存在或成环时当顶层，每个科目恰好出现一次', () => {
    const odd: StatementItem[] = [
      { id: 'a', label: 'a', parent: 'missing' },
      { id: 'b', label: 'b', parent: 'c' },
      { id: 'c', label: 'c', parent: 'b' },
    ]
    const ids = statementRows(odd, new Set()).map((row) => row.item.id)
    expect(ids.toSorted()).toEqual(['a', 'b', 'c'])
  })
  it('同比往前 periodsPerYear 列、环比往前一列；分母取绝对值，缺数或分母为 0 是 null', () => {
    expect(changeAt(values.rev, periods, 4, 'yoy', 4)).toBeCloseTo(0.5)
    expect(changeAt(values.rev, periods, 4, 'qoq', 4)).toBeCloseTo(20 / 130)
    expect(changeAt(values.rev, periods, 2, 'yoy', 4)).toBeNull()
    // 亏损收窄：-10 → 5 是 +150%，方向为正。
    expect(changeAt(values.net, periods, 1, 'qoq', 4)).toBeCloseTo(1.5)
    expect(
      changeAt(
        { x: 0, y: 1 } as never,
        [
          { id: 'x', label: '' },
          { id: 'y', label: '' },
        ],
        1,
        'qoq',
        4,
      ),
    ).toBeNull()
  })
})

describe('StatementTable', () => {
  it('画科目树与期间列，更正过的格带标记；没有科目时写空态', () => {
    const html = renderToStaticMarkup(
      <StatementTable items={items} periods={periods} values={values} labels={stLabels} />,
    )
    expect(html).toContain('data-slot="statement-table"')
    expect(html).toContain('营业收入')
    expect(html).toContain('data-slot="statement-revised"')
    expect(html).toContain('第 2 版')
    const empty = renderToStaticMarkup(<StatementTable items={[]} periods={periods} values={{}} labels={stLabels} />)
    expect(empty).toContain('没有科目')
  })
  it('同比口径写百分比并按方向着色', () => {
    const html = renderToStaticMarkup(
      <StatementTable items={items} periods={periods} values={values} labels={stLabels} mode="yoy" />,
    )
    expect(html).toContain('data-mode="yoy"')
    expect(html).toContain('+50.00%')
    expect(html).toContain('data-tone="up"')
  })
})

const comps: CompsRow[] = [
  { id: 'a', symbol: 'AAA', subject: true, values: { pe: 20, growth: 0.1 } },
  { id: 'b', symbol: 'BBB', values: { pe: 10, growth: 0.3 } },
  { id: 'c', symbol: 'CCC', values: { pe: 30, growth: null } },
  { id: 'd', symbol: 'DDD', values: { pe: 40, growth: 0.2 } },
]
const metrics: CompsMetric[] = [
  { id: 'pe', label: 'PE', group: 'val', better: 'lower', format: (v) => `${v.toFixed(1)}x` },
  { id: 'growth', label: '营收同比', group: 'grow', format: (v) => `${(v * 100).toFixed(1)}%` },
]

describe('comps-model', () => {
  it('中位数：奇偶都对，空是 null', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 2, 3])).toBe(2.5)
    expect(median([])).toBeNull()
    expect(columnMedian(comps, 'pe')).toBe(25)
  })
  it('好坏按 better：lower 时低于中位为正；没写方向不着色', () => {
    expect(goodness(10, 25, 'lower')).toBeCloseTo(0.6)
    expect(goodness(40, 25, 'lower')).toBeCloseTo(-0.6)
    expect(goodness(40, 25, 'higher')).toBeCloseTo(0.6)
    expect(goodness(40, 25, undefined)).toBeNull()
    expect(goodnessLimit(comps, 'growth', undefined)).toBeNull()
  })
  it('本公司始终置顶，其余按列排，没数的在最后', () => {
    expect(orderComps(comps, { id: 'pe', desc: true }).map((row) => row.id)).toEqual(['a', 'd', 'c', 'b'])
    expect(orderComps(comps, { id: 'growth', desc: false }).map((row) => row.id)).toEqual(['a', 'd', 'b', 'c'])
    expect(orderComps(comps, null)[0]!.id).toBe('a')
  })
})

describe('CompsTable', () => {
  it('画列集页签、本公司标记与表尾两行', () => {
    const html = renderToStaticMarkup(
      <CompsTable
        rows={comps}
        metrics={metrics}
        groups={[
          { id: 'val', label: '估值' },
          { id: 'grow', label: '增长' },
        ]}
        labels={{
          table: '同业',
          symbol: '公司',
          groups: '指标组',
          median: '中位数',
          mean: '均值',
          subject: '本公司',
          empty: '空',
        }}
      />,
    )
    expect(html).toContain('data-slot="comps-table"')
    expect(html).toContain('data-slot="column-set-tabs"')
    expect(html).toContain('本公司')
    expect(html).toContain('中位数')
    expect(html).toContain('25.0x')
  })
})

describe('valuation-band-model', () => {
  it('分位线性插值；负倍数不进分布', () => {
    expect(bandQuantile([1, 2, 3, 4, 5], 0.5)).toBe(3)
    expect(bandQuantile([1, 2], 0.25)).toBeCloseTo(1.25)
    expect(usableMultiples([-5, 10, null, 20])).toEqual([10, 20])
    expect(bandMultiples([10, 20, 30], [0, 1])).toEqual([10, 30])
  })
  it('带线 = 价格 × 分位倍数 / 当期倍数；当期倍数不可用时断开', () => {
    const line = bandLine([100, 120, 90], [20, 24, -1], 10)
    expect(line[0]).toBe(50)
    expect(line[1]).toBe(50)
    expect(Number.isNaN(line[2])).toBe(true)
  })
  it('当前分位：最后一个可用倍数在历史里的位置', () => {
    expect(currentPercentile([10, 20, 30, 40])).toBeCloseTo(0.875)
    expect(currentPercentile([-1, null])).toBeNull()
  })
})

describe('ValuationBand', () => {
  const vbLabels: ValuationBandLabels = {
    chart: '估值带',
    actions: { group: '图', table: '表格', exportCsv: '导出', fullscreen: '全屏' },
    table: '估值带表格',
    x: '日期',
    price: '价格',
    multiple: 'PE',
    band: (q) => `P${Math.round(q * 100)}`,
    percentile: (p) => `当前分位 P${Math.round(p * 100)}`,
    empty: '没有可用的倍数',
  }
  it('画价格线、五条带线与当前分位读数；没有可用倍数时写空态', () => {
    const prices = [10, 11, 12, 13, 14, 15]
    const pe = [10, 12, 14, 16, 18, 20]
    const html = renderToStaticMarkup(
      <ValuationBand
        prices={prices}
        multiples={pe}
        labels={vbLabels}
        formatPrice={(v) => v.toFixed(2)}
        formatMultiple={(v) => `${v.toFixed(1)}x`}
        formatX={(i) => `D${i}`}
      />,
    )
    expect(html).toContain('data-slot="valuation-band-price"')
    expect(html.match(/data-slot="valuation-band-line"/g)?.length).toBe(5)
    expect(html).toContain('当前分位 P92')
    const empty = renderToStaticMarkup(
      <ValuationBand
        prices={[1, 2]}
        multiples={[-1, null]}
        labels={vbLabels}
        formatPrice={(v) => String(v)}
        formatMultiple={(v) => String(v)}
        formatX={(i) => String(i)}
      />,
    )
    expect(empty).toContain('没有可用的倍数')
  })
})

// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { CompanyProfile } from './company-profile.tsx'
import { CrossRates } from './cross-rates.tsx'
import { crossRateMatrix, moveCell, plainRate } from './cross-rates-model.ts'
import { SymbolInfo } from './symbol-info.tsx'
import { SymbolOverview, type SymbolOverviewItem } from './symbol-overview.tsx'
import { nearestIndex, percentSeries, timeSpan, timeX } from './symbol-overview-model.ts'

// KatanaUI #147（KATANAview #1884）：对照 TradingView 小组件补的第二批报价件的纯逻辑与结构。悬停、键盘与像素留给文档站的浏览器测试。

const count = (html: string, pattern: RegExp) => html.match(pattern)?.length ?? 0

describe('SymbolInfo 品种报价头', () => {
  it('写出代码、名称、交易所、最新价、带符号的涨跌额与涨跌幅，每个区间一条 meter', () => {
    const html = renderToStaticMarkup(
      <SymbolInfo
        symbol="AAA"
        name="Alpha Devices"
        exchange="NASDAQ"
        last={212.4}
        change={-1.6}
        changePct={-0.75}
        unit="USD"
        status={{ tone: 'ok', label: 'Market open' }}
        ranges={[
          { id: 'day', title: "Day's range", low: 210, high: 215 },
          { id: '52w', title: '52 week range', low: 150, high: 240 },
        ]}
        label="Alpha Devices quote"
      />,
    )
    expect(html).toContain('aria-label="Alpha Devices quote"')
    expect(html).toContain('NASDAQ')
    expect(html).toContain('212.40')
    expect(html).toContain('-1.60')
    expect(html).toContain('-0.75%')
    expect(html).toContain('Market open')
    expect(html).toContain('is-down')
    expect(count(html, /role="meter"/g)).toBe(2)
    expect(html).toContain('aria-label="52 week range"')
  })

  it('涨时涨跌额前写 +；不给区间与状态就不画', () => {
    const html = renderToStaticMarkup(
      <SymbolInfo symbol="BBB" last={10} change={0.5} changePct={5} label="BBB" formatPrice={(n) => n.toFixed(1)} />,
    )
    expect(html).toContain('+0.5')
    expect(html).toContain('is-up')
    expect(html).not.toContain('role="meter"')
    expect(html).not.toContain('symbol-info-status')
  })
})

describe('SymbolOverview 多品种走势卡', () => {
  it('percentSeries：相对第一个有效值的百分数；起点是 0 或没有有效值时整条 NaN', () => {
    expect(percentSeries([Number.NaN, 100, 110, 95])).toEqual([Number.NaN, 0, 10, -5])
    expect(percentSeries([0, 1]).every(Number.isNaN)).toBe(true)
    expect(percentSeries([]).length).toBe(0)
  })

  it('nearestIndex：二分找最近，一样近取靠后的；timeSpan 合并几条的起止', () => {
    expect(nearestIndex([0, 10, 20, 30], 14)).toBe(1)
    expect(nearestIndex([0, 10, 20, 30], 15)).toBe(2)
    expect(nearestIndex([0, 10, 20, 30], 99)).toBe(3)
    expect(nearestIndex([], 1)).toBeNull()
    expect(timeSpan([[5, 9], [], [2, 7]])).toEqual([2, 9])
    expect(timeSpan([[]])).toBeNull()
    expect(timeX(5, 0, 10)).toBe(500)
    expect(timeX(5, 5, 5)).toBe(500)
  })

  const items: SymbolOverviewItem[] = [
    { id: 'a', symbol: 'AAA', last: 102, changePct: 2, values: [100, 101, 102], times: [0, 1, 2] },
    { id: 'b', symbol: 'BBB', last: 49, changePct: -2, values: [50, 49.5, 49], times: [0, 1, 2] },
  ]
  const labels = { tabs: 'Symbols', ranges: 'Range', chart: 'Chart', empty: 'No data' }

  it('price 口径只画选中的那只（面积 + 线），页签与区间按钮都在', () => {
    const html = renderToStaticMarkup(
      <SymbolOverview
        items={items}
        ranges={[
          { id: '1d', label: '1D' },
          { id: '1m', label: '1M' },
        ]}
        defaultRange="1m"
        formatTime={(t) => `t${t}`}
        labels={labels}
      />,
    )
    expect(count(html, /role="tab"/g)).toBe(2)
    expect(count(html, /data-slot="symbol-overview-line"/g)).toBe(1)
    expect(html).toContain('k-symov-area')
    expect(html).toMatch(/aria-pressed="true"(?:(?!<\/button>).)*>1M</)
    expect(html).toMatch(/aria-pressed="false"(?:(?!<\/button>).)*>1D</)
    expect(html).not.toContain('k-symov-swatch')
  })

  it('percent 口径把所有品种叠在一起，选中的那条加粗，页签上有色块；没有面积', () => {
    const html = renderToStaticMarkup(
      <SymbolOverview items={items} scale="percent" defaultValue="b" formatTime={String} labels={labels} />,
    )
    expect(count(html, /data-slot="symbol-overview-line"/g)).toBe(2)
    expect(count(html, /k-symov-line is-selected/g)).toBe(1)
    expect(count(html, /k-symov-swatch/g)).toBe(2)
    expect(html).not.toContain('k-symov-area')
    expect(html).toMatch(/aria-selected="true"[^>]*>.*BBB/)
  })

  it('选中的那只少于两个有效值：走势位置写空态', () => {
    const html = renderToStaticMarkup(
      <SymbolOverview
        items={[{ id: 'x', symbol: 'X', last: 1, changePct: 0, values: [1], times: [0] }]}
        formatTime={String}
        labels={labels}
      />,
    )
    expect(html).toContain('symbol-overview-empty')
    expect(html).toContain('No data')
  })
})

describe('CrossRates 交叉汇率矩阵', () => {
  const quotes = [
    { base: 'EUR', quote: 'USD', rate: 1.0832, changePct: 0.21 },
    { base: 'USD', quote: 'EUR', rate: 0.9232, changePct: -0.21 },
    { base: 'USD', quote: 'JPY', rate: 155.2, changePct: 0.6 },
  ]

  it('crossRateMatrix：行是基准、列是计价；对角线不取数，缺的对是 null', () => {
    const rows = crossRateMatrix(['USD', 'EUR', 'JPY'], quotes)
    expect(rows[0]![0]!.diagonal).toBe(true)
    expect(rows[0]![1]!.data?.rate).toBe(0.9232)
    expect(rows[1]![0]!.data?.rate).toBe(1.0832)
    expect(rows[2]![0]!.data).toBeNull()
  })

  it('plainRate：不小于 100 两位，否则四位；不是有限数写「—」', () => {
    expect(plainRate(155.234)).toBe('155.23')
    expect(plainRate(1.08321)).toBe('1.0832')
    expect(plainRate(Number.NaN)).toBe('—')
  })

  it('moveCell：方向键到边停住，Home / End 到行头尾，Ctrl 加 Home / End 到整张头尾，别的键不管', () => {
    expect(moveCell({ row: 0, col: 0 }, 3, 'ArrowLeft')).toEqual({ row: 0, col: 0 })
    expect(moveCell({ row: 1, col: 1 }, 3, 'ArrowDown')).toEqual({ row: 2, col: 1 })
    expect(moveCell({ row: 1, col: 1 }, 3, 'End')).toEqual({ row: 1, col: 2 })
    expect(moveCell({ row: 1, col: 1 }, 3, 'Home', true)).toEqual({ row: 0, col: 0 })
    expect(moveCell({ row: 1, col: 1 }, 3, 'a')).toBeNull()
  })

  it('汇率模式：n × n 个格子，只有一格在 Tab 序里，对角线没有字，缺的对写「—」', () => {
    const html = renderToStaticMarkup(
      <CrossRates currencies={['USD', 'EUR', 'JPY']} quotes={quotes} labels={{ table: 'Cross rates', empty: '—' }} />,
    )
    expect(count(html, /role="gridcell"/g)).toBe(9)
    expect(count(html, /tabindex="0"/g)).toBe(1)
    expect(html).toContain('1.0832')
    expect(html).toContain('155.20')
    expect(html).toMatch(/is-diagonal"[^>]*><\/td>/)
    expect(html).toMatch(/data-pair="JPY\/USD"[^>]*>—</)
  })

  it('热力模式：格子按涨跌幅分档上色、只写涨跌幅；没有货币时画空态', () => {
    const html = renderToStaticMarkup(
      <CrossRates
        currencies={['USD', 'JPY']}
        quotes={quotes}
        mode="heatmap"
        labels={{ table: 'Heatmap', empty: 'Not connected' }}
      />,
    )
    expect(html).toContain('data-mode="heatmap"')
    expect(html).toMatch(/is-step2[^"]*"[^>]*data-pair="USD\/JPY"/)
    expect(html).toContain('+0.60%')
    expect(html).not.toContain('155.20')
    const empty = renderToStaticMarkup(
      <CrossRates currencies={[]} quotes={[]} labels={{ table: 'x', empty: 'Not connected' }} />,
    )
    expect(empty).toContain('Not connected')
  })
})

describe('CompanyProfile 公司简介卡', () => {
  const labels = { more: 'Show more', less: 'Show less', empty: 'Not connected' }

  it('事实与正文都在；折叠时正文带行数限制', () => {
    const html = renderToStaticMarkup(
      <CompanyProfile
        name="Alpha Devices"
        facts={[
          { id: 'sector', label: 'Sector', value: 'Electronic technology' },
          { id: 'employees', label: 'Employees' },
        ]}
        description="Designs devices."
        collapsedLines={3}
        labels={labels}
      />,
    )
    expect(count(html, /data-slot="company-profile-fact"/g)).toBe(2)
    expect(html).toContain('Electronic technology')
    expect(html).toMatch(/Employees<\/dt><dd>—<\/dd>/)
    expect(html).toContain('-webkit-line-clamp:3')
    expect(html).toContain('data-expanded="false"')
  })

  it('默认展开时出「收起」按钮，aria-expanded 为真；没有数据画空态', () => {
    const html = renderToStaticMarkup(<CompanyProfile name="A" description="Text" defaultExpanded labels={labels} />)
    expect(html).toContain('aria-expanded="true"')
    expect(html).toContain('Show less')
    const empty = renderToStaticMarkup(<CompanyProfile name="A" labels={labels} />)
    expect(empty).toContain('company-profile-empty')
    expect(empty).toContain('Not connected')
  })
})

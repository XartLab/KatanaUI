// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { MarketBrowser, type MarketBrowserLabels, type MarketCategory } from './market-browser.tsx'

const labels: MarketBrowserLabels = {
  search: '搜索币对',
  categories: '市场分类',
  list: '市场',
  columns: { symbol: '币对', last: '最新价', change: '24h 涨跌' },
  empty: '还没有自选',
  noResults: '没有匹配',
  favorite: (row) => `自选 ${row.symbol}`,
}
const rows = [
  { id: 'a', symbol: 'BTC-USDT', name: 'Bitcoin', last: 94820.5, change: 1500, changePct: 1.62, favorite: true },
  { id: 'b', symbol: 'ETH-USDT', name: 'Ethereum', last: 3312.4, change: -28, changePct: -0.84 },
]
const categories: MarketCategory[] = [
  { id: 'favorites', label: '自选', rows: rows.filter((row) => row.favorite) },
  { id: 'all', label: '全部', rows },
]

describe('MarketBrowser', () => {
  it('搜索框、分类页签（第一个默认选中）、表的读屏名与列头', () => {
    const html = renderToStaticMarkup(<MarketBrowser categories={categories} labels={labels} />)
    expect(html).toContain('type="search"')
    expect(html).toContain('aria-label="搜索币对"')
    expect(html).toContain('aria-label="市场分类"')
    expect(html).toMatch(/role="tab"[^>]*aria-selected="true"[^>]*>自选</)
    expect(html).toContain('aria-label="市场"')
    expect(html).toContain('最新价')
    expect(html).toContain('24h 涨跌')
  })

  it('行：星标按钮带 aria-pressed 与读屏名，价格与涨跌写成文字（涨带 + 号）', () => {
    const html = renderToStaticMarkup(<MarketBrowser categories={categories} labels={labels} defaultValue="all" />)
    expect(html).toContain('aria-label="自选 BTC-USDT"')
    expect(html).toMatch(/aria-label="自选 BTC-USDT"[^>]*aria-pressed="true"/)
    expect(html).toMatch(/aria-label="自选 ETH-USDT"[^>]*aria-pressed="false"/)
    expect(html).toContain('94820.50')
    expect(html).toContain('+1.62%')
    expect(html).toContain('-0.84%')
    expect(html.match(/data-slot="market-row"/g)).toHaveLength(2)
  })

  it('给了 onSelect 行可聚焦；不给就不是链接', () => {
    const on = renderToStaticMarkup(<MarketBrowser categories={categories} labels={labels} onSelect={() => {}} />)
    expect(on).toContain('tabindex="0"')
    expect(on).toContain('is-link')
    const off = renderToStaticMarkup(<MarketBrowser categories={categories} labels={labels} />)
    expect(off).not.toMatch(/data-slot="market-row"[^>]*tabindex/)
    expect(off).not.toContain('is-link')
  })

  it('受控排序：当前列头带 aria-sort，行按它排', () => {
    const html = renderToStaticMarkup(
      <MarketBrowser categories={categories} labels={labels} defaultValue="all" sort={{ key: 'chgPct', dir: 'asc' }} />,
    )
    expect(html).toMatch(/aria-sort="ascending"[^>]*><button[^>]*data-key="chgPct"/)
    expect(html.indexOf('ETH-USDT</span>')).toBeLessThan(html.indexOf('BTC-USDT</span>'))
  })

  it('分类里没有行写 empty', () => {
    const html = renderToStaticMarkup(
      <MarketBrowser categories={[{ id: 'favorites', label: '自选', rows: [] }]} labels={labels} />,
    )
    expect(html).toContain('role="status"')
    expect(html).toContain('还没有自选')
    expect(html).not.toContain('<table')
  })
})

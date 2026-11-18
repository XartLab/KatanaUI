// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { isRecentList, matchRange, pushRecent, recentInSegment, splitMatch } from './symbol-search-model.ts'
import { SymbolSearch } from './symbol-search.tsx'

// #77 第 1 条：纯函数与静态结构。键盘、异步查询、最近搜索的增删在 e2e/ui-gallery.spec.ts 用真浏览器验。
const btc = {
  id: 'BINANCE:BTCUSDT',
  symbol: 'BTCUSDT',
  name: 'Bitcoin / TetherUS',
  exchange: 'Binance',
  market: 'crypto',
}
const aapl = { id: 'NASDAQ:AAPL', symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', market: 'stock' }
const moutai = { id: 'SSE:600519', symbol: '600519', name: '贵州茅台', exchange: 'SSE', market: 'stock' }

describe('symbol-search-model', () => {
  it('matchRange / splitMatch：不分大小写的第一段，空词不命中', () => {
    expect(matchRange('BTCUSDT', 'usd')).toEqual([3, 6])
    expect(matchRange('BTCUSDT', '  ')).toBeNull()
    expect(matchRange('BTCUSDT', 'eth')).toBeNull()
    expect(splitMatch('Bitcoin', 'coin')).toEqual({ before: 'Bit', hit: 'coin', after: '' })
    expect(splitMatch('贵州茅台', '茅台')).toEqual({ before: '贵州', hit: '茅台', after: '' })
  })

  it('pushRecent：挪到最前、按 id 去重、限长', () => {
    expect(pushRecent([btc, aapl], aapl, 8).map((item) => item.id)).toEqual([aapl.id, btc.id])
    expect(pushRecent([btc, aapl], moutai, 2).map((item) => item.id)).toEqual([moutai.id, btc.id])
    expect(pushRecent([btc], aapl, 0)).toEqual([])
  })

  it('recentInSegment：all 全给，别的按 market 过滤', () => {
    expect(recentInSegment([btc, aapl, moutai], 'all')).toHaveLength(3)
    expect(recentInSegment([btc, aapl, moutai], 'stock').map((item) => item.symbol)).toEqual(['AAPL', '600519'])
    expect(recentInSegment([btc], 'futures')).toEqual([])
  })

  it('isRecentList：形状不对的存档当没存过', () => {
    expect(isRecentList([btc])).toBe(true)
    expect(isRecentList([{ id: 1 }])).toBe(false)
    expect(isRecentList({})).toBe(false)
  })
})

describe('SymbolSearch 结构', () => {
  const html = renderToStaticMarkup(
    <SymbolSearch
      onQuery={() => []}
      onSelect={() => {}}
      segments={[
        { id: 'all', label: 'All' },
        { id: 'stock', label: 'Stocks' },
      ]}
      recent={[btc, aapl]}
      labels={{ title: 'Symbol search', recent: 'Recent', segments: 'Markets', placeholder: 'Symbol' }}
    />,
  )

  it('输入框是 combobox，名字取 title；分段是一组 aria-pressed 按钮', () => {
    expect(html).toContain('role="combobox"')
    expect(html).toContain('aria-label="Markets"')
    expect(html.match(/aria-pressed=/g)).toHaveLength(2)
  })

  it('空查询先列最近搜索：每行徽标、代码、名称、交易所', () => {
    expect(html).toContain('data-slot="symbol-search-recent"')
    expect(html.match(/data-slot="symbol-search-row"/g)).toHaveLength(2)
    expect(html).toContain('data-slot="symbol-mark"')
    expect(html).toContain('Bitcoin / TetherUS')
    expect(html).toContain('Binance')
  })
})

// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { SymbolSearch, type SymbolSearchItem } from '../../src/blocks'

// 演示数据，不是行情。
const SYMBOLS: readonly SymbolSearchItem[] = [
  {
    id: 'BINANCE:BTCUSDT',
    symbol: 'BTCUSDT',
    name: 'Bitcoin / TetherUS',
    exchange: 'Binance',
    market: 'crypto',
    type: '现货',
  },
  { id: 'NASDAQ:AAPL', symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', market: 'stock', type: '股票' },
  {
    id: 'NASDAQ:AMD',
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    exchange: 'NASDAQ',
    market: 'stock',
    type: '股票',
  },
  { id: 'SSE:600519', symbol: '600519', name: '贵州茅台', exchange: 'SSE', market: 'stock', type: '股票' },
  { id: 'NASDAQ:QQQ', symbol: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ', market: 'fund', type: 'ETF' },
]

export function SymbolSearchUsage() {
  const [recent, setRecent] = useState<SymbolSearchItem[]>([SYMBOLS[3]!])
  return (
    <div
      style={{
        width: 560,
        height: 300,
        overflow: 'hidden',
        borderRadius: 14,
        border: '1px solid var(--k-overlay-dialog-borderColor)',
      }}
    >
      <SymbolSearch
        defaultQuery="a"
        debounceMs={0}
        segments={[
          { id: 'all', label: '全部' },
          { id: 'stock', label: '股票' },
          { id: 'fund', label: '基金' },
          { id: 'crypto', label: '加密' },
        ]}
        recent={recent}
        onRecentChange={setRecent}
        onQuery={(query, segment) =>
          SYMBOLS.filter(
            (item) =>
              (segment === 'all' || item.market === segment) &&
              `${item.symbol} ${item.name}`.toLowerCase().includes(query.trim().toLowerCase()),
          )
        }
        onSelect={() => {}}
        labels={{
          title: '品种搜索',
          placeholder: '代码或名称',
          segments: '市场',
          recent: '最近搜索',
          empty: '没有匹配的品种',
          loading: '搜索中…',
          clear: '清空',
        }}
      />
    </div>
  )
}

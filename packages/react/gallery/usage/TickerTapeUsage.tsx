// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TickerTape, type TickerItem } from '../../src/quotes'

// 演示数据（固定，不是行情）：走势是写死的几段。
export const TICKER_ITEMS: readonly TickerItem[] = [
  {
    id: 'spx',
    symbol: 'SPX500',
    last: 7355.1,
    change: 8.1,
    changePct: 0.11,
    currency: 'USD',
    series: [7310, 7322, 7318, 7340, 7336, 7355],
  },
  {
    id: 'ndx',
    symbol: 'NAS100',
    last: 27154.5,
    change: 110.8,
    changePct: 0.41,
    currency: 'USD',
    series: [26990, 27050, 27010, 27100, 27120, 27154],
  },
  {
    id: 'dji',
    symbol: 'US30',
    last: 50689.7,
    change: -76.1,
    changePct: -0.15,
    currency: 'USD',
    series: [50800, 50760, 50790, 50720, 50700, 50690],
  },
  {
    id: 'eur',
    symbol: 'EURUSD',
    last: 1.09679,
    change: -0.003,
    changePct: -0.27,
    series: [1.0998, 1.099, 1.0985, 1.0978, 1.0972, 1.0968],
  },
  {
    id: 'btc',
    symbol: 'BTCUSD',
    last: 63978,
    change: -902,
    changePct: -1.39,
    currency: 'USD',
    series: [64900, 64700, 64800, 64300, 64100, 63978],
  },
  {
    id: 'eth',
    symbol: 'ETHUSD',
    last: 1794.6,
    change: -27.9,
    changePct: -1.53,
    currency: 'USD',
    series: [1822, 1815, 1818, 1805, 1799, 1794.6],
  },
]

const DIGITS: Readonly<Record<string, number>> = { EURUSD: 5, BTCUSD: 0 }

export function TickerTapeUsage({ paused }: { paused?: boolean }) {
  const [picked, setPicked] = useState<string>('')
  return (
    <div style={{ width: 720, display: 'grid', gap: 8 }} data-gallery-ticker data-picked={picked}>
      <TickerTape
        items={TICKER_ITEMS}
        labels={{
          region: '行情跑马灯',
          pause: '暂停滚动',
          resume: '继续滚动',
          trend: (item) => `${item.symbol} 近期走势`,
        }}
        formatPrice={(value, item) =>
          value.toLocaleString('en-US', {
            minimumFractionDigits: DIGITS[item.symbol] ?? 1,
            maximumFractionDigits: DIGITS[item.symbol] ?? 1,
          })
        }
        paused={paused}
        onSelect={(item) => setPicked(item.symbol)}
      />
      <TickerTape
        items={TICKER_ITEMS}
        layout="inline"
        mode="static"
        labels={{ region: '行情条（不滚动）', pause: '暂停滚动', resume: '继续滚动' }}
      />
    </div>
  )
}

// SPDX-License-Identifier: MIT
import { TradeTape, type Trade } from '../../src/blocks'

// 演示数据：编出来的，不是行情。从新到旧，id 稳定。
const T0 = Date.UTC(2026, 10, 22, 9, 30, 0)
const TRADES: Trade[] = [
  { id: 6, time: T0 + 6000, price: 100.01, size: 0.4, side: 'buy' },
  { id: 5, time: T0 + 5000, price: 100.01, size: 0.2, side: 'buy' },
  { id: 4, time: T0 + 4000, price: 100, size: 6.5, side: 'sell' },
  { id: 3, time: T0 + 3000, price: 100.01, size: 1.1, side: 'buy' },
  { id: 2, time: T0 + 2000, price: 100, size: 0.3, side: 'sell' },
  { id: 1, time: T0 + 1000, price: 100, size: 0.7, side: 'sell' },
]

export function TradeTapeUsage() {
  return (
    <div style={{ maxWidth: 360 }}>
      <TradeTape
        trades={TRADES}
        priceDecimals={2}
        sizeDecimals={3}
        largeSize={5}
        aggregate
        labels={{
          list: '成交明细',
          columns: { time: '时间', price: '价格', size: '数量' },
          sides: { buy: '主动买', sell: '主动卖' },
          count: (n) => `×${n}`,
          large: '大单',
          empty: '还没有成交',
        }}
      />
    </div>
  )
}

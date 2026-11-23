// SPDX-License-Identifier: MIT
import { OrderBook } from '../../src/blocks'

// 演示数据：编出来的，不是行情。
const BIDS = [
  { price: 99.99, size: 1.2 },
  { price: 99.98, size: 0.8 },
  { price: 99.95, size: 2.4 },
  { price: 99.9, size: 3.1 },
]
const ASKS = [
  { price: 100.01, size: 0.9 },
  { price: 100.02, size: 1.6 },
  { price: 100.05, size: 2 },
  { price: 100.1, size: 2.7 },
]

export function OrderBookUsage() {
  return (
    <div style={{ maxWidth: 360 }}>
      <OrderBook
        bids={BIDS}
        asks={ASKS}
        priceDecimals={2}
        sizeDecimals={3}
        tickOptions={[0.01, 0.05, 0.1]}
        depth={4}
        last={100}
        lastTone="up"
        onPriceSelect={(price, side) => console.log(price, side)}
        labels={{
          list: '订单簿',
          modes: { group: '显示模式', both: '买卖', bids: '只看买', asks: '只看卖' },
          tick: '合并档位',
          columns: { price: '价格', size: '数量', total: '累计' },
          bid: '买',
          ask: '卖',
          spread: '价差',
          share: (bid, ask) => `买盘占 ${bid}，卖盘占 ${ask}`,
          empty: '没有档位',
        }}
      />
    </div>
  )
}

// SPDX-License-Identifier: MIT
import { DepthChart } from '../../src/blocks'

// 演示数据：编出来的，不是行情。
const BIDS = [
  { price: 99.99, size: 1.2 },
  { price: 99.97, size: 2.8 },
  { price: 99.93, size: 3.5 },
  { price: 99.85, size: 6 },
  { price: 99.7, size: 9 },
]
const ASKS = [
  { price: 100.01, size: 0.9 },
  { price: 100.04, size: 2.1 },
  { price: 100.09, size: 3.8 },
  { price: 100.18, size: 5.2 },
  { price: 100.3, size: 8 },
]

export function DepthChartUsage() {
  return (
    <div style={{ maxWidth: 480 }}>
      <DepthChart
        bids={BIDS}
        asks={ASKS}
        priceDecimals={2}
        sizeDecimals={3}
        rangePct={0.3}
        height={180}
        labels={{
          chart: '深度图',
          bid: '买盘',
          ask: '卖盘',
          mid: '中间价',
          total: '累计量',
          offset: '距中间价',
          empty: '没有档位',
        }}
      />
    </div>
  )
}

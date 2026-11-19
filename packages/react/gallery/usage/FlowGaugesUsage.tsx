// SPDX-License-Identifier: MIT
import { FlowGauges, type FlowGaugeData } from '../../src/blocks'

const flowGauges: readonly FlowGaugeData[] = [
  {
    kind: 'pressure',
    id: 'mp',
    title: 'MARKET PRESSURE · 1m',
    value: 62,
    valueText: '+62',
    note: '买方 · 近 60s 逐笔',
  },
  { kind: 'priceChange', id: 'pc', title: 'PRICE CHANGE · 5m', value: -18, valueText: '−18', note: '−100 … +100' },
  {
    kind: 'dom',
    id: 'dom',
    title: 'DOM PRESSURE · 10 档',
    bids: [60, 80, 100, 70],
    asks: [40, 30, 50, 20],
    summary: '前 10 档：买盘 71%，卖盘 29%',
    note: 'Bid 71% · Ask 29%',
  },
  {
    kind: 'divergence',
    id: 'dd',
    title: 'DELTA DIVERGENCE',
    rows: [
      { window: '5s', cells: ['off', 'off', 'ok', 'ok', 'on', 'on'], summary: '近期两格同向，其余无背离' },
      { window: '1m', cells: ['off', 'ok', 'ok', 'ok', 'ok', 'warn'], summary: '末格背离预警' },
      { window: '5m', cells: ['off', 'off', 'off', 'ok', 'ok', 'ok'], summary: '近三格同向' },
      { window: '20m', cells: null, summary: '数据不足' },
    ],
    note: '20m · N/A（数据不足）',
  },
]

export function FlowGaugesUsage() {
  return (
    <>
      <div style={{ width: 620 }}>
        <FlowGauges label="订单流仪表" gauges={flowGauges} />
      </div>

      <div style={{ width: 620 }}>
        <FlowGauges
          label="订单流仪表（缺数据）"
          gauges={[
            {
              kind: 'pressure',
              id: 'mp',
              title: 'MARKET PRESSURE · 1m',
              value: null,
              valueText: '',
              note: '窗口不足',
            },
            {
              kind: 'priceChange',
              id: 'pc',
              title: 'PRICE CHANGE · 5m',
              value: 24,
              valueText: '+24',
              estimated: true,
              note: '无逐笔方向',
            },
          ]}
          labels={{ estimate: '估算' }}
        />
      </div>
    </>
  )
}

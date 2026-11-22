// SPDX-License-Identifier: MIT
import { PositionsTable, type Position, type PositionsTableLabels } from '../../src/blocks'

// 演示数据：品种、价格与强平价都是编出来的，不是行情；强平价由调用方（交易所接口）给，件只算距离。
export const POSITIONS: readonly Position[] = [
  {
    id: 'btc-long',
    symbol: 'BTCUSDT',
    side: 'long',
    quantity: 0.5,
    entryPrice: 64000,
    markPrice: 64250,
    liquidationPrice: 52300,
    unrealizedPnl: 125,
    margin: 3200,
    leverage: 10,
    pricePrecision: 1,
  },
  {
    id: 'eth-short',
    symbol: 'ETHUSDT',
    side: 'short',
    quantity: 8,
    entryPrice: 3100,
    markPrice: 3150,
    liquidationPrice: 3380,
    unrealizedPnl: -400,
    margin: 4960,
    leverage: 5,
    pricePrecision: 2,
  },
  {
    id: 'sol-long',
    symbol: 'SOLUSDT',
    side: 'long',
    quantity: 120,
    entryPrice: 160,
    markPrice: 148.2,
    liquidationPrice: 143,
    unrealizedPnl: -1416,
    margin: 3840,
    leverage: 5,
    pricePrecision: 2,
  },
  {
    id: 'xau-long',
    symbol: 'XAUUSD',
    side: 'long',
    quantity: 2,
    entryPrice: 2640,
    markPrice: 2652.5,
    liquidationPrice: null,
    unrealizedPnl: 25,
    margin: null,
    leverage: null,
    pricePrecision: 2,
  },
]

export const POSITIONS_LABELS: PositionsTableLabels = {
  list: '持仓（演示数据）',
  columns: {
    symbol: '品种',
    side: '方向',
    quantity: '数量',
    entry: '开仓均价',
    mark: '标记价',
    liquidation: '强平价',
    distance: '强平距离',
    pnl: '未实现盈亏',
    margin: '保证金 / 杠杆',
    actions: '操作',
  },
  side: { long: '多', short: '空' },
  close: '平仓',
  tpsl: '止盈止损',
  closeFor: (position) => `平仓 ${position.symbol} ${position.side === 'long' ? '多' : '空'}`,
  tpslFor: (position) => `设置止盈止损 ${position.symbol}`,
  risk: { warn: '接近强平', danger: '极近强平' },
  totals: {
    label: '合计',
    count: (count) => `${count} 个持仓`,
    pnl: '未实现盈亏',
    margin: '保证金',
    atRisk: (count) => `${count} 个接近强平`,
  },
  empty: '没有持仓',
}

export function PositionsTableUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 1040 }}>
      <PositionsTable
        positions={POSITIONS}
        labels={POSITIONS_LABELS}
        liquidationWarnPct={10}
        onClose={(position) => console.log('平仓', position.id)}
        onSetTpsl={(position) => console.log('止盈止损', position.id)}
      />
    </div>
  )
}

// SPDX-License-Identifier: MIT
import { OrdersTable, type Order, type OrdersTableLabels } from '../../src/blocks'

// 演示数据：委托是编出来的；时间是固定的毫秒时间戳（UTC）。
export const ORDERS: readonly Order[] = [
  {
    id: 'o-1001',
    symbol: 'BTCUSDT',
    side: 'buy',
    type: 'limit',
    price: 63800,
    quantity: 0.3,
    filled: 0,
    status: 'open',
    time: Date.UTC(2026, 10, 22, 1, 20, 5),
    pricePrecision: 1,
  },
  {
    id: 'o-1002',
    symbol: 'BTCUSDT',
    side: 'sell',
    type: 'limit',
    price: 66000,
    quantity: 0.5,
    filled: 0.2,
    status: 'partial',
    time: Date.UTC(2026, 10, 22, 1, 42, 31),
    pricePrecision: 1,
  },
  {
    id: 'o-1003',
    symbol: 'ETHUSDT',
    side: 'sell',
    type: 'conditional',
    price: 3395,
    triggerPrice: 3380,
    quantity: 4,
    filled: 0,
    status: 'pending',
    time: Date.UTC(2026, 10, 22, 2, 5, 12),
    pricePrecision: 2,
  },
  {
    id: 'o-1004',
    symbol: 'SOLUSDT',
    side: 'buy',
    type: 'limit',
    price: 140,
    quantity: 50,
    filled: 0,
    status: 'canceling',
    time: Date.UTC(2026, 10, 22, 2, 31, 48),
    pricePrecision: 2,
  },
]

export const ORDERS_LABELS: OrdersTableLabels = {
  list: '委托（演示数据）',
  columns: {
    symbol: '品种',
    side: '方向',
    type: '类型',
    price: '价格',
    quantity: '数量',
    filled: '已成交',
    status: '状态',
    time: '时间（UTC）',
    actions: '操作',
  },
  side: { buy: '买', sell: '卖' },
  type: { limit: '限价', market: '市价', conditional: '条件' },
  status: { open: '挂单', partial: '部分成交', pending: '待触发', canceling: '撤单中' },
  cancel: '撤单',
  cancelFor: (order) => `撤单 ${order.symbol} ${order.id}`,
  amendFor: (order) => `改价 ${order.symbol} ${order.id}`,
  amendInput: (order) => `${order.symbol} 新价格`,
  amendInvalid: '价格要大于 0',
  cancelAll: '全部撤单',
  summary: (count) => `${count} 张委托`,
  empty: '没有委托',
}

export function OrdersTableUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 960 }}>
      <OrdersTable
        orders={ORDERS}
        labels={ORDERS_LABELS}
        onCancel={(order) => console.log('撤单', order.id)}
        onCancelAll={(orders) => console.log('全部撤单', orders.length)}
        onAmend={(order, price) => console.log('改价', order.id, price)}
      />
    </div>
  )
}

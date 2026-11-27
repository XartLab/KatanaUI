# OrdersTable

账户四件之一（#104）：一行一张在途委托：品种、方向（买 / 卖，文字）、类型（限价 / 市价 / 条件）、价格、数量、已成交（数量加进度条）、状态、时间；行内「撤单」；价格旁铅笔进入行内改价：回车提交 onAmend(order, price)，Esc 或失焦取消；表上方「全部撤单」发 onCancelAll(还能撤的单)。市价单与撤单中的单不能改价。件不下单，只发回调。

## Provide

`*` marks a required prop.

### OrdersTable

委托 Order 见类型；status 是调用方归好的四档。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `orders` * | `readonly Order[]` | — | Working orders. |
| `labels` * | `OrdersTableLabels` | — | Texts. |
| `onCancel` | `(order: Order) => void` | — | Called when the cancel button of a row is pressed. |
| `onCancelAll` | `(orders: Order[]) => void` | — | Called with every order that can still be cancelled when "cancel all" is pressed; the caller confirms with the user. |
| `onAmend` | `(order: Order, price: number) => void` | — | Called when Enter is pressed on a changed, valid price; the caller sends the amend and updates the order. |
| `formatPrice` | `(value: number, order: Order) => string` | `defaultPrice` | How a price is written; defaults to the order's pricePrecision. |
| `formatQuantity` | `(value: number, order: Order) => string` | `(value) => defaultQuantity(value)` | How a quantity is written; defaults to up to 8 decimals without trailing zeros. |
| `formatTime` | `(time: number) => string` | `defaultTime` | How the created time is written; defaults to HH:MM:SS in UTC. |
| `hideBar` | `boolean` | — | Hide the bar above the table (summary and cancel all). |
| `className` | `string` | — | Extra class name on the root. |

### amendDecision

纯函数：回车时提交、只关框还是留在框里。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `price` * | `number \| null` | — | Order price; null for a market order (or a conditional order that becomes a market order). |

### canAmend

纯函数：能否改价。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `status` * | `OrderStatus` | — | Lifecycle status, already normalised by the caller. |
| `type` * | `OrderType` | — | Order type: limit, market or conditional. |
| `price` * | `number \| null` | — | Order price; null for a market order (or a conditional order that becomes a market order). |

### canCancel

纯函数：能否撤单。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `status` * | `OrderStatus` | — | Lifecycle status, already normalised by the caller. |

### cancellable

纯函数：「全部撤单」的范围。

### fillRatio

纯函数：已成交占比，0 到 1。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `quantity` * | `number` | — | Ordered quantity. |
| `filled` * | `number` | — | Filled quantity so far. |

### parseAmendPrice

纯函数：改价框文字转正的有限数。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { OrdersTable, type Order, type OrdersTableLabels } from '@katana-ui/react/blocks'

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
```

## States

- 改价：点铅笔，价格格换成输入框并全选；Enter 提交（价格没变只关框），Esc 或失焦取消，非法输入标红。
- 撤单中：状态标签变警告色，撤单按钮进行中（Button pending：满 300ms 出转圈、再按无效、字与宽不变，不再置灰），没有铅笔。
- 没传 onCancel / onAmend / onCancelAll 时对应控件不画；空表写 labels.empty。

## Don't

- 不要在件里等交易所回报：发出回调后由调用方改状态。
- 不要做成点一下就提交的改价：回车才提交。

## Composition

```
OrdersTable
  统计与「全部撤单」
  DataGrid
    行：品种 | 买卖 | 类型 | 价格 | 数量 | 已成交 | 状态 | 时间 | 撤单
```

## Keyboard

- `Enter`：改价框里：提交新价
- `Esc`：改价框里：取消
- `Tab`：在行内按钮之间移动

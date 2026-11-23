# PositionsTable

账户四件之一（#104，#103 持仓监控的表）：一行一个持仓，列出品种、方向（多 / 空，文字）、数量、开仓均价、标记价、强平价、强平距离（% 加进度条）、未实现盈亏（金额与 %）、保证金与杠杆；行内「平仓」「止盈止损」只发回调；表尾合计。强平距离近于调用方给的阈值（liquidationWarnPct）时整格换警示色并带图标，再近一半是危险档。同页的 PositionsOrdersTabs 把持仓表与委托表摆进同一个页签外壳。件不认识交易所，不下单。

## Provide

`*` marks a required prop.

### PositionsTable

持仓 Position 见类型；强平价与盈亏由调用方给，件只算强平距离、风险档与合计。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `positions` * | `readonly Position[]` | — | Open positions. |
| `labels` * | `PositionsTableLabels` | — | Texts. |
| `liquidationWarnPct` | `number` | `10` | Distance in percent at or below which a row shows the warning color and icon; defaults to 10. |
| `liquidationDangerPct` | `number` | — | Distance in percent at or below which the warning turns to danger; defaults to half of the warn distance. |
| `liquidationScalePct` | `number` | — | Distance in percent that fills the whole bar; defaults to three times the warn distance. |
| `onClose` | `(position: Position) => void` | — | Called when the close button of a row is pressed; the caller decides full or partial and confirms with the user. |
| `onSetTpsl` | `(position: Position) => void` | — | Called when the take-profit / stop-loss button of a row is pressed. |
| `formatPrice` | `(value: number, position: Position) => string` | — | How a price is written; defaults to the position's pricePrecision. |
| `formatQuantity` | `(value: number, position: Position) => string` | — | How a quantity is written; defaults to up to 8 decimals without trailing zeros. |
| `formatAmount` | `(value: number) => string` | `defaultAmount` | How a money amount (PnL, margin) is written; defaults to two decimals with grouping. |
| `hideTotals` | `boolean` | — | Hide the footer totals. |
| `className` | `string` | — | Extra class name on the root. |

### PositionsOrdersTabs

positions 与 orders 两组属性原样传给两张表。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `positions` * | `PositionsTableProps` | — | Props of the positions tab, passed on to PositionsTable. |
| `orders` * | `OrdersTableProps` | — | Props of the orders tab, passed on to OrdersTable. |
| `labels` * | `PositionsOrdersTabsLabels` | — | Texts of the shell. |
| `tab` | `PositionsOrdersTab` | — | Controlled tab; omit for uncontrolled. |
| `defaultTab` | `PositionsOrdersTab` | `'positions'` | Tab shown first when uncontrolled. |
| `onTabChange` | `(tab: PositionsOrdersTab) => void` | — | Called when the tab changes. |
| `className` | `string` | — | Extra class name on the root. |

### liquidationDistance

纯函数：多头 (标记价 − 强平价) / 标记价，空头反过来，百分数；无强平价为 null。

### liquidationFill

纯函数：距离在进度条上的填充，0 到 1。

### liquidationRisk

纯函数：≤ danger 危险、≤ warn 警告、其余安全。

### positionTotals

纯函数：表尾合计。

### unrealizedPercent

纯函数：盈亏占保证金的百分比。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `quantity` * | `number` | — | Absolute position size. |
| `unrealizedPnl` * | `number` | — | Unrealized PnL in the settlement currency. |
| `margin` * | `number \| null` | — | Margin held for this position; null for unmargined positions. |
| `entryPrice` * | `number` | — | Average entry price. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { PositionsTable, type Position, type PositionsTableLabels } from '@katana-ui/react/blocks'

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
```

## States

- 强平距离：安全是灰色进度条；≤ 警示阈值是警告色加三角图标；≤ 阈值一半是危险色加粗；已越过强平价也是危险。无强平价写「—」。
- 盈亏：金额带正负号，百分比跟在后面；颜色跟 data-updown。
- 没传 onClose / onSetTpsl 时对应按钮不画；空表写 labels.empty。

## Don't

- 不要在件里下单：平仓全部还是部分、要不要确认，都在调用方回调里做。
- 不要让件算强平价：各家维持保证金规则不同，由调用方给。
- 不要只靠颜色表示风险：图标有读屏名，距离是文字。

## Composition

```
PositionsOrdersTabs
  Tabs
  PositionsTable
    DataGrid
    表尾合计
  OrdersTable
```

## Keyboard

- `Tab`：在行内按钮之间移动
- `Enter / Space`：触发当前按钮

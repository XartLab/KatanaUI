# OrderTicket

买卖切换、保证金模式与杠杆、限价 / 市价、带「最优价」的价格框、可按成本 / 数量 / 风险三种填法的仓位框与百分比滑杆、勾选后原地展开的止盈止损（可选出场模板，标明交易所托管还是本机触发），下面实时列出张数、名义价值、保证金、开平手续费、总占用、预估强平价、保本价、止盈止损盈亏与盈亏比。按成本：名义价值 = 成本 ÷（1/杠杆 + 开仓费率 + 平仓费率），数量向下取整，改杠杆成本不变。面板只算和显示，账户、费率、规格由调用方传，下单是 onSubmit。功能参照 OKX 下单面板与 ATAS 出场策略、按风险算仓位（2026-11-19 读），实现原创。

## Provide

`*` marks a required prop.

### OrderTicket

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `instrument` * | `OrderTicketInstrument` | — | Contract spec and display names. |
| `account` * | `OrderTicketAccount` | — | Balance, fee rates, maintenance margin rate and any held position. |
| `market` * | `OrderTicketMarket` | — | Last price and best bid / ask. |
| `maxLeverage` | `number` | — | Highest leverage allowed; leave out for spot and unlevered venues, which hides the leverage controls. |
| `defaultLeverage` | `number` | `1` | Starting leverage. |
| `marginModes` | `readonly MarginMode[]` | — | Margin modes on offer; leave out to hide the selector. |
| `defaultSide` | `OrderSide` | `'buy'` | Starting side. |
| `defaultSizingMode` | `SizingMode` | `'cost'` | How the size box is read at first: cost (default), quantity or risk. |
| `defaultAmount` | `string` | `''` | Starting text of the size box. |
| `defaultExits` | `{ takeProfit?: string; stopLoss?: string }` | — | Starting take-profit and stop-loss prices; giving either opens the exits section. |
| `includeCloseFee` | `boolean` | `true` | Count the estimated closing fee in the cost. |
| `exitTemplates` | `readonly ExitTemplate[]` | — | Saved exit templates, as percent distances from the entry. |
| `stopCustody` | `StopCustody` | `'venue'` | Where stops live: held by the venue, or triggered locally. |
| `labels` * | `OrderTicketLabels` | — | All visible text and accessible names. |
| `locale` | `string` | — | BCP 47 tag for number formatting, defaults to the browser language. |
| `onSubmit` * | `(order: OrderDraft) => void` | — | Called with the order when the submit button is clicked. |
| `onLeverageChange` | `(leverage: number) => void` | — | Called when the leverage changes. |
| `onMarginModeChange` | `(mode: MarginMode) => void` | — | Called when the margin mode changes. |
| `onOpenCalculator` | `() => void` | — | Called when the calculator button is clicked; leave out to hide the button. |
| `className` | `string` | — | Extra class name on the panel. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { OrderTicket, type OrderDraft, type OrderTicketLabels } from '@katana-ui/react/blocks'

const LABELS: OrderTicketLabels = {
  side: 'Side',
  buy: 'Buy / Long',
  sell: 'Sell / Short',
  marginMode: 'Margin mode',
  marginModes: { cross: 'Cross', isolated: 'Isolated' },
  leverage: 'Leverage',
  orderType: 'Order type',
  orderTypes: { limit: 'Limit', market: 'Market' },
  price: 'Price',
  marketPrice: 'Market',
  best: 'BBO',
  sizingMode: 'Size by',
  sizingModes: { cost: 'Cost', quantity: 'Quantity', risk: 'Risk' },
  percent: 'Percent of available',
  available: 'Available',
  exits: 'TP / SL',
  exitTemplate: 'Exit template',
  noTemplate: 'No template',
  takeProfit: 'Take profit',
  stopLoss: 'Stop loss',
  custody: { venue: 'Held by exchange', local: 'Local trigger' },
  size: 'Size',
  notional: 'Notional',
  margin: 'Margin',
  fees: 'Fees (open + close)',
  cost: 'Total cost',
  liquidation: 'Liq. price',
  estimate: 'est.',
  breakeven: 'Breakeven',
  rewardRisk: 'Reward : risk',
  averageAfter: 'Position after fill',
  issues: {
    'below-min': 'Below the minimum order size',
    'exceeds-available': 'Costs more than the available balance',
    'no-stop': 'Sizing by risk needs a stop-loss price',
    'stop-wrong-side': 'The stop loss is on the profit side of the entry',
  },
  submit: { buy: 'Buy / Long', sell: 'Sell / Short' },
  calculator: 'Open calculator',
}

// Demo numbers, not live data: a BTCUSDT perpetual where one contract is 0.01 BTC.
export function OrderTicketUsage() {
  const [last, setLast] = useState<OrderDraft>()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <OrderTicket
        instrument={{
          symbol: 'BTC-USDT-SWAP',
          base: 'BTC',
          quote: 'USDT',
          contractValue: 0.01,
          lotSize: 0.01,
          minSize: 0.01,
          tickSize: 0.1,
          sizeUnit: 'Cont',
        }}
        account={{ available: 250, fees: { open: 0.0005, close: 0.0005 }, maintenanceMarginRate: 0.004 }}
        market={{ last: 60000, bid: 59999.9, ask: 60000.1 }}
        maxLeverage={125}
        defaultLeverage={100}
        marginModes={['isolated', 'cross']}
        defaultAmount="10"
        defaultExits={{ takeProfit: '61200', stopLoss: '59700' }}
        exitTemplates={[
          { id: 'scalp', name: 'Scalp · TP 1% / SL 0.5%', takeProfit: 0.01, stopLoss: 0.005 },
          { id: 'swing', name: 'Swing · TP 6% / SL 2%', takeProfit: 0.06, stopLoss: 0.02 },
        ]}
        labels={LABELS}
        locale="en-US"
        onSubmit={setLast}
        onOpenCalculator={() => undefined}
      />
      {last ? (
        <output className="k-text-caption text-ink-3">
          {last.side} {last.contracts} @ {last.price ?? 'market'}
        </output>
      ) : null}
    </div>
  )
}
```

## States

- 没填数量：读数全是 0，提交钮禁用，不报错。
- 不足最小下单量 / 超过可用：仓位框红边，下面一行 role=alert 写原因，提交钮禁用。
- 按风险：止盈止损一栏强制展开；没填止损或止损填在盈利一侧，止损框红边并写原因。
- 市价：价格框灰掉写 labels.marketPrice，按对手价（买看卖一、卖看买一）算。
- 没给 maxLeverage（现货、A 股）：杠杆与保证金模式不显示，保证金与强平价两行不显示，等于「按金额买」。
- stopCustody=local：止盈止损栏右上写「本机触发」并用警示色；venue 写「交易所托管」。

## Don't

- 不要在面板里取账户或下单：数据由调用方传，onSubmit 里走自己的执行网关。
- 强平价是单仓逐仓的近似，标着「预估」；全仓或交易所给了精确值时，不要拿这个数当准。
- 币本位（反向）合约不要用它算，公式只对正向合约与现货成立。
- 账户级风控（日亏线、连亏次数）不放进这里。

## Composition

```
OrderTicket
  SideSwitch（买 / 卖）
  Select（保证金模式）· 杠杆框
  ToggleGroup（限价 / 市价）
  价格框 · Button（最优价）
  Select（填法）· 仓位框 · Slider（0–100%）
  Checkbox（止盈止损）· Select（出场模板）· 止盈框 · 止损框
  读数（dl）
  提交钮 · Button（计算器）
```

## Keyboard

- `Tab`：买卖、保证金模式、杠杆、委托类型、价格、最优价、填法、仓位、滑杆、止盈止损、提交，依次走
- `← →`：在滑杆上按 1% 调仓位
- `Space`：在止盈止损的勾选框上展开或收起
- `Enter`：在买卖钮、最优价、提交钮上触发

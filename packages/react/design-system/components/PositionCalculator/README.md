# PositionCalculator

简化的计算器：方向、开仓价、平仓价、数量、杠杆五个输入，答三件事——平在这个价赚或亏多少（含开平手续费，另给保证金回报率）、预估强平价、保本价。打开时由调用方带入当前价格、杠杆、数量与费率，不用从头手填。PositionCalculator 是弹窗，PositionCalculatorPanel 是可内嵌的主体。

## Provide

`*` marks a required prop.

### PositionCalculatorPanel

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `instrument` * | `InstrumentSpec & { tickSize: number; quote: string; sizeUnit: string }` | — | Contract spec plus tick size and unit names. |
| `fees` * | `FeeRates` | — | Fee rates as fractions. |
| `maintenanceMarginRate` | `number` | — | Maintenance margin rate as a fraction; without it no liquidation price is shown. |
| `defaultSide` | `OrderSide` | `'buy'` | Starting side. |
| `defaultEntry` * | `number` | — | Starting entry price, normally the current price. |
| `defaultExit` | `number` | — | Starting exit price. |
| `defaultContracts` | `number` | `1` | Starting size in contracts. |
| `defaultLeverage` | `number` | `1` | Starting leverage. |
| `labels` * | `PositionCalculatorLabels` | — | All visible text and accessible names. |
| `locale` | `string` | — | BCP 47 tag for number formatting, defaults to the browser language. |
| `className` | `string` | — | Extra class name on the panel. |

### PositionCalculator

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `instrument` * | `InstrumentSpec & { tickSize: number; quote: string; sizeUnit: string }` | — | Contract spec plus tick size and unit names. |
| `fees` * | `FeeRates` | — | Fee rates as fractions. |
| `maintenanceMarginRate` | `number` | — | Maintenance margin rate as a fraction; without it no liquidation price is shown. |
| `defaultSide` | `OrderSide` | — | Starting side. |
| `defaultEntry` * | `number` | — | Starting entry price, normally the current price. |
| `defaultExit` | `number` | — | Starting exit price. |
| `defaultContracts` | `number` | — | Starting size in contracts. |
| `defaultLeverage` | `number` | — | Starting leverage. |
| `labels` * | `PositionCalculatorLabels` | — | All visible text and accessible names. |
| `locale` | `string` | — | BCP 47 tag for number formatting, defaults to the browser language. |
| `className` | `string` | — | Extra class name on the panel. |
| `open` * | `boolean` | — | Whether the dialog is open. |
| `onOpenChange` * | `(open: boolean) => void` | — | Called when the dialog asks to open or close. |
| `title` * | `string` | — | Dialog title. |
| `closeLabel` * | `string` | — | Accessible name of the close button. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { PositionCalculatorPanel } from '@katana-ui/react/blocks'

// Inline body shown here; PositionCalculator wraps the same panel in a dialog (open, onOpenChange, title, closeLabel).
export function PositionCalculatorUsage() {
  return (
    <PositionCalculatorPanel
      instrument={{ contractValue: 0.01, lotSize: 0.01, tickSize: 0.1, quote: 'USDT', sizeUnit: 'Cont' }}
      fees={{ open: 0.0005, close: 0.0005 }}
      maintenanceMarginRate={0.004}
      defaultEntry={60000}
      defaultExit={61200}
      defaultContracts={1.51}
      defaultLeverage={100}
      locale="en-US"
      labels={{
        side: 'Side',
        buy: 'Long',
        sell: 'Short',
        entry: 'Entry',
        exit: 'Exit',
        size: 'Size',
        leverage: 'Leverage',
        pnl: 'Profit / loss',
        roe: 'Return on margin',
        liquidation: 'Liq. price',
        estimate: 'est.',
        breakeven: 'Breakeven',
      }}
    />
  )
}
```

## States

- 没填平仓价：盈亏与回报率写「—」，强平价与保本价照算。
- 没给 maintenanceMarginRate，或多头不加杠杆：强平价写「—」。

## Don't

- 不要拿它下单，它只算数；下单用 OrderTicket。
- 强平价是近似，标着「预估」。

## Composition

```
PositionCalculator
  Dialog · DialogHeader · DialogTitle
  PositionCalculatorPanel
    SideSwitch · 开仓价 · 平仓价 · 数量 · 杠杆
    读数（dl）
```

## Keyboard

- `Tab`：方向、开仓价、平仓价、数量、杠杆，依次走
- `Esc`：关掉弹窗

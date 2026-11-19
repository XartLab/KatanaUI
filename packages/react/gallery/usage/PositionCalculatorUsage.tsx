// SPDX-License-Identifier: MIT
import { PositionCalculatorPanel } from '../../src/blocks'

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

// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { OrderTicket, type OrderDraft, type OrderTicketLabels } from '../../src/blocks'

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

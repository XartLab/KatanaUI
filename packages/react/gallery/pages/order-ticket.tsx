// SPDX-License-Identifier: MIT
// OrderTicket 页的预览：先是「用法」那份最小例子，下面是受控价格与锁住态的示例（#176）：订单簿点一档，两栏的限价跟着变；
// 交易锁开着时两个下单钮灰掉、钮下写原因。盘口是写死的示例档位，不是行情。
import { useState } from 'react'
import { OrderBook, OrderTicket, type OrderSide } from '../../src/blocks'
import { Switch } from '../../src/index'
import { ORDER_TICKET_LABELS, OrderTicketUsage } from '../usage/OrderTicketUsage.tsx'
import { Row } from './parts.tsx'

// 示例数据：BTC-USDT-SWAP，一张 0.01 BTC，tick 0.1，最新价 60000，可用 250 USDT。
const INSTRUMENT = {
  symbol: 'BTC-USDT-SWAP',
  base: 'BTC',
  quote: 'USDT',
  contractValue: 0.01,
  lotSize: 0.01,
  minSize: 0.01,
  tickSize: 0.1,
  sizeUnit: 'Cont',
}
const BIDS = [
  { price: 59999.9, size: 1.2 },
  { price: 59999.5, size: 0.8 },
  { price: 59998, size: 2.4 },
  { price: 59995, size: 3.1 },
]
const ASKS = [
  { price: 60000.1, size: 0.9 },
  { price: 60000.5, size: 1.6 },
  { price: 60002, size: 2 },
  { price: 60005, size: 2.7 },
]

function ControlledTicket() {
  const [price, setPrice] = useState<Partial<Record<OrderSide, string>>>({})
  const [locked, setLocked] = useState(false)
  const [picked, setPicked] = useState<string>()
  return (
    <div className="gal-stack" data-gallery-ticket-controlled style={{ width: '100%' }}>
      <p className="gal-note">
        示例：盘口是写死的示例档位，不是行情。点一档，两栏的限价都换成这档价；打开交易锁，两个下单钮灰掉、钮下写原因，填的数都留着。
      </p>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Switch checked={locked} onCheckedChange={setLocked} aria-label="Trading lock" />
        Trading lock
      </label>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div style={{ maxWidth: 360 }}>
          <OrderBook
            bids={BIDS}
            asks={ASKS}
            priceDecimals={1}
            sizeDecimals={2}
            depth={4}
            last={60000}
            lastTone="up"
            onPriceSelect={(level) => {
              const text = level.toFixed(1)
              setPrice({ buy: text, sell: text })
              setPicked(text)
            }}
            labels={{
              list: 'Order book (example)',
              modes: { group: 'Book mode', both: 'Both', bids: 'Bids', asks: 'Asks' },
              tick: 'Merge ticks',
              columns: { price: 'Price', size: 'Size', total: 'Total' },
              bid: 'Bid',
              ask: 'Ask',
              spread: 'Spread',
              share: (bid, ask) => `Bids ${bid}, asks ${ask}`,
              empty: 'No levels',
            }}
          />
          <p className="gal-note" data-gallery-ticket-picked>
            {picked ? `Picked ${picked}` : 'Click a level to fill the limit price'}
          </p>
        </div>
        <OrderTicket
          instrument={INSTRUMENT}
          account={{ available: 250, fees: { open: 0.0005, close: 0.0005 }, maintenanceMarginRate: 0.004 }}
          market={{ last: 60000, bid: 59999.9, ask: 60000.1 }}
          maxLeverage={125}
          defaultLeverage={100}
          defaultAmount="10"
          price={price}
          onPriceChange={(text, side) => setPrice((current) => ({ ...current, [side]: text }))}
          locked={locked}
          lockedReason="Trading lock is on: unlock it in the status bar"
          labels={ORDER_TICKET_LABELS}
          locale="en-US"
          onSubmit={() => undefined}
        />
      </div>
    </div>
  )
}

export function OrderTicketDemo() {
  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <OrderTicketUsage />
      <Row name="受控价格与交易锁：price / onPriceChange 接订单簿点价，locked / lockedReason 接交易锁">
        <ControlledTicket />
      </Row>
    </div>
  )
}

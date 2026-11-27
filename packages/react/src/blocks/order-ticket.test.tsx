// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { OrderTicket, type OrderTicketLabels } from './order-ticket.tsx'

// #176：受控价格与锁住态的结构；2026-11-27 起版式照 OKX（一份表单、两个钮、两栏读数）。打字、点最优价回调 onPriceChange、点订单簿回填，在文档站的真浏览器里验（模式页「下单到确认」）。

const LABELS: OrderTicketLabels = {
  action: 'Open or close',
  actions: { open: 'Open', close: 'Close' },
  side: 'Side',
  buy: 'Long',
  sell: 'Short',
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
  maxOpen: { buy: 'Max long', sell: 'Max short' },
  exits: 'TP / SL',
  exitTemplate: 'Exit template',
  noTemplate: 'No template',
  takeProfit: 'Take profit',
  stopLoss: 'Stop loss',
  custody: { venue: 'Held by exchange', local: 'Local trigger' },
  size: 'Size',
  notional: 'Notional',
  margin: 'Margin',
  fees: 'Fees',
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
  submit: { buy: 'Open long', sell: 'Open short' },
  submitClose: { buy: 'Close short', sell: 'Close long' },
  feeRate: 'Fees',
  calculator: 'Calculator',
}

// 示例数据：一张 0.01 BTC，最新价 60000，可用 250。
const render = (props: Partial<Parameters<typeof OrderTicket>[0]> = {}) =>
  renderToStaticMarkup(
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
      account={{ available: 250, fees: { open: 0.0005, close: 0.0005 } }}
      market={{ last: 60000, bid: 59999.9, ask: 60000.1 }}
      maxLeverage={125}
      defaultLeverage={100}
      defaultAmount="10"
      labels={LABELS}
      locale="en-US"
      onSubmit={() => undefined}
      {...props}
    />,
  )

/** 取带某个 data-slot 的标签原文。 */
const tags = (html: string, element: 'input' | 'button', slot: string) =>
  [...html.matchAll(new RegExp(`<${element}\\b[^>]*data-slot="${slot}"[^>]*>`, 'g'))].map((match) => match[0])
const attr = (tag: string, name: string) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1]
const priceValues = (html: string) => tags(html, 'input', 'ticket-price').map((tag) => attr(tag, 'value'))
/** 某个读数格（带 data-side）里的字。 */
const cell = (html: string, slot: string, side: 'buy' | 'sell') =>
  new RegExp(`data-slot="${slot}" data-side="${side}"[^>]*>(?:<[^>]+>)*([^<]+)`).exec(html)?.[1]

describe('OrderTicket 受控价格', () => {
  it('只有一个价格框；不给价格：从最新价起（按 tick 写）', () => {
    expect(priceValues(render())).toEqual(['60000.0'])
  })

  it('price 受控：取 buy，没有 buy 取 sell', () => {
    expect(priceValues(render({ price: { buy: '59990.5' } }))).toEqual(['59990.5'])
    expect(priceValues(render({ price: { sell: '60010.0' } }))).toEqual(['60010.0'])
    expect(priceValues(render({ price: { buy: '59990.5', sell: '60010.0' } }))).toEqual(['59990.5'])
  })

  it('defaultPrice 不受控：一开始的字；price 同时给时以 price 为准', () => {
    expect(priceValues(render({ defaultPrice: { sell: '61000' } }))).toEqual(['61000'])
    expect(priceValues(render({ defaultPrice: { buy: '1' }, price: { buy: '2' } }))).toEqual(['2'])
  })

  it('受控价格进读数：张数按给的价算（10 USDT、100 倍、开平各 0.05%，30000 时一张 300，3.03 张）', () => {
    const html = render({ price: { buy: '30000' } })
    expect(cell(html, 'ticket-size', 'buy')).toContain('3.03 Cont')
    expect(cell(html, 'ticket-size', 'sell')).toContain('3.03 Cont')
  })

  it('价格步进：给了 stepUp / stepDown 才画上下箭头', () => {
    expect(render()).not.toContain('Raise')
    expect(render({ labels: { ...LABELS, stepUp: 'Raise', stepDown: 'Lower' } })).toContain('aria-label="Raise"')
  })
})

describe('OrderTicket 版式', () => {
  it('一份表单：数量、价格框各一个，下单钮两个（买在前）', () => {
    const html = render()
    expect(tags(html, 'input', 'ticket-amount')).toHaveLength(1)
    expect(tags(html, 'button', 'ticket-submit').map((tag) => attr(tag, 'data-side'))).toEqual(['buy', 'sell'])
  })

  it('没填数量：读数写 --，明细不出现；填了才出现', () => {
    const empty = render({ defaultAmount: '' })
    expect(cell(empty, 'ticket-notional', 'buy')).toBe('--')
    expect(empty).not.toContain('data-slot="ticket-details"')
    expect(render()).toContain('data-slot="ticket-details"')
  })

  it('最高买价 / 最低卖价：行情给了限价并且两个标签都给了才显示', () => {
    const market = { last: 60000, bid: 59999.9, ask: 60000.1, maxBuy: 61200, minSell: 58800 }
    expect(render({ market })).not.toContain('ticket-max-buy')
    const html = render({ market, labels: { ...LABELS, maxBuyPrice: 'Max buy', minSellPrice: 'Min sell' } })
    expect(html).toContain('61,200.0')
    expect(html).toContain('58,800.0')
  })

  it('市价页签没有价格框、限价页签有（限价是默认页签）', () => {
    expect(render()).toContain('data-slot="ticket-price"')
  })
})

describe('OrderTicket 保证金模式与杠杆', () => {
  it('保证金模式是带箭头的下拉格，当前项写在格里（OKX 同款，取代 kubai 020 的分段，#251）', () => {
    const html = render({ marginModes: ['isolated', 'cross'] })
    expect(html).toMatch(/<button\b[^>]*role="combobox"[^>]*aria-label="Margin mode"/)
    expect(html).not.toContain('data-slot="ticket-margin-mode"><button')
    expect(html).toContain('data-slot="ticket-leverage-cell"')
  })

  it('不给 marginModes：没有保证金模式格；不给 maxLeverage：连杠杆格也没有', () => {
    expect(render()).not.toContain('Margin mode')
    expect(render({ maxLeverage: undefined })).not.toContain('ticket-leverage-cell')
  })
})

describe('OrderTicket 锁住态', () => {
  it('没锁：下单钮可点，没有原因行', () => {
    const html = render({ lockedReason: 'Trading lock is on' })
    for (const tag of tags(html, 'button', 'ticket-submit')) {
      expect(tag).not.toMatch(/\sdisabled=""/)
      expect(attr(tag, 'aria-describedby')).toBeUndefined()
    }
    expect(html).not.toContain('data-slot="ticket-locked"')
    expect(html).not.toContain('Trading lock is on')
  })

  it('锁住：两个下单钮都灰掉，钮下写一行原因，两个钮经 aria-describedby 读到它；面板照样算数', () => {
    const html = render({ locked: true, lockedReason: 'Trading lock is on' })
    const buttons = tags(html, 'button', 'ticket-submit')
    expect(buttons).toHaveLength(2)
    const ids = new Set<string>()
    for (const tag of buttons) {
      expect(tag).toMatch(/\sdisabled=""/)
      expect(attr(tag, 'data-locked')).toBe('true')
      const id = attr(tag, 'aria-describedby')!
      expect(id).toBeTruthy()
      ids.add(id)
      expect(html).toMatch(new RegExp(`<p id="${id}" data-slot="ticket-locked"[^>]*>.*?Trading lock is on</p>`))
    }
    // 两个钮共用一行原因。
    expect(ids.size).toBe(1)
    expect(cell(html, 'ticket-size', 'buy')).toContain('1.51 Cont')
  })

  it('锁住但没给原因：钮照样灰掉，不挂空的描述', () => {
    const html = render({ locked: true })
    for (const tag of tags(html, 'button', 'ticket-submit')) {
      expect(tag).toMatch(/\sdisabled=""/)
      expect(attr(tag, 'aria-describedby')).toBeUndefined()
    }
    expect(html).not.toContain('data-slot="ticket-locked"')
  })
})

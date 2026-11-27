// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { OrderTicket, type OrderTicketLabels } from './order-ticket.tsx'

// #176：受控价格与锁住态的结构。打字、点最优价回调 onPriceChange、点订单簿回填，在文档站的真浏览器里验（模式页「下单到确认」）。

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

/** 按出现次序（买栏在前、卖栏在后）取带某个 data-slot 的标签原文。 */
const tags = (html: string, element: 'input' | 'button', slot: string) =>
  [...html.matchAll(new RegExp(`<${element}\\b[^>]*data-slot="${slot}"[^>]*>`, 'g'))].map((match) => match[0])
const attr = (tag: string, name: string) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1]
const priceValues = (html: string) => tags(html, 'input', 'ticket-price').map((tag) => attr(tag, 'value'))

describe('OrderTicket 受控价格', () => {
  it('不给价格：两栏都从最新价起（按 tick 写）', () => {
    expect(priceValues(render())).toEqual(['60000.0', '60000.0'])
  })

  it('price 受控：两栏各显示给的那一份，没给的一栏照旧', () => {
    expect(priceValues(render({ price: { buy: '59990.5' } }))).toEqual(['59990.5', '60000.0'])
    expect(priceValues(render({ price: { buy: '59990.5', sell: '60010.0' } }))).toEqual(['59990.5', '60010.0'])
  })

  it('defaultPrice 不受控：一开始的字；price 同时给时以 price 为准', () => {
    expect(priceValues(render({ defaultPrice: { sell: '61000' } }))).toEqual(['60000.0', '61000'])
    expect(priceValues(render({ defaultPrice: { buy: '1' }, price: { buy: '2' } }))).toEqual(['2', '60000.0'])
  })

  it('受控价格进读数：张数按给的价算（10 USDT、100 倍、开平各 0.05%，30000 时一张 300，3.03 张）', () => {
    const html = render({ price: { buy: '30000' } })
    const sizes = [...html.matchAll(/data-slot="ticket-size"[^>]*>(?:<[^>]+>)*([^<]+)/g)].map((match) => match[1])
    expect(sizes[0]).toContain('3.03 Cont')
    expect(sizes[1]).toContain('1.51 Cont')
  })
})

describe('OrderTicket 保证金模式', () => {
  it('两项是分段：一直都看得见，当前项 aria-pressed，不是下拉（kubai 020，#251）', () => {
    const html = render({ marginModes: ['isolated', 'cross'] })
    const group = /<div\b[^>]*data-slot="ticket-margin-mode"[^>]*>([\s\S]*?)<\/div>/.exec(html)
    expect(group).not.toBeNull()
    expect(group![0]).toContain('aria-label="Margin mode"')
    const buttons = [...group![1]!.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map((match) => match[0])
    expect(buttons.map((tag) => /(Cross|Isolated)/.exec(tag)?.[1])).toEqual(['Isolated', 'Cross'])
    expect(buttons.map((tag) => /aria-pressed="([^"]*)"/.exec(tag)?.[1])).toEqual(['true', 'false'])
    // 保证金模式没有下拉触发器（计量方式 Size by 仍是下拉，是例外）。
    expect(html).not.toMatch(/<button\b[^>]*role="combobox"[^>]*aria-label="Margin mode"/)
  })

  it('不给 marginModes：没有这一组', () => {
    expect(render()).not.toContain('data-slot="ticket-margin-mode"')
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

  it('锁住：两个下单钮都灰掉，钮下写原因，钮经 aria-describedby 读到它；面板照样算数', () => {
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
    // 两栏各一份原因，id 不重复。
    expect(ids.size).toBe(2)
    expect(html).toContain('1.51 Cont')
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

// SPDX-License-Identifier: MIT
import { useRef, useState } from 'react'
import {
  OrderBook,
  OrdersTable,
  OrderTicket,
  PanelFrame,
  PanelFrameBody,
  PanelFrameHeader,
  type Order,
  type OrderDraft,
  type OrderSide,
  type OrderBookLabels,
  type OrderTicketLabels,
  type StopCustody,
} from '../../src/blocks'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Switch,
  Toast,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastIcon,
  ToastText,
  ToastTitle,
  ToastViewport,
  ToggleGroup,
  ToggleGroupItem,
} from '../../src/index'
import { ORDERS_LABELS } from '../usage/OrdersTableUsage'
import { replyNotice, submitToGateway, type ReplyNotice } from './trading-sim'
import type { Pattern } from './types'

// 演示数据：一个永续合约，一张 0.01 BTC，最新价 60000，可用 250 USDT；网关是 trading-sim.ts 里的假网关，不连任何交易所。
const SYMBOL = 'BTC-USDT-SWAP'
const INSTRUMENT = {
  symbol: SYMBOL,
  base: 'BTC',
  quote: 'USDT',
  contractValue: 0.01,
  lotSize: 0.01,
  minSize: 0.01,
  tickSize: 0.1,
  sizeUnit: '张',
}
const ACCOUNT = { available: 250, fees: { open: 0.0005, close: 0.0005 }, maintenanceMarginRate: 0.004 }
const MARKET = { last: 60000, bid: 59999.9, ask: 60000.1, maxBuy: 61200, minSell: 58800 }
// 演示盘口：写死的几档，不跳动；点一档回填下单面板的限价。
const BOOK_BIDS = [
  { price: 59999.9, size: 1.2 },
  { price: 59999.5, size: 0.8 },
  { price: 59998, size: 2.4 },
  { price: 59995, size: 3.1 },
  { price: 59990, size: 4.6 },
]
const BOOK_ASKS = [
  { price: 60000.1, size: 0.9 },
  { price: 60000.5, size: 1.6 },
  { price: 60002, size: 2 },
  { price: 60005, size: 2.7 },
  { price: 60010, size: 3.8 },
]
const LOCKED_REASON = '交易锁开着，不能下单'
const REJECT_REASON = '交易所回：保证金不足（演示）'

const TICKET_LABELS: OrderTicketLabels = {
  action: '开仓或平仓',
  actions: { open: '开仓', close: '平仓' },
  side: '方向',
  buy: '买入',
  sell: '卖出',
  marginMode: '保证金模式',
  marginModes: { cross: '全仓', isolated: '逐仓' },
  leverage: '杠杆',
  orderType: '委托类型',
  orderTypes: { limit: '限价', market: '市价' },
  price: '价格',
  marketPrice: '按市价',
  best: '最优价',
  sizingMode: '填法',
  sizingModes: { cost: '按成本', quantity: '按数量', risk: '按风险' },
  percent: '占可用的比例',
  available: '可用',
  maxOpen: { buy: '可开多', sell: '可开空' },
  exits: '止盈止损',
  exitTemplate: '出场模板',
  noTemplate: '不用模板',
  takeProfit: '止盈价',
  stopLoss: '止损价',
  custody: { venue: '交易所托管', local: '本机触发' },
  exitUnits: { price: '价格', change: '涨跌幅', roe: '收益率', pnl: '盈亏额' },
  exitUnit: '止盈止损的填法',
  triggerPrice: '触发价',
  triggerPrices: { last: '最新价', mark: '标记价格', index: '指数价格' },
  exitSides: { buy: '多', sell: '空' },
  size: '张数',
  notional: '订单价值',
  margin: '保证金',
  fees: '手续费（开 + 平）',
  cost: '总占用',
  liquidation: '强平价',
  estimate: '预估',
  breakeven: '保本价',
  rewardRisk: '盈亏比',
  averageAfter: '成交后均价',
  issues: {
    'below-min': '不足最小下单量',
    'exceeds-available': '超过可用余额',
    'no-stop': '按风险算要先填止损价',
    'stop-wrong-side': '止损在盈利一侧',
  },
  submit: { buy: '开多', sell: '开空' },
  submitClose: { buy: '平空', sell: '平多' },
  feeRate: '费率',
  calculator: '计算器',
  contractValue: '单张委托价值',
  maxBuyPrice: '最高买价',
  minSellPrice: '最低卖价',
  positionBuilder: '仓位创建器',
  transfer: '划转资金',
  help: '委托类型说明',
  stepUp: '价格加一档',
  stepDown: '价格减一档',
}

const BOOK_LABELS: OrderBookLabels = {
  list: '订单簿',
  modes: { group: '显示模式', both: '买卖', bids: '只看买', asks: '只看卖' },
  tick: '合并档位',
  columns: { price: '价格', size: '数量', total: '累计' },
  bid: '买',
  ask: '卖',
  spread: '价差',
  share: (bid, ask) => `买盘占 ${bid}，卖盘占 ${ask}`,
  empty: '没有档位',
}

const number = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 })
const row = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } as const

type Notice = ReplyNotice & { id: number }

/** 确认窗：把读数区里决定这笔单的几个数原样再摆一次，发出前最后看一眼。 */
function Confirm({
  draft,
  custody,
  onSend,
  onCancel,
}: {
  draft: OrderDraft | null
  custody: StopCustody
  onSend: (draft: OrderDraft) => void
  onCancel: () => void
}) {
  const lines: [string, string][] = draft
    ? [
        ['品种', SYMBOL],
        ['方向', `${draft.reduceOnly ? '平仓' : '开仓'} · ${draft.side === 'buy' ? '买入' : '卖出'}`],
        ['价格', draft.price === undefined ? '按市价' : `${draft.price} USDT`],
        ['张数', `${draft.contracts} 张 · ${draft.leverage} 倍`],
        ['总占用', `${number.format(draft.sizing.cost)} USDT`],
        [
          '预估强平价',
          draft.sizing.liquidationPrice === undefined ? '—' : `${number.format(draft.sizing.liquidationPrice)} USDT`,
        ],
        [
          '止盈止损',
          draft.takeProfit === undefined && draft.stopLoss === undefined
            ? '没有'
            : `${draft.takeProfit ?? '—'} / ${draft.stopLoss ?? '—'} · ${TICKET_LABELS.custody[custody]}`,
        ],
      ]
    : []
  return (
    <Dialog open={draft !== null} onOpenChange={(open) => (open ? undefined : onCancel())}>
      <DialogContent closeLabel="关闭" style={{ width: 400 }}>
        <DialogHeader>
          <DialogTitle>确认下单</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription>发出前再看一眼；点「发出」才交给执行网关。</DialogDescription>
          <dl data-testid="confirm-lines" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 16px' }}>
            {lines.map(([term, value]) => (
              <div key={term} style={{ display: 'contents' }}>
                <dt>{term}</dt>
                <dd style={{ margin: 0, fontVariantNumeric: 'tabular-nums' }}>{value}</dd>
              </div>
            ))}
          </dl>
        </DialogBody>
        <DialogFooter>
          <Button onClick={onCancel}>取消</Button>
          <Button variant="primary" onClick={() => draft && onSend(draft)}>
            发出
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Demo() {
  const [locked, setLocked] = useState(false)
  const [reply, setReply] = useState<'accept' | 'reject'>('accept')
  const [custody, setCustody] = useState<StopCustody>('venue')
  const [oneClick, setOneClick] = useState(false)
  const [pending, setPending] = useState<OrderDraft | null>(null)
  const [notices, setNotices] = useState<readonly Notice[]>([])
  const [orders, setOrders] = useState<readonly Order[]>([])
  const [price, setPrice] = useState<Partial<Record<OrderSide, string>>>({})
  const seq = useRef(1)

  const send = (draft: OrderDraft) => {
    setPending(null)
    const id = seq.current++
    const answer = submitToGateway(
      draft,
      { locked, reject: reply === 'reject' ? REJECT_REASON : null },
      { id: `demo-${id}`, time: Date.now(), symbol: SYMBOL, pricePrecision: 1 },
    )
    if (answer.kind === 'accepted') setOrders((list) => [answer.order, ...list])
    setNotices((list) => [{ id, ...replyNotice(answer, draft, SYMBOL) }, ...list].slice(0, 3))
  }

  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 1000 }}>
      <p className="gal-note">
        演示数据：假网关，不连交易所。下面几个开关只在演示里有，用来摆出各种回答；把成本填到 250
        以上看「超过可用」；点订单簿一档，下单面板的限价跟着换。
      </p>
      <div style={row} role="group" aria-label="演示开关">
        <label style={row}>
          <Switch checked={locked} onCheckedChange={setLocked} aria-label="交易锁" />
          交易锁
        </label>
        <label style={row}>
          <Switch checked={oneClick} onCheckedChange={setOneClick} aria-label="一键下单（不弹确认）" />
          一键下单（不弹确认）
        </label>
        <ToggleGroup
          size="sm"
          aria-label="交易所回答（演示）"
          value={reply}
          onValueChange={(value) => value && setReply(value as 'accept' | 'reject')}
        >
          <ToggleGroupItem value="accept">交易所接受</ToggleGroupItem>
          <ToggleGroupItem value="reject">交易所拒单</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          size="sm"
          aria-label="止盈止损放在哪（场所能力，演示）"
          value={custody}
          onValueChange={(value) => value && setCustody(value as StopCustody)}
        >
          <ToggleGroupItem value="venue">交易所托管</ToggleGroupItem>
          <ToggleGroupItem value="local">本机触发</ToggleGroupItem>
        </ToggleGroup>
      </div>
      {locked ? (
        <Alert tone="warn" data-testid="lock-banner">
          <AlertTitle>交易锁开着</AlertTitle>
          <AlertDescription>
            面板照样算数、填的数都留着；两个下单钮灰掉，原因写在钮下。解锁在状态栏的交易锁上。
          </AlertDescription>
        </Alert>
      ) : null}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
        <PanelFrame aria-label="订单簿">
          <PanelFrameHeader heading="订单簿" object={`· ${SYMBOL} · 演示数据`} />
          <PanelFrameBody>
            <OrderBook
              bids={BOOK_BIDS}
              asks={BOOK_ASKS}
              priceDecimals={1}
              sizeDecimals={2}
              depth={5}
              last={MARKET.last}
              lastTone="up"
              onPriceSelect={(level) => {
                const text = level.toFixed(1)
                setPrice({ buy: text, sell: text })
              }}
              labels={BOOK_LABELS}
            />
          </PanelFrameBody>
        </PanelFrame>
        <PanelFrame aria-label="下单">
          <PanelFrameHeader heading="下单" object={`· ${SYMBOL} · 演示数据`} />
          <PanelFrameBody>
            <OrderTicket
              instrument={INSTRUMENT}
              account={ACCOUNT}
              market={MARKET}
              maxLeverage={125}
              defaultLeverage={100}
              marginModes={['isolated', 'cross']}
              defaultAmount="10"
              price={price}
              onPriceChange={(text, side) => setPrice((current) => ({ ...current, [side]: text }))}
              locked={locked}
              lockedReason={LOCKED_REASON}
              stopCustody={custody}
              triggerPriceTypes={['last', 'mark', 'index']}
              labels={TICKET_LABELS}
              locale="zh-CN"
              onSubmit={(draft) => (oneClick ? send(draft) : setPending(draft))}
            />
          </PanelFrameBody>
        </PanelFrame>
        <div className="gal-stack">
          {/* 页内摆出：static 盖掉视口的 fixed；靠上的角新的一条排在最上。 */}
          <ToastViewport
            position="top-right"
            className="static w-full"
            aria-label="下单结果"
            data-testid="order-results"
          >
            {notices.map((notice) => (
              <Toast key={notice.id} tone={notice.tone}>
                <ToastContent>
                  <ToastIcon />
                  <ToastText>
                    <ToastTitle>{notice.title}</ToastTitle>
                    <ToastDescription>{notice.description}</ToastDescription>
                  </ToastText>
                  <ToastClose
                    label="关掉这条提示"
                    onClick={() => setNotices((list) => list.filter((item) => item.id !== notice.id))}
                  />
                </ToastContent>
              </Toast>
            ))}
          </ToastViewport>
          {notices.length === 0 ? <p className="gal-note">下单的结果在这里弹出（应用里在窗口右下角）。</p> : null}
        </div>
      </div>
      <PanelFrame aria-label="委托">
        <PanelFrameHeader heading="委托" object={`· ${orders.length} 张 · 演示数据`} />
        <PanelFrameBody>
          <OrdersTable
            orders={orders}
            labels={ORDERS_LABELS}
            onCancel={(order) =>
              setOrders((list) => list.map((item) => (item.id === order.id ? { ...item, status: 'canceling' } : item)))
            }
            onAmend={(order, price) =>
              setOrders((list) => list.map((item) => (item.id === order.id ? { ...item, price } : item)))
            }
          />
        </PanelFrameBody>
      </PanelFrame>
      <Confirm draft={pending} custody={custody} onSend={send} onCancel={() => setPending(null)} />
    </div>
  )
}

const pattern: Pattern = {
  id: 'order-to-confirmation',
  title: '下单到确认',
  summary:
    '从填单到看见结果：面板里先看下单前的数，点下单弹确认窗，发出后网关的回答用弹出提示说，挂出的限价单出现在委托表里。',
  Demo,
  use: [
    '手动下一张单：限价或市价、开仓或平仓，要在发出前看清占用、强平价与止盈止损放在哪',
    '任何经执行网关发出的单：结果一律回到同一条弹出提示与同一张委托表，不在面板里另写一遍',
  ],
  avoid: [
    '只算数不下单（算赚多少、强平在哪）：用 PositionCalculator，不要拿下单面板当计算器',
    '平掉已有持仓、撤单与改价：在持仓表与委托表的行内做（见「持仓监控」），不要回到下单面板再填一张反向单',
    '自动下单的策略：它不走确认窗，在账户风控与策略额度里执行；这里只讲人手下单',
  ],
  parts: [
    {
      page: 'order-ticket',
      role: '填单与下单前的数：张数、保证金、总占用、预估强平价、保本价、止盈止损盈亏；超过可用时那一栏报错、下单钮变灰；price / onPriceChange 接订单簿点价，locked / lockedReason 接交易锁',
    },
    { page: 'dialog', role: '确认窗：把决定这笔单的几个数再摆一次，「发出」才交给网关' },
    { page: 'toast', role: '网关的回答：已挂出、已成交、被拒（写原因）、交易锁挡下' },
    { page: 'orders-table', role: '挂出的限价单出现在这里，行内撤单与改价' },
    { page: 'alert', role: '交易锁开着时，面板上方一条常驻说明（去哪解锁）' },
    { page: 'switch', role: '一键下单（跳过确认）是用户自己打开的设置，默认关' },
    {
      page: 'order-book',
      role: '点一档回调 onPriceSelect，回填下单面板的限价（OrderTicket 的受控 price）',
    },
  ],
  rules: [
    '次序固定：填单 → 读数区看数 → 下单钮 → 确认窗 → 网关 → 弹出提示 → 委托表；每一步只有一个去处，不在面板里另画一份结果',
    '点订单簿一档：限价框换成这档价（OrderTicket 受控 price，onPriceSelect 里写回），不直接下单，仍走下单钮与确认窗；照 TradingView 的 DOM，点档按这档价下限价单、默认先确认（帮助中心「Depth of market (DOM)」，2026-11-23 读）。点档是否顺带切回限价页签，页面没写，待核对；这里不切',
    '确认窗默认弹（照 TradingView：一键下单默认关，下单与平仓都先给预览，2026-11-23 读其帮助中心「How to place an order」）；一键下单是用户在设置里自己打开的，打开后点下单直接发出',
    '确认窗只摆读数区里已有的数（方向、价格、张数与杠杆、总占用、预估强平价、止盈止损与托管方式），不另算一遍；数与面板对不上就是 bug',
    '超过可用、不足最小下单量、止损在盈利一侧：面板那一栏当场报错、下单钮变灰，不等网关来拒',
    '交易锁开着：OrderTicket 的 locked 让两个下单钮灰掉，lockedReason 写在钮下（警示色加锁形图标，钮经 aria-describedby 读到），面板照样算数、填的数都留着；面板上方挂一条常驻的 Alert 说去哪解锁。不靠点了下单再被网关挡下来报错',
    '网关仍是交易锁的唯一权威：绕过面板发来的单，锁开着时不出网关，弹 warn 语气的提示「没有发出：交易锁开着」',
    '止盈止损写明放在哪：交易所托管（面板关了也生效）或本机触发（本机进程不在就不生效）；本机触发用警示色，确认窗里也写一遍',
    '弹出提示的标题写结果（「委托已挂出」「市价单已成交」「下单被拒」），说明写品种、方向、张数与原因；被拒用 danger，挡下用 warn，成功用 ok',
    '限价单挂出后进委托表的第一行；市价单当场成交，不进委托表，去持仓表看；撤单发出后那一行先变「撤单中」，等回报再消失',
    '下单钮只把单交给调用方（onSubmit），走唯一的执行网关；面板不直连券商、不存单',
  ],
  source: {
    label: 'TradingView · How to place an order',
    href: 'https://www.tradingview.com/support/solutions/43000786671/',
  },
}
export default pattern

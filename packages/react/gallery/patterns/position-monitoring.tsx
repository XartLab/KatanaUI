// SPDX-License-Identifier: MIT
import { useState, type ComponentProps } from 'react'
import {
  AccountEquity,
  PanelFrame,
  PanelFrameBody,
  PanelFrameHeader,
  PositionsOrdersTabs,
  type Order,
  type Position,
  type PositionsOrdersTab,
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
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  useFieldControl,
} from '../../src/index'
import { EQUITY_LABELS } from '../usage/AccountEquityUsage'
import { ORDERS, ORDERS_LABELS } from '../usage/OrdersTableUsage'
import { POSITIONS, POSITIONS_LABELS } from '../usage/PositionsTableUsage'
import { closePosition, nearestLiquidation, parseCloseQuantity } from './trading-sim'
import type { Pattern } from './types'

// 演示数据：持仓与委托取自持仓表、委托表两页的演示数据（gallery/usage），总权益是编的；平仓、撤单、改价只改页上的状态，不连交易所。
const EQUITY = 52430.18
const WARN_PCT = 10
const MARGIN_THRESHOLDS = { warn: 50, danger: 80 }
const money = new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function QuantityInput(props: ComponentProps<typeof Input>) {
  const control = useFieldControl()
  return <Input {...props} {...control} />
}

/** 确认窗的内容：数量默认全部，改小就是部分平仓（照 TradingView 的平仓预览）。换一个持仓就换 key，数量回到全部。 */
function CloseForm({
  position,
  onSend,
  onCancel,
}: {
  position: Position
  onSend: (position: Position, quantity: number) => void
  onCancel: () => void
}) {
  const [text, setText] = useState(String(position.quantity))
  const quantity = parseCloseQuantity(text, position.quantity)
  const share = quantity === null ? 0 : quantity / position.quantity
  return (
    <>
      <DialogBody>
        <DialogDescription>
          {position.symbol} {position.side === 'long' ? '多' : '空'}，持有 {position.quantity}，按市价平掉。
        </DialogDescription>
        <Field invalid={quantity === null}>
          <FieldLabel>平仓数量</FieldLabel>
          <QuantityInput value={text} onChange={(event) => setText(event.target.value)} inputMode="decimal" />
          <FieldDescription>
            按现在的标记价，这部分盈亏约 {money.format(position.unrealizedPnl * share)} USDT。
          </FieldDescription>
          {quantity === null ? <FieldError>填大于 0、不超过 {position.quantity} 的数</FieldError> : null}
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onCancel}>取消</Button>
        <Button variant="primary" disabled={quantity === null} onClick={() => quantity && onSend(position, quantity)}>
          {quantity !== null && quantity < position.quantity ? '部分平仓' : '全部平仓'}
        </Button>
      </DialogFooter>
    </>
  )
}

function CloseConfirm({
  position,
  onSend,
  onCancel,
}: {
  position: Position | null
  onSend: (position: Position, quantity: number) => void
  onCancel: () => void
}) {
  return (
    <Dialog open={position !== null} onOpenChange={(open) => (open ? undefined : onCancel())}>
      <DialogContent closeLabel="关闭" style={{ width: 380 }}>
        <DialogHeader>
          <DialogTitle>确认平仓</DialogTitle>
        </DialogHeader>
        {position ? <CloseForm key={position.id} position={position} onSend={onSend} onCancel={onCancel} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function Demo() {
  const [positions, setPositions] = useState<readonly Position[]>(POSITIONS)
  const [orders, setOrders] = useState<readonly Order[]>(ORDERS)
  const [tab, setTab] = useState<PositionsOrdersTab>('positions')
  const [closing, setClosing] = useState<Position | null>(null)
  const [last, setLast] = useState('没有')

  const usedMargin = positions.reduce((sum, item) => sum + (item.margin ?? 0), 0)
  const unrealized = positions.reduce((sum, item) => sum + item.unrealizedPnl, 0)
  const nearest = nearestLiquidation(positions, WARN_PCT)
  const markCanceling = (ids: ReadonlySet<string>) =>
    setOrders((list) => list.map((item) => (ids.has(item.id) ? { ...item, status: 'canceling' } : item)))

  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 1080 }}>
      <p className="gal-note">
        演示数据：不连交易所。平掉离强平最近的那一个，上面的提醒换到下一个；全都离强平够远，提醒就收起。
      </p>
      <PanelFrame aria-label="账户">
        <PanelFrameHeader heading="账户" object="· 演示数据" />
        <PanelFrameBody>
          <AccountEquity
            equity={EQUITY}
            available={EQUITY - usedMargin}
            usedMargin={usedMargin}
            unrealizedPnl={unrealized}
            thresholds={MARGIN_THRESHOLDS}
            currency="USDT"
            labels={EQUITY_LABELS}
          />
        </PanelFrameBody>
      </PanelFrame>
      {nearest ? (
        <Alert tone={nearest.risk} data-testid="liquidation-alert" data-risk={nearest.risk}>
          <AlertTitle>
            {nearest.position.symbol} {nearest.position.side === 'long' ? '多' : '空'}
            {nearest.risk === 'danger' ? '极近强平' : '接近强平'}：还差 {nearest.distance.toFixed(1)}%
          </AlertTitle>
          <AlertDescription>
            标记价 {nearest.position.markPrice}，强平价 {nearest.position.liquidationPrice}。加保证金、减仓或设止损；
            行里的「强平距离」一格同色。
          </AlertDescription>
        </Alert>
      ) : null}
      <PanelFrame aria-label="持仓与委托">
        <PanelFrameHeader heading="持仓与委托" object="· 演示数据" />
        <PanelFrameBody>
          <PositionsOrdersTabs
            tab={tab}
            onTabChange={setTab}
            labels={{ tabs: '持仓与委托', positions: (count) => `持仓 ${count}`, orders: (count) => `委托 ${count}` }}
            positions={{
              positions,
              labels: POSITIONS_LABELS,
              liquidationWarnPct: WARN_PCT,
              onClose: setClosing,
              onSetTpsl: (position) =>
                setLast(`打开 ${position.symbol} 的止盈止损（演示：应用里开下单面板的止盈止损栏）`),
            }}
            orders={{
              orders,
              labels: ORDERS_LABELS,
              onCancel: (order) => {
                setLast(`撤单 ${order.id}`)
                markCanceling(new Set([order.id]))
              },
              onCancelAll: (targets) => {
                setLast(`全部撤单 ${targets.length} 张`)
                markCanceling(new Set(targets.map((item) => item.id)))
              },
              onAmend: (order, price) => {
                setLast(`改价 ${order.id} → ${price}`)
                setOrders((list) => list.map((item) => (item.id === order.id ? { ...item, price } : item)))
              },
            }}
          />
        </PanelFrameBody>
      </PanelFrame>
      <p className="gal-note" role="status" data-testid="monitor-last">
        最近操作：{last}
      </p>
      <CloseConfirm
        position={closing}
        onCancel={() => setClosing(null)}
        onSend={(position, quantity) => {
          setClosing(null)
          setPositions((list) => closePosition(list, position.id, quantity))
          setLast(`平仓 ${position.symbol} ${quantity}：市价单已发出（演示）`)
        }}
      />
    </div>
  )
}

const pattern: Pattern = {
  id: 'position-monitoring',
  title: '持仓监控',
  summary:
    '开着仓时一直摆在眼前的一块：上面账户权益与保证金率，下面持仓与委托两个页签，行内平仓、撤单、改价；离强平近了，那一格变色，面板上方再挂一条提醒。',
  Demo,
  use: [
    '账户里有持仓或在途委托的任何时候：交易工作区底部常驻的那一块',
    '要在一处看完「还剩多少保证金、哪个仓危险、哪张单还挂着」，并就地处理',
  ],
  avoid: [
    '复盘已经平掉的仓：用成交记录与策略报告，不在持仓表里留历史',
    '开新仓：用下单面板（见「下单到确认」）；行内只做平仓、止盈止损、撤单、改价这些对已有仓和单的动作',
    '只想看一个品种：用品种页里的持仓一行，不要为一个品种开整块',
  ],
  parts: [
    { page: 'account-equity', role: '总权益、可用、已用保证金、未实现盈亏，下面一条保证金率风险条' },
    { page: 'positions-table', role: '持仓：强平距离（文字 + 进度条），近了换警示色；行内平仓与止盈止损；表尾合计' },
    { page: 'orders-table', role: '委托：行内撤单、点铅笔改价（回车提交）、全部撤单' },
    { page: 'tabs', role: '持仓与委托放进同一个页签外壳（PositionsOrdersTabs），页签上写数量' },
    { page: 'alert', role: '离强平最近的一个仓的常驻提醒：写品种、还差多少、强平价，危险档用 danger' },
    { page: 'dialog', role: '平仓前的确认：品种、方向、数量（默认全部，改小是部分平仓）、按市价、预估盈亏' },
    { page: 'field', role: '确认窗里的平仓数量：超过持有或不是正数时报错，平仓钮变灰' },
    { page: 'panel-frame', role: '账户与持仓委托各一个面板外框' },
  ],
  rules: [
    '从上到下：账户权益 → 强平提醒（有才挂）→ 持仓与委托页签；版式照 TradingView 底部的账户管理器（持仓、委托分页签，2026-11-23 读其帮助中心「What is the account manager」）',
    '强平距离两层：表里那一格按调用方给的阈值变色（≤ 阈值警告，≤ 阈值一半危险，强平价由交易所给）；表上方只挂一条，写离强平最近的那一个，平掉或拉开了就换下一个、全安全就收起',
    '强平提醒常驻在面板里，不用弹出提示：它会自己消失，而风险还在；距离同时写成数字，不只靠颜色',
    '平仓默认弹确认（照 TradingView：一键下单关着时平仓也先给预览，数量默认全部、改小就是部分平仓），确认窗写品种、方向、数量、按市价与这部分的预估盈亏；钮上的字跟着写「全部平仓」或「部分平仓」',
    '撤单发出后那一行先变「撤单中」、按钮灰掉，等回报再移走；全部撤单只撤还能撤的',
    '改价照委托表：点铅笔、改数、回车提交，Esc 或失焦取消；市价单与撤单中的单不能改',
    '页签上写数量（「持仓 3」「委托 4」），切到别的页签也知道还有几个仓开着',
    '表里的数都由调用方给（强平价、盈亏、保证金），件只算距离、风险档与合计；行内按钮只发回调，下单走执行网关',
  ],
  source: {
    label: 'TradingView · What is the account manager',
    href: 'https://www.tradingview.com/support/solutions/43000786138/',
  },
}
export default pattern

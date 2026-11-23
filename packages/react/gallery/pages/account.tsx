// SPDX-License-Identifier: MIT
// 账户四件（#104）的文档站预览：持仓表、委托表、账户权益概览、资金费率、期权 T 型报价。数据都是编出来的演示数据，不是行情也不是真实账户；
// 件不下单、不连交易所，这里的回调只改页上的状态并把结果写在旁边的一行字里（e2e 读它）。
import { useState } from 'react'
import {
  AccountEquity,
  FundingRate,
  OptionsChain,
  OrdersTable,
  PanelFrame,
  PanelFrameBody,
  PanelFrameHeader,
  PositionsOrdersTabs,
  PositionsTable,
  type Order,
  type Position,
  type PositionsOrdersTab,
} from '../../src/blocks/index.ts'
import { Button } from '../../src/primitives/button.tsx'
import { EQUITY_CURVE, EQUITY_LABELS } from '../usage/AccountEquityUsage.tsx'
import { FUNDING_HISTORY, FUNDING_LABELS } from '../usage/FundingRateUsage.tsx'
import { EXPIRIES, OPTIONS_LABELS, UNDERLYING, chainFor } from '../usage/OptionsChainUsage.tsx'
import { ORDERS, ORDERS_LABELS } from '../usage/OrdersTableUsage.tsx'
import { POSITIONS, POSITIONS_LABELS } from '../usage/PositionsTableUsage.tsx'

const NOTE = '演示数据：编出来的，不是行情也不是真实账户；件只发回调，不下单。'

function Frame({ heading, maxWidth, children }: { heading: string; maxWidth: number; children: React.ReactNode }) {
  return (
    <div style={{ width: '100%', maxWidth }}>
      <PanelFrame focused aria-label={heading}>
        <PanelFrameHeader heading={heading} object="演示数据" />
        <PanelFrameBody>{children}</PanelFrameBody>
      </PanelFrame>
    </div>
  )
}

export function PositionsTableDemo() {
  const [last, setLast] = useState('没有')
  const [tab, setTab] = useState<PositionsOrdersTab>('positions')
  const [warn, setWarn] = useState(10)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 1080 }}>
      <p className="gal-note">
        {NOTE} 强平距离近于警示阈值（现在 {warn}%）的行换警示色并带图标；点「平仓」「止盈止损」只发回调。
      </p>
      <div className="gal-row" role="group" aria-label="警示阈值">
        {[5, 10, 20].map((value) => (
          <Button
            key={value}
            size="sm"
            variant={warn === value ? 'primary' : 'default'}
            aria-pressed={warn === value}
            onClick={() => setWarn(value)}
          >
            警示阈值 {value}%
          </Button>
        ))}
      </div>
      <Frame heading="持仓" maxWidth={1080}>
        <PositionsTable
          positions={POSITIONS}
          labels={POSITIONS_LABELS}
          liquidationWarnPct={warn}
          onClose={(position: Position) => setLast(`平仓 ${position.symbol}`)}
          onSetTpsl={(position: Position) => setLast(`止盈止损 ${position.symbol}`)}
        />
      </Frame>
      <p className="gal-note" data-testid="pos-last">
        最近操作：{last}
      </p>
      <Frame heading="持仓与委托（页签外壳）" maxWidth={1080}>
        <PositionsOrdersTabs
          tab={tab}
          onTabChange={setTab}
          labels={{ tabs: '持仓与委托', positions: (count) => `持仓 ${count}`, orders: (count) => `委托 ${count}` }}
          positions={{ positions: POSITIONS, labels: POSITIONS_LABELS, liquidationWarnPct: warn }}
          orders={{ orders: ORDERS, labels: ORDERS_LABELS }}
        />
      </Frame>
    </div>
  )
}

export function OrdersTableDemo() {
  const [orders, setOrders] = useState<readonly Order[]>(ORDERS)
  const [last, setLast] = useState('没有')
  const mark = (ids: ReadonlySet<string>) =>
    setOrders((list) => list.map((item) => (ids.has(item.id) ? { ...item, status: 'canceling' } : item)))
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 1000 }}>
      <p className="gal-note">{NOTE} 点价格旁的铅笔改价：回车提交，Esc 取消；撤单发出后调用方把状态改成「撤单中」。</p>
      <Frame heading="委托" maxWidth={1000}>
        <OrdersTable
          orders={orders}
          labels={ORDERS_LABELS}
          onCancel={(order) => {
            setLast(`撤单 ${order.id}`)
            mark(new Set([order.id]))
          }}
          onCancelAll={(targets) => {
            setLast(`全部撤单 ${targets.length}`)
            mark(new Set(targets.map((item) => item.id)))
          }}
          onAmend={(order, price) => {
            setLast(`改价 ${order.id} → ${price}`)
            setOrders((list) => list.map((item) => (item.id === order.id ? { ...item, price } : item)))
          }}
        />
      </Frame>
      <p className="gal-note" data-testid="ord-last">
        最近操作：{last}
      </p>
    </div>
  )
}

const LEVEL_CASES = [
  { id: 'safe', used: 12000 },
  { id: 'warn', used: 31000 },
  { id: 'danger', used: 44000 },
] as const

export function AccountEquityDemo() {
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 760 }}>
      <p className="gal-note">{NOTE} 保证金率风险条：警告 ≥ 50%，危险 ≥ 80%（阈值由调用方传）。</p>
      <Frame heading="账户权益" maxWidth={760}>
        <AccountEquity
          equity={52430.18}
          available={31720.4}
          usedMargin={20709.78}
          unrealizedPnl={-1691}
          thresholds={{ warn: 50, danger: 80 }}
          curve={EQUITY_CURVE}
          currency="USDT"
          labels={EQUITY_LABELS}
        />
      </Frame>
      <p className="gal-note">三档对照（总权益 52,430.18 不变，只改已用保证金）：</p>
      <div className="gal-row" style={{ alignItems: 'stretch', flexWrap: 'wrap', width: '100%' }}>
        {LEVEL_CASES.map((item) => (
          <div key={item.id} data-testid={`equity-${item.id}`} style={{ flex: '1 1 220px', minWidth: 220 }}>
            <AccountEquity
              equity={52430.18}
              available={52430.18 - item.used}
              usedMargin={item.used}
              unrealizedPnl={0}
              thresholds={{ warn: 50, danger: 80 }}
              labels={EQUITY_LABELS}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// 固定的钟：截图与说明用，倒计时不走。
const FIXED_NOW = Date.UTC(2026, 10, 22, 5, 46, 53)

export function FundingRateDemo() {
  const [settlement] = useState(() => Date.now() + (2 * 3600 + 13 * 60 + 7) * 1000)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 640 }}>
      <p className="gal-note">{NOTE} 倒计时跟系统时钟每秒走一次；传 now 就固定（下面第二张）。费率是百分数。</p>
      <Frame heading="资金费率（走时钟）" maxWidth={640}>
        <div data-testid="funding-live">
          <FundingRate
            rate={0.01}
            predictedRate={0.0082}
            nextSettlement={settlement}
            history={FUNDING_HISTORY}
            labels={FUNDING_LABELS}
          />
        </div>
      </Frame>
      <Frame heading="负费率、固定时钟（now 注入）" maxWidth={640}>
        <div data-testid="funding-fixed">
          <FundingRate
            rate={-0.0253}
            predictedRate={-0.0141}
            nextSettlement={FIXED_NOW + (2 * 3600 + 13 * 60 + 7) * 1000}
            now={FIXED_NOW}
            history={FUNDING_HISTORY.map((point) => ({ ...point, rate: -point.rate }))}
            labels={FUNDING_LABELS}
          />
        </div>
      </Frame>
    </div>
  )
}

export function OptionsChainDemo() {
  const [expiry, setExpiry] = useState('1129')
  const [picked, setPicked] = useState('没有')
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 1040 }}>
      <p className="gal-note">
        {NOTE} 标的价 {UNDERLYING}
        ：最近的行权价是平值行，认购在平值之下、认沽在平值之上是实值区；方向键走格，点格发回调。
      </p>
      <Frame heading="期权 T 型报价" maxWidth={1040}>
        <OptionsChain
          rows={chainFor(expiry)}
          underlyingPrice={UNDERLYING}
          expiries={EXPIRIES}
          expiry={expiry}
          onExpiryChange={setExpiry}
          onQuoteSelect={(strike, side, field) =>
            setPicked(`${strike} ${side === 'call' ? '认购' : '认沽'} ${OPTIONS_LABELS.fields[field]}`)
          }
          labels={OPTIONS_LABELS}
        />
      </Frame>
      <p className="gal-note" data-testid="opt-picked">
        选中：{picked}
      </p>
    </div>
  )
}

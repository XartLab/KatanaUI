// SPDX-License-Identifier: MIT
import { useState } from 'react'
import {
  ChangeText,
  ConsensusBlock,
  countConsensus,
  FlowGauges,
  PnlText,
  RegimeBand,
  RegimeStrip,
  formatCompact,
  formatPercentChange,
  formatPrice,
  formatQuantity,
  type ConsensusParty,
  type FlowGaugeData,
  type RegimeSegment,
  type RegimeState,
} from '../../src/quant'
import { Cell, Row } from './parts'

// 量化层（@katana-ui/react/quant，#1862）的演示。数值都是示例，不是行情。根元素设 data-updown="cn" 时涨跌色互换（红涨绿跌）。

export function ChangeTextDemo() {
  return (
    <>
      <Row name="涨跌幅">
        <Cell name="涨">
          <ChangeText data-testid="quant-up" value={1.234} />
        </Cell>
        <Cell name="跌">
          <ChangeText data-testid="quant-down" value={-0.5} />
        </Cell>
        <Cell name="平">
          <ChangeText data-testid="quant-flat" value={0} />
        </Cell>
      </Row>
      <Row name="带箭头">
        <Cell name="涨">
          <ChangeText data-testid="quant-arrow-up" value={3.2} arrow />
        </Cell>
        <Cell name="跌">
          <ChangeText data-testid="quant-arrow-down" value={-1.1} arrow />
        </Cell>
      </Row>
    </>
  )
}

export function PnlTextDemo() {
  return (
    <Row name="盈亏">
      <Cell name="盈">
        <PnlText data-testid="quant-pnl-up" value="12.5">
          +12.5 USDT
        </PnlText>
      </Cell>
      <Cell name="亏">
        <PnlText data-testid="quant-pnl-down" value="-3">
          {'−3 USDT'}
        </PnlText>
      </Cell>
    </Row>
  )
}

export function QuantFormatDemo() {
  return (
    <>
      <Row name="价格（按 tick）">
        <Cell name="A 股 0.01">
          <span data-testid="quant-price-ashare">{formatPrice(1688, { tick: 0.01 })}</span>
        </Cell>
        <Cell name="期货 0.25">
          <span data-testid="quant-price-future">{formatPrice(4500.25, { tick: 0.25 })}</span>
        </Cell>
        <Cell name="加密 1e-8">
          <span data-testid="quant-price-crypto">{formatPrice(0.00000123, { tick: 1e-8 })}</span>
        </Cell>
      </Row>
      <Row name="涨跌幅与数量">
        <Cell name="formatPercentChange">
          <span>{formatPercentChange(1.234)}</span>
        </Cell>
        <Cell name="formatCompact">
          <span>{formatCompact(1_250_000)}</span>
        </Cell>
        <Cell name="formatQuantity">
          <span>{formatQuantity(1.5, 'base', { abbreviate: false, digits: 2 })}</span>
        </Cell>
      </Row>
    </>
  )
}

const SAMPLE = '示例数据，不是行情'

const flowGauges: readonly FlowGaugeData[] = [
  {
    kind: 'pressure',
    id: 'mp',
    title: 'MARKET PRESSURE · 1m',
    value: 62,
    valueText: '+62',
    note: '买方 · 近 60s 逐笔',
  },
  { kind: 'priceChange', id: 'pc', title: 'PRICE CHANGE · 5m', value: -18, valueText: '−18', note: '−100 … +100' },
  {
    kind: 'dom',
    id: 'dom',
    title: 'DOM PRESSURE · 10 档',
    bids: [60, 80, 100, 70],
    asks: [40, 30, 50, 20],
    summary: '前 10 档：买盘 71%，卖盘 29%',
    note: 'Bid 71% · Ask 29%',
  },
  {
    kind: 'divergence',
    id: 'dd',
    title: 'DELTA DIVERGENCE',
    rows: [
      { window: '5s', cells: ['off', 'off', 'ok', 'ok', 'on', 'on'], summary: '近期两格同向，其余无背离' },
      { window: '1m', cells: ['off', 'ok', 'ok', 'ok', 'ok', 'warn'], summary: '末格背离预警' },
      { window: '5m', cells: ['off', 'off', 'off', 'ok', 'ok', 'ok'], summary: '近三格同向' },
      { window: '20m', cells: null, summary: '数据不足' },
    ],
    note: '20m · N/A（数据不足）',
  },
]

export function FlowGaugesDemo() {
  return (
    <>
      <p className="gal-note">{SAMPLE}。口径（怎么算）在调用方，这里只收算好的数。</p>
      <Row name="四个仪表">
        <div style={{ width: 620 }}>
          <FlowGauges label="订单流仪表" gauges={flowGauges} />
        </div>
      </Row>
      <Row name="缺数据">
        <div style={{ width: 620 }}>
          <FlowGauges
            label="订单流仪表（缺数据）"
            gauges={[
              {
                kind: 'pressure',
                id: 'mp',
                title: 'MARKET PRESSURE · 1m',
                value: null,
                valueText: '',
                note: '窗口不足',
              },
              {
                kind: 'priceChange',
                id: 'pc',
                title: 'PRICE CHANGE · 5m',
                value: 24,
                valueText: '+24',
                estimated: true,
                note: '无逐笔方向',
              },
            ]}
            estimateText="估算"
          />
        </div>
      </Row>
    </>
  )
}

const regimeStates: readonly RegimeState[] = [
  { id: 'trend', name: '趋势上', color: 1, detail: '47%' },
  { id: 'range', name: '震荡', color: 2, detail: '38%' },
  { id: 'vol', name: '高波下行', color: 4, detail: '11%' },
  { id: 'crisis', name: '危机', color: 7, detail: '4%' },
]
const regimeSegments: readonly RegimeSegment[] = [
  { from: 0, to: 12, state: 'trend' },
  { from: 12, to: 20, state: 'range' },
  { from: 20, to: 26, state: 'vol' },
  { from: 26, to: 40, state: 'trend' },
  { from: 40, to: 50, state: 'range' },
  { from: 50, to: 54, state: 'crisis' },
  { from: 54, to: 66, state: 'range' },
  { from: 66, to: 71, state: 'vol' },
  { from: 71, to: 80, state: 'trend' },
  { from: 80, to: 88, state: 'range' },
  { from: 88, to: 100, state: 'trend', estimated: true },
]

export function RegimeStripDemo() {
  const [active, setActive] = useState<string | null>(null)
  return (
    <>
      <p className="gal-note">{SAMPLE}</p>
      <Row name="带 + 图例">
        <div style={{ width: 620 }} data-testid="regime-strip">
          <RegimeStrip
            title="RUN 3d07 · HMM 4 态 · 月频"
            segments={regimeSegments}
            states={regimeStates}
            label="市场状态带：2019 到 2026，四种状态"
            describe={(segment, state) =>
              `${state.name} · ${segment.from}–${segment.to}${segment.estimated ? '（估）' : ''}`
            }
            current="trend"
            currentText="当前"
            estimateText="估（尚未确认）"
            activeState={active}
            onPickState={setActive}
          />
        </div>
      </Row>
      <Row name="只画带">
        <div style={{ width: 620 }}>
          <RegimeBand segments={regimeSegments} states={regimeStates} label="只有带" />
        </div>
      </Row>
    </>
  )
}

const stateText = {
  pass: '通过',
  warn: '接近',
  blocked: '未过',
  unknown: '未返回',
  timeout: '超时',
  stale: '需重检',
  pending: '评估中',
}
const orderParties: readonly ConsensusParty[] = [
  { key: 'gw', label: 'GATEWAY', state: 'pass', message: '可用 ✓ 整手 ✓' },
  {
    key: 'acct',
    label: 'ACCOUNT',
    state: 'warn',
    message: '集中度 58 / 60',
    detail: '单票集中度上限 60%，当前 58%；再买 2,000 股会到 61%（示例）。',
  },
  { key: 'rules', label: 'RULES', state: 'pass', message: '无规则命中' },
]
const promoteParties: readonly ConsensusParty[] = [
  { key: 'gates', label: 'GATES', state: 'blocked', message: '偏离门未过 19.4%', detail: '偏离门要求 ≤ 15%（示例）。' },
  { key: 'cap', label: 'CAPACITY', state: 'pass', message: '0.9 / 5 亿' },
  { key: 'acct', label: 'ACCOUNT', state: 'unknown', message: '未指定' },
]
const countText = (parties: readonly ConsensusParty[]) => {
  const n = countConsensus(parties)
  return `${n.pass} 通过 · ${n.warn} 接近 · ${n.blocked} 未过 · ${n.open} 未填`
}

export function ConsensusBlockDemo() {
  return (
    <>
      <p className="gal-note">{SAMPLE}。每一方的判定来自各自的权威，件只画不判。</p>
      <Row name="可提交">
        <div style={{ width: 340 }} data-testid="consensus-ok">
          <ConsensusBlock
            label="下单必要条件"
            intent="下单 · 账户 A · 买 300750 × 2,000"
            parties={orderParties}
            verdict="warn"
            verdictText="可提交"
            summary={countText(orderParties)}
            hash="7f3a"
            onHashClick={() => {}}
            stateLabels={stateText}
          />
        </div>
      </Row>
      <Row name="不可提交">
        <div style={{ width: 340 }} data-testid="consensus-blocked">
          <ConsensusBlock
            label="推进必要条件"
            intent="推进 · alice-rev → LIVE"
            parties={promoteParties}
            verdict="blocked"
            verdictText="不可推进"
            summary={countText(promoteParties)}
            hash={null}
            stateLabels={stateText}
          />
        </div>
      </Row>
      <Row name="超时 / 失效">
        <div style={{ width: 340 }} data-testid="consensus-stale">
          <ConsensusBlock
            label="重检必要条件"
            parties={[
              { key: 'gw', label: 'GATEWAY', state: 'timeout', message: '超时' },
              { key: 'acct', label: 'ACCOUNT', state: 'stale', message: '需重检' },
              { key: 'rules', label: 'RULES', state: 'pending', message: '评估中' },
            ]}
            verdict="blocked"
            verdictText="不可提交"
            stateLabels={stateText}
          />
        </div>
      </Row>
    </>
  )
}

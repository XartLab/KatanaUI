// SPDX-License-Identifier: MIT
import { ChangeText, PnlText, formatCompact, formatPercentChange, formatPrice, formatQuantity } from '../../src/quant'
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

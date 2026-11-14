// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { PanelFrame } from '../../src/blocks'
import {
  ChangeText,
  LimitLadder,
  PnlText,
  formatCompact,
  formatPercentChange,
  formatPrice,
  formatQuantity,
  type LadderLevel,
  type LimitLadderLabels,
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

// 演示数据：名字、代码、数值都是虚构的，不是行情。
const LADDER_LEVELS: readonly LadderLevel[] = [
  {
    board: 5,
    promoted: [1, 1],
    items: [
      {
        code: '600001',
        name: '示例科技',
        change: 10,
        firstSeal: '09:30',
        sealAmount: 5.2e8,
        opens: 0,
        industry: '软件',
        status: 'sealed',
      },
    ],
  },
  {
    board: 4,
    promoted: [1, 2],
    items: [
      {
        code: '600002',
        name: '示例电力',
        change: 10.01,
        firstSeal: '09:41',
        sealAmount: 2.1e8,
        opens: 1,
        industry: '电力',
        status: 'sealed',
      },
      {
        code: '000003',
        name: '示例传媒',
        change: 3.2,
        firstSeal: '09:36',
        sealAmount: 0,
        opens: 3,
        industry: '传媒',
        status: 'broken',
      },
    ],
  },
  {
    board: 3,
    promoted: [2, 4],
    items: [
      {
        code: '300004',
        name: '示例机器人',
        change: 19.98,
        firstSeal: '09:33',
        sealAmount: 3.6e8,
        opens: 0,
        industry: '机器人',
        status: 'sealed',
      },
      {
        code: '002005',
        name: '示例医药',
        change: 10.02,
        firstSeal: '10:12',
        sealAmount: 8.8e7,
        opens: 2,
        industry: '医药',
        status: 'sealed',
      },
      {
        code: '601006',
        name: '示例港口',
        change: 5.4,
        firstSeal: '09:50',
        sealAmount: 0,
        opens: 4,
        industry: '交运',
        status: 'broken',
      },
      { code: '603007', name: '示例化工', change: -10, opens: 0, industry: '化工', status: 'down' },
    ],
  },
  {
    board: 1,
    promoted: [6, 31],
    items: [
      {
        code: '000008',
        name: '示例半导体',
        change: 10.03,
        firstSeal: '09:45',
        sealAmount: 1.5e8,
        opens: 0,
        industry: '半导体',
        status: 'sealed',
      },
      {
        code: '002009',
        name: '示例食品',
        change: 6.1,
        firstSeal: '13:20',
        sealAmount: 0,
        opens: 2,
        industry: '食品',
        status: 'broken',
      },
      { code: '600010', name: '示例零售', change: 2.3, industry: '零售', status: 'none' },
    ],
  },
]

const LADDER_LABELS: LimitLadderLabels = {
  board: '板',
  promoted: (done, total) => `晋级 ${done}/${total}`,
  count: (n) => `${n} 只`,
  status: { sealed: '封住', broken: '炸板', down: '跌停', none: '没涨停' },
  columns: { name: '名称', change: '涨跌幅', firstSeal: '首封', sealAmount: '封单额', opens: '开板', industry: '行业' },
  list: '连板天梯',
  empty: '这一天没有涨停',
}

export function LimitLadderDemo() {
  const [selected, setSelected] = useState<string | null>('300004')
  return (
    <div style={{ width: '100%', maxWidth: 640, height: 520 }}>
      <PanelFrame
        index="02"
        title="连板天梯"
        object="演示数据"
        meta="DEMO"
        source="SOURCE · 演示数据 · 非行情"
        focused
        labels={{ settings: '设置', maximize: '最大化', restore: '还原', close: '关闭' }}
      >
        <LimitLadder levels={LADDER_LEVELS} labels={LADDER_LABELS} selected={selected} onSelect={setSelected} />
      </PanelFrame>
    </div>
  )
}

// SPDX-License-Identifier: MIT
import { useEffect, useMemo, useState } from 'react'
import { PanelFrame } from '../../src/blocks'
import {
  ChangeText,
  ConsensusBlock,
  countConsensus,
  DecimalField,
  FlowGauges,
  LimitLadder,
  MarketHeatmap,
  PnlText,
  RegimeBand,
  RegimeStrip,
  formatCompact,
  formatVolume,
  formatPercentChange,
  formatPrice,
  formatQuantity,
  type ConsensusParty,
  type FlowGaugeData,
  type HeatmapColorBy,
  type HeatmapItem,
  type HeatmapScheme,
  type HeatmapSizeBy,
  type LadderLevel,
  type LimitLadderLabels,
  type MarketHeatmapLabels,
  type RegimeSegment,
  type RegimeState,
} from '../../src/quant'
import { ToggleGroup, ToggleGroupItem } from '../../src/primitives/toggle-group'
import { Cell, Row, SAMPLE_MARK_SRC } from './parts'

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
        <Cell name="formatVolume">
          <span>{formatVolume(2_950_000)}</span>
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
  summary: { sealed: '涨停', highest: '最高板', promoteRate: '晋级率' },
  list: '连板天梯',
  empty: '这一天没有涨停',
}

export function LimitLadderDemo() {
  const [selected, setSelected] = useState<string | null>('300004')
  return (
    <div style={{ width: '100%', maxWidth: 640, height: 660 }}>
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

// 市场热力图（#15）的演示数据：全是编出来的，不是真实品种，也不是行情。固定种子，每次打开一样。
function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

const HEAT_INDUSTRIES: [string, string][] = [
  ['半导体', '芯'],
  ['白酒', '酿'],
  ['银行', '银'],
  ['新能源', '能'],
  ['医药', '药'],
  ['券商', '券'],
  ['军工', '工'],
  ['软件', '软'],
]
const HEAT_ORDINALS = '甲乙丙丁戊己庚辛'

function makeStocks(): HeatmapItem[] {
  const rand = seeded(15)
  const out: HeatmapItem[] = []
  let n = 0
  HEAT_INDUSTRIES.forEach(([industry, mark], g) => {
    const count = g < 4 ? 8 : 7
    const tilt = (rand() - 0.5) * 3
    for (let i = 0; i < count; i += 1) {
      n += 1
      const cap = 1.2e10 * Math.exp(rand() * 3.6) * (g === 2 ? 3 : 1)
      const day = tilt + (rand() + rand() + rand() - 1.5) * 4
      out.push({
        code: String(600000 + n * 7).padStart(6, '0'),
        name: `示例${mark}${HEAT_ORDINALS[i]}`,
        group: industry,
        price: 4 + rand() * 180,
        size: { cap, turnover: cap * (0.004 + rand() * 0.03) },
        value: { day: Number(day.toFixed(2)), week: Number((day * 1.4 + (rand() - 0.5) * 6).toFixed(2)) },
      })
    }
  })
  return out
}

const CRYPTO_NAMES = [
  'ALFA',
  'BRAV',
  'CHAR',
  'DELT',
  'ECHO',
  'FOXT',
  'GOLF',
  'HOTL',
  'INDI',
  'JULI',
  'KILO',
  'LIMA',
  'MIKE',
  'NOVE',
  'OSCA',
  'PAPA',
  'QUEB',
  'ROME',
  'SIER',
  'TANG',
  'UNIF',
  'VICT',
  'WHIS',
  'XRAY',
  'YANK',
  'ZULU',
  'ARBO',
  'BOLT',
  'CEDA',
  'DUNE',
]

function makeCoins(): HeatmapItem[] {
  const rand = seeded(30)
  return CRYPTO_NAMES.map((code, i) => {
    const cap = 6e11 * Math.exp(-i * 0.28) * (0.7 + rand() * 0.6)
    const day = (rand() + rand() + rand() - 1.5) * 7
    return {
      code,
      name: `示例币 ${String(i + 1).padStart(2, '0')}`,
      price: 0.02 + rand() * 4000,
      size: { cap, turnover: cap * (0.02 + rand() * 0.12) },
      value: { day: Number(day.toFixed(2)), week: Number((day * 1.6 + (rand() - 0.5) * 12).toFixed(2)) },
    }
  })
}

// 示意图标：每个行业里市值最大的那只（共 4 只）传自绘的 SVG，演示「有图」的样子；其余是字母圆标。不是任何真实公司的标志。
function withSampleLogos(items: HeatmapItem[]): HeatmapItem[] {
  const top = new Map<string, HeatmapItem>()
  for (const item of items) {
    const old = top.get(item.group ?? '')
    if (!old || item.size.cap! > old.size.cap!) top.set(item.group ?? '', item)
  }
  const picked = new Set([...top.values()].sort((a, b) => b.size.cap! - a.size.cap!).slice(0, 4))
  return items.map((item) => (picked.has(item) ? { ...item, logo: SAMPLE_MARK_SRC } : item))
}

const STOCKS = withSampleLogos(makeStocks())
const COINS = makeCoins()

const HEAT_SIZE: HeatmapSizeBy[] = [
  { key: 'cap', label: '市值' },
  { key: 'turnover', label: '成交额' },
  { key: 'equal', label: '等大', equal: true },
]
// 涨跌幅固定一档 1%（±3%，TradingView 的做法）；周表现不给档宽，按这批值自动取。
const HEAT_COLOR: HeatmapColorBy[] = [
  { key: 'day', label: '涨跌幅', unit: '%', step: 1 },
  { key: 'week', label: '周表现', unit: '%' },
]
const HEAT_LABELS: MarketHeatmapLabels = {
  sizeBy: '大小',
  colorBy: '颜色',
  view: '视图',
  grouped: '分组',
  flat: '平铺',
  all: '全部',
  other: '其他',
  price: '价格',
  group: '行业',
  summary: { count: '只数', up: '上涨', down: '下跌' },
  segment: (range) => `隐藏或显示 ${range} 的格子`,
  list: '市场热力图',
  empty: '没有数据',
}

export function MarketHeatmapDemo() {
  const [selected, setSelected] = useState<string | null>(null)
  const [scheme, setScheme] = useState<HeatmapScheme>('classic')
  const [market, setMarket] = useState('stocks')
  const [wide, setWide] = useState(false)
  const [live, setLive] = useState(false)
  const [tick, setTick] = useState(0)
  // 模拟更新：每 1.5 秒让一部分格子的涨跌幅挪一点（演示颜色过渡与翻方向的边框闪烁）；演示数据，不是行情。
  useEffect(() => {
    if (!live) return
    const timer = setInterval(() => setTick((n) => n + 1), 1500)
    return () => clearInterval(timer)
  }, [live])
  const stocks = useMemo(() => {
    if (tick === 0) return STOCKS
    const rand = seeded(1000 + tick)
    return STOCKS.map((item) =>
      rand() < 0.3
        ? { ...item, value: { ...item.value, day: Number((item.value.day! + (rand() - 0.5) * 3).toFixed(2)) } }
        : item,
    )
  }, [tick])
  const coins = market === 'coins'
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: wide ? undefined : 760 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <ToggleGroup variant="sm" aria-label="数据" value={market} onValueChange={setMarket}>
          <ToggleGroupItem value="stocks">分行业的股票</ToggleGroupItem>
          <ToggleGroupItem value="coins">不分组的加密</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup variant="sm" aria-label="配色" value={scheme} onValueChange={(v) => setScheme(v as HeatmapScheme)}>
          <ToggleGroupItem value="classic">经典</ToggleGroupItem>
          <ToggleGroupItem value="mono">单色</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          variant="sm"
          aria-label="屏幕"
          value={wide ? 'wide' : 'small'}
          onValueChange={(v) => setWide(v === 'wide')}
        >
          <ToggleGroupItem value="small">小屏</ToggleGroupItem>
          <ToggleGroupItem value="wide">大屏 1920×1080</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          variant="sm"
          aria-label="更新"
          value={live ? 'live' : 'still'}
          onValueChange={(v) => setLive(v === 'live')}
        >
          <ToggleGroupItem value="still">静止</ToggleGroupItem>
          <ToggleGroupItem value="live">模拟更新</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <p className="gal-note">
        每个行业里市值最大的一只传了自绘的示意图标，演示有图的样子；示意图标，不是任何真实公司的标志。其余是字母圆标。格子按实际像素分档：大格子加大徽标、写公司名，组头写平均涨跌。
      </p>
      <div style={{ overflow: 'auto' }}>
        <div style={{ height: wide ? 1080 : 620, width: wide ? 1920 : undefined }}>
          <PanelFrame
            index="03"
            title={coins ? '加密热力图' : '股票热力图'}
            object="演示数据"
            meta="DEMO"
            source="SOURCE · 演示数据 · 非行情"
            focused
            labels={{ settings: '设置', maximize: '最大化', restore: '还原', close: '关闭' }}
          >
            <MarketHeatmap
              key={`${market}-${wide}`}
              items={coins ? COINS : stocks}
              sizeBy={HEAT_SIZE}
              colorBy={HEAT_COLOR}
              labels={{ ...HEAT_LABELS, group: '行业' }}
              scheme={scheme}
              selected={selected}
              onSelect={setSelected}
            />
          </PanelFrame>
        </div>
      </div>
    </div>
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

const BUTTONS = { decrease: '减一格', increase: '加一格' }

export function DecimalFieldDemo() {
  const [price, setPrice] = useState('67000.3')
  const [qty, setQty] = useState('')
  // 只读与禁用也接真的 onValue：要是件在这两种状态下还会改值，演示页上就看得见。
  const [locked, setLocked] = useState('100.5')
  return (
    <>
      <Row name="价格（tick 0.5）">
        <div className="gal-wide">
          <DecimalField label="价格" value={price} onValue={setPrice} step="0.5" buttons={BUTTONS} />
        </div>
        <output data-testid="decimal-price-out">{price}</output>
      </Row>
      <Row name="数量（空框从 1 起，带单位）">
        <div className="gal-wide">
          <DecimalField
            label="数量"
            value={qty}
            onValue={setQty}
            step="0.001"
            base="1"
            unit="BTC"
            placeholder="1"
            buttons={BUTTONS}
          />
        </div>
        <output data-testid="decimal-qty-out">{qty}</output>
      </Row>
      <Row name="状态">
        <Cell name="只读">
          <DecimalField label="只读价格" value={locked} onValue={setLocked} step="0.5" readOnly buttons={BUTTONS} />
        </Cell>
        <Cell name="禁用">
          <DecimalField label="禁用价格" value={locked} onValue={setLocked} step="0.5" disabled buttons={BUTTONS} />
        </Cell>
        <Cell name="error">
          <DecimalField label="错误价格" value="abc" onValue={() => {}} step="0.5" status="error" />
        </Cell>
        <Cell name="warning">
          <DecimalField label="警告价格" value="100.3" onValue={() => {}} step="0.5" status="warning" />
        </Cell>
      </Row>
      <p className="gal-note">↑ / ↓ 走一格，Shift 十格；打字自由，合不合法由调用方判。0.1 的格子加起来是精确的。</p>
    </>
  )
}

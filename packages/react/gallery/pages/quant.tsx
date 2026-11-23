// SPDX-License-Identifier: MIT
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import {
  ConsensusBlock,
  countConsensus,
  FlowGauges,
  Meter,
  PanelFrame,
  PanelFrameBody,
  PanelFrameHeader,
  RegimeBand,
  RegimeStrip,
  type ConsensusParty,
  type FlowGaugeData,
  type RegimeSegment,
  type RegimeState,
} from '../../src/blocks/index.ts'
import {
  ChangeText,
  DecimalField,
  DistributionBars,
  EventCalendar,
  LimitLadder,
  MarketHeatmap,
  MetricCard,
  MetricCardGrid,
  PnlText,
  RatingText,
  TechnicalRating,
  formatCompact,
  formatPercentChange,
  formatPrice,
  formatQuantity,
  formatVolume,
  type DividendEvent,
  type EarningsEvent,
  type EconomicEvent,
  type IpoEvent,
  type EventCalendarLabels,
  type HeatmapColorBy,
  type HeatmapItem,
  type HeatmapScheme,
  type HeatmapSizeBy,
  type LadderLevel,
  type LimitLadderLabels,
  type MarketHeatmapLabels,
  type MetricChange,
  type MetricRange,
  type MetricStage,
  type RatingGroup,
  type RatingRow,
  type RatingVerdict,
  type PivotTable,
  type TechnicalRatingLabels,
} from '../../src/quant/index.ts'
import { symbolMenu } from '../../src/quotes/row-actions.tsx'
import { ToggleGroup, ToggleGroupItem } from '../../src/primitives/toggle-group.tsx'
import { LiveToggle } from '../LiveToggle.tsx'
import { ladderFrom, ladderLevels, ladderStep } from '../ladder-sim.ts'
import { useLiveTicker } from '../live-sim.ts'
import { LiveMetricCardDemo, LivePnlTextDemo, LiveSparkTileDemo } from './live-readouts.tsx'
import { ActionLog, Cell, Row, SAMPLE_MARK_SRC, demoSymbolActions } from './parts.tsx'

// 量化层（@katana-ui/react/quant，#1862、#1929）的演示。数值都是示例，不是行情，页上也写明。根元素设 data-updown="cn" 时涨跌色互换（红涨绿跌）。

export function RatingTextDemo() {
  return (
    <Row name="五档">
      <Cell name="强力买入">
        <RatingText level="strong-buy">强力买入</RatingText>
      </Cell>
      <Cell name="买入">
        <RatingText level="buy">买入</RatingText>
      </Cell>
      <Cell name="中性">
        <RatingText level="neutral">中性</RatingText>
      </Cell>
      <Cell name="卖出">
        <RatingText level="sell">卖出</RatingText>
      </Cell>
      <Cell name="强力卖出">
        <RatingText level="strong-sell">强力卖出</RatingText>
      </Cell>
    </Row>
  )
}

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
      <LivePnlTextDemo />
    </>
  )
}

export function PnlTextDemo() {
  return (
    <>
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
      <LivePnlTextDemo />
    </>
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

/** A 股件的演示挂着时根上是 data-updown="cn"（红涨绿跌，照 #78 的 cn-pack 页），离开这一页还原成原来的值。 */
function useCnUpdown() {
  useLayoutEffect(() => {
    const root = document.documentElement
    const before = root.dataset.updown
    root.dataset.updown = 'cn'
    return () => {
      if (before === undefined) delete root.dataset.updown
      else root.dataset.updown = before
    }
  }, [])
}

export function LimitLadderDemo() {
  useCnUpdown()
  const [selected, setSelected] = useState<string | null>('300004')
  const [log, setLog] = useState('')
  // 实时：每 2 秒随机让某只封单量变、炸板、回封，偶尔升板换层、来一只新首板；自动化浏览器里默认暂停，用 window.__liveStep 步进。
  const { state: sim } = useLiveTicker(() => ladderFrom(LADDER_LEVELS), ladderStep, { intervalMs: 2000 })
  return (
    <div style={{ width: '100%', maxWidth: 640 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 8 }}>
        <LiveToggle labels={{ group: '数据刷新', live: '实时', paused: '暂停' }} />
        <span className="gal-note">
          封单量变化闪、炸板琥珀警示、回封与升板闪涨色、新首板蓝线高亮；本页根上设了 data-updown="cn"（红涨绿跌）
        </span>
      </div>
      <div style={{ height: 660 }}>
        <PanelFrame focused aria-label="连板天梯">
          <PanelFrameHeader heading="连板天梯" object="演示数据" />
          <PanelFrameBody>
            <LimitLadder
              levels={ladderLevels(sim)}
              labels={LADDER_LABELS}
              selected={selected}
              onSelect={(item) => setSelected(item.code)}
              rowActions={(item) => demoSymbolActions(item.code, setLog)}
            />
          </PanelFrameBody>
        </PanelFrame>
      </div>
      <ActionLog text={log} />
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
        symbol: String(600000 + n * 7).padStart(6, '0'),
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
      symbol: code,
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
  fullscreen: '全屏',
  dataset: '数据集',
  openInScreener: '在选股器打开',
  display: {
    logo: 'Logo',
    title: { label: '标题', none: '无', code: '代码', name: '全名' },
    value: { label: '格内数值', none: '无', price: '价格', size: '成交额', change: '涨跌幅' },
  },
}

const HEAT_DATASETS = [
  { key: 'stocks', label: '分行业的股票' },
  { key: 'coins', label: '不分组的加密' },
]

export function MarketHeatmapDemo() {
  const [selected, setSelected] = useState<string | null>(null)
  const [log, setLog] = useState('')
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
        <ToggleGroup size="sm" aria-label="配色" value={scheme} onValueChange={(v) => setScheme(v as HeatmapScheme)}>
          <ToggleGroupItem value="classic">经典</ToggleGroupItem>
          <ToggleGroupItem value="mono">单色</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          size="sm"
          aria-label="屏幕"
          value={wide ? 'wide' : 'small'}
          onValueChange={(v) => setWide(v === 'wide')}
        >
          <ToggleGroupItem value="small">小屏</ToggleGroupItem>
          <ToggleGroupItem value="wide">大屏 1920×1080</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          size="sm"
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
          <PanelFrame focused aria-label={coins ? '加密热力图' : '股票热力图'}>
            <PanelFrameHeader heading={coins ? '加密热力图' : '股票热力图'} object="演示数据" />
            <PanelFrameBody>
              <MarketHeatmap
                key={`${market}-${wide}`}
                items={coins ? COINS : stocks}
                sizeBy={HEAT_SIZE}
                colorBy={HEAT_COLOR}
                labels={{ ...HEAT_LABELS, group: '行业' }}
                datasets={HEAT_DATASETS}
                dataset={market}
                onDatasetChange={setMarket}
                onOpenInScreener={() => setLog('在选股器打开：' + (coins ? '加密货币' : '分行业的股票'))}
                scheme={scheme}
                selected={selected}
                onSelect={setSelected}
                cellActions={(item) => demoSymbolActions(item.symbol, setLog)}
              />
            </PanelFrameBody>
          </PanelFrame>
        </div>
      </div>
      <ActionLog text={log} />
    </div>
  )
}

// 技术评级仪表（#20）的演示：读数与结论从合成价格算出来，不是行情；分数与个数在这里按「买 − 卖」除以总数现算，真实调用方自己算。
// 周期与列名照 TradingView 技术页（2026-11-15 实测）：1 分钟到 1 月共十档；仪表三组 Oscillators / Summary / Moving Averages。
const RATING_TIMEFRAMES = [
  { value: '1m', label: '1 minute' },
  { value: '5m', label: '5 minutes' },
  { value: '15m', label: '15 minutes' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '2h', label: '2 hours' },
  { value: '4h', label: '4 hours' },
  { value: '1d', label: '1 day' },
  { value: '1w', label: '1 week' },
  { value: '1M', label: '1 month' },
]
const RATING_ZONES = ['Strong sell', 'Sell', 'Neutral', 'Buy', 'Strong buy'] as const
const RATING_LABELS: TechnicalRatingLabels = {
  zones: RATING_ZONES,
  verdict: { sell: 'Sell', neutral: 'Neutral', buy: 'Buy' },
  total: (n) => `${n} indicators`,
  columns: { name: 'Name', reading: 'Value', verdict: 'Action' },
  timeframe: 'Timeframe',
  list: 'Technical rating',
  empty: 'No data',
}

// 演示价格：每个周期一条固定种子的合成收盘价（随机游走加慢波），读数与结论都从它算出来，规则照 TradingView 的技术评级
//（tradingview.com/support/solutions/43000614331，2026-11-15 读）：RSI 30 以下买、70 以上卖；随机指标 20 / 80；CCI ±100；Williams %R −80 / −20；
// 动量、ROC、AO 看正负；MACD 线在信号线上为买；均线是价格在均线上为买。只用收盘价合成（真实调用方用 K 线），所以是演示，不是行情。
const sma = (xs: readonly number[], n: number) => xs.slice(-n).reduce((a, b) => a + b, 0) / n
const emaSeries = (xs: readonly number[], n: number) => {
  const k = 2 / (n + 1)
  const out: number[] = []
  xs.forEach((x, i) => out.push(i === 0 ? x : x * k + out[i - 1]! * (1 - k)))
  return out
}
const smaSeries = (xs: readonly number[], n: number) => xs.map((_, i) => (i + 1 < n ? NaN : sma(xs.slice(0, i + 1), n)))
function indicators(close: readonly number[]) {
  const last = close.at(-1)!
  const gains = close.slice(1).map((c, i) => Math.max(0, c - close[i]!))
  const losses = close.slice(1).map((c, i) => Math.max(0, close[i]! - c))
  let ag = gains.slice(0, 14).reduce((a, b) => a + b, 0) / 14
  let al = losses.slice(0, 14).reduce((a, b) => a + b, 0) / 14
  for (let i = 14; i < gains.length; i += 1) {
    ag = (ag * 13 + gains[i]!) / 14
    al = (al * 13 + losses[i]!) / 14
  }
  const rsi = al === 0 ? 100 : 100 - 100 / (1 + ag / al)
  const raw = close.map((c, i) => {
    const w = close.slice(Math.max(0, i - 13), i + 1)
    const [lo, hi] = [Math.min(...w), Math.max(...w)]
    return hi === lo ? 50 : ((c - lo) / (hi - lo)) * 100
  })
  const stoch = sma(
    smaSeries(raw.slice(13), 3).filter((x) => !Number.isNaN(x)),
    3,
  )
  const w20 = close.slice(-20)
  const m20 = sma(close, 20)
  const cci = (last - m20) / (0.015 * (w20.reduce((a, b) => a + Math.abs(b - m20), 0) / 20))
  const w14 = close.slice(-14)
  const [lo14, hi14] = [Math.min(...w14), Math.max(...w14)]
  const willr = ((hi14 - last) / (hi14 - lo14)) * -100
  const macdLine = emaSeries(close, 12).map((v, i) => v - emaSeries(close, 26)[i]!)
  const macd = macdLine.at(-1)!
  const signal = emaSeries(macdLine, 9).at(-1)!
  const sign = (v: number): RatingVerdict => (v > 0 ? 'buy' : v < 0 ? 'sell' : 'neutral')
  const band = (v: number, lo: number, hi: number): RatingVerdict => (v < lo ? 'buy' : v > hi ? 'sell' : 'neutral')
  const f = (v: number) => v.toFixed(2)
  const osc: [string, number, RatingVerdict][] = [
    ['RSI (14)', rsi, band(rsi, 30, 70)],
    ['Stochastic %K (14, 3, 3)', stoch, band(stoch, 20, 80)],
    ['CCI (20)', cci, band(cci, -100, 100)],
    ['Williams %R (14)', willr, band(willr, -80, -20)],
    ['Awesome Oscillator', sma(close, 5) - sma(close, 34), sign(sma(close, 5) - sma(close, 34))],
    ['Momentum (10)', last - close.at(-11)!, sign(last - close.at(-11)!)],
    ['Rate of Change (9)', (last / close.at(-10)! - 1) * 100, sign(last - close.at(-10)!)],
    ['MACD (12, 26)', macd, sign(macd - signal)],
  ]
  const avg = [10, 20, 30, 50, 100, 200].flatMap((n) => {
    const e = emaSeries(close, n).at(-1)!
    const m = sma(close, n)
    return [
      [`EMA (${n})`, e, sign(last - e)],
      [`SMA (${n})`, m, sign(last - m)],
    ] as [string, number, RatingVerdict][]
  })
  const row =
    (group: string) =>
    ([name, value, verdict]: [string, number, RatingVerdict], i: number): RatingRow => ({
      key: `${group}${i}`,
      name,
      group,
      reading: f(value),
      verdict,
    })
  return [...osc.map(row('osc')), ...avg.map(row('ma'))]
}

function makeRating(frame: number, extra: readonly number[] = []) {
  const rand = seeded(20 + frame * 7)
  const drift = (rand() - 0.45) * 0.6
  const close: number[] = []
  let price = 100
  for (let i = 0; i < 260; i += 1) {
    price += drift + Math.sin(i / (9 + frame * 3)) * 0.9 + (rand() - 0.5) * 2.4
    close.push(price)
  }
  // 实时：在固定的合成行情后面接上节拍器给的新价（每步一个涨跌量），评级窗口保持 260 根，读数与结论就跟着慢慢变。
  for (const step of extra) {
    price += step
    close.push(price)
  }
  const rows = indicators(close.slice(-260))
  const tally = (list: readonly RatingRow[]) => ({
    sell: list.filter((r) => r.verdict === 'sell').length,
    neutral: list.filter((r) => r.verdict === 'neutral').length,
    buy: list.filter((r) => r.verdict === 'buy').length,
  })
  const group = (key: string, label: string, list: readonly RatingRow[]): RatingGroup => {
    const counts = tally(list)
    return { key, label, counts, value: (counts.buy - counts.sell) / list.length }
  }
  const groups = [
    group(
      'osc',
      'Oscillators',
      rows.filter((r) => r.group === 'osc'),
    ),
    group('all', 'Summary', rows),
    group(
      'ma',
      'Moving Averages',
      rows.filter((r) => r.group === 'ma'),
    ),
  ]
  return { rows, groups, pivots: makePivots(close.slice(-260)) }
}

// 枢轴点：高低收取最近 20 根，规则照常见定义（Classic、Fibonacci、Camarilla、Woodie、DM）；Woodie 与 DM 只有一部分档位，缺的传 null 画「—」。演示用，不是行情。
function makePivots(close: readonly number[]): PivotTable {
  const w = close.slice(-20)
  const [h, l, c, o] = [Math.max(...w), Math.min(...w), close.at(-1)!, close.at(-2)!]
  const r = h - l
  const f = (v: number | null) => (v === null ? null : v.toFixed(2))
  const p = (h + l + c) / 3
  const wp = (h + l + 2 * c) / 4
  const x = c < o ? h + 2 * l + c : c > o ? 2 * h + l + c : h + l + 2 * c
  const cols = {
    classic: [h + 2 * (p - l), p + r, 2 * p - l, p, 2 * p - h, p - r, l - 2 * (h - p)],
    fib: [p + r, p + 0.618 * r, p + 0.382 * r, p, p - 0.382 * r, p - 0.618 * r, p - r],
    cam: [
      c + (r * 1.1) / 4,
      c + (r * 1.1) / 6,
      c + (r * 1.1) / 12,
      p,
      c - (r * 1.1) / 12,
      c - (r * 1.1) / 6,
      c - (r * 1.1) / 4,
    ],
    woodie: [null, wp + r, 2 * wp - l, wp, 2 * wp - h, wp - r, null],
    dm: [null, null, x / 2 - l, x / 4, x / 2 - h, null, null],
  }
  return {
    title: 'Pivots',
    columns: ['Classic', 'Fibonacci', 'Camarilla', 'Woodie', 'DM'],
    rows: ['R3', 'R2', 'R1', 'P', 'S1', 'S2', 'S3'].map((label, i) => ({
      key: label,
      label,
      values: [cols.classic[i]!, cols.fib[i]!, cols.cam[i]!, cols.woodie[i]!, cols.dm[i]!].map(f),
    })),
  }
}

export function TechnicalRatingDemo() {
  const [frame, setFrame] = useState('1d')
  // 实时：每个节拍给合成行情接一根新价（涨跌量随机，幅度比历史大一些，评级才看得出变）；档位升了闪涨色、降了闪跌色。
  const { state: extra } = useLiveTicker<number[]>([], (steps, rng) => [...steps, (rng() - 0.5) * 6], {
    intervalMs: 2500,
  })
  const { rows, groups, pivots } = makeRating(
    RATING_TIMEFRAMES.findIndex((tf) => tf.value === frame),
    extra,
  )
  return (
    <div style={{ width: '100%', maxWidth: 760 }}>
      <div style={{ paddingBottom: 8 }}>
        <LiveToggle labels={{ group: '数据刷新', live: '实时', paused: '暂停' }} />
      </div>
      <div style={{ height: 900 }}>
        <PanelFrame focused aria-label="技术评级">
          <PanelFrameHeader heading="Technicals" object="演示数据" />
          <PanelFrameBody>
            <TechnicalRating
              groups={groups}
              rows={rows}
              labels={RATING_LABELS}
              primary="all"
              pivots={pivots}
              timeframes={RATING_TIMEFRAMES}
              value={frame}
              onValueChange={setFrame}
              disclaimer="Ratings only summarise indicator readings; they are not trading advice."
            />
          </PanelFrameBody>
        </PanelFrame>
      </div>
    </div>
  )
}

const SAMPLE = '示例数据，不是行情'
const asset = [18, 16, 17, 12, 13, 9, 10, 6, 4]
const drawdown = [4, 8, 6, 12, 10, 16, 12, 18, 14]
const stable = [10, 12, 9, 14, 11, 13, 10, 12, 11]
const exposure = [16, 14, 15, 10, 11, 8, 9, 5, 4]

export function SparkTileDemo() {
  const [clicks, setClicks] = useState(0)
  return (
    <>
      <p className="gal-note">{SAMPLE}</p>
      <Row name="一行 5 个">
        <div className="gal-grid-5" data-testid="spark-row">
          <MetricCard
            variant="tile"
            label="NET ASSET"
            value="2.42M"
            series={asset.map((v) => 20 - v)}
            labels={{ spark: '近 9 期净值走势' }}
            changePct={1.31}
            note="今日"
          />
          <MetricCard
            variant="tile"
            label="DRAWDOWN"
            value="-3.1%"
            series={drawdown}
            labels={{ spark: '近 9 期回撤走势' }}
            trendTone="neutral"
            note="峰值 -6.8% · 02-14"
          />
          <MetricCard
            variant="tile"
            label="TURNOVER"
            value="0.62"
            unit="/月"
            series={stable}
            labels={{ spark: '近 9 期换手' }}
            note="稳定"
          />
          <MetricCard
            variant="tile"
            label="EXPOSURE"
            value="131"
            unit="/ 150%"
            series={exposure.map((v) => 20 - v)}
            labels={{ spark: '近 9 期敞口，虚线是上限' }}
            threshold={19}
            status="near"
            note="接近上限"
          />
          <MetricCard
            variant="tile"
            label="SHARPE 60D"
            value={null}
            series={[]}
            labels={{ spark: '夏普：没有数据' }}
            note="等待数据"
          />
        </div>
      </Row>
      <Row name="可点">
        <div className="gal-grid-5">
          <MetricCard
            variant="tile"
            label="FILLS"
            value={String(clicks)}
            series={stable}
            labels={{ spark: '近 9 期成交' }}
            changePct={-0.8}
            note="点我 +1"
            onSelect={() => setClicks((n) => n + 1)}
          />
        </div>
      </Row>
      <LiveSparkTileDemo />
    </>
  )
}

// 线照 LossLimits 卡：80% 起接近、100% 越限。
const LIMIT_LABELS = { warn: '预警线 80%', hard: '硬限 100%' }

export function MeterDemo() {
  return (
    <>
      <p className="gal-note">{SAMPLE}</p>
      <Row name="条（bar）">
        <div className="gal-stack" data-testid="meter-bars">
          <Meter label="LOAD · 敞口" value={72} tone="ok" />
          <Meter label="LOAD · 受锁（超过 60% 上限）" value={38} tone="warn" mark={60} markLabel="上限" />
          <Meter label="回测进度" value={61} />
          <Meter label="OFF" value={0} tone="off" />
        </div>
      </Row>
      <Row name="限额（warnAt / hardAt）">
        <div className="gal-stack" data-testid="meter-limits">
          <Meter label="总敞口 / 净值" value={54} warnAt={80} hardAt={100} valueText="54%" limitLabels={LIMIT_LABELS} />
          <Meter
            label="保证金占用"
            value={86}
            warnAt={80}
            hardAt={100}
            valueText="86% · 接近"
            limitLabels={LIMIT_LABELS}
          />
          <Meter
            label="日内回撤"
            value={112}
            warnAt={80}
            hardAt={100}
            valueText="112% · 越限"
            limitLabels={LIMIT_LABELS}
          />
        </div>
      </Row>
      <Row name="刻度（gauge）">
        <div className="gal-stack" data-testid="meter-gauges">
          <Meter label="RS-20 · 电子" value={94} display="gauge" />
          <Meter label="RS-20 · 军工（弱势）" value={27} display="gauge" tone="danger" />
        </div>
      </Row>
      <Row name="同步率条（sync）">
        <div className="gal-stack" data-testid="meter-sync">
          <Meter label="PAPER · 第 21 / 30 天" value={70} display="sync" mark={100} markLabel="评估点" />
          <Meter label="容量使用" value={52} display="sync" tone="ok" mark={80} markLabel="容量上限" />
        </div>
      </Row>
    </>
  )
}

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
            labels={{ estimate: '估算' }}
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
            labels={{ current: '当前', estimate: '估（尚未确认）' }}
            activeState={active}
            onSelect={(state) => setActive(state?.id ?? null)}
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
  { id: 'gw', label: 'GATEWAY', state: 'pass', message: '可用 ✓ 整手 ✓' },
  {
    id: 'acct',
    label: 'ACCOUNT',
    state: 'warn',
    message: '集中度 58 / 60',
    detail: '单票集中度上限 60%，当前 58%；再买 2,000 股会到 61%（示例）。',
  },
  { id: 'rules', label: 'RULES', state: 'pass', message: '无规则命中' },
]
const promoteParties: readonly ConsensusParty[] = [
  { id: 'gates', label: 'GATES', state: 'blocked', message: '偏离门未过 19.4%', detail: '偏离门要求 ≤ 15%（示例）。' },
  { id: 'cap', label: 'CAPACITY', state: 'pass', message: '0.9 / 5 亿' },
  { id: 'acct', label: 'ACCOUNT', state: 'unknown', message: '未指定' },
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
            subject="下单 · 账户 A · 买 300750 × 2,000"
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
            subject="推进 · alice-rev → LIVE"
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
              { id: 'gw', label: 'GATEWAY', state: 'timeout', message: '超时' },
              { id: 'acct', label: 'ACCOUNT', state: 'stale', message: '需重检' },
              { id: 'rules', label: 'RULES', state: 'pending', message: '评估中' },
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
          <DecimalField label="价格" value={price} onValueChange={setPrice} step="0.5" buttons={BUTTONS} />
        </div>
        <output data-testid="decimal-price-out">{price}</output>
      </Row>
      <Row name="数量（空框从 1 起，带单位）">
        <div className="gal-wide">
          <DecimalField
            label="数量"
            value={qty}
            onValueChange={setQty}
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
          <DecimalField
            label="只读价格"
            value={locked}
            onValueChange={setLocked}
            step="0.5"
            readOnly
            buttons={BUTTONS}
          />
        </Cell>
        <Cell name="禁用">
          <DecimalField
            label="禁用价格"
            value={locked}
            onValueChange={setLocked}
            step="0.5"
            disabled
            buttons={BUTTONS}
          />
        </Cell>
        <Cell name="error">
          <DecimalField label="错误价格" value="abc" onValueChange={() => {}} step="0.5" status="error" />
        </Cell>
        <Cell name="warning">
          <DecimalField label="警告价格" value="100.3" onValueChange={() => {}} step="0.5" status="warning" />
        </Cell>
      </Row>
      <p className="gal-note">↑ / ↓ 走一格，Shift 十格；打字自由，合不合法由调用方判。0.1 的格子加起来是精确的。</p>
    </>
  )
}

// 经济日历（#28）的演示数据：事件名、国家名、数值全是编出来的，不是真实数据。固定「现在」= 2026-11-17 周二 09:30（上海），截图与断言不随真实日期变。
const CAL_NOW = Date.UTC(2026, 10, 17, 1, 30)
const calAt = (day: number, hour: number, minute = 0) => Date.UTC(2026, 10, day, hour - 8, minute)
const CAL_EVENTS: EconomicEvent[] = [
  {
    id: 'a1',
    at: calAt(16, 9, 30),
    region: 'CN',
    regionName: '甲国',
    regionGroup: 'ASIA',
    name: '示例消费者物价指数 同比',
    importance: 3,
    actual: '0.4%',
    forecast: '0.3%',
    previous: '0.3%',
    category: 'prices',
    description: '衡量一篮子消费品与服务的价格相对去年同期的变化，是央行判断通胀压力的主要依据之一（演示文字）。',
    source: '示例统计局',
    history: [0.1, 0.2, 0.2, 0.1, 0.3, 0.3, 0.4],
    nextAt: calAt(30, 9, 30),
  },
  {
    id: 'a2',
    category: 'consumer',
    at: calAt(16, 22, 0),
    region: 'US',
    regionName: '乙国',
    regionGroup: 'NORTH AMERICA',
    name: '示例零售销售 环比',
    importance: 2,
    actual: '0.2%',
    forecast: '0.4%',
    previous: '0.6%',
  },
  {
    id: 'b1',
    category: 'business',
    at: calAt(17, 9, 0),
    region: 'CN',
    regionName: '甲国',
    regionGroup: 'ASIA',
    name: '示例工业增加值 同比',
    importance: 2,
    actual: '5.1%',
    forecast: '4.9%',
    previous: '4.8%',
    description: '规模以上工业企业增加值的同比增速（演示文字）。',
    source: '示例统计局',
    history: [4.2, 4.5, 4.4, 4.7, 4.8, 5.1],
    nextAt: calAt(30, 10, 0),
  },
  {
    id: 'b2',
    category: 'trade',
    at: calAt(17, 8, 45),
    region: 'JP',
    regionName: '丙国',
    regionGroup: 'ASIA',
    name: '示例贸易帐',
    importance: 1,
    actual: '-0.2万亿',
    forecast: '-0.3万亿',
    previous: '-0.4万亿',
  },
  {
    id: 'b3',
    category: 'business',
    at: calAt(17, 17, 0),
    region: 'EU',
    regionName: '丁区',
    regionGroup: 'EUROPE',
    name: '示例经济景气指数',
    importance: 2,
    forecast: '98.5',
    previous: '97.9',
  },
  {
    id: 'b5',
    category: 'housing',
    at: calAt(17, 21, 30),
    region: 'US',
    regionName: '乙国',
    regionGroup: 'NORTH AMERICA',
    name: '示例建筑许可',
    importance: 1,
    forecast: '1.40M',
    previous: '1.38M',
  },
  {
    id: 'b4',
    category: 'housing',
    at: calAt(17, 21, 30),
    region: 'US',
    regionName: '乙国',
    regionGroup: 'NORTH AMERICA',
    name: '示例新屋开工',
    importance: 1,
    forecast: '1.32M',
    previous: '1.35M',
  },
  {
    id: 'c1',
    category: 'labor',
    at: calAt(18, 10, 0),
    region: 'GB',
    regionName: '戊国',
    regionGroup: 'EUROPE',
    name: '示例失业率',
    importance: 2,
    forecast: '4.3%',
    previous: '4.2%',
  },
  {
    id: 'c2',
    category: 'labor',
    at: calAt(18, 21, 30),
    region: 'US',
    regionName: '乙国',
    regionGroup: 'NORTH AMERICA',
    name: '示例非农就业人数',
    importance: 3,
    forecast: '18.5万',
    previous: '22.8万',
    description: '非农部门当月新增就业人数，是判断劳动力市场与政策走向的关键数据（演示文字）。',
    source: '示例劳工部',
    history: [18.1, 20.4, 25.3, 19.8, 22.8],
    nextAt: calAt(25, 21, 30),
  },
  {
    id: 'c3',
    category: 'money',
    at: calAt(18, 23, 0),
    region: 'US',
    regionName: '乙国',
    regionGroup: 'NORTH AMERICA',
    name: '示例央行官员讲话',
    importance: 3,
    previous: '—',
  },
  {
    id: 'd1',
    category: 'money',
    at: calAt(20, 15, 0),
    region: 'EU',
    regionName: '丁区',
    regionGroup: 'EUROPE',
    name: '示例央行利率决议',
    importance: 3,
    forecast: '2.25%',
    previous: '2.25%',
  },
  {
    id: 'd2',
    at: calAt(20, 20, 30),
    region: 'US',
    regionName: '乙国',
    regionGroup: 'NORTH AMERICA',
    name: '示例初请失业金人数',
    importance: 2,
    forecast: '22.0万',
    previous: '21.8万',
  },
  {
    id: 'n1',
    category: 'business',
    at: calAt(24, 9, 30),
    region: 'CN',
    regionName: '甲国',
    regionGroup: 'ASIA',
    name: '示例制造业采购经理指数',
    importance: 3,
    forecast: '50.2',
    previous: '49.8',
  },
  {
    id: 'n2',
    category: 'business',
    at: calAt(25, 10, 0),
    region: 'GB',
    regionName: '戊国',
    regionGroup: 'EUROPE',
    name: '示例工业产出',
    importance: 1,
    forecast: '0.1%',
    previous: '0.0%',
  },
]

const CAL_EARNINGS: EarningsEvent[] = [
  {
    id: 'e1',
    currency: 'USD',
    at: calAt(17, 7, 0),
    region: 'US',
    regionName: '乙国',
    regionGroup: 'NORTH AMERICA',
    code: 'ALFA',
    name: '示例阿尔法科技',
    session: 'before',
    epsActual: 1.42,
    epsForecast: 1.31,
    revenueActual: 18.4e9,
    revenueForecast: 17.9e9,
    marketCap: 612e9,
  },
  {
    id: 'e2',
    currency: 'USD',
    at: calAt(17, 20, 0),
    region: 'US',
    regionName: '乙国',
    regionGroup: 'NORTH AMERICA',
    code: 'BETA',
    name: '示例贝塔零售',
    session: 'before',
    epsActual: 0.88,
    epsForecast: 0.95,
    revenueActual: 52.1e9,
    revenueForecast: 52.6e9,
    marketCap: 240e9,
  },
  {
    id: 'e3',
    currency: 'USD',
    at: calAt(17, 22, 0),
    region: 'US',
    regionName: '乙国',
    regionGroup: 'NORTH AMERICA',
    code: 'GAMA',
    name: '示例伽马半导体',
    session: 'after',
    epsForecast: 2.05,
    revenueForecast: 9.8e9,
    marketCap: 1.1e12,
  },
  {
    id: 'e4',
    at: calAt(18, 16, 0),
    region: 'CN',
    regionName: '甲国',
    regionGroup: 'ASIA',
    code: '600001',
    name: '示例德尔塔能源',
    epsForecast: 0.62,
    revenueForecast: 31.2e9,
    marketCap: 88e9,
  },
  {
    id: 'e5',
    currency: 'USD',
    at: calAt(19, 7, 0),
    region: 'EU',
    regionName: '丁区',
    regionGroup: 'EUROPE',
    code: 'EPSI',
    name: '示例艾普西隆汽车',
    session: 'before',
    epsForecast: 1.7,
    revenueForecast: 40.3e9,
    marketCap: 56e9,
  },
]
const CAL_DIVIDENDS: DividendEvent[] = [
  {
    id: 'd-1',
    at: calAt(17, 0),
    region: 'US',
    regionName: '乙国',
    regionGroup: 'NORTH AMERICA',
    code: 'ALFA',
    name: '示例阿尔法科技',
    currency: '$',
    amount: 0.25,
    yield: 0.62,
    payAt: calAt(28, 0),
  },
  {
    id: 'd-2',
    at: calAt(18, 0),
    region: 'CN',
    regionName: '甲国',
    regionGroup: 'ASIA',
    code: '600001',
    name: '示例德尔塔能源',
    currency: '¥',
    amount: 0.8,
    yield: 3.41,
    payAt: calAt(26, 0),
  },
  {
    id: 'd-3',
    at: calAt(20, 0),
    region: 'GB',
    regionName: '戊国',
    regionGroup: 'EUROPE',
    code: 'ZETA',
    name: '示例泽塔矿业',
    currency: '£',
    amount: 0.46,
    yield: 5.12,
    payAt: calAt(30, 0),
  },
]
const CAL_IPOS: IpoEvent[] = [
  {
    id: 'i-1',
    at: calAt(18, 0),
    region: 'US',
    regionName: '乙国',
    regionGroup: 'NORTH AMERICA',
    code: 'ETAX',
    name: '示例伊塔生物',
    exchange: 'NASDAQ',
    priceLow: 14,
    priceHigh: 16,
    shares: 8.5e6,
    dealSize: 127.5e6,
    status: '已定价',
  },
  {
    id: 'i-2',
    at: calAt(19, 0),
    region: 'CN',
    regionName: '甲国',
    regionGroup: 'ASIA',
    name: '示例西塔机器人',
    exchange: 'SSE',
    priceLow: 36.4,
    priceHigh: 36.4,
    shares: 62e6,
    dealSize: 2.26e9,
    status: '待上市',
  },
]

const CAL_LABELS: EventCalendarLabels = {
  list: '经济日历',
  empty: '这一天没有符合条件的事件',
  nav: { today: '今天', prevWeek: '上一周', nextWeek: '下一周', pickDate: '选择日期', week: '本周' },
  categoryGroup: '日历类别',
  category: { economic: '经济', earnings: '财报', dividends: '分红', ipo: 'IPO' },
  highOnly: '只看高重要',
  economicCategory: {
    label: '经济类别',
    all: '全部类别',
    items: {
      bonds: '债券',
      business: '商业',
      consumer: '消费',
      gdp: 'GDP',
      government: '政府',
      health: '卫生',
      housing: '住房',
      labor: '就业',
      money: '货币',
      prices: '价格',
      trade: '贸易',
      taxes: '税收',
    },
  },
  countries: {
    all: '全部国家',
    count: (n) => `${n} 个国家`,
    title: '选择国家',
    search: '搜索国家 / 地区',
    entireWorld: '全球',
    top: '前 20 大经济体',
    empty: '没有这个国家',
    otherGroup: '其他',
    cancel: '取消',
    apply: '应用',
  },
  today: '今天',
  now: '现在',
  importance: (level) => `重要程度 ${level}`,
  columns: { actual: '实际', forecast: '预期', previous: '前值' },
  earningsColumns: {
    epsEstimate: 'EPS 预期',
    epsActual: 'EPS 实际',
    epsSurprise: 'EPS 意外',
    revenueEstimate: '营收预期',
    revenueActual: '营收实际',
    revenueSurprise: '营收意外',
    marketCap: '市值',
  },
  dividendColumns: { amount: '每股分红', yield: '股息率', payDate: '派息日' },
  ipoColumns: { exchange: '交易所', priceRange: '发行价', shares: '股数', dealSize: '募资额', status: '状态' },
  session: { before: '盘前', during: '盘中', after: '盘后' },
  countdown: (m) => (m >= 60 ? `${Math.floor(m / 60)} 小时 ${m % 60} 分后` : `${m} 分后`),
  dayTitle: (day) => {
    const [y, m, d] = day.split('-').map(Number)
    const week = '日一二三四五六'[new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()]
    return `${m} 月 ${d} 日 周${week}`
  },
  count: (n) => `${n} 条`,
  detail: {
    description: '说明',
    source: '来源',
    history: '历史值',
    historyLabel: (n) => `最近 ${n} 期历史值`,
    nextRelease: '下次发布',
  },
  rowActions: '事件操作',
  rowMenu: '事件菜单',
}

export function EventCalendarDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 820, height: 640 }}>
      <PanelFrame focused aria-label="经济日历">
        <PanelFrameHeader heading="经济日历" object="演示数据" />
        <PanelFrameBody>
          <EventCalendar
            events={CAL_EVENTS}
            earnings={CAL_EARNINGS}
            dividends={CAL_DIVIDENDS}
            ipos={CAL_IPOS}
            labels={CAL_LABELS}
            now={CAL_NOW}
            timeZone="Asia/Shanghai"
            locale="zh-CN"
            defaultDay="2026-11-17"
            topRegions={['US', 'CN', 'JP']}
            earningsLinks={(e) =>
              e.epsActual === undefined
                ? []
                : [
                    { key: 'm', label: '财报材料' },
                    { key: 'c', label: '电话会' },
                  ]
            }
            rowActions={(event) =>
              symbolMenu({
                newAlert: { label: '设提醒', onSelect: () => undefined },
                copyCode: { label: `复制 ${event.id}`, onSelect: () => undefined },
              })
            }
          />
        </PanelFrameBody>
      </PanelFrame>
    </div>
  )
}

// 指标卡演示（#30）：序列由固定种子的随机游走编出来（演示数据，不是行情），两组各一面卡片墙。
function walk(seed: number, start: number, step: number, lo: number, hi: number, n = 250): number[] {
  let state = seed
  const rand = () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
  const out: number[] = []
  let v = start
  for (let i = 0; i < n; i += 1) {
    v = Math.min(hi, Math.max(lo, v + (rand() - 0.5) * 2 * step))
    out.push(Number(v.toFixed(2)))
  }
  return out
}

const METRIC_RANGES = [
  { key: '1m', label: '1 月', n: 21 },
  { key: '3m', label: '3 月', n: 63 },
  { key: '6m', label: '6 月', n: 126 },
  { key: '1y', label: '1 年', n: 250 },
] as const

function metricProps(values: readonly number[]): { ranges: MetricRange[]; changes: MetricChange[] } {
  const last = values[values.length - 1]!
  const since = (back: number): number | null => {
    const base = values[values.length - 1 - back]
    return base === undefined || base === 0 ? null : ((last - base) / Math.abs(base)) * 100
  }
  return {
    ranges: METRIC_RANGES.map((r) => ({ key: r.key, label: r.label, values: values.slice(-r.n) })),
    changes: [
      { key: 'd', label: '较前日', value: since(1) },
      { key: 'w', label: '较前周', value: since(5) },
      { key: 'm', label: '较前月', value: since(21) },
      { key: 'y', label: '较前年', value: since(249) },
    ],
  }
}

const FEAR_GREED_STAGES: MetricStage[] = [
  { label: '极度恐惧', from: 0, to: 25 },
  { label: '恐惧', from: 25, to: 45 },
  { label: '中性', from: 45, to: 55 },
  { label: '贪婪', from: 55, to: 75 },
  { label: '极度贪婪', from: 75, to: 100 },
]
const CYCLE_STAGES: MetricStage[] = [
  { label: '冰点', from: 0, to: 20 },
  { label: '低迷', from: 20, to: 40 },
  { label: '平稳', from: 40, to: 60 },
  { label: '活跃', from: 60, to: 80 },
  { label: '亢奋', from: 80, to: 100 },
]

const GLOBAL_DEMO = [
  {
    title: '恐惧与贪婪指数',
    trend: 'neutral' as const,
    seed: 11,
    start: 48,
    step: 4,
    lo: 5,
    hi: 95,
    digits: 0,
    stages: FEAR_GREED_STAGES,
  },
  { title: 'VIX 波动率', trend: 'inverse' as const, seed: 23, start: 17, step: 1.2, lo: 10, hi: 45, digits: 2 },
  { title: '金油比', seed: 37, start: 24, step: 0.5, lo: 15, hi: 35, digits: 2 },
  { title: '美元指数', seed: 41, start: 102, step: 0.6, lo: 94, hi: 112, digits: 2 },
]
const ASHARE_DEMO = [
  {
    title: '情绪分',
    trend: 'neutral' as const,
    seed: 53,
    start: 52,
    step: 6,
    lo: 3,
    hi: 97,
    digits: 0,
    stages: CYCLE_STAGES,
  },
  { title: '涨停数', seed: 67, start: 60, step: 9, lo: 15, hi: 140, digits: 0, unit: '只' },
  { title: '连板高度', seed: 71, start: 4, step: 0.9, lo: 1, hi: 9, digits: 0, unit: '板' },
  { title: '封板率', seed: 83, start: 72, step: 3, lo: 40, hi: 95, digits: 1, unit: '%' },
]

function MetricWall({
  name,
  demo,
}: {
  name: string
  demo: readonly (typeof GLOBAL_DEMO)[number][] | typeof ASHARE_DEMO
}) {
  return (
    <MetricCardGrid label={name} minWidth={280} ranges={METRIC_RANGES} rangeLabel={`${name}走势区间`}>
      {demo.map((d) => {
        const values = walk(d.seed, d.start, d.step, d.lo, d.hi).map((v) => Number(v.toFixed(d.digits)))
        const last = values[values.length - 1]!
        return (
          <MetricCard
            key={d.title}
            label={d.title}
            value={last.toFixed(d.digits)}
            unit={'unit' in d ? d.unit : undefined}
            {...metricProps(values)}
            trendTone={'trend' in d ? d.trend : 'direction'}
            labels={{ range: `${d.title}走势区间`, spark: `${d.title}走势` }}
            stages={'stages' in d ? d.stages : undefined}
            current={last}
            source="演示数据，不是行情"
            updatedAt="更新 2026-11-15 15:00"
          />
        )
      })}
    </MetricCardGrid>
  )
}

export function MetricCardDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 1080, height: 780 }}>
      <PanelFrame focused aria-label="指标卡">
        <PanelFrameHeader heading="指标卡" object="演示数据" />
        <PanelFrameBody>
          <div className="gal-metric-wall" style={{ overflow: 'auto', padding: 12, display: 'grid', gap: 16 }}>
            <section data-testid="metric-global">
              <p className="gal-note">全球情绪</p>
              <MetricWall name="全球情绪" demo={GLOBAL_DEMO} />
            </section>
            <section data-testid="metric-ashare">
              <p className="gal-note">A 股情绪周期</p>
              <MetricWall name="A 股情绪周期" demo={ASHARE_DEMO} />
            </section>
            <section data-testid="metric-empty">
              <p className="gal-note">没有数据</p>
              <MetricCardGrid label="空态" minWidth={280}>
                <MetricCard
                  label="未接入的指标"
                  value={null}
                  changes={[{ key: 'd', label: '较前日', value: null }]}
                  ranges={[{ key: '1m', label: '1 月', values: [] }]}
                  labels={{ range: '走势区间', spark: '没有数据' }}
                  source="未连接"
                />
              </MetricCardGrid>
            </section>
            <section data-testid="metric-live">
              <LiveMetricCardDemo />
            </section>
          </div>
        </PanelFrameBody>
      </PanelFrame>
    </div>
  )
}

// 分档分布柱（#109）：A 股涨跌幅 11 档，家数是示例数据，不是行情。档名、汇总的名字都在这里写（包里不带文案）。
const DIST_BINS = [
  { key: 'd0', label: '跌停', count: 38, tone: 'down' },
  { key: 'd1', label: '<-7%', count: 120, tone: 'down' },
  { key: 'd2', label: '-7~-5', count: 210, tone: 'down' },
  { key: 'd3', label: '-5~-3', count: 480, tone: 'down' },
  { key: 'd4', label: '-3~-1', count: 920, tone: 'down' },
  { key: 'd5', label: '平', count: 260, tone: 'muted' },
  { key: 'd6', label: '1~3', count: 1180, tone: 'up' },
  { key: 'd7', label: '3~5', count: 640, tone: 'up' },
  { key: 'd8', label: '5~7', count: 310, tone: 'up' },
  { key: 'd9', label: '>7%', count: 140, tone: 'up' },
  { key: 'd10', label: '涨停', count: 62, tone: 'up' },
] as const

export function DistributionBarsDemo() {
  return (
    <>
      <div className="gal-wide" data-testid="dist-bars" style={{ maxWidth: 560 }}>
        <DistributionBars bins={DIST_BINS} label="示例涨跌幅分布" totals={{ up: '涨', muted: '平', down: '跌' }} />
      </div>
      <p className="gal-note">
        示例数据：11 档（9 档同理），柱顶是家数，底部一行汇总；档的边界与文字都由调用方传。没有数据显示空态：
      </p>
      <div className="gal-wide" data-testid="dist-empty" style={{ maxWidth: 560 }}>
        <DistributionBars bins={[]} label="示例空态" empty="暂无数据" />
      </div>
    </>
  )
}

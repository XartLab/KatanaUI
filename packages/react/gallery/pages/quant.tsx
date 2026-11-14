// SPDX-License-Identifier: MIT
import { useEffect, useMemo, useState } from 'react'
import { PanelFrame } from '../../src/blocks'
import {
  ChangeText,
  LimitLadder,
  MarketHeatmap,
  TechnicalRating,
  PnlText,
  formatCompact,
  formatPercentChange,
  formatPrice,
  formatQuantity,
  formatVolume,
  type HeatmapColorBy,
  type HeatmapItem,
  type HeatmapScheme,
  type HeatmapSizeBy,
  type LadderLevel,
  type LimitLadderLabels,
  type MarketHeatmapLabels,
  type RatingGroup,
  type RatingRow,
  type RatingVerdict,
  type TechnicalRatingLabels,
} from '../../src/quant'
import { ToggleGroup, ToggleGroupItem } from '../../src/primitives/toggle-group'
import { ActionLog, Cell, Row, SAMPLE_MARK_SRC, demoSymbolActions } from './parts'

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
  const [log, setLog] = useState('')
  return (
    <div style={{ width: '100%', maxWidth: 640 }}>
      <div style={{ height: 660 }}>
        <PanelFrame
          index="02"
          title="连板天梯"
          object="演示数据"
          meta="DEMO"
          source="SOURCE · 演示数据 · 非行情"
          focused
          labels={{ settings: '设置', maximize: '最大化', restore: '还原', close: '关闭' }}
        >
          <LimitLadder
            levels={LADDER_LEVELS}
            labels={LADDER_LABELS}
            selected={selected}
            onSelect={setSelected}
            rowActions={(item) => demoSymbolActions(item.code, setLog)}
          />
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
              cellActions={(item) => demoSymbolActions(item.code, setLog)}
            />
          </PanelFrame>
        </div>
      </div>
      <ActionLog text={log} />
    </div>
  )
}

// 技术评级仪表（#20）的演示：读数与结论从合成价格算出来，不是行情；分数与个数在这里按「买 − 卖」除以总数现算，真实调用方自己算。
const RATING_TIMEFRAMES = [
  { value: '1m', label: '1 分' },
  { value: '15m', label: '15 分' },
  { value: '1h', label: '1 小时' },
  { value: '4h', label: '4 小时' },
  { value: '1d', label: '1 日' },
  { value: '1w', label: '1 周' },
  { value: '1M', label: '1 月' },
]
const RATING_ZONES = ['强卖', '卖', '中性', '买', '强买'] as const
const RATING_LABELS: TechnicalRatingLabels = {
  zones: RATING_ZONES,
  verdict: { sell: '卖', neutral: '中性', buy: '买' },
  total: (n) => `共 ${n} 项指标`,
  columns: { name: '指标', reading: '读数', verdict: '结论' },
  timeframe: '时间周期',
  list: '技术评级',
  empty: '没有数据',
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

function makeRating(frame: number) {
  const rand = seeded(20 + frame * 7)
  const drift = (rand() - 0.45) * 0.6
  const close: number[] = []
  let price = 100
  for (let i = 0; i < 260; i += 1) {
    price += drift + Math.sin(i / (9 + frame * 3)) * 0.9 + (rand() - 0.5) * 2.4
    close.push(price)
  }
  const rows = indicators(close)
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
      '振荡指标',
      rows.filter((r) => r.group === 'osc'),
    ),
    group('all', '总评', rows),
    group(
      'ma',
      '均线',
      rows.filter((r) => r.group === 'ma'),
    ),
  ]
  return { rows, groups }
}

export function TechnicalRatingDemo() {
  const [frame, setFrame] = useState('1d')
  const { rows, groups } = makeRating(RATING_TIMEFRAMES.findIndex((tf) => tf.value === frame))
  return (
    <div style={{ width: '100%', maxWidth: 520, height: 760 }}>
      <PanelFrame
        index="04"
        title="技术评级"
        object="演示数据"
        meta="DEMO"
        source="SOURCE · 演示数据 · 非行情"
        focused
        labels={{ settings: '设置', maximize: '最大化', restore: '还原', close: '关闭' }}
      >
        <TechnicalRating
          groups={groups}
          rows={rows}
          labels={RATING_LABELS}
          primary="all"
          timeframes={RATING_TIMEFRAMES}
          timeframe={frame}
          onTimeframeChange={setFrame}
          disclaimer="评级只是指标读数的汇总，不是买卖建议。"
        />
      </PanelFrame>
    </div>
  )
}

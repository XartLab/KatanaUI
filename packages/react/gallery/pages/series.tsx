// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { useScrubber } from '../../src/index.ts'
import {
  AttributionBars,
  SeriesExplorer,
  SmallMultiples,
  type AttributionItem,
  type SeriesPoint,
  type SmallMultiple,
} from '../../src/blocks/index.ts'
import {
  BrushChart,
  CalendarHeatmap,
  HorizonChart,
  EquityCurve,
  type EquityCurvePoint,
  type CalendarDay,
  type CalendarEvent,
  type HorizonRow,
} from '../../src/quant/index.ts'
import { Row, SAMPLE_MARK_SRC } from './parts.tsx'

// #1917：时间序列与盈亏的件的演示。下面所有数据都是演示用的合成数据（在这个展示页里按固定种子生成，不是行情、不是账户），每页也写明了；应用里没有样本数据。

export const DEMO_NOTE = '演示数据：固定种子合成，不是行情，也不是账户。'

/** 固定种子的伪随机（mulberry32）：每次渲染、每个主题数据都一样，e2e 才能断言具体数。 */
export function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 随机游走：从 start 起 count 个点，每步 ±step 内。 */
export function walk(seed: number, count: number, start = 100, step = 2): number[] {
  const next = seeded(seed)
  const out = [start]
  for (let i = 1; i < count; i++) out.push(+(out[i - 1]! + (next() - 0.5) * 2 * step).toFixed(2))
  return out
}

const DAY = 86_400_000
/** 演示用的日期轴：2026-01-01 起每天一格（UTC）。 */
export const DEMO_START = Date.UTC(2026, 0, 1)
export const dayAt = (index: number) => new Date(DEMO_START + index * DAY).toISOString().slice(0, 10)

export function UseScrubberDemo() {
  const bars = [4, 7, 5, 9, 12, 8, 6, 10, 14, 11, 7, 9]
  const scrub = useScrubber({ count: bars.length, mode: 'band' })
  return (
    <>
      <Row name="十二格">
        <div className="gal-scrub" data-gallery-scrubber role="group" aria-label="扫读演示：十二根柱" {...scrub.props}>
          {bars.map((value, i) => (
            <span
              key={i}
              className="gal-scrub-bar"
              data-active={scrub.index === i ? 'true' : undefined}
              style={{ height: value * 6 }}
            />
          ))}
        </div>
        <output className="gal-label" data-gallery-scrubber-readout>
          {scrub.index === null ? '未选中' : `第 ${scrub.index + 1} 格 · 值 ${bars[scrub.index]}`}
        </output>
      </Row>
      <p className="gal-note">{DEMO_NOTE}</p>
    </>
  )
}

export function BrushChartDemo() {
  const values = walk(11, 120, 1000, 18)
  return (
    <>
      <div className="gal-wide" data-gallery-brush style={{ maxWidth: 640 }}>
        <BrushChart
          values={values}
          label="示例权益曲线"
          formatX={dayAt}
          formatValue={(v) => v.toFixed(0)}
          labels={{ start: '窗口起点', end: '窗口终点', window: '窗口位置' }}
          defaultWindow={[60, 120]}
        />
      </div>
      <p className="gal-note">{DEMO_NOTE}</p>
    </>
  )
}

const money = (value: number) => `${value > 0 ? '+' : ''}${value.toLocaleString('en-US')}`

const ATTR_SYMBOLS: AttributionItem[] = [
  {
    key: '300750',
    label: '300750 宁德时代',
    value: 73_920,
    icon: {},
    detail: [
      { label: '持仓', value: '3' },
      { label: '账户', value: 'A B' },
    ],
  },
  { key: '00700', label: '00700 腾讯控股', value: 14_300, icon: {} },
  { key: '002475', label: '002475 立讯精密', value: 8_760, icon: {}, closed: '已平 09-18' },
  // 示意图标：自绘的 SVG，演示有图的样子。
  { key: 'BTC', label: 'BTC 比特币', value: 3_100, icon: { src: SAMPLE_MARK_SRC } },
  { key: '601012', label: '601012 隆基绿能', value: 1_640, icon: {} },
  { key: '688981', label: '688981 中芯国际', value: 480, icon: {} },
  { key: '000333', label: '000333 美的集团', value: 200, icon: {} },
  { key: '600519', label: '600519 贵州茅台', value: -11_200, icon: {} },
  { key: 'IF2510', label: 'IF2510 沪深300 期货', value: -32_580, icon: {} },
  { key: 'fee', label: '费用 · 税', value: -2_000, kind: 'fee' },
]
const ATTR_ACCOUNTS: AttributionItem[] = [
  { key: 'A', label: '账户 A', value: 38_200 },
  { key: 'B', label: '账户 B', value: 9_400 },
  { key: 'F', label: '账户 F', value: -1_160 },
  { key: 'fee', label: '费用 · 税', value: -2_000, kind: 'fee' },
]
const ATTR_STRATEGIES: AttributionItem[] = [
  { key: 'trend', label: '趋势跟随', value: 52_300 },
  { key: 'mean', label: '均值回归', value: 4_200 },
  { key: 'hedge', label: '对冲', value: -9_600 },
  { key: 'fee', label: '费用 · 税', value: -2_000, kind: 'fee' },
]
const ATTR_CLASSES: AttributionItem[] = [
  { key: 'stock', label: '股票', value: 63_400 },
  { key: 'future', label: '期货', value: -17_000 },
  { key: 'fee', label: '费用 · 税', value: -2_000, kind: 'fee' },
]
const ATTR_BY_DIM: Record<string, AttributionItem[]> = {
  symbol: ATTR_SYMBOLS,
  account: ATTR_ACCOUNTS,
  strategy: ATTR_STRATEGIES,
  asset: ATTR_CLASSES,
}

export function AttributionBarsDemo() {
  const [dim, setDim] = useState('symbol')
  const [range, setRange] = useState('today')
  const [focus, setFocus] = useState<string | undefined>('300750')
  const items = ATTR_BY_DIM[dim] ?? ATTR_SYMBOLS
  const pos = items.reduce((sum, item) => sum + Math.max(0, item.value), 0)
  const neg = items.reduce((sum, item) => sum + Math.min(0, item.value), 0)
  return (
    <>
      <div className="gal-wide" data-gallery-attribution style={{ maxWidth: 760 }}>
        <AttributionBars
          items={items}
          title="P&L ATTRIBUTION"
          meta={(max) => `归因 · 今日 · 账户 A B · CNY · 刻度 ±${max.toLocaleString('en-US')}`}
          label="今日盈亏归因（示例）"
          dimensions={{
            label: '维度',
            value: dim,
            onChange: (key) => key && setDim(key),
            options: [
              { key: 'symbol', label: '品种' },
              { key: 'account', label: '账户' },
              { key: 'strategy', label: '策略' },
              { key: 'asset', label: '资产类别' },
            ],
          }}
          ranges={{
            label: '区间',
            value: range,
            onChange: (key) => key && setRange(key),
            options: [
              { key: 'today', label: '今日' },
              { key: 'week', label: '本周' },
              { key: 'month', label: '本月' },
            ],
          }}
          formatValue={money}
          otherLabel={(n) => `其他 ×${n}`}
          formatShare={(x) => `${(x * 100).toFixed(1)}%`}
          shareLabel="占比"
          readouts={[
            { key: 'sum', label: '今日合计', text: money(pos + neg), value: pos + neg },
            { key: 'pos', label: '正贡献', text: money(pos), value: pos },
            { key: 'neg', label: '负贡献', text: money(neg), value: neg },
          ]}
          focusKey={focus}
          onSelect={setFocus}
          heads={{ index: 'IDX', item: '品种', value: '贡献', share: '占比 |贡献|', shareTitle: '占总贡献绝对值之和' }}
          footer={{
            count: `${items.length} 项`,
            source: 'SOURCE · 台账成交 + 行情估值 · 演示数据',
            note: '研究账本不计入',
          }}
          actionLabels={{ group: '图工具', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }}
          onExport={() => {}}
        />
      </div>
      <p className="gal-note">
        {DEMO_NOTE}场景照设计稿 PnLAttribution 卡：方向用位置（正在右、负在左），条是 ink-200
        点阵纹理，焦点品种的条是强调色纹理，只有数字用涨跌色。超过 7 项折进「其他
        ×n」，费用·税永远在最底；已平仓的行整行删除线、名称后一个「已平
        09-18」点阵小标签。品种前是徽标：股票用字母圆标，BTC
        一行用自绘的示意图标演示有图的样子（示意图标，不是真实标志）。
      </p>
    </>
  )
}

/** 演示用的一年每日盈亏：2025-11-15 到 2026-11-14，周末休市（open: false），工作日有数；十月前后撒几个演示事件。 */
const CAL_FROM = '2025-11-15'
const CAL_TO = '2026-11-14'
const CAL_EVENTS: Record<string, CalendarEvent[]> = {
  '2026-09-30': [{ label: '300750 财报', kind: '财报' }],
  '2026-10-08': [{ label: '600519 分红', kind: '分红', tone: 'holding' }],
  '2026-10-09': [
    { label: '00700 财报', kind: '财报' },
    { label: '宏观数据', kind: '宏观' },
  ],
  '2026-10-13': [{ label: '002475 解禁', kind: '解禁', tone: 'high' }],
  '2026-10-15': [{ label: 'CPI', kind: '宏观' }],
  '2026-10-19': [
    { label: '300750 分红', kind: '分红' },
    { label: '宏观数据', kind: '宏观' },
    { label: '002475 解禁', kind: '解禁', tone: 'holding' },
  ],
  '2026-10-21': [{ label: '600519 财报', kind: '财报' }],
  '2026-10-27': [
    { label: 'A', kind: '财报' },
    { label: 'B', kind: '财报' },
    { label: 'C', kind: '分红' },
    { label: 'D', kind: '解禁', tone: 'high' },
    { label: 'E', kind: '宏观' },
  ],
}
const CAL_DAYS: CalendarDay[] = (() => {
  const next = seeded(7)
  const out: CalendarDay[] = []
  for (let ms = Date.UTC(2025, 10, 15); ms <= Date.UTC(2026, 10, 14); ms += 86_400_000) {
    const weekday = new Date(ms).getUTCDay()
    const date = new Date(ms).toISOString().slice(0, 10)
    const events = CAL_EVENTS[date]
    if (weekday === 0 || weekday === 6) out.push({ date, value: null, open: false, events })
    else out.push({ date, value: Math.round((next() - 0.46) * 2000), events })
  }
  return out
})()

const CAL_PROPS = {
  weekdayLabels: ['日', '一', '二', '三', '四', '五', '六'],
  monthLabels: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
  weekLabel: (week: number) => `W${week}`,
  closedLabel: '休',
  formatValue: (value: number) => (value > 0 ? '+' : '') + value,
  describe: (date: string, value: number | null) =>
    `${date}  ${value === null ? '休市或没有数据' : (value > 0 ? '+' : '') + value}`,
  legend: { down: '亏', up: '盈' },
  actionLabels: { group: '图工具', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' },
  tableHeads: { date: '日期', value: '数值' },
} as const

export function CalendarHeatmapDemo() {
  const [view, setView] = useState<'pnl' | 'turnover' | 'events'>('pnl')
  const [picked, setPicked] = useState('')
  const month = CAL_DAYS.filter((day) => day.date.startsWith('2026-10'))
  const sum = month.reduce((t, day) => t + (day.date <= '2026-10-19' ? (day.value ?? 0) : 0), 0)
  return (
    <>
      <div className="gal-wide" data-gallery-calendar="month" style={{ maxWidth: 620 }}>
        <CalendarHeatmap
          {...CAL_PROPS}
          days={CAL_DAYS}
          month="2026-10"
          today="2026-10-19"
          view={view}
          label="示例收益日历 2026-10"
          total={{ text: `${sum > 0 ? '+' : ''}${sum}`, value: sum }}
          toolbar={
            <span className="gal-row" role="group" aria-label="视图">
              {(['pnl', 'turnover', 'events'] as const).map((v) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} data-view={v}>
                  {v === 'pnl' ? '收益' : v === 'turnover' ? '换手' : '事件'}
                </button>
              ))}
              <span>2026-10 · 账户 A B F</span>
            </span>
          }
          onSelect={setPicked}
          onExport={() => {}}
        />
        <output data-gallery-calendar-picked>{picked ? `点了 ${picked}` : ''}</output>
      </div>
      <Row name="年视图">
        <div className="gal-wide" data-gallery-calendar="year" style={{ maxWidth: 860 }}>
          <CalendarHeatmap
            {...CAL_PROPS}
            days={CAL_DAYS}
            mode="year"
            from={CAL_FROM}
            to={CAL_TO}
            label="示例：一年的每日盈亏"
          />
        </div>
      </Row>
      <p className="gal-note">
        {DEMO_NOTE}场景照设计稿 Calendar 卡：格 34px，日期左上、数值右下、事件点左下（最多 3 个，更多写
        +n），休市日灰底写「休」，今天强调色描边； 收益色是发散色的浅档，只有超月内 80 分位的格用深档，涨跌色不上面积。
      </p>
    </>
  )
}
/** 演示用的日内收益（%）：四行各用一个闭式公式生成，一行 48 个点，页上写明是演示。 */
const HZ_POINTS = 48
const hz = (f: (i: number) => number) => Array.from({ length: HZ_POINTS }, (_, i) => +f(i).toFixed(3))
export const HORIZON_DEMO_ROWS: readonly HorizonRow[] = [
  { key: 'AAA', label: 'AAA', values: hz((i) => 3 * Math.sin(i / 3.8)) },
  { key: 'BBB', label: 'BBB', values: hz((i) => 1.2 * Math.sin(i / 3.8 + 1)) },
  { key: 'CCC', label: 'CCC', values: hz((i) => (i < HZ_POINTS / 2 ? 0.9 : -0.9)) },
  { key: 'DDD', label: 'DDD', values: hz((i) => -2 * Math.cos(i / 5)) },
]
const pctText = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`

export function HorizonChartDemo() {
  return (
    <>
      <div className="gal-wide" data-gallery-horizon="shared" style={{ maxWidth: 560 }}>
        <HorizonChart
          rows={HORIZON_DEMO_ROWS}
          label="示例：四个品种的日内收益（共用刻度）"
          formatValue={pctText}
          formatX={(i) => `第 ${i + 1} 点`}
        />
      </div>
      <Row name="各行各自的刻度">
        <div className="gal-wide" data-gallery-horizon="row" style={{ maxWidth: 560 }}>
          <HorizonChart
            rows={HORIZON_DEMO_ROWS}
            label="示例：四个品种的日内收益（各自刻度）"
            formatValue={pctText}
            scale="row"
          />
        </div>
      </Row>
      <p className="gal-note">
        {DEMO_NOTE}三条带：颜色越深值越大，涨跌色跟涨跌配色走；共用刻度时行与行可比，各自刻度只看形状。
      </p>
    </>
  )
}

/** 演示用的六个品种的价格走势：闭式公式，一条 40 个点。 */
const SM_POINTS = 40
const sm = (f: (i: number) => number) => Array.from({ length: SM_POINTS }, (_, i) => +f(i).toFixed(3))
export const SMALL_MULTIPLES_DEMO: readonly SmallMultiple[] = [
  { key: 'AAA', label: 'AAA', values: sm((i) => 100 + i * 0.5) },
  { key: 'BBB', label: 'BBB', values: sm((i) => 100 - i * 0.3) },
  { key: 'CCC', label: 'CCC', values: sm((i) => 100 + 5 * Math.sin((i * Math.PI) / (SM_POINTS - 1))) },
  { key: 'DDD', label: 'DDD', values: sm((i) => 50 + 20 * Math.cos(i / 6)) },
  { key: 'EEE', label: 'EEE', values: sm((i) => 80 + 8 * Math.sin(i / 3) + i * 0.2) },
  { key: 'FFF', label: 'FFF', values: sm((i) => 120 - 15 * Math.sin(i / 8)) },
]

export function SmallMultiplesDemo() {
  const [picked, setPicked] = useState<string | null>(null)
  return (
    <>
      <div className="gal-wide" data-gallery-multiples="each" style={{ maxWidth: 640 }}>
        <SmallMultiples
          items={SMALL_MULTIPLES_DEMO}
          label="示例：六个品种的走势（各自范围）"
          formatValue={(v) => v.toFixed(2)}
          formatX={(i) => `第 ${i + 1} 点`}
          onSelect={setPicked}
        />
      </div>
      <p className="gal-note" data-gallery-multiples-picked>
        {picked === null ? '还没点标题' : `点了 ${picked}`}
      </p>
      <Row name="共用范围">
        <div className="gal-wide" data-gallery-multiples="shared" style={{ maxWidth: 640 }}>
          <SmallMultiples
            items={SMALL_MULTIPLES_DEMO}
            label="示例：六个品种的走势（共用范围）"
            formatValue={(v) => v.toFixed(2)}
            yScale="shared"
          />
        </div>
      </Row>
      <p className="gal-note">{DEMO_NOTE}线色按头尾比，涨跌色跟涨跌配色走；each 看形状，shared 看高低。</p>
    </>
  )
}

/** 演示用的 24 个月的盈亏：2025-01 到 2026-12，一月一个点，闭式公式生成（已实现、手续费、资金费、净盈亏）。 */
const SX_MONTHS = 24
const SX_OPENING = 50_000
const sxPoints = (deposit: number): SeriesPoint[] => {
  let equity = SX_OPENING
  return Array.from({ length: SX_MONTHS }, (_, m) => {
    const closed = m === 9
    const realized = closed ? 0 : Math.round(2400 * Math.sin(m / 2.5) + 400 + 60 * m)
    const fee = closed ? 0 : -(120 + 10 * (m % 5))
    const funding = closed ? 0 : m % 3 === 0 ? -60 : 45
    const net = realized + fee + funding
    equity += net + (m === 18 ? deposit : 0)
    return { at: Date.UTC(2025, m, 1), closed, values: { realized, fee, funding, net, equity } }
  })
}
const SX_POINTS = sxPoints(0)
const SX_POINTS_UNRECORDED = sxPoints(500)
const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toLocaleString('en-US')}`
const monthText = (at: number) => new Date(at).toISOString().slice(0, 7)

const SX_PROPS = {
  series: [
    { key: 'realized', label: '已实现', kind: 'bar' },
    { key: 'fee', label: '费税', kind: 'bar', cost: true },
    { key: 'funding', label: '资金费', kind: 'bar' },
    { key: 'net', label: '净盈亏', kind: 'line' },
  ],
  ranges: [
    { key: '3m', label: '3M', months: 3 },
    { key: '6m', label: '6M', months: 6 },
    { key: '12m', label: '12M', months: 12 },
    { key: 'all', label: '全部', months: null },
  ],
  kpis: [
    { key: 'net', label: '净盈亏', series: 'net', reduce: 'sum', format: signed, limit: -1500 },
    { key: 'realized', label: '已实现', series: 'realized', reduce: 'sum', format: signed },
    { key: 'fee', label: '费税', series: 'fee', reduce: 'sum', format: signed, lowerIsBetter: true },
  ],
  columns: [
    {
      key: 'realized',
      label: '已实现',
      text: (p: SeriesPoint) => signed(p.values.realized!),
      tone: (p: SeriesPoint) => p.values.realized ?? null,
    },
    { key: 'fee', label: '费税', text: (p: SeriesPoint) => signed(p.values.fee!) },
    {
      key: 'funding',
      label: '资金费',
      text: (p: SeriesPoint) => signed(p.values.funding!),
      tone: (p: SeriesPoint) => p.values.funding ?? null,
    },
    {
      key: 'net',
      label: '净盈亏',
      text: (p: SeriesPoint) => signed(p.values.net!),
      tone: (p: SeriesPoint) => p.values.net ?? null,
    },
  ],
  labels: {
    chart: 'P&L EXPLORER',
    ranges: '区间',
    metrics: '指标',
    compare: '对比上一期',
    previous: '上一期',
    table: '示例盈亏明细',
    time: '月份',
    empty: '没有数据',
    spark: (metric: string) => `${metric}走势（演示）`,
    limit: '月亏损限额',
    source: 'SOURCE / 演示数据（固定种子合成）· 2026-12 收盘',
    actions: { group: '图工具', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' },
    brush: { start: '窗口起点', end: '窗口终点', window: '窗口位置' },
    reconcile: { open: '期初', close: '期末', diff: '差额', ok: '对账一致', warn: '对账有差', unit: 'CNY' },
  },
  meta: '盈亏探索（演示）· RUN 2C91 · 2025-01 → 2026-12 · CNY',
  events: [
    { at: Date.UTC(2025, 5, 1), label: '费率上调' },
    { at: Date.UTC(2026, 1, 1), label: '换仓' },
    { at: Date.UTC(2026, 7, 1), label: '限额调整' },
  ],
  formatAt: monthText,
  formatValue: (v: number) => v.toLocaleString('en-US'),
  formatChange: (r: number) => `${r > 0 ? '+' : ''}${(r * 100).toFixed(1)}%`,
  reconcile: {
    net: 'net',
    equity: 'equity',
    openingEquity: SX_OPENING,
    format: (v: number) => v.toLocaleString('en-US'),
  },
} as const

// 情绪状态带（#109 regimes）：三种状态按月切 24 个点，最后一段是估的。演示数据。
const SX_REGIMES = {
  label: '情绪周期状态',
  title: '情绪日趋势',
  current: 'warm',
  currentText: '当前',
  estimateText: '估算',
  states: [
    { id: 'cold', name: '冰点', color: 1 },
    { id: 'warm', name: '升温', color: 2 },
    { id: 'peak', name: '高潮', color: 4 },
  ],
  segments: [
    { from: Date.UTC(2025, 0, 1), to: Date.UTC(2025, 7, 1), state: 'cold' },
    { from: Date.UTC(2025, 7, 1), to: Date.UTC(2026, 2, 1), state: 'warm' },
    { from: Date.UTC(2026, 2, 1), to: Date.UTC(2026, 8, 1), state: 'peak' },
    { from: Date.UTC(2026, 8, 1), to: Date.UTC(2027, 0, 1), state: 'warm', estimated: true },
  ],
} as const

export function SeriesExplorerDemo() {
  return (
    <>
      <div className="gal-wide" data-gallery-explorer="ok" style={{ maxWidth: 760 }}>
        <SeriesExplorer {...SX_PROPS} points={SX_POINTS} onExport={() => {}} />
      </div>
      <Row name="对账对不上">
        <div className="gal-wide" data-gallery-explorer="mismatch" style={{ maxWidth: 760 }}>
          <SeriesExplorer {...SX_PROPS} points={SX_POINTS_UNRECORDED} defaultMetric={null} />
        </div>
      </Row>
      <Row name="叠状态带（regimes）">
        <div className="gal-wide" data-gallery-explorer="regimes" style={{ maxWidth: 760 }}>
          <SeriesExplorer {...SX_PROPS} points={SX_POINTS} defaultMetric="net" regimes={SX_REGIMES} />
        </div>
      </Row>
      <p className="gal-note">
        {DEMO_NOTE}按月 24 个点（第 10 个月休市，画灰色竖带）；点瓦片展开图面板。第二个例子的第 19 个月有一笔没记的入金
        500，窗口包含它时对账亮琥珀灯并写差额。
      </p>
    </>
  )
}

/** 演示用的 90 笔平仓：2026-10-08 起，间隔不等（有的隔几分钟、有的隔几小时），权益从 50,000 起，带一段回撤。 */
const EQ_T0 = Date.UTC(2026, 9, 8, 1, 30)
const EQ_POINTS: EquityCurvePoint[] = (() => {
  const rand = seeded(1931)
  let time = EQ_T0
  let equity = 50_000
  let peak = equity
  return Array.from({ length: 90 }, (_, i) => {
    time += (3 + Math.floor(rand() * 40)) * 60_000
    equity += Math.round((rand() - 0.42) * 420 - (i > 40 && i < 58 ? 260 : 0))
    peak = Math.max(peak, equity)
    const dd = equity - peak
    return {
      time,
      equity,
      drawdown: dd,
      title: `第 ${i + 1} 笔 · ${new Date(time).toISOString().slice(0, 16).replace('T', ' ')}`,
      equityText: equity.toLocaleString('en-US'),
      drawdownText: dd.toLocaleString('en-US'),
    }
  })
})()
const EQ_BENCH = EQ_POINTS.map((_, i) => 50_000 + i * 38)

export function EquityCurveDemo() {
  return (
    <>
      <div className="gal-wide" data-gallery-equity style={{ maxWidth: 760 }}>
        <EquityCurve
          points={EQ_POINTS}
          title="权益曲线"
          hint="初始资金 + 已平净盈亏，每平一笔一个点，横轴是回放时间（演示）"
          name="权益"
          benchmark={{ name: '基准', values: EQ_BENCH }}
          label="权益曲线与镜像回撤"
          axis={(v) => v.toLocaleString('en-US')}
          formatTime={(t) => new Date(t).toISOString().slice(11, 16)}
          labels={{
            drawdown: '回撤',
            time: '时刻',
            scale: { group: '纵轴', linear: '线性', log: '对数' },
            brush: { start: '窗口起点', end: '窗口终点', window: '窗口位置' },
            actions: { group: '图工具', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' },
          }}
          source="来源 / 演示数据（固定种子合成）"
          onExport={() => {}}
        />
      </div>
      <p className="gal-note">
        {DEMO_NOTE}90
        笔平仓，间隔不等，点按各自的时刻摆；基准是一条均匀上行的虚线。拖底下的概览条只看一段，对数轴按需切换。
      </p>
    </>
  )
}

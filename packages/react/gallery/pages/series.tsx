// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { useScrubber } from '../../src/index'
import { SeriesExplorer, SmallMultiples, type SeriesPoint, type SmallMultiple } from '../../src/blocks'
import {
  BrushChart,
  BulletMeter,
  CalendarHeatmap,
  HorizonChart,
  WaterfallChart,
  type CalendarDay,
  type HorizonRow,
  type WaterfallStep,
} from '../../src/quant'
import { Row } from './parts'

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

const BRIDGE: readonly WaterfallStep[] = [
  { key: 'open', label: '期初权益', value: 10_000, kind: 'total' },
  { key: 'realized', label: '已实现', value: 1_250 },
  { key: 'fee', label: '手续费', value: -180 },
  { key: 'funding', label: '资金费', value: -95 },
  { key: 'close', label: '期末权益', value: 10_975, kind: 'total' },
]

const money = (value: number) => `${value > 0 ? '+' : ''}${value.toLocaleString('en-US')}`

export function WaterfallChartDemo() {
  return (
    <>
      <div className="gal-wide" data-gallery-waterfall="ok" style={{ maxWidth: 560 }}>
        <WaterfallChart
          steps={BRIDGE}
          label="示例盈亏桥：期初到期末"
          formatValue={(v, bar) => (bar.kind === 'total' ? v.toLocaleString('en-US') : money(v))}
        />
      </div>
      <Row name="对不上">
        <div className="gal-wide" data-gallery-waterfall="gap" style={{ maxWidth: 560 }}>
          <WaterfallChart
            steps={[...BRIDGE.slice(0, 4), { key: 'close', label: '期末权益', value: 11_100, kind: 'total' }]}
            label="示例盈亏桥：期末与累计对不上"
            formatValue={(v, bar) => (bar.kind === 'total' ? v.toLocaleString('en-US') : money(v))}
            formatGap={(gap) => `未解释 ${money(gap)}`}
          />
        </div>
      </Row>
      <Row name="从 0 起">
        <div className="gal-wide" data-gallery-waterfall="zero" style={{ maxWidth: 560 }}>
          <WaterfallChart
            steps={BRIDGE}
            zeroBaseline
            label="示例盈亏桥：纵轴从 0 起"
            formatValue={(v, bar) => (bar.kind === 'total' ? v.toLocaleString('en-US') : money(v))}
          />
        </div>
      </Row>
      <p className="gal-note">{DEMO_NOTE}总计柱与前面累计对不上时画虚线框、读数写差额，不替它抹平。</p>
    </>
  )
}

export function BulletMeterDemo() {
  const state = { ok: '正常', warn: '接近', breach: '越限' }
  const ticks = { soft: '软限 80', hard: '硬限 100' }
  return (
    <>
      <div className="gal-wide" data-gallery-bullet style={{ maxWidth: 420, display: 'grid', gap: 14 }}>
        <BulletMeter
          label="总敞口（示例）"
          value={40}
          max={120}
          soft={80}
          hard={100}
          valueText="已用 40，软限 80，硬限 100，满刻度 120"
          formatValue={(v) => `${v}%`}
          stateLabels={state}
          tickLabels={ticks}
        />
        <BulletMeter
          label="单日亏损（示例）"
          value={85}
          max={120}
          soft={80}
          hard={100}
          valueText="已用 85，软限 80，硬限 100，满刻度 120"
          formatValue={(v) => `${v}%`}
          stateLabels={state}
          tickLabels={ticks}
        />
        <BulletMeter
          label="连亏笔数（示例）"
          value={130}
          max={120}
          soft={80}
          hard={100}
          valueText="已用 130，超过满刻度 120，硬限 100"
          formatValue={(v) => `${v}%`}
          stateLabels={state}
          tickLabels={ticks}
        />
      </div>
      <p className="gal-note">{DEMO_NOTE}达到软限算接近，达到硬限算越限；超出满刻度的条画满。</p>
    </>
  )
}

/** 演示用的一年每日盈亏：2025-11-15 到 2026-11-14，只有工作日有数（周末休市，画成没数据）。 */
const CAL_FROM = '2025-11-15'
const CAL_TO = '2026-11-14'
const CAL_DAYS: CalendarDay[] = (() => {
  const next = seeded(7)
  const out: CalendarDay[] = []
  for (let ms = Date.UTC(2025, 10, 15); ms <= Date.UTC(2026, 10, 14); ms += 86_400_000) {
    const weekday = new Date(ms).getUTCDay()
    if (weekday === 0 || weekday === 6) continue
    out.push({ date: new Date(ms).toISOString().slice(0, 10), value: Math.round((next() - 0.46) * 2000) })
  }
  return out
})()

export function CalendarHeatmapDemo() {
  return (
    <>
      <div className="gal-wide" data-gallery-calendar style={{ maxWidth: 860 }}>
        <CalendarHeatmap
          days={CAL_DAYS}
          from={CAL_FROM}
          to={CAL_TO}
          weekdayLabels={['日', '一', '二', '三', '四', '五', '六']}
          monthLabels={Array.from({ length: 12 }, (_, i) => `${i + 1}月`)}
          describe={(date, value) => `${date}  ${value === null ? '休市' : (value > 0 ? '+' : '') + value}`}
          label="示例：一年的每日盈亏"
          legend={{ down: '亏', up: '盈' }}
        />
      </div>
      <p className="gal-note">
        {DEMO_NOTE}周末休市画成没数据（只有淡边）；颜色深浅按当天盈亏占全年最大绝对值的比例分四档。
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
const SX_POINTS: SeriesPoint[] = Array.from({ length: SX_MONTHS }, (_, m) => {
  const realized = Math.round(2400 * Math.sin(m / 2.5) + 400 + 60 * m)
  const fee = -(120 + 10 * (m % 5))
  const funding = m % 3 === 0 ? -60 : 45
  const net = realized + fee + funding
  return { at: Date.UTC(2025, m, 1), values: { realized, fee, funding, net } }
})
const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toLocaleString('en-US')}`
const monthText = (at: number) => new Date(at).toISOString().slice(0, 7)

export function SeriesExplorerDemo() {
  return (
    <>
      <div className="gal-wide" data-gallery-explorer style={{ maxWidth: 760 }}>
        <SeriesExplorer
          points={SX_POINTS}
          series={[
            { key: 'realized', label: '已实现', kind: 'bar', color: 'var(--series-2)' },
            { key: 'fee', label: '手续费', kind: 'bar', color: 'var(--series-5)' },
            { key: 'funding', label: '资金费', kind: 'bar', color: 'var(--series-4)' },
            { key: 'net', label: '净盈亏', kind: 'line', color: 'var(--series-1)' },
          ]}
          ranges={[
            { key: '3m', label: '3M', months: 3 },
            { key: '6m', label: '6M', months: 6 },
            { key: '12m', label: '12M', months: 12 },
            { key: 'all', label: '全部', months: null },
          ]}
          kpis={[
            { key: 'realized', label: '已实现', series: 'realized', reduce: 'sum', format: signed },
            { key: 'fee', label: '手续费', series: 'fee', reduce: 'sum', format: signed },
            { key: 'net', label: '净盈亏', series: 'net', reduce: 'sum', format: signed },
          ]}
          columns={[
            {
              key: 'realized',
              label: '已实现',
              text: (p) => signed(p.values.realized!),
              tone: (p) => p.values.realized ?? null,
            },
            { key: 'fee', label: '手续费', text: (p) => signed(p.values.fee!), tone: (p) => p.values.fee ?? null },
            {
              key: 'funding',
              label: '资金费',
              text: (p) => signed(p.values.funding!),
              tone: (p) => p.values.funding ?? null,
            },
            { key: 'net', label: '净盈亏', text: (p) => signed(p.values.net!), tone: (p) => p.values.net ?? null },
          ]}
          labels={{
            chart: '示例盈亏：按月堆叠柱加净盈亏线',
            ranges: '区间',
            series: '序列',
            compare: '对比上一期',
            previous: '上一期净盈亏',
            table: '示例盈亏明细',
            time: '月份',
            empty: '没有数据',
            brush: { start: '窗口起点', end: '窗口终点', window: '窗口位置' },
          }}
          formatAt={monthText}
          formatValue={(v) => v.toLocaleString('en-US')}
          formatChange={(r) => `${r > 0 ? '+' : ''}${(r * 100).toFixed(1)}%`}
        />
      </div>
      <p className="gal-note">
        {DEMO_NOTE}按月 24 个点；KPI 的变化是相对紧挨在前面、一样长的上一期；全部区间前面没有上一期，写破折号。
      </p>
    </>
  )
}

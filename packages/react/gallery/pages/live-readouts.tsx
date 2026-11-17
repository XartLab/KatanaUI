// SPDX-License-Identifier: MIT
// 「读数与图表」的实时刷新演示：每件一个自带 LiveToggle 与模拟器的小例子，数据都是随机游走的演示数据，不是行情。
// 写法照 usage/LiveUsage.tsx：useLiveTicker 的 step 是纯的、只用传进来的 rng；自动化浏览器默认暂停，用 window.__liveStep 手动推进。
import type { ReactNode } from 'react'
import {
  Button,
  Treemap,
  UptimeBars,
  layoutTreemap,
  type TreemapItem,
  type UptimeCell,
  type UptimeStatus,
} from '../../src/index.ts'
import { Led, Lcd, PriceTag, QuoteCard, Sparkline, type LedState } from '../../src/index.ts'
import { StatusBar, type StatusItem } from '../../src/blocks/index.ts'
import {
  ChangeText,
  EquityCurve,
  KeyStats,
  MetricCard,
  MetricCardGrid,
  PnlText,
  SparkTile,
  type EquityCurvePoint,
  type MetricRange,
  type MetricStage,
} from '../../src/quant/index.ts'
import { LiveToggle } from '../LiveToggle.tsx'
import { chance, pick, randomInt, randomWalk, useLiveTicker, type Rng } from '../live-sim.ts'
import { Row } from './parts.tsx'

const LABELS = { group: '数据刷新', live: '实时', paused: '暂停' }
const THIN = { display: 'flex', gap: 8, alignItems: 'center' } as const

/** 一块实时演示：顶上一个开关加「走一步」，下面是内容；data-gallery-live 给 e2e 找。 */
function Live({ id, step, children }: { id: string; step?: () => void; children: ReactNode }) {
  return (
    <div className="gal-stack" data-gallery-live={id} style={{ width: '100%', maxWidth: 760, marginTop: 16 }}>
      <div style={THIN}>
        <LiveToggle labels={LABELS} />
        {step ? (
          <Button size="sm" onClick={step}>
            走一步
          </Button>
        ) : null}
        <span className="gal-note">实时刷新（模拟数据）</span>
      </div>
      {children}
    </div>
  )
}

const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value))
/** 往一列数末尾追加一点，只留最后 keep 个（窗口跟着最新点走）。 */
const push = (values: readonly number[], next: number, keep: number) => [...values, next].slice(-keep)
/** 走一步，但保证和上一个不一样（方向才看得出来）。 */
function walkChanged(value: number, rng: Rng, pct: number, unit = 0.01): number {
  const next = randomWalk(value, rng, pct)
  return next === value ? Math.round((value + (rng() < 0.5 ? -unit : unit)) * 100) / 100 : next
}

// —— 走势线 Sparkline ——
export function LiveSparklineDemo() {
  const { state, advance } = useLiveTicker<readonly number[]>(
    [10, 10.4, 10.2, 11, 11.8, 11.5, 12.1, 11.9, 12.4, 12.2],
    (values, rng) => push(values, walkChanged(values[values.length - 1]!, rng, 0.03), 30),
    { intervalMs: 1500 },
  )
  return (
    <Live id="sparkline" step={advance}>
      <div style={{ width: 240 }}>
        <Sparkline values={state} label="实时走势" lastLabel={state[state.length - 1]!.toFixed(2)} />
      </div>
    </Live>
  )
}

// —— 报价卡与价格标签 ——
type Quote = { price: number; trail: readonly number[] }
const PREV_CLOSE = 10
export function LiveQuoteDemo() {
  const { state, advance } = useLiveTicker<Quote>(
    { price: 11.8, trail: [10, 10.3, 10.1, 10.9, 11.4, 11.2, 11.8] },
    (q, rng) => {
      const price = walkChanged(q.price, rng, 0.012)
      return { price, trail: push(q.trail, price, 24) }
    },
    { intervalMs: 1400 },
  )
  const change = state.price - PREV_CLOSE
  const percent = (change / PREV_CLOSE) * 100
  const tone = change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
  const sign = change >= 0 ? '+' : ''
  return (
    <Live id="quote" step={advance}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: 220 }}>
          <QuoteCard
            name="示例甲"
            symbol="AAA"
            price={state.price.toFixed(2)}
            change={`${sign}${change.toFixed(2)}`}
            percent={`${sign}${percent.toFixed(2)}%`}
            tone={tone}
            spark={state.trail}
            sparkLabel="示例甲走势"
          />
        </div>
        <p>
          行内：
          <PriceTag name="示例甲" price={state.price.toFixed(2)} change={`${sign}${percent.toFixed(2)}%`} tone={tone} />
        </p>
      </div>
    </Live>
  )
}

// —— 矩形树图 ——
type Tile = { name: string; change: number }
const TREE_START: readonly TreemapItem<Tile>[] = [
  { group: '板块一', size: 600, data: { name: '示例 A', change: 0.031 } },
  { group: '板块一', size: 300, data: { name: '示例 B', change: -0.012 } },
  { group: '板块一', size: 240, data: { name: '示例 F', change: 0.006 } },
  { group: '板块二', size: 220, data: { name: '示例 C', change: 0.004 } },
  { group: '板块二', size: 180, data: { name: '示例 D', change: -0.029 } },
  { group: '板块二', size: 150, data: { name: '示例 G', change: -0.004 } },
  { group: '板块三', size: 120, data: { name: '示例 E', change: 0.018 } },
  { group: '板块三', size: 100, data: { name: '示例 H', change: -0.009 } },
]
export function LiveTreemapDemo() {
  const { state, advance } = useLiveTicker(
    TREE_START,
    (items, rng) =>
      items.map((item) => {
        const size = clamp(Math.round(item.size * (1 + (rng() * 2 - 1) * 0.18)), 80, 700)
        // 偶尔翻一次方向：格子颜色渐变、方向翻了的那一格闪一下。
        const flip = chance(rng, 0.25)
        const change = clamp((flip ? -item.data.change * 0.8 : item.data.change) + (rng() - 0.5) * 0.012, -0.05, 0.05)
        return { ...item, size, data: { name: item.data.name, change } }
      }),
    { intervalMs: 1800 },
  )
  return (
    <Live id="treemap" step={advance}>
      <div className="gal-wide" style={{ maxWidth: 640 }}>
        <Treemap
          blocks={layoutTreemap(state, true)}
          heads
          cellKey={(item) => item.name}
          describe={(item) => ({
            name: item.name,
            text: `${item.change >= 0 ? '+' : ''}${(item.change * 100).toFixed(2)}%`,
            change: item.change,
          })}
          legendText={(step) => `${step > 0 ? '+' : ''}${step}%`}
        />
      </div>
    </Live>
  )
}

// —— 状态灯与 LCD 读数 ——
type Gauge = { pnl: number; led: LedState }
export function LiveLedLcdDemo() {
  const { state, advance } = useLiveTicker<Gauge>(
    { pnl: 1284.5, led: 'ok' },
    (g, rng) => ({
      pnl: walkChanged(g.pnl, rng, 0.01),
      led: chance(rng, 0.35)
        ? pick(
            rng,
            (['ok', 'warn', 'danger'] as const).filter((s) => s !== g.led),
          )
        : g.led,
    }),
    { intervalMs: 1500 },
  )
  const words: Record<string, string> = { ok: '正常', warn: '延迟偏高', danger: '已断开' }
  return (
    <Live id="lcd" step={advance}>
      <Row>
        <Lcd
          label="PNL"
          value={`${state.pnl >= 0 ? '+' : ''}${state.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          tone={state.pnl >= 0 ? 'up' : 'down'}
        />
        <span style={THIN}>
          <Led state={state.led} label={`行情连接：${words[state.led]}`} />
          {`行情连接 ${words[state.led]}`}
        </span>
      </Row>
    </Live>
  )
}

// —— 涨跌文字 ——
export function LivePnlTextDemo() {
  const { state, advance } = useLiveTicker(
    { change: 1.23, pnl: 12.5 },
    (s, rng) => ({
      change: Math.round((s.change + (rng() - 0.5) * 1.2) * 100) / 100 || 0.01,
      pnl: walkChanged(s.pnl, rng, 0.3),
    }),
    { intervalMs: 1500 },
  )
  return (
    <Live id="pnl" step={advance}>
      <Row>
        <ChangeText value={state.change} arrow flash />
        <PnlText value={state.pnl} flash>
          {`${state.pnl >= 0 ? '+' : ''}${state.pnl.toFixed(2)}`}
        </PnlText>
      </Row>
    </Live>
  )
}

// —— 关键数据 ——
export function LiveKeyStatsDemo() {
  const { state, advance } = useLiveTicker(
    { cap: 3.41, pe: 31.2, eps: 6.57 },
    (s, rng) => ({
      cap: walkChanged(s.cap, rng, 0.01),
      pe: walkChanged(s.pe, rng, 0.01),
      eps: walkChanged(s.eps, rng, 0.004),
    }),
    { intervalMs: 1600 },
  )
  return (
    <Live id="key-stats" step={advance}>
      <KeyStats
        title="关键数据"
        items={[
          { key: 'cap', label: '总市值', value: `${state.cap.toFixed(2)}T`, unit: 'USD', badge: '超大盘' },
          { key: 'pe', label: '市盈率（TTM）', value: state.pe.toFixed(2) },
          { key: 'eps', label: '每股收益（TTM）', value: state.eps.toFixed(2), unit: 'USD' },
          { key: 'beta', label: 'Beta（1 年）', value: '—' },
        ]}
      />
    </Live>
  )
}

// —— SparkTile ——
type Tiles = { nav: number; navTrail: readonly number[]; exposure: number; expTrail: readonly number[]; dd: number }
const NAV_BASE = 2.3887
export function LiveSparkTileDemo() {
  const { state, advance } = useLiveTicker<Tiles>(
    {
      nav: 2.42,
      navTrail: [2, 4, 3, 8, 7, 11, 10, 14, 16],
      exposure: 131,
      expTrail: [4, 6, 5, 10, 9, 12, 11, 15, 16],
      dd: -3.1,
    },
    (t, rng) => {
      const nav = walkChanged(t.nav, rng, 0.004)
      const exposure = clamp(Math.round(t.exposure + (rng() - 0.45) * 8), 100, 160)
      return {
        nav,
        navTrail: push(t.navTrail, clamp(t.navTrail[t.navTrail.length - 1]! + (rng() - 0.4) * 5, 0, 20), 9),
        exposure,
        expTrail: push(t.expTrail, (exposure / 131) * 16, 9),
        dd: clamp(Math.round((t.dd + (rng() - 0.5) * 0.6) * 10) / 10, -9, -0.1),
      }
    },
    { intervalMs: 1500 },
  )
  const over = state.exposure >= 150
  return (
    <Live id="spark-tile" step={advance}>
      <div className="gal-grid-5">
        <SparkTile
          label="NET ASSET"
          value={`${state.nav.toFixed(2)}M`}
          series={state.navTrail}
          sparkLabel="净值走势"
          delta={(state.nav / NAV_BASE - 1) * 100}
          note="今日"
        />
        <SparkTile
          label="DRAWDOWN"
          value={`${state.dd.toFixed(1)}%`}
          series={state.navTrail.map((v) => 20 - v)}
          sparkLabel="回撤走势"
          trendTone="neutral"
          note="峰值 -6.8%"
        />
        <SparkTile
          label="EXPOSURE"
          value={String(state.exposure)}
          unit="/ 150%"
          series={state.expTrail}
          sparkLabel="敞口走势，虚线是上限"
          threshold={19}
          state={over ? 'over' : state.exposure >= 125 ? 'near' : 'normal'}
          note={over ? '越过上限' : state.exposure >= 125 ? '接近上限' : '正常'}
        />
      </div>
    </Live>
  )
}

// —— 状态栏：行情断线与重连 ——
type Feed = { ms: number; execMs: number; sec: number }
const LATENCY = (ms: number) => `${ms} ms`
export function LiveStatusBarDemo() {
  const { state, advance } = useLiveTicker<Feed & { tick: number }>(
    { ms: 42, execMs: 118, sec: 12, tick: 0 },
    (s, rng, n) => ({
      ms: clamp(Math.round(s.ms + (rng() - 0.5) * 16), 20, 90),
      execMs: clamp(Math.round(s.execMs + (rng() - 0.5) * 60), 60, 220),
      sec: (s.sec + 2) % 60,
      tick: n + 1,
    }),
    { intervalMs: 1500 },
  )
  // 行情源周期性断线：每 7 拍里第 4、5 拍断开、第 6 拍重连（演示要偶尔、要可重复）。
  const phase = state.tick % 7
  const down = phase > 3 && phase <= 5
  const items: StatusItem[] = [
    {
      id: 'quote',
      label: 'QUOTE',
      value: down ? '已断开' : LATENCY(state.ms),
      led: down ? 'danger' : 'ok',
      ledLabel: down ? '断线' : '正常',
      priority: 3,
      onClick: () => {},
    },
    {
      id: 'exec',
      label: 'EXEC',
      value: LATENCY(state.execMs),
      led: state.execMs > 150 ? 'warn' : 'ok',
      ledLabel: state.execMs > 150 ? '偏慢' : '正常',
      priority: 3,
      onClick: () => {},
    },
    { id: 'live', label: 'LIVE', value: 'IBKR U123', live: true, led: 'on', ledLabel: '实盘账户' },
    { id: 'mode', label: 'MODE', value: 'QUIET', priority: 0 },
    { id: 'clock', value: `09:30:${String(state.sec).padStart(2, '0')}`, priority: 4 },
  ]
  return (
    <Live id="status-bar" step={advance}>
      <div style={{ width: 720 }}>
        <StatusBar
          label="实时状态栏"
          moreLabel="更多状态项"
          left={items.slice(0, 3)}
          center={items.slice(3, 4)}
          right={items.slice(4)}
        />
      </div>
    </Live>
  )
}

// —— 指标卡 ——
const RANGES = [
  { key: '1m', label: '1 月', n: 21 },
  { key: '3m', label: '3 月', n: 63 },
] as const
const FEAR_GREED: MetricStage[] = [
  { label: '极度恐惧', from: 0, to: 25 },
  { label: '恐惧', from: 25, to: 45 },
  { label: '中性', from: 45, to: 55 },
  { label: '贪婪', from: 55, to: 75 },
  { label: '极度贪婪', from: 75, to: 100 },
]
type Metric = { title: string; values: readonly number[]; step: number; lo: number; hi: number; digits: number }
const SEED_RNG = (seed: number): number[] => {
  let v = 48
  let s = seed
  return Array.from({ length: 80 }, () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    v = clamp(v + (s / 4294967296 - 0.5) * 8, 5, 95)
    return Math.round(v)
  })
}
const METRIC_START: readonly Metric[] = [
  { title: '恐惧与贪婪指数', values: SEED_RNG(11), step: 4, lo: 5, hi: 95, digits: 0 },
  {
    title: 'VIX 波动率',
    values: SEED_RNG(23).map((v) => Math.round((10 + v * 0.3) * 100) / 100),
    step: 0.8,
    lo: 10,
    hi: 45,
    digits: 2,
  },
]
export function LiveMetricCardDemo() {
  const { state, advance } = useLiveTicker(
    METRIC_START,
    (cards, rng) =>
      cards.map((card) => {
        const last = card.values[card.values.length - 1]!
        const unit = 10 ** -card.digits
        let next = Number(clamp(last + (rng() - 0.5) * 2 * card.step, card.lo, card.hi).toFixed(card.digits))
        if (next === last) next = Number((last + (last < card.hi ? unit : -unit)).toFixed(card.digits))
        return { ...card, values: push(card.values, next, 80) }
      }),
    { intervalMs: 1600 },
  )
  return (
    <Live id="metric-card" step={advance}>
      <MetricCardGrid label="实时指标" minWidth={280} ranges={RANGES} rangeLabel="走势区间">
        {state.map((card, index) => {
          const last = card.values[card.values.length - 1]!
          const since = (back: number) => {
            const base = card.values[card.values.length - 1 - back]
            return base === undefined || base === 0 ? null : ((last - base) / Math.abs(base)) * 100
          }
          const ranges: MetricRange[] = RANGES.map((r) => ({
            key: r.key,
            label: r.label,
            values: card.values.slice(-r.n),
          }))
          return (
            <MetricCard
              key={card.title}
              title={card.title}
              value={last.toFixed(card.digits)}
              changes={[
                { key: 'd', label: '较前日', value: since(1) },
                { key: 'w', label: '较前周', value: since(5) },
              ]}
              ranges={ranges}
              trendTone={index === 0 ? 'neutral' : 'inverse'}
              rangeLabel={`${card.title}走势区间`}
              sparkLabel={`${card.title}走势`}
              stages={index === 0 ? FEAR_GREED : undefined}
              current={last}
              source="演示数据，不是行情"
              updatedAt="实时刷新"
            />
          )
        })}
      </MetricCardGrid>
    </Live>
  )
}

// —— 权益曲线 ——
const EQ_T0 = Date.UTC(2026, 9, 8, 1, 30)
const eqPoint = (index: number, time: number, equity: number, peak: number): EquityCurvePoint => {
  const dd = equity - Math.max(peak, equity)
  return {
    time,
    equity,
    drawdown: dd,
    title: `第 ${index + 1} 笔 · ${new Date(time).toISOString().slice(0, 16).replace('T', ' ')}`,
    equityText: equity.toLocaleString('en-US'),
    drawdownText: dd.toLocaleString('en-US'),
  }
}
const EQ_START: readonly EquityCurvePoint[] = (() => {
  const out: EquityCurvePoint[] = []
  let equity = 50_000
  let time = EQ_T0
  let peak = equity
  for (let i = 0; i < 40; i += 1) {
    time += (5 + ((i * 7) % 30)) * 60_000
    equity += Math.round(Math.sin(i / 3) * 260 + 60)
    out.push(eqPoint(i, time, equity, peak))
    peak = Math.max(peak, equity)
  }
  return out
})()
export function LiveEquityCurveDemo() {
  const { state, advance } = useLiveTicker(
    { points: EQ_START, n: EQ_START.length },
    (s, rng) => {
      const last = s.points[s.points.length - 1]!
      const peak = Math.max(...s.points.map((p) => p.equity))
      const next = eqPoint(
        s.n,
        last.time + (3 + randomInt(rng, 40)) * 60_000,
        last.equity + Math.round((rng() - 0.42) * 420),
        peak,
      )
      return { points: [...s.points, next].slice(-120), n: s.n + 1 }
    },
    { intervalMs: 1500 },
  )
  // 基准按时刻算（不按序号），窗口左移时基准线也只是平移。
  const bench = state.points.map((p) => 50_000 + ((p.time - EQ_T0) / 60_000) * 0.8)
  return (
    <Live id="equity-curve" step={advance}>
      <div className="gal-wide" style={{ maxWidth: 760 }}>
        <EquityCurve
          points={state.points}
          title="权益曲线（实时）"
          name="权益"
          benchmark={{ name: '基准', values: bench }}
          label="实时权益曲线与镜像回撤"
          axis={(v) => v.toLocaleString('en-US')}
          formatTime={(t) => new Date(t).toISOString().slice(11, 16)}
          labels={{
            drawdown: '回撤',
            time: '时刻',
            scale: { group: '纵轴', linear: '线性', log: '对数' },
            brush: { start: '窗口起点', end: '窗口终点', window: '窗口位置' },
            actions: { group: '图工具', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' },
          }}
          source="来源 / 演示数据（随机游走）"
        />
      </div>
    </Live>
  )
}

// —— 逐格可用条 ——
const UPTIME_WORDS = { up: '正常', degraded: '降级', down: '断开', none: '无数据' } as const
const upCell = (id: number, status: UptimeStatus): UptimeCell => ({
  id: String(id),
  status,
  label: `第 ${id + 1} 格 · ${UPTIME_WORDS[status]}`,
})
export function LiveUptimeDemo() {
  const { state, advance } = useLiveTicker(
    { cells: Array.from({ length: 30 }, (_, i) => upCell(i, i === 6 ? 'down' : i === 11 ? 'degraded' : 'up')), n: 30 },
    (s, rng) => {
      const status: UptimeStatus = chance(rng, 0.2) ? pick(rng, ['degraded', 'down'] as const) : 'up'
      return { cells: [...s.cells.slice(1), upCell(s.n, status)], n: s.n + 1 }
    },
    { intervalMs: 1500 },
  )
  const up = state.cells.filter((c) => c.status === 'up').length
  return (
    <Live id="uptime" step={advance}>
      <div className="gal-wide">
        <UptimeBars
          cells={state.cells}
          label="示例行情源近 30 格"
          statusLabels={UPTIME_WORDS}
          availability={{ value: ((up / state.cells.length) * 100).toFixed(1), unit: '%' }}
          actionLabels={{ group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }}
          tableLabel="逐格可用表"
          tableHead={['时间', '状态']}
          source="来源 / 演示数据 · 随机游走 · 非行情"
        />
      </div>
    </Live>
  )
}

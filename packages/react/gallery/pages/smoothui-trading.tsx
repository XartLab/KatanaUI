// SPDX-License-Identifier: MIT
// 照 SmoothUI 搬来的「交易工作台最用得上」一批件的演示：新闻进场、行情跑马灯、成交通知岛、自选置顶、板块展开、点阵图、角标、加载、滚动进度等。
// 数据与文案都是演示用的虚构内容；实时的靠 live-sim 的节拍器与 LiveToggle，自动化浏览器里默认暂停，用 window.__liveStep 步进。
import { BarChart3, Bell, Power, TrendingUp, Zap } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  AnimatedAvatarGroup,
  AnimatedList,
  AnimatedStepper,
  AnimatedTags,
  Button,
  CountBadge,
  DitherChart,
  DynamicIsland,
  ExposureSlider,
  GridLoader,
  HoverExpand,
  InfiniteSlider,
  Led,
  MotionLoader,
  PagePreloader,
  PinnedList,
  PowerOffSlide,
  RollingText,
  ScrollProgress,
  Squircle,
  SwitchboardCard,
  MOTION_LOADER_VARIANTS,
  GRID_LOADER_PATTERNS,
  type AnimatedListItem,
  type GridLoaderPattern,
  type PagePreloaderVariant,
} from '../../src/index.ts'
import { LiveToggle } from '../LiveToggle.tsx'
import { chance, pick, randomWalk, useLiveEnabled, useLiveTicker, type Rng } from '../live-sim.ts'
import { Cell, Row } from './parts.tsx'
import { hhmm } from '../../src/lib/date.ts'

const LIVE_LABELS = { group: '数据刷新', live: '实时', paused: '暂停' }

// ---------- AnimatedList：新闻快讯与封板事件流 ----------
const HEADLINES = [
  '云端科技获得头部券商调研',
  '蓝海能源发布年度回购方案',
  '启明半导体二期产线投产',
  '远山医药三期临床达到主要终点',
  '星河传媒终止重大资产重组',
  '北辰新材获得海外大额订单',
  '听雨软件推出面向券商的研究助手',
]
const SOURCES = ['演示通讯社', '演示交易所', '演示研究部']
type Wire = { n: number; title: string; source: string; time: string }
type WireState = { wires: Wire[]; count: number }
const clock = (n: number) => {
  return hhmm(9 * 60 + 30 + n)
}
function wireStep(state: WireState, rng: Rng, tick: number): WireState {
  // 第一拍必来一条：手动步进（e2e）有确定的结果；之后按概率，偶尔一次来两条。
  if (tick > 0 && !chance(rng, 0.7)) return state
  const batch = tick > 0 && chance(rng, 0.2) ? 2 : 1
  const made = Array.from({ length: batch }, (_, k) => {
    const n = state.count + k
    return { n, title: `${pick(rng, HEADLINES)}（演示 ${n + 1}）`, source: pick(rng, SOURCES), time: clock(n) }
  })
  return { wires: [...made.reverse(), ...state.wires].slice(0, 12), count: state.count + batch }
}
const seedWires = (): WireState => ({
  count: 3,
  wires: [2, 1, 0].map((n) => ({
    n,
    title: `${HEADLINES[n]}（演示 ${n + 1}）`,
    source: SOURCES[n % 3]!,
    time: clock(n),
  })),
})
function WireRow({ wire }: { wire: Wire }) {
  return (
    <div
      className="k-text-data"
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 'var(--space-3)',
        padding: 'var(--space-2) var(--space-3)',
      }}
    >
      <span
        className="k-text-caption"
        style={{ flex: 'none', color: 'var(--ink-300)', fontVariantNumeric: 'tabular-nums' }}
      >
        {wire.time}
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: 'var(--ink-100)',
        }}
      >
        {wire.title}
      </span>
      <span className="k-text-micro" style={{ flex: 'none', color: 'var(--ink-300)' }}>
        {wire.source}
      </span>
    </div>
  )
}

export function AnimatedListDemo() {
  const { state, advance } = useLiveTicker<WireState>(seedWires, wireStep, { intervalMs: 2000 })
  const [clicked, setClicked] = useState('—')
  const items: AnimatedListItem[] = state.wires.map((wire) => ({
    id: `w${wire.n}`,
    label: wire.title,
    content: <WireRow wire={wire} />,
  }))
  return (
    <div className="gal-stack" data-gallery-live="animated-list" style={{ width: '100%', maxWidth: 640 }}>
      <Row>
        <LiveToggle labels={LIVE_LABELS} />
        <Button data-testid="wire-push" onClick={advance}>
          来一条快讯
        </Button>
        <span className="gal-note">
          新条目弹性插入、旧条目下移；鼠标停在列表上时新条目先攒着，移开后进来。点一条：{clicked}
        </span>
      </Row>
      <AnimatedList
        label="快讯流"
        items={items}
        maxVisible={6}
        pendingLabel={(count) => `${count} 条新快讯`}
        onItemClick={(id) => setClicked(id)}
      />
    </div>
  )
}

// ---------- InfiniteSlider：行情跑马灯 ----------
type Tick = { code: string; name: string; price: number; open: number }
const TICKS: readonly Tick[] = [
  { code: 'BTCUSDT', name: 'BTC', price: 106977.4, open: 106400 },
  { code: 'ETHUSDT', name: 'ETH', price: 3814.2, open: 3790 },
  { code: 'AAPL', name: 'AAPL', price: 231.45, open: 230.1 },
  { code: 'NVDA', name: 'NVDA', price: 148.62, open: 151.2 },
  { code: 'TSLA', name: 'TSLA', price: 342.18, open: 338.9 },
  { code: '600001', name: '星河锂业', price: 24.36, open: 24.0 },
  { code: '600002', name: '云端科技', price: 18.92, open: 19.4 },
  { code: 'XAUUSD', name: 'XAU', price: 2648.5, open: 2641 },
]
function tapeStep(state: readonly Tick[], rng: Rng): readonly Tick[] {
  return state.map((tick) => ({ ...tick, price: randomWalk(tick.price, rng, 0.003) }))
}
function TapeItem({ tick }: { tick: Tick }) {
  const change = ((tick.price - tick.open) / tick.open) * 100
  const up = change >= 0
  const digits = tick.price >= 1000 ? 1 : 2
  const text = tick.price.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  return (
    <span
      className="k-text-data"
      data-slot="tape-item"
      style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'var(--space-2)', whiteSpace: 'nowrap' }}
    >
      <span style={{ color: 'var(--ink-200)' }}>{tick.name}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        <RollingText text={text} value={tick.price} animate />
      </span>
      <span style={{ color: up ? 'var(--pnl-up)' : 'var(--pnl-down)', fontVariantNumeric: 'tabular-nums' }}>
        {up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
      </span>
    </span>
  )
}

export function InfiniteSliderDemo() {
  const [live] = useLiveEnabled()
  const { state } = useLiveTicker<readonly Tick[]>(TICKS, tapeStep, { intervalMs: 1500 })
  return (
    <div className="gal-stack" data-gallery-live="infinite-slider" style={{ width: '100%', maxWidth: 720 }}>
      <Row>
        <LiveToggle labels={LIVE_LABELS} />
        <span className="gal-note">暂停时跑马灯停住，数据也不刷；悬停减速到 15 像素每秒。</span>
      </Row>
      <div
        style={{ borderBlock: '1px solid var(--line-100)', background: 'var(--bg-100)', padding: 'var(--space-2) 0' }}
      >
        <InfiniteSlider label="行情跑马灯" speed={60} speedOnHover={15} paused={!live}>
          {state.map((tick) => (
            <TapeItem key={tick.code} tick={tick} />
          ))}
        </InfiniteSlider>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
        <div
          style={{
            height: 96,
            width: 160,
            overflow: 'hidden',
            border: '1px solid var(--line-100)',
            background: 'var(--bg-100)',
            padding: '0 var(--space-3)',
          }}
        >
          <InfiniteSlider label="竖向行情" direction="vertical" reverse speed={24} paused={!live}>
            {state.slice(0, 5).map((tick) => (
              <TapeItem key={tick.code} tick={tick} />
            ))}
          </InfiniteSlider>
        </div>
        <span className="gal-note">direction=vertical 做竖向的滚动榜；reverse 反向。</span>
      </div>
    </div>
  )
}

// ---------- DynamicIsland：交易通知岛 ----------
type IslandView = 'idle' | 'fill' | 'alert' | 'pending'
const ISLAND_VIEWS: readonly IslandView[] = ['idle', 'fill', 'alert', 'pending']
const ISLAND_NAMES: Record<IslandView, string> = {
  idle: '待机',
  fill: '成交回报',
  alert: '炸板提醒',
  pending: '委托中',
}
const ISLAND_ROW = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-2) var(--space-4)',
} as const
const ISLAND_BODY = { width: 224 } as const
const ISLAND_MAIN = { margin: 0, color: 'var(--ink-100)' } as const
const ISLAND_SUB = { margin: 0, color: 'var(--ink-300)', fontVariantNumeric: 'tabular-nums' } as const
const chip = (tone: string) =>
  ({
    padding: 'var(--space-1) var(--space-2)',
    borderRadius: 9999,
    background: `color-mix(in srgb, ${tone} 25%, transparent)`,
    color: tone,
    fontVariantNumeric: 'tabular-nums',
  }) as const
function IslandContent({ view }: { view: IslandView }) {
  if (view === 'fill')
    return (
      <div style={ISLAND_ROW}>
        <TrendingUp aria-hidden="true" size={20} style={{ flex: 'none', color: 'var(--pnl-up)' }} />
        <div style={ISLAND_BODY}>
          <p className="k-text-data" style={ISLAND_MAIN}>
            成交 BTCUSDT 买入 0.50
          </p>
          <p className="k-text-caption" style={ISLAND_SUB}>
            均价 106,977.4 · 手续费 5.35
          </p>
        </div>
        <span className="k-text-micro" style={chip('var(--pnl-up)')}>
          全部成交
        </span>
      </div>
    )
  if (view === 'alert')
    return (
      <div style={ISLAND_ROW}>
        <Zap aria-hidden="true" size={20} style={{ flex: 'none', color: 'var(--signal-amber)' }} />
        <div style={ISLAND_BODY}>
          <p className="k-text-data" style={ISLAND_MAIN}>
            云端科技 炸板
          </p>
          <p className="k-text-caption" style={ISLAND_SUB}>
            封单 1.2 亿 → 3,400 万 · 5 连板
          </p>
        </div>
        <span className="k-text-micro" style={chip('var(--signal-amber)')}>
          提醒
        </span>
      </div>
    )
  if (view === 'pending')
    return (
      <div style={ISLAND_ROW}>
        <MotionLoader label="委托处理中" variant="dot-ring" size={20} />
        <p className="k-text-data" style={{ ...ISLAND_MAIN, width: 192 }}>
          ETHUSDT 卖出 2.00 · 委托中
        </p>
      </div>
    )
  return (
    <div className="k-text-data" style={{ ...ISLAND_ROW, gap: 'var(--space-2)', color: 'var(--ink-200)' }}>
      <Led state="ok" label="行情已连接" />
      行情已连接
    </div>
  )
}

export function DynamicIslandDemo() {
  const [view, setView] = useState<IslandView>('idle')
  // 实时：每 3 秒按顺序换一个视图；自动化浏览器默认暂停，用步进。
  const sim = useLiveTicker<IslandView>(
    'idle',
    (current) => ISLAND_VIEWS[(ISLAND_VIEWS.indexOf(current) + 1) % ISLAND_VIEWS.length]!,
    {
      intervalMs: 3000,
    },
  )
  const [seen, setSeen] = useState(0)
  if (sim.tick !== seen) {
    setSeen(sim.tick)
    setView(sim.state)
  }
  return (
    <div className="gal-stack" data-gallery-live="dynamic-island" style={{ width: '100%', maxWidth: 560 }}>
      <Row>
        <LiveToggle labels={LIVE_LABELS} />
        {ISLAND_VIEWS.map((one) => (
          <Button key={one} aria-pressed={view === one} onClick={() => setView(one)}>
            {ISLAND_NAMES[one]}
          </Button>
        ))}
      </Row>
      <div style={{ display: 'grid', height: 128, placeItems: 'center' }}>
        <DynamicIsland view={view} label="交易通知">
          <IslandContent view={view} />
        </DynamicIsland>
      </div>
    </div>
  )
}

// ---------- PinnedList：自选置顶 ----------
const WATCH = [
  { id: 'btc', title: 'BTCUSDT', meta: '106,977.4  +1.20%' },
  { id: 'eth', title: 'ETHUSDT', meta: '3,814.2  +0.63%' },
  { id: 'aapl', title: 'AAPL', meta: '231.45  +0.58%' },
  { id: 'nvda', title: 'NVDA', meta: '148.62  -1.71%' },
  { id: 'lith', title: '星河锂业', meta: '24.36  +1.50%' },
  { id: 'cloud', title: '云端科技', meta: '18.92  -2.47%' },
]
export function PinnedListDemo() {
  const [pinned, setPinned] = useState<string[]>(['btc'])
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 420 }}>
      <p className="gal-note" data-testid="pinned-state">
        已置顶：{pinned.join('、') || '无'}（最多 3 个，点一行钉住或取消，方向键、P 也行）
      </p>
      <PinnedList
        items={WATCH}
        maxPinned={3}
        pinnedIds={pinned}
        onPinnedChange={setPinned}
        labels={{
          list: '自选列表',
          pin: (title) => `置顶 ${title}`,
          unpin: (title) => `取消置顶 ${title}`,
          emptyPinned: '点一行把它钉在最上面',
        }}
      />
    </div>
  )
}

// ---------- AnimatedAvatarGroup ----------
const HOLDINGS = [
  { code: 'NVDA', name: '英伟达' },
  { code: 'AAPL', name: '苹果' },
  { code: 'MSFT', name: '微软' },
  { code: 'TSLA', name: '特斯拉' },
  { code: '600001', name: '星河锂业' },
  { code: '600002', name: '云端科技' },
  { code: '600003', name: '启明半导体' },
]
export function AnimatedAvatarGroupDemo() {
  return (
    <>
      <Row name="前 4 个">
        <AnimatedAvatarGroup label="半导体 ETF 前十大持仓" items={HOLDINGS} />
      </Row>
      <Row name="全部展示">
        <AnimatedAvatarGroup label="相关品种" items={HOLDINGS.slice(0, 3)} size={36} overlap={0.4} />
      </Row>
      <p className="gal-note">鼠标移上去拉开，移开收拢；触屏不展开。</p>
    </>
  )
}

// ---------- HoverExpand ----------
const SECTORS = [
  { id: 'semi', title: '半导体', body: '+2.34% · 领涨 云端科技' },
  { id: 'bank', title: '银行', body: '-0.41% · 权重股回落' },
  { id: 'ai', title: 'AI 算力', body: '+3.10% · 成交额 1,280 亿' },
  { id: 'med', title: '创新药', body: '+0.86% · 三期读出集中' },
]
export function HoverExpandDemo() {
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 640 }}>
      <div style={{ height: 160 }}>
        <HoverExpand label="板块概览" items={SECTORS.map((s) => ({ id: s.id, title: s.title, children: s.body }))} />
      </div>
    </div>
  )
}

// ---------- DitherChart ----------
const CURVE = [{ points: [3, 5, 4, 7, 6, 9, 8, 12, 10, 14].map((value) => ({ value })) }]
const TWO = [
  { points: [8, 6, 9, 7, 11, 9].map((value) => ({ value })) },
  { points: [4, 5, 3, 6, 4, 7].map((value) => ({ value })) },
]
const SLICES = [{ points: [46, 28, 16, 10].map((value) => ({ value })) }]
const HEAT = [
  { points: [1, 3, 5, 4, 2, 6, 8, 5].map((value) => ({ value })) },
  { points: [2, 2, 4, 7, 6, 5, 3, 4].map((value) => ({ value })) },
  { points: [6, 5, 2, 1, 3, 4, 7, 9].map((value) => ({ value })) },
]
export function DitherChartDemo() {
  return (
    <>
      <Row name="line">
        <DitherChart variant="line" data={CURVE} description="净值走势：十个点从 3 升到 14" width={220} height={120} />
        <DitherChart variant="bar" data={TWO} description="两组柱：本周与上周的六日成交" width={220} height={120} />
      </Row>
      <Row name="donut / gauge">
        <DitherChart
          variant="donut"
          data={SLICES}
          description="仓位构成：46%、28%、16%、10%"
          width={120}
          height={120}
        />
        <DitherChart
          variant="gauge"
          data={[{ points: [{ value: 72 }] }]}
          description="风险使用率 72%"
          width={120}
          height={120}
        />
        <DitherChart
          variant="funnel"
          data={[{ points: [100, 72, 41, 18].map((value) => ({ value })) }]}
          description="漏斗：信号到成交逐级转化"
          width={160}
          height={120}
        />
      </Row>
      <Row name="heatmap">
        <DitherChart
          variant="heatmap"
          data={HEAT}
          description="三个板块八个时段的热度"
          width={220}
          height={90}
          matrix={8}
        />
        <DitherChart variant="stacked" data={TWO} description="两组堆叠柱" width={160} height={90} />
      </Row>
    </>
  )
}

// ---------- CountBadge ----------
export function CountBadgeDemo() {
  const [count, setCount] = useState(3)
  return (
    <>
      <Row name="数字">
        <CountBadge variant="count" count={count} label={`${count} 条未读提醒`}>
          <Button aria-label="提醒">
            <Bell aria-hidden="true" size={16} />
          </Button>
        </CountBadge>
        <CountBadge variant="count" count={count} max={9} position="top-left" label={`${count} 条未读，显示到 9`}>
          <Button aria-label="消息">
            <BarChart3 aria-hidden="true" size={16} />
          </Button>
        </CountBadge>
      </Row>
      <Row name="点与状态">
        <CountBadge variant="dot" ping label="有新信号">
          <Button aria-label="信号">
            <Zap aria-hidden="true" size={16} />
          </Button>
        </CountBadge>
        {(['online', 'away', 'busy', 'offline'] as const).map((status) => (
          <Cell key={status} name={status}>
            <CountBadge variant="status" status={status} position="bottom-right" label={`状态 ${status}`}>
              <span
                className="k-text-data"
                style={{
                  display: 'inline-flex',
                  width: 32,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 9999,
                  background: 'var(--bg-300)',
                  color: 'var(--ink-200)',
                }}
              >
                QX
              </span>
            </CountBadge>
          </Cell>
        ))}
      </Row>
      <Row>
        <Button onClick={() => setCount((n) => n + 1)}>来 1 条</Button>
        <Button onClick={() => setCount((n) => Math.max(0, n - 1))}>读 1 条</Button>
        <Button onClick={() => setCount(120)}>120 条</Button>
        <Button onClick={() => setCount(0)}>清零</Button>
      </Row>
    </>
  )
}

// ---------- SwitchboardCard ----------
const WORD = [
  [1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
]
export function SwitchboardCardDemo() {
  const [live] = useLiveEnabled()
  const [hits, setHits] = useState(0)
  return (
    <div className="gal-stack" data-gallery-live="switchboard-card" style={{ width: '100%', maxWidth: 520 }}>
      <Row>
        <LiveToggle labels={LIVE_LABELS} />
      </Row>
      <SwitchboardCard
        title="市场活跃度"
        subtitle="全市场 5,312 只中 1,204 只异动（演示数据）"
        random
        paused={!live}
        seed={7}
      />
      <SwitchboardCard
        title="TEST 图案"
        subtitle="lit 给 0/1 矩阵就按它常亮；整卡可点"
        lit={WORD}
        onClick={() => setHits((n) => n + 1)}
      />
      <p className="gal-note" data-testid="switchboard-hits">
        点击次数 {hits}
      </p>
    </div>
  )
}

// ---------- AnimatedTags ----------
const SECTOR_TAGS = ['半导体', 'AI 算力', '创新药', '银行', '新能源', '军工', '券商']
export function AnimatedTagsDemo() {
  const [picked, setPicked] = useState<string[]>(['半导体'])
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 420 }}>
      <AnimatedTags
        tags={SECTOR_TAGS}
        selected={picked}
        onChange={setPicked}
        labels={{
          selected: '关注板块',
          available: '可选板块',
          empty: '还没有关注的板块',
          remove: (tag) => `移除 ${tag}`,
          add: (tag) => `关注 ${tag}`,
        }}
      />
      <p className="gal-note" data-testid="tags-state">
        已选 {picked.length} 个
      </p>
    </div>
  )
}

// ---------- ExposureSlider ----------
export function ExposureSliderDemo() {
  const [exposure, setExposure] = useState(0)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 520 }}>
      <ExposureSlider
        label="净敞口"
        min={-20}
        max={20}
        value={exposure}
        onValueChange={setExposure}
        tone="pnl"
        format={(v) => (v > 0 ? `+${v}%` : `${v}%`)}
      />
      <Row>
        <Button onClick={() => setExposure(10)}>做多 10%</Button>
        <Button onClick={() => setExposure(-10)}>做空 10%</Button>
        <Button onClick={() => setExposure(0)}>归零</Button>
      </Row>
      <p className="gal-note">拖动刻度尺，或聚焦后按 ← → 一格、PageUp / PageDown 十格、Home / End 到两端。</p>
    </div>
  )
}

// ---------- PowerOffSlide ----------
export function PowerOffSlideDemo() {
  const [log, setLog] = useState('未执行')
  return (
    <div className="gal-stack">
      <PowerOffSlide
        label="滑动全部平仓"
        busyLabel="平仓中…"
        icon={<Power aria-hidden="true" size={24} />}
        duration={1500}
        onConfirm={() => setLog('已发出全部平仓指令（演示，没有真的下单）')}
      />
      <p className="gal-note" data-testid="slide-log">
        {log}
      </p>
    </div>
  )
}

// ---------- AnimatedStepper ----------
const TICKET_STEPS = ['选品种', '填参数', '确认'] as const
export function AnimatedStepperDemo() {
  const [step, setStep] = useState(0)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 640 }}>
      <AnimatedStepper
        orientation="horizontal"
        currentStep={step}
        onStepChange={setStep}
        allowClickNavigation
        labels={{ steps: '下单步骤', step: (n, label) => `第 ${n} 步：${label}`, completed: '已完成', current: '当前' }}
        steps={[
          {
            label: TICKET_STEPS[0],
            description: '标的与方向',
            content: (
              <p className="k-text-data" style={{ margin: 0, color: 'var(--ink-200)' }}>
                选择 BTCUSDT，方向买入。
              </p>
            ),
          },
          {
            label: TICKET_STEPS[1],
            description: '数量与价格',
            content: (
              <p className="k-text-data" style={{ margin: 0, color: 'var(--ink-200)' }}>
                数量 0.50，限价 106,900。
              </p>
            ),
          },
          {
            label: TICKET_STEPS[2],
            description: '核对后提交',
            content: (
              <p className="k-text-data" style={{ margin: 0, color: 'var(--ink-200)' }}>
                预计成交额 53,450 USDT，确认提交。
              </p>
            ),
          },
        ]}
      />
      <Row>
        <Button disabled={step === 0} onClick={() => setStep((n) => Math.max(0, n - 1))}>
          上一步
        </Button>
        <Button disabled={step === 2} onClick={() => setStep((n) => Math.min(2, n + 1))}>
          下一步
        </Button>
      </Row>
      <AnimatedStepper
        orientation="vertical"
        defaultStep={1}
        labels={{ steps: '审批步骤', step: (n, label) => `第 ${n} 步：${label}`, completed: '已完成', current: '当前' }}
        steps={[{ label: '生成建议' }, { label: '风控复核' }, { label: '下单' }]}
      />
    </div>
  )
}

// ---------- Squircle ----------
const SQUIRCLE_BOX = { width: 96, height: 96, background: 'var(--bg-300)' } as const
export function SquircleDemo() {
  return (
    <>
      <Row name="圆角对比">
        <Cell name="border-radius 24">
          <div style={{ width: 96, height: 96, background: 'var(--bg-300)', borderRadius: 24 }} />
        </Cell>
        <Cell name="smoothing 0.6">
          <Squircle radius={24} style={SQUIRCLE_BOX} />
        </Cell>
        <Cell name="smoothing 1">
          <Squircle radius={24} smoothing={1} border style={SQUIRCLE_BOX} />
        </Cell>
      </Row>
    </>
  )
}

// ---------- 加载 ----------
const GRID_PATTERNS = Object.keys(GRID_LOADER_PATTERNS) as GridLoaderPattern[]
export function GridLoaderDemo() {
  return (
    <>
      <Row name="图案">
        {GRID_PATTERNS.slice(0, 8).map((pattern) => (
          <Cell key={pattern} name={pattern}>
            <GridLoader label={`加载 ${pattern}`} pattern={pattern} size={32} />
          </Cell>
        ))}
      </Row>
      <Row name="模式">
        <Cell name="stagger">
          <GridLoader label="依次点亮" mode="stagger" pattern="border" size={32} color="var(--accent)" />
        </Cell>
        <Cell name="sequence">
          <GridLoader
            label="图案轮换"
            mode="sequence"
            sequence={['border', 'cross', 'corners', 'diamond']}
            size={32}
            speed="slow"
          />
        </Cell>
        <Cell name="rounded">
          <GridLoader label="圆点" pattern="cross" rounded size={32} color="var(--pnl-up)" />
        </Cell>
        <Cell name="still">
          <GridLoader label="静止图案" pattern="diamond" still size={32} />
        </Cell>
      </Row>
    </>
  )
}
export function MotionLoaderDemo() {
  return (
    <Row name="款式">
      {MOTION_LOADER_VARIANTS.map((variant) => (
        <Cell key={variant} name={variant}>
          <MotionLoader label={`加载 ${variant}`} variant={variant} size={36} />
        </Cell>
      ))}
    </Row>
  )
}

// ---------- PagePreloader ----------
const PRELOADER_VARIANTS: readonly PagePreloaderVariant[] = ['curtain', 'stairs', 'pixel', 'words']
export function PagePreloaderDemo() {
  const [variant, setVariant] = useState<PagePreloaderVariant>('curtain')
  const [run, setRun] = useState(0)
  return (
    <div className="gal-stack" data-gallery-live="page-preloader" style={{ width: '100%', maxWidth: 560 }}>
      <Row>
        {PRELOADER_VARIANTS.map((one) => (
          <Button
            key={one}
            aria-pressed={variant === one}
            onClick={() => {
              setVariant(one)
              setRun((n) => n + 1)
            }}
          >
            {one}
          </Button>
        ))}
        <Button data-testid="preloader-replay" onClick={() => setRun((n) => n + 1)}>
          重播
        </Button>
      </Row>
      <div
        style={{
          position: 'relative',
          height: 160,
          overflow: 'hidden',
          border: '1px solid var(--line-100)',
          background: 'var(--bg-100)',
        }}
      >
        <div
          className="k-text-title"
          style={{ display: 'grid', height: '100%', placeItems: 'center', color: 'var(--ink-100)' }}
        >
          工作区已就绪
        </div>
        <PagePreloader
          key={`${variant}-${run}`}
          label="正在载入工作区"
          variant={variant}
          duration={900}
          words={['载入行情', '恢复布局', '就绪']}
        />
      </div>
    </div>
  )
}

// ---------- ScrollProgress ----------
export function ScrollProgressDemo() {
  const box = useRef<HTMLDivElement>(null)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 640 }}>
      <div
        ref={box}
        data-testid="scroll-box"
        style={{ height: 192, overflow: 'auto', border: '1px solid var(--line-100)', background: 'var(--bg-100)' }}
      >
        <ScrollProgress label="阅读进度" container={box} position="top" />
        <div
          className="k-text-data"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)',
            color: 'var(--ink-200)',
          }}
        >
          {Array.from({ length: 18 }, (_, i) => (
            <p key={i} style={{ margin: 0 }}>
              研究报告第 {i + 1} 段（演示）：公司的收入结构、毛利率走势与现金流情况，各项假设写在附表里。
            </p>
          ))}
        </div>
      </div>
      <Row name="四种">
        <ScrollProgress label="环形进度" variant="ring" container={box} position="inline" showValue />
        <ScrollProgress label="数字进度" variant="number" container={box} position="inline" />
        <ScrollProgress label="分段进度" variant="segments" container={box} position="inline" showValue />
      </Row>
    </div>
  )
}

// SPDX-License-Identifier: MIT
import { useMemo, useState } from 'react'
import { SymbolGalaxy, type GalaxyNode } from '../../src/blocks/index.ts'
import {
  ConnectedScatter,
  QuantileLayers,
  Ridgeline,
  SlopeChart,
  type ScatterSeries,
  type SlopeItem,
} from '../../src/quant/index.ts'
import {
  histogramBins,
  RangeHistogramSlider,
  UptimeBars,
  uptimeShare,
  type UptimeCell,
  type UptimeStatus,
} from '../../src/index.ts'
import { Row } from './parts.tsx'

/** 图右上三件的演示 props；导出与全屏的回调留空（演示页没有可导出的东西）。 */
const ACTIONS = { group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }
const view = (tableHead: string[], tableLabel: string) => ({
  actionLabels: ACTIONS,
  tableLabel,
  tableHead,
  onExport: () => {},
  onFullscreen: () => {},
  source: '来源 / 演示数据 · 固定种子合成 · 非行情',
})

// #1918：分布与关系类的件的演示。下面所有数据都是演示用的示例（在这个展示页里写死或用固定种子构造，不是行情，也不是真实的连接状态），页上也写明了；应用里没有样本数据。

/** 固定种子的伪随机（mulberry32）：同样的种子永远同样的演示数据，e2e 的几何断言才稳。 */
function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 正态分布样本（Box-Muller），均值与标准差自己给。 */
function gaussians(seed: number, count: number, mean: number, sd: number): number[] {
  const next = seeded(seed)
  const out: number[] = []
  while (out.length < count) {
    const u = Math.max(next(), 1e-9)
    const v = next()
    const r = Math.sqrt(-2 * Math.log(u))
    out.push(mean + sd * r * Math.cos(2 * Math.PI * v))
    if (out.length < count) out.push(mean + sd * r * Math.sin(2 * Math.PI * v))
  }
  return out
}

const NOTE = '演示数据：写死的状态位置，不是真实连接状态。'
const NOTE_DIST = '演示数据：固定种子生成的 2000 个示例涨跌幅，不是行情。'

const STATUS_TEXT: Record<UptimeStatus, string> = { up: '正常', down: '中断', degraded: '降级', none: '无数据' }

/** 逐日 30 格：最早 2 格没有数据，第 6、20 天中断，第 11、12、25 天降级；逐小时 48 格：第 8 小时中断，第 16、17 小时降级。写死的位置，e2e 的几何断言才稳。 */
const days = (hourly = false): UptimeCell[] => {
  const count = hourly ? 48 : 30
  const downAt = hourly ? [7] : [5, 19]
  const degradedAt = hourly ? [15, 16] : [10, 11, 24]
  return Array.from({ length: count }, (_, i) => {
    const status: UptimeStatus =
      i < 2 ? 'none' : downAt.includes(i) ? 'down' : degradedAt.includes(i) ? 'degraded' : 'up'
    const when = hourly ? `${String(i % 24).padStart(2, '0')}:00` : `第 ${i + 1} 天`
    const cuts = status === 'down' ? ` · 断流 ${1 + (i % 4)} 次` : ''
    return { id: String(i), status, label: `${when} · ${STATUS_TEXT[status]}${cuts}` }
  })
}

const STATUS_WORDS = { up: '正常', degraded: '降级', down: '断开', none: '无数据' } as const

export function UptimeBarsDemo() {
  const daily = days()
  const hourly = days(true)
  const [picked, setPicked] = useState('')
  // 对象写法：单位 % 用次一级墨色单独渲染（precision-instrument §2.2）。
  const pctValue = (cells: UptimeCell[]) => ({ value: ((uptimeShare(cells) ?? 0) * 100).toFixed(1), unit: '%' })
  const share = (cells: UptimeCell[]) => `近 ${cells.length} 格可用率 ${((uptimeShare(cells) ?? 0) * 100).toFixed(1)}%`
  return (
    <>
      <p className="gal-note">{NOTE}</p>
      <Row name="逐日（30 天）">
        <div className="gal-wide" data-gallery-uptime="daily">
          <UptimeBars
            {...view(['时间', '状态'], '逐格可用表')}
            cells={daily}
            label="示例行情源 QUOTE HUB · WS 近 30 天"
            statusLabels={STATUS_WORDS}
            availability={pctValue(daily)}
            range={['2026-10-16', '2026-11-14']}
            idle={share(daily)}
          />
        </div>
      </Row>
      <Row name="逐小时（48 小时），可点">
        <div className="gal-wide" data-gallery-uptime="hourly">
          <UptimeBars
            {...view(['时间', '状态'], '逐格可用表')}
            cells={hourly}
            label="示例连接 近 48 小时"
            statusLabels={STATUS_WORDS}
            availability={pctValue(hourly)}
            range={['2026-11-12 15:00', '2026-11-14 14:00']}
            idle={share(hourly)}
            onSelect={(cell) => setPicked(cell.label)}
          />
          <p data-gallery-uptime-picked>{picked}</p>
        </div>
      </Row>
    </>
  )
}

/** 2000 个示例涨跌幅（%，正态，均值 0.3、标准差 2.2）：只为画一条看得出形状的分布。 */
const CHANGES = gaussians(42, 2000, 0.3, 2.2)

export function RangeHistogramSliderDemo() {
  const [range, setRange] = useState<readonly [number, number]>([-2, 3])
  const counts = useMemo(() => histogramBins(CHANGES, -10, 10, 40), [])
  const inside = CHANGES.filter((value) => value >= range[0] && value <= range[1]).length
  return (
    <>
      <p className="gal-note">{NOTE_DIST}</p>
      <Row name="涨跌幅筛选（受控）">
        <div className="gal-wide" data-gallery-range="controlled">
          <RangeHistogramSlider
            counts={counts}
            min={-10}
            max={10}
            step={0.5}
            value={range}
            onValueChange={setRange}
            label="涨跌幅区间"
            labels={{ low: '涨跌幅下限', high: '涨跌幅上限' }}
            formatValue={(value) => `${value.toFixed(1)}%`}
            describe={(r) => `${r[0].toFixed(1)}% 到 ${r[1].toFixed(1)}%，共 ${inside} 个示例`}
          />
        </div>
      </Row>
      <Row name="不受控，默认全选">
        <div className="gal-wide" data-gallery-range="free">
          <RangeHistogramSlider
            counts={counts}
            min={-10}
            max={10}
            step={0.5}
            label="涨跌幅区间（不受控）"
            labels={{ low: '下限', high: '上限' }}
            formatValue={(value) => `${value.toFixed(1)}%`}
          />
        </div>
      </Row>
    </>
  )
}

/** 因子 5 分位层的示例日收益（%）：每层 400 个、标准差 1.8，均值从 −1.2 升到 +1.5。 */
const LAYERS = [-1.2, -0.4, 0.1, 0.7, 1.5].map((mean, i) => ({
  id: `q${i + 1}`,
  label: `第 ${i + 1} 层`,
  values: gaussians(100 + i, 400, mean, 1.8),
}))

export function RidgelineDemo() {
  return (
    <>
      <p className="gal-note">演示数据：固定种子生成的 5 层各 400 个示例收益，不是回测结果。</p>
      <Row name="分层收益分布，0 为基准线">
        <div className="gal-wide" data-gallery-ridge="layers">
          <Ridgeline
            {...view(['分层', '说明'], '分层收益分布表')}
            groups={LAYERS}
            label="示例：因子分层的日收益分布"
            baseline={0}
            formatValue={(value) => `${value} %`}
            describe={(group, stats) =>
              `${group.label}：中位数 ${stats.median.toFixed(2)} %，均值 ${stats.mean.toFixed(2)} %，${stats.n} 个`
            }
            idle="悬停或用上下键选一层"
          />
        </div>
      </Row>
      <Row name="没有基准线，窄一点">
        <div className="gal-wide" data-gallery-ridge="plain">
          <Ridgeline
            {...view(['分层', '说明'], '分层收益分布表')}
            groups={LAYERS.slice(0, 3)}
            label="示例：前三层（无基准线）"
            rowHeight={28}
            overlap={1.5}
            describe={(group, stats) => `${group.label}：中位数 ${stats.median.toFixed(2)} %`}
          />
        </div>
      </Row>
    </>
  )
}

/** 8 个示例品种的再平衡前后权重（%）：写死的表，几项故意挨得很近（12.0 与 12.4、8.0 与 8.3），用来看标签防重叠。 */
const WEIGHTS: readonly SlopeItem[] = [
  { id: 'a', label: '示例 A', before: 24, after: 18 },
  { id: 'b', label: '示例 B', before: 12, after: 15.5 },
  { id: 'c', label: '示例 C', before: 12.4, after: 12.4 },
  { id: 'd', label: '示例 D', before: 8, after: 10 },
  { id: 'e', label: '示例 E', before: 8.3, after: 9.6 },
  { id: 'f', label: '示例 F', before: 15, after: 14 },
  { id: 'g', label: '示例 G', before: 10, after: 9.1 },
  { id: 'h', label: '示例 H', before: 10.3, after: 11.4 },
]

/** 同 8 个示例品种的因子得分，按得分排名看升降。 */
const SCORES: readonly SlopeItem[] = WEIGHTS.map((item, index) => ({
  ...item,
  before: [3.1, 2.4, 2.9, 0.5, 1.2, 1.8, -0.4, 0.9][index]!,
  after: [3.2, 3.3, 2.5, 1.9, 0.2, 2.8, 1.1, 0.1][index]!,
}))

export function SlopeChartDemo() {
  const [picked, setPicked] = useState('')
  return (
    <>
      <p className="gal-note">演示数据：写死的示例权重与得分，不是持仓。</p>
      <Row name="再平衡前后权重（%）">
        <div className="gal-wide" data-gallery-slope="value">
          <SlopeChart
            {...view(['名称', '前', '后', '说明'], '前后对比表')}
            items={WEIGHTS}
            label="示例：再平衡前后权重"
            columns={{ before: '调整前', after: '调整后' }}
            formatValue={(value) => `${value} %`}
            describe={(item, change) =>
              `${item.label}：${item.before}% 到 ${item.after}%，${change > 0 ? '加仓' : change < 0 ? '减仓' : '不变'} ${Math.abs(change).toFixed(1)} 个百分点`
            }
            onSelect={(item) => setPicked(item.label)}
            idle="悬停或用上下键选一项，Enter 选中"
          />
          <p data-gallery-slope-picked>{picked}</p>
        </div>
      </Row>
      <Row name="因子排名变化（名次）">
        <div className="gal-wide" data-gallery-slope="rank">
          <SlopeChart
            {...view(['名称', '前', '后', '说明'], '前后对比表')}
            mode="rank"
            items={SCORES}
            label="示例：因子得分名次变化"
            columns={{ before: '上月', after: '本月' }}
            formatValue={(value) => value.toFixed(1)}
            describe={(item, change) =>
              `${item.label}：得分 ${item.before} 到 ${item.after}，名次${change > 0 ? `升 ${change} 位` : change < 0 ? `降 ${-change} 位` : '不变'}`
            }
          />
        </div>
      </Row>
    </>
  )
}

/** 两个示例策略各 8 个月的 (波动 %, 收益 %)：写死的数。甲一路往高波动高收益漂，乙往低波动漂。 */
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08']
const path = (name: string, points: readonly (readonly [number, number])[]) =>
  points.map(([x, y], i) => ({ x, y, label: `${name} 2026-${MONTHS[i]}：波动 ${x} %，收益 ${y} %` }))
const STRATEGIES: readonly ScatterSeries[] = [
  {
    id: 'a',
    label: '示例策略甲',
    points: path('甲', [
      [8, 4],
      [9, 5],
      [10, 4.5],
      [11, 6],
      [12, 7],
      [13, 6.5],
      [14, 8],
      [15, 9],
    ]),
  },
  {
    id: 'b',
    label: '示例策略乙',
    points: path('乙', [
      [14, 6],
      [13, 6.5],
      [12, 5.5],
      [11, 5],
      [10, 5.5],
      [9, 4.5],
      [8, 4],
      [7, 4.2],
    ]),
  },
]

export function ConnectedScatterDemo() {
  return (
    <>
      <p className="gal-note">演示数据：写死的两个示例策略各 8 个月的波动与收益，不是回测结果。</p>
      <Row name="波动 vs 收益，按月连成轨迹">
        <div className="gal-wide" data-gallery-scatter="two">
          <ConnectedScatter
            {...view(['轨迹', '时间点', '波动', '收益'], '轨迹点表')}
            series={STRATEGIES}
            label="示例：两个策略的波动与收益按月的轨迹"
            axes={{ x: '年化波动（%）', y: '年化收益（%）' }}
            formatX={(value) => `${value} %`}
            formatY={(value) => `${value} %`}
            idle="悬停或用方向键选一个月"
          />
        </div>
      </Row>
      <Row name="单条轨迹">
        <div className="gal-wide" data-gallery-scatter="one">
          <ConnectedScatter
            {...view(['轨迹', '时间点', '波动', '收益'], '轨迹点表')}
            series={STRATEGIES.slice(0, 1)}
            label="示例：策略甲的轨迹"
            axes={{ x: '年化波动（%）', y: '年化收益（%）' }}
          />
        </div>
      </Row>
    </>
  )
}

const SECTORS = ['金融', '科技', '消费', '能源', '医药']
const MARKETS = ['主板', '创业板', '科创板']
const STATES = ['持仓', '自选']

/** 示例品种：大小取对数正态（均值 3、标准差 0.9，再取指数，单位「亿」，只为画出有大有小），涨跌取正态（均值 0、标准差 2.5%）；行业、市场、因子分位、状态由序号与种子定。 */
function galaxyNodes(count: number, seed: number): GalaxyNode[] {
  const next = seeded(seed)
  const sizes = gaussians(seed + 1, count, 3, 0.9)
  const changes = gaussians(seed + 2, count, 0, 0.025)
  return Array.from({ length: count }, (_, i) => ({
    id: `s${String(i).padStart(4, '0')}`,
    label: `示例 ${String(i + 1).padStart(4, '0')}`,
    size: Math.exp(sizes[i]!),
    change: changes[i]!,
    groups: {
      sector: SECTORS[Math.floor(next() * SECTORS.length)]!,
      market: MARKETS[Math.floor(next() * MARKETS.length)]!,
      quantile: `第 ${1 + Math.floor(next() * 5)} 层`,
      state: STATES[next() < 0.3 ? 0 : 1]!,
    },
  }))
}

const GALAXY_NODES = galaxyNodes(48, 7)
const GALAXY_MANY = galaxyNodes(2400, 9)
const GROUPINGS = [
  { id: 'sector', label: '行业' },
  { id: 'market', label: '市场' },
  { id: 'quantile', label: '因子分位' },
  { id: 'state', label: '状态' },
]

export function SymbolGalaxyDemo() {
  const [picked, setPicked] = useState<GalaxyNode | null>(null)
  const shared = {
    groupings: GROUPINGS,
    groupingLabel: '分组方式',
    ...view(['名称', '分组', '详情'], '品种表'),
    describe: (node: GalaxyNode) =>
      `${node.label}：市值 ${node.size.toFixed(1)} 亿，涨跌 ${node.change === null ? '—' : `${(node.change * 100).toFixed(2)} %`}`,
    groupText: (group: string, count: number) => `${group}，${count} 只`,
    legendText: (step: number) => ['大跌', '跌', '平', '涨', '大涨'][step + 2] ?? '',
    tooltip: (node: GalaxyNode) => ({
      title: node.label,
      rows: [
        { key: 'size', label: '市值', value: `${node.size.toFixed(1)} 亿` },
        {
          key: 'change',
          label: '涨跌',
          // 涨跌色只上数字（dataviz §2）。
          value: (
            <span style={{ color: (node.change ?? 0) >= 0 ? 'var(--pnl-up)' : 'var(--pnl-down)' }}>
              {node.change === null ? '—' : `${(node.change * 100).toFixed(2)} %`}
            </span>
          ),
        },
      ],
    }),
  }
  return (
    <>
      <p className="gal-note">演示数据：固定种子生成的示例品种（市值与涨跌都是随机数），不是行情，也不是持仓。</p>
      <Row name="48 个示例品种（SVG），点选中">
        <div className="gal-wide" data-gallery-galaxy="svg">
          <SymbolGalaxy
            {...shared}
            nodes={GALAXY_NODES}
            label="示例：品种星系"
            onSelect={setPicked}
            selectedId={picked?.id ?? null}
            idle="悬停看详情，点一个点选中；Tab 在团间走，方向键在团内走"
          />
          <p data-gallery-galaxy-picked>{picked ? picked.label : ''}</p>
        </div>
      </Row>
      {/* canvas 是浏览器里画的，设计系统包的静态预览（服务端渲染）里画不出来，所以只在浏览器里摆这一行。 */}
      {typeof document !== 'undefined' && (
        <Row name="2400 个示例品种（点数多，自动改画 canvas）">
          <div className="gal-wide" data-gallery-galaxy="canvas">
            <SymbolGalaxy {...shared} nodes={GALAXY_MANY} label="示例：品种星系（2400 个）" defaultGroupBy="market" />
          </div>
        </Row>
      )}
    </>
  )
}

/** 5 层 31 期（2024-01 到 2026-07，每月一期）的示例累计超额收益（%）：期末值照卡 QuantileLayers 的量级（最高层约 +32、最低层约 -22）；第三层在「未通过」那一行故意压低到第二层之下。 */
function layerSeries(monotone: boolean) {
  return [-22.5, -8, monotone ? 1 : -12, 11, 32].map((final, i) => {
    let sum = 0
    const months = gaussians(200 + i, 31, final / 31, 0.8)
    return { rank: i + 1, label: `Q${i + 1}`, points: months.map((month) => (sum += month)) }
  })
}

function QuantileCase({ monotone, id }: { monotone: boolean; id: string }) {
  const layers = layerSeries(monotone)
  const longShort = layers[4]!.points.map((value, i) => value - layers[0]!.points[i]!)
  const x = (i: number) => `${2024 + Math.floor(i / 12)}-${String(1 + (i % 12)).padStart(2, '0')}`
  const labels = {
    chart: '示例：因子分层累计收益',
    actions: { group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' },
    x: '日期',
    layers: '分层',
    table: '分层累计收益表',
    monotonicPass: '通过',
    monotonicFail: '未通过',
    monotonic: '单调性',
    tooMany: '分层多于 10，不画线。',
  }
  const stats = [
    // 多空年化 = 多空差期末累计（%）按 31 个月折成年的复合收益。
    {
      key: 'ls',
      label: '多空年化',
      value: `${((Math.pow(1 + longShort.at(-1)! / 100, 12 / 31) - 1) * 100).toFixed(1)} %`,
    },
    { key: 'turn', label: '换手', value: '0.62 /月' },
    { key: 'n', label: '样本', value: '31 期 · 4 280 只' },
  ]
  return (
    <div className="gal-wide" data-gallery-quantile={id}>
      <QuantileLayers
        layers={layers}
        longShort={longShort}
        title="MOM_RS_V3 · 5 分层累计超额"
        longShortLabel="Q5−Q1"
        labels={labels}
        formatValue={(value) => ({ value: value.toFixed(1), unit: '%' })}
        formatX={x}
        stats={stats}
        source="来源 / 演示数据 · 固定种子合成 · 非回测"
        onExport={() => {}}
      />
    </div>
  )
}

export function QuantileLayersDemo() {
  return (
    <>
      <p className="gal-note">
        演示数据：固定种子生成的示例累计超额收益（因子 MOM_RS_V3，2024-01 到 2026-07），不是回测结果。
      </p>
      <Row name="5 分层，单调通过">
        <QuantileCase monotone id="pass" />
      </Row>
      <Row name="第 3 层压低，单调未通过">
        <QuantileCase monotone={false} id="fail" />
      </Row>
    </>
  )
}

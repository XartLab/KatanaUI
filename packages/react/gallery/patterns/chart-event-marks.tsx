// SPDX-License-Identifier: MIT
// 模式：图上事件标记（#270，规则取自 XartLab/KATANAview#2189 实现决定第 5 节「定」，2026-11-27）。
// 标记本身画在 KATANAview 的图表包里（可画层 timescale-marks）；这一页只写设计规则，示例是照金样例画的示意图，不连图表。
import { NewsFeed, type NewsGroup, type NewsItem } from '../../src/blocks'
import { NEWS_LABELS } from '../pages/blocks'
import type { Pattern } from './types'

// 金样例（演示数据）：605990.XSHG（演示用的代码），交易日 2026-11-23 至 11-27，没有休市日。
const DAYS = [
  { day: '11-23', count: 1, color: 'var(--series-1)', size: 10, ring: false, hollow: false },
  { day: '11-24', count: 4, color: 'var(--series-1)', size: 16, ring: true, hollow: false },
  { day: '11-25', count: 1, color: 'var(--series-3)', size: 10, ring: false, hollow: false },
  { day: '11-26', count: 1, color: 'var(--series-4)', size: 10, ring: false, hollow: false },
  { day: '11-27', count: 0, color: '', size: 0, ring: false, hollow: false },
] as const

// A 股的影响类型与颜色：分类表序号 i 对应 --series-{i+1}，「其他」对应 --series-other。
const IMPACT_COLORS = [
  ['公告', 'var(--series-1)'],
  ['政策与监管', 'var(--series-2)'],
  ['行业与题材', 'var(--series-3)'],
  ['公司经营', 'var(--series-4)'],
  ['外盘与宏观', 'var(--series-5)'],
  ['市场情绪', 'var(--series-6)'],
  ['其他', 'var(--series-other)'],
] as const

const BAND_HEIGHT = 18
const COLUMN = 84
const WIDTH = COLUMN * DAYS.length

/** 主图最下面、时间轴正上方的一条带：圆里写当天条数，直径 10–16px，11-24 外面有一圈细环（同一天不止一类）。 */
function BandSketch() {
  return (
    <svg
      role="img"
      aria-label="图上事件标记示意：五个交易日的底部标记带"
      width={WIDTH}
      height={92}
      viewBox={`0 0 ${WIDTH} 92`}
      style={{ maxWidth: '100%', background: 'var(--k-surface-sunken-background)', borderRadius: 6 }}
    >
      {/* 成交量柱：带子压在它上面，不画底色。 */}
      {DAYS.map((d, i) => (
        <rect
          key={d.day}
          x={i * COLUMN + 30}
          y={72 - (i % 3) * 8 - 8}
          width={24}
          height={(i % 3) * 8 + 8}
          fill="var(--alpha-white-8)"
        />
      ))}
      <line x1={0} x2={WIDTH} y1={74} y2={74} stroke="var(--k-separable-secondary-borderColor)" />
      {DAYS.map((d, i) => {
        const cx = i * COLUMN + COLUMN / 2
        const cy = 74 - 1 - BAND_HEIGHT / 2
        return (
          <g key={d.day}>
            {d.count > 0 && (
              <>
                {d.ring && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={d.size / 2 + 1.5}
                    fill="none"
                    stroke="var(--series-other)"
                    strokeWidth={1}
                  />
                )}
                <circle cx={cx} cy={cy} r={d.size / 2} fill={d.color} />
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  fill="var(--k-surface-sunken-background)"
                  fontWeight={600}
                >
                  {d.count}
                </text>
              </>
            )}
            <text x={cx} y={88} textAnchor="middle" fontSize={10} fill="var(--k-content-secondary-foreground)">
              {d.day}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

const NOW = Date.UTC(2026, 10, 24, 8, 0, 0)
const MIN = 60_000
const direction = (label: string) => ({ label, tone: 'neutral' as const })
const DAY_ITEMS: NewsItem[] = [
  {
    id: 'e1',
    time: NOW - 20 * MIN,
    channel: 'cn',
    source: 'wire',
    title: '演示公司：控股股东拟增持不低于 1 亿元',
    tags: [{ label: '公告', tone: 'neutral' }, direction('利好')],
    sourcesCount: 2,
    alsoFrom: ['演示快讯'],
  },
  {
    id: 'e2',
    time: NOW - 80 * MIN,
    channel: 'cn',
    source: 'exch',
    title: '演示公司：披露回购进展',
    tags: [{ label: '公告', tone: 'neutral' }, direction('中性')],
  },
  {
    id: 'e3',
    time: NOW - 150 * MIN,
    channel: 'cn',
    source: 'desk',
    title: '演示行业：板块情绪升温，资金回流',
    tags: [{ label: '市场情绪', tone: 'neutral' }, direction('利好')],
  },
  {
    id: 'e4',
    time: NOW - 300 * MIN,
    channel: 'cn',
    source: 'wire',
    title: '演示公司：传闻有新订单，待核实',
    tags: [direction('未标')],
  },
]
const byType = (item: NewsItem): NewsGroup => {
  const type = item.tags?.[0]
  const label = type && type.label !== '未标' ? type.label : '未标'
  return { key: label, label, count: DAY_ITEMS.filter((i) => (i.tags?.[0]?.label ?? '未标') === label).length }
}
const SIDEBAR_LABELS = {
  ...NEWS_LABELS,
  ago: (s: number) => `${Math.floor(s / 60)} 分钟前`,
  end: { endReached: '到底了' },
}

function Demo() {
  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <p className="gal-note">演示数据：标题、代码、条数都是编的，样子照金样例画，不连图表。</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <div className="gal-stack">
          <BandSketch />
          <p className="gal-note">
            11-23 的 1 条公告；11-24 有 4 条、两类（公告最多），所以外面一圈细环；11-25、11-26 各 1 条；11-27
            没有，不画。
          </p>
          <ul
            aria-label="影响类型与颜色"
            style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', margin: 0, padding: 0, listStyle: 'none' }}
          >
            {IMPACT_COLORS.map(([name, color]) => (
              <li key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg width={10} height={10} aria-hidden="true">
                  <circle cx={5} cy={5} r={5} fill={color} />
                </svg>
                {name}
              </li>
            ))}
            <li style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <svg width={10} height={10} aria-hidden="true">
                <circle cx={5} cy={5} r={4.5} fill="none" stroke="var(--series-other)" />
              </svg>
              全部没标（空心）
            </li>
          </ul>
        </div>
        <div style={{ width: 480, height: 300 }} data-testid="event-rail">
          <p className="gal-note">点 11-24：右侧事件栏（图不动）。2026-11-24 · {DAY_ITEMS.length} 条</p>
          <NewsFeed
            items={DAY_ITEMS}
            channels={[]}
            sources={[
              { value: 'wire', label: '演示通讯社' },
              { value: 'desk', label: '演示研究台' },
              { value: 'exch', label: '演示交易所' },
            ]}
            now={NOW}
            labels={SIDEBAR_LABELS}
            chrome="bare"
            groupBy={byType}
            endState="end"
          />
        </div>
      </div>
    </div>
  )
}

const pattern: Pattern = {
  id: 'chart-event-marks',
  title: '图上事件标记',
  summary:
    '在 K 线图上标出有新闻或公告的交易日：时间轴上方一条带，一天一个圆，颜色是影响类型、大小是条数；悬停看要点，点开右侧事件栏，图表不动。设计规则在这里，标记本身画在 KATANAview 的图表包里。',
  Demo,
  use: [
    '要在价格图上看「哪几天有事」：新闻、公告、财报这类按交易日发生、一天可能有好几条的事件',
    '标记要和侧栏列表条数一致：点开的列表与按（交易日，标的）查到的完全一致',
  ],
  avoid: [
    '要把事件画在某一根 K 线的价位上（成交箭头、策略标记、脚本标记）：那是挂在 K 线上的标记，不是时间轴上的带',
    '要让标记表达涨跌或利好利空：颜色只表示影响类型，方向写在悬停与侧栏里',
    '回放里不画：按交易日聚合分不出那一刻拿不拿得到，画了就是拿未来的数',
  ],
  parts: [
    {
      page: 'news-feed',
      role: '事件栏：chrome="bare" 去掉标题行与过滤区，groupBy 按影响类型分段，tags 写类型与方向（中性色），endState 写「到底了」',
    },
    { page: 'multi-select', role: '图表设置「事件」一节里的影响类型、方向多选' },
    { page: 'switch', role: '「新闻标记」开关，默认开' },
    { page: 'tag', role: '悬停与事件栏里的类型、方向用中性的小标签，不用涨跌色' },
  ],
  rules: [
    '位置：主图最下面、时间轴正上方的一条带，高 18px（依据：现有序列标记的形状基数 8px × 2，再加上下各 1px，图表包 primitives/series-markers.ts），不挂在 K 线上方。',
    '位置的出处：TradingView 把财报画成 E 图标，「placed along the X-axis on the report date」（帮助页 Earnings，2026-11-27 读）；图表库的时间轴标记是「figures above the time scale」，里面一个字符（Charting Library 文档 Marks，2026-11-27 读）。',
    '带子不画底色，压在成交量柱上面，跟 TradingView 一样；不跟成交箭头、策略标记、脚本标记（都挂在 K 线上下）抢地方，价格区保持干净。',
    '一天一个标记：（交易日，标的）有新闻就出一个；圆里写当天条数，100 条及以上写「99+」。',
    '颜色按当天条数最多的影响类型，取分类色：该市场分类表的序号 i 对应 --series-{i+1}，「其他」对应 --series-other，并列取序号小的。A 股：公告 series-1、政策与监管 series-2、行业与题材 series-3、公司经营 series-4、外盘与宏观 series-5、市场情绪 series-6；美股 7 类，用到 series-7。',
    '同一天有多种类型：不拆成几个点，主色取最多的那类，外面加一圈 1px 的 --series-other 细环，表示「不止一类」。',
    '当天的新闻全部没标（未标等于总数）：画空心圆，描边 --series-other。',
    '大小：直径 10–16px，按可见窗口里条数最多的那天线性归一，不设分档阈值；依据：10px 是 9px 数字加边的最小可读尺寸，16px 是带高 18px 减去上下留白。',
    '形状：新闻用圆，方块留给公告；方向不进颜色，只在悬停与侧栏里写。',
    '落到哪一根：日线落在 tradeDate 那一根（日线柱的时间戳是交易日 UTC 0 点）；日内周期落在该交易日的第一根（开盘那根）；周线、月线把几天合进所在那根，条数相加，颜色和细环重新算，合并在应用的纯函数里做，可画层只管画。',
    '悬停：纯文本，四行——「2026-11-24 · 4 条」、「公告 2 · 市场情绪 1 · 未标 1」、「利好 2 · 利空 1 · 中性 0」、「当日 +1.23% · 次日 −0.40% · 5 日 +2.10%」；依据：图表库的时间轴标记悬停弹纯文本，不支持 HTML（Charting Library 文档 Marks，2026-11-27 读）。',
    '悬停里的涨跌是事实，从图上自己的 K 线算：当日 = 当天最后一根的收盘价比前一交易日最后一根的收盘价；次日、5 日（5 个交易日是一周，推导）是之后第 1、第 5 个交易日的收盘价比当天收盘价；还没到写「—（还没到）」，图上没载入的写「—」；不写概率、预测、胜率。',
    '点击：打开图表右侧的事件栏，列出当天的条目；查询与按（交易日，标的）取列表完全一致，再加上图表当前的影响类型、方向过滤；栏头写「2026-11-24 · 4 条」，条数取列表自己的条数。',
    '事件栏每行：时间、时段标签、来源、标题、影响类型、利好 / 利空 / 中性、来源数；类型与方向用中性的小标签，不用涨跌色。',
    '图表不动：事件栏把图挤窄，但可见的首根和末根 K 线不变（逻辑范围不变），不滚到那一天，不改缩放和价格轴。',
    '过滤：图表设置加「事件」一节（照 TradingView 图表设置 Events 页签的 Dividends、Splits、Earnings 开关，帮助页 43000494799，2026-11-27 读）：开关「新闻标记」默认开，影响类型多选，方向多选；过滤条件一起传给逐日计数与事件栏的列表，两边的条数口径一样。',
    '取哪段：已载入 K 线的首个到末个交易日，最多 800 个自然日（服务的上限）；更早的不取，图例写「新闻标记只取了最近 800 天」；K 线载入范围变了才重取，另外跟着数据集的 60 秒刷新。',
    '回放里不画新闻标记，图例写「回放中不显示新闻标记」：逐日计数按交易日聚合，分不出那一刻拿不拿得到（asOf / availableAt），画了就是拿未来的数。',
    '取不到：没有新闻数据源不画标记，图例里写一行原因；取数失败写原因，不画空带冒充「没有新闻」。',
    'A 股：收盘后（15:00 起）和休市日的新闻算到下一个交易日，事件栏每行写时段（盘前 / 盘中 / 午休 / 盘后 / 休市）；美股收盘后从 16:00 起。',
    '待核对（没读到）：TradingView 分红、拆股的图标长什么样；同一天有几个标记怎么排；点时间轴标记之后发生什么。',
  ],
  source: {
    label: 'TradingView · Earnings 与 Charting Library Marks（2026-11-27 读）',
    href: 'https://br.tradingview.com/charting-library-docs/latest/ui_elements/Marks',
  },
}
export default pattern

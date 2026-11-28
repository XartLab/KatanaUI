# StrategyReport

回测结果的一整页，页签照 TradingView 策略测试器：概览（一排关键读数：净利润、总收益率、最大回撤、胜率、盈亏比、交易次数、夏普；下面是权益曲线与回撤，可叠同期买入持有）、绩效（全部 / 多 / 空三列的指标表）、交易分析（盈亏分布与持仓时长的直方图、连续盈亏条、读数清单）、风险比率（夏普、索提诺、卡玛、恢复因子、回撤与上冲）、交易列表（DataGrid，每笔进出场、数量、盈亏、累计、最大浮盈浮亏，行可展开看信号与持仓时长）、属性（参数与回测设置的分组键值）。顶上「全部 / 多 / 空」管概览、交易分析与交易列表；绩效与风险比率三列并排，当前那列加亮。指标全由逐笔平仓算，口径写在 strategy-report-model.ts 的注释里（夏普与索提诺按日收益年化，年化日数由 periodsPerYear 给）。结构参照 TradingView 策略测试器帮助页（2026-11-15 读到概览页；其余页签没读到页面，按需求稿的结构做，待核对）。演示数据是固定种子合成的，页上与小标都写明。

## Provide

`*` marks a required prop.

### StrategyReport

页签与多空的状态在件内；数据、数字格式与全部文字由调用方传，件不认识任何应用或交易所，包里没有语言。高度由外层给（件撑满外层，每页自己滚；交易列表的表撑满页签区）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `trades` | `ReportTrade[]` | — | { id, side: long \| short, entryTime, exitTime（毫秒）, entryPrice, exitPrice, quantity, pnl（已扣费）, maxRunup（≥ 0）, maxDrawdown（≤ 0）, entrySignal?, exitSignal? }。不用排序，件按平仓时间算。 |
| `initialCapital` | `number` | — | 初始资金：总收益率、回撤比例、年化收益按它算。 |
| `periodsPerYear / riskFree` | `number` | `252 / 0` | 夏普与索提诺的年化日数（A 股、美股 252，加密 365）与年化无风险利率（小数）。 |
| `benchmark` | `{ name: string; at: (time: number) => number }` | — | 同期买入持有：给一个时刻，返回那时的买入持有权益（起点是初始资金）。不给就不画虚线与概览里的买入持有读数。 |
| `properties` | `{ id, title, rows: { label, value }[] }[]` | — | 属性页：参数与回测设置，分组的键值，值已是写好的字。 |
| `format` | `StrategyReportFormat` | — | money、percent（0.12 → 12%）、price、quantity、time、duration（毫秒）必填；ratio（默认两位小数）与 axisTime（图横轴的短时刻）可选。件不格式化数值。 |
| `labels` | `StrategyReportLabels` | — | 全部文字：tabs、side、metrics（每个指标名）、equity（权益曲线的标题、线名、读屏名与图自带的文字）、analysis（直方图每根柱与连续条每一笔的整句）、list（列名、多空、展开行的字）、empty。 |
| `badge` | `string` | — | 页签行右端的小标，如「演示数据」。 |
| `defaultTab / defaultSide` | `string` | — | 起始页签与多空，默认概览与全部。 |
| `onTabChange / onSideChange` | `callback` | — | 页签或多空变了通知调用方（可选）。 |
| `onExport` | `(csv, fileName) => void` | — | 给了，交易列表的表头菜单里出「导出 CSV」。 |

### computeReport(trades, options)

逐笔平仓 → 全部读数与权益曲线的纯函数（净盈亏、盈亏因子、胜率、盈亏比、期望、连胜连亏、最大回撤与上冲、回撤段、夏普、索提诺、卡玛、年化、恢复因子）；没有亏损时盈亏因子、盈亏比是 null。件内部用它，调用方想在别处出同样的数也可以直接调。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { StrategyReport, type ReportTrade, type StrategyReportLabels, type StrategyReportTab } from '@katana-ui/react/blocks'

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

const DAY = 86_400_000

const START = Date.UTC(2026, 0, 5, 1, 30)

const CAPITAL = 100_000

/** 140 笔：胜率约 44%，盈利笔平均约 900、亏损笔平均约 -520，中间夹一段连亏；持仓几小时到几天。 */

export const DEMO_TRADES: readonly ReportTrade[] = (() => {
  const rand = seeded(35)
  let clock = START
  let price = 38
  return Array.from({ length: 140 }, (_, i) => {
    const entryTime = clock
    const hours = 2 + Math.floor(rand() * rand() * 120)
    const exitTime = entryTime + hours * 3_600_000
    clock = exitTime + (4 + Math.floor(rand() * 60)) * 3_600_000
    const slump = i >= 58 && i < 66
    const win = !slump && rand() < 0.46
    const size = 0.4 + rand() * 1.6
    const pnl = Math.round(win ? 300 + rand() * rand() * 3600 * size : -(160 + rand() * 900 * size))
    const side: 'long' | 'short' = rand() < 0.58 ? 'long' : 'short'
    price = Math.max(20, price + (rand() - 0.5) * 2.4)
    const quantity = 1000
    const move = pnl / quantity
    return {
      id: `t${i + 1}`,
      side,
      entryTime,
      exitTime,
      entryPrice: Number(price.toFixed(2)),
      exitPrice: Number((price + (side === 'long' ? move : -move)).toFixed(2)),
      quantity,
      pnl,
      maxRunup: Math.round(Math.max(pnl, 0) + rand() * 500),
      maxDrawdown: -Math.round(Math.max(-pnl, 0) + rand() * 400),
      entrySignal: side === 'long' ? '突破 20 日高点' : '跌破 20 日低点',
      exitSignal: win ? '移动止盈' : '止损',
    }
  })
})()

const number = (digits: number, sign = false) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: sign ? 'exceptZero' : 'auto',
  })

const money = number(0, true)

const pct = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, signDisplay: 'exceptZero' })

const price = number(2)

const qty = number(0)

const iso = (t: number) => new Date(t).toISOString().slice(0, 16).replace('T', ' ')

const duration = (ms: number) => {
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `${minutes}m`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`
}

const FORMAT = {
  money: (v: number) => money.format(Math.round(v)),
  percent: (v: number) => pct.format(v),
  price: (v: number) => price.format(v),
  quantity: (v: number) => qty.format(v),
  time: iso,
  duration,
  axisTime: (t: number) => iso(t).slice(5, 10),
}

const LABELS: StrategyReportLabels = {
  report: '策略报告',
  tabs: {
    group: '报告页签',
    overview: '概览',
    performance: '绩效',
    analysis: '交易分析',
    ratios: '风险比率',
    trades: '交易列表',
    properties: '属性',
  },
  side: { group: '多空', all: '全部', long: '多', short: '空' },
  metrics: {
    netProfit: '净利润',
    grossProfit: '总盈利',
    grossLoss: '总亏损',
    profitFactor: '盈亏因子',
    totalReturn: '总收益率',
    maxDrawdown: '最大回撤',
    maxDrawdownPct: '最大回撤比例',
    winRate: '胜率',
    payoffRatio: '盈亏比',
    tradeCount: '交易次数',
    wins: '盈利笔数',
    losses: '亏损笔数',
    breakeven: '持平笔数',
    expectancy: '每笔期望',
    avgWin: '平均盈利',
    avgLoss: '平均亏损',
    largestWin: '最大盈利',
    largestLoss: '最大亏损',
    avgDuration: '平均持仓时长',
    avgWinDuration: '盈利笔平均持仓',
    avgLossDuration: '亏损笔平均持仓',
    maxConsecWins: '最长连胜',
    maxConsecLosses: '最长连亏',
    sharpe: '夏普比率',
    sortino: '索提诺比率',
    calmar: '卡玛比率',
    cagr: '年化收益',
    recoveryFactor: '恢复因子',
    maxRunup: '最大上冲',
    avgDrawdown: '平均回撤',
    longestDrawdown: '最长回撤时长',
    finalEquity: '期末权益',
    buyHold: '买入持有',
  },
  equity: {
    title: '净盈亏',
    hint: '每平一笔一个点，累计净盈亏；虚线是同期买入持有',
    name: '策略',
    label: '净盈亏曲线与回撤',
    axisName: '起点',
    drawdown: '回撤',
    time: '时刻',
    scale: { group: '纵轴', linear: '线性', log: '对数' },
    brush: { start: '窗口起点', end: '窗口终点', window: '窗口位置' },
    actions: { group: '图工具', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' },
  },
  analysis: {
    pnlDistribution: '盈亏分布（笔数）',
    durationDistribution: '持仓时长分布（笔数）',
    streaks: '连续盈亏',
    win: '盈利',
    loss: '亏损',
    flat: '持平',
    bar: (from, to, count) => `${from} 到 ${to}：${count} 笔`,
    streakItem: (index, result) => `第 ${index} 笔：${result === 'win' ? '盈利' : result === 'loss' ? '亏损' : '持平'}`,
    facts: '交易分析读数',
  },
  list: {
    label: '交易列表',
    columns: {
      index: '#',
      side: '方向',
      entryTime: '进场时间',
      exitTime: '出场时间',
      entryPrice: '进场价',
      exitPrice: '出场价',
      quantity: '数量',
      pnl: '盈亏',
      cumulative: '累计盈亏',
      runup: '最大浮盈',
      drawdown: '最大浮亏',
    },
    sides: { long: '多', short: '空' },
    detail: { entrySignal: '进场信号', exitSignal: '出场信号', duration: '持仓时长', return: '收益率' },
  },
  empty: '没有交易',
}

const PROPERTIES = [
  {
    id: 'params',
    title: '策略参数',
    rows: [
      { label: '快线周期', value: '24' },
      { label: '慢线周期', value: '90' },
      { label: '止损（ATR 倍数）', value: '2.5' },
      { label: '移动止盈（ATR 倍数）', value: '3.0' },
    ],
  },
  {
    id: 'settings',
    title: '回测设置',
    rows: [
      { label: '初始资金', value: '100,000' },
      { label: '每笔数量', value: '1,000' },
      { label: '手续费', value: '0.025%（双边）' },
      { label: '滑点', value: '1 个最小变动价位' },
      { label: '回测区间', value: '2026-01-05 起，140 笔' },
      { label: '年化交易日', value: '252' },
      { label: '数据', value: '合成演示数据，不是行情' },
    ],
  },
]

const benchmark = {
  name: '买入持有',
  at: (time: number) => {
    const days = (time - START) / DAY
    return CAPITAL * (1 + 0.00045 * days + 0.035 * Math.sin(days / 21))
  },
}

/** defaultTab：组件截图截绩效表与交易列表用（#92）；文档站不传，开在概览。 */
export function StrategyReportUsage({ defaultTab }: { defaultTab?: StrategyReportTab } = {}) {
  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <div style={{ height: 620 }} data-testid="report-frame">
        <StrategyReport
          trades={DEMO_TRADES}
          initialCapital={CAPITAL}
          benchmark={benchmark}
          properties={PROPERTIES}
          format={FORMAT}
          labels={LABELS}
          badge="演示数据"
          defaultTab={defaultTab}
        />
      </div>
      <div style={{ height: 160 }} data-testid="report-empty">
        <StrategyReport trades={[]} initialCapital={CAPITAL} properties={PROPERTIES} format={FORMAT} labels={LABELS} />
      </div>
    </div>
  )
}

/** 12 × 10 的参数网格：快线 8…52、慢线 40…130；夏普是一座以（24，90）为顶的缓坡加一点噪声，快线逼近慢线的组合没有结果。 */
```

## States

- 没有交易（或筛选后没有）：概览、交易分析、交易列表写 labels.empty；绩效与风险比率照常出表，数值为 0 或「—」。
- 读数算不出来（没有亏损的盈亏因子、日收益全相同的夏普）写「—」，不写 0。
- 涨跌色只给字；直方图与连续条的面用中档涨跌色（灰是持平），没有橙色与蓝色。
- 多空切换时，绩效与风险比率三列不变，当前那列加亮；别的页按所选的多空重算。

## Don't

- 不要传已经汇总好的指标：件只收逐笔平仓，这样多空、绩效、分布的数永远对得上。
- 不要把演示数据当回测结果：真实回测的接入在应用里另做。
- 不要在件里写文字：指标名、列名、整句都由 labels 传。

## Composition

```
StrategyReport
  Tabs
    顶行：TabsList（line）· 小标 · ToggleGroup（全部 / 多 / 空）
    概览：关键读数条 · EquityCurve（权益与回撤，可带买入持有）
    绩效 / 风险比率：table（三列：全部、多、空）
    交易分析：直方图 svg × 2 · 连续盈亏条 · dl
    交易列表：DataGrid（renderSubRow 展开）
    属性：分组 dl
```

## Keyboard

- `← / →`：在页签间移动（UI SDK Tabs）
- `Tab`：页签行、多空切换、各页里的图与表之间移动
- `→ / ←`：交易列表里：焦点所在行展开 / 收起

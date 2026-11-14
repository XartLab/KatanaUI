// SPDX-License-Identifier: MIT
import { StrategyReport, type ReportTrade, type StrategyReportLabels } from '../../src/blocks/index.ts'
import { ParamScatter, type ParamPoint } from '../../src/quant/index.ts'
import { Row } from './parts.tsx'

// 策略报告与参数优化散点图的演示。下面所有数据都是固定种子合成的演示数据（不是回测结果，也不是行情），页上写明；应用里接真实回测另开票。

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

export function StrategyReportDemo() {
  return (
    <div className="gal-stack" style={{ width: '100%' }}>
      <p className="gal-note">
        演示数据：固定种子合成的 140 笔平仓（胜率约 44%，中间夹一段连亏），不是回测结果。切页签、切「全部 / 多 /
        空」；交易列表点行展开看进出场信号。
      </p>
      <div style={{ height: 620 }} data-testid="report-frame">
        <StrategyReport
          trades={DEMO_TRADES}
          initialCapital={CAPITAL}
          benchmark={benchmark}
          properties={PROPERTIES}
          format={FORMAT}
          labels={LABELS}
          badge="演示数据"
        />
      </div>
      <p className="gal-note">没有交易时：</p>
      <div style={{ height: 160 }} data-testid="report-empty">
        <StrategyReport trades={[]} initialCapital={CAPITAL} properties={PROPERTIES} format={FORMAT} labels={LABELS} />
      </div>
    </div>
  )
}

/** 12 × 10 的参数网格：快线 8…52、慢线 40…130；夏普是一座以（24，90）为顶的缓坡加一点噪声，快线逼近慢线的组合没有结果。 */
export const GRID: readonly ParamPoint[] = (() => {
  const rand = seeded(351)
  const points: ParamPoint[] = []
  for (let fast = 8; fast <= 52; fast += 4)
    for (let slow = 40; slow <= 130; slow += 10) {
      const bump = Math.exp(-((fast - 24) ** 2 / 260 + (slow - 90) ** 2 / 1500))
      points.push({
        id: `f${fast}-s${slow}`,
        x: fast,
        y: slow,
        value: fast + 8 > slow ? null : Number((1.7 * bump - 0.45 + (rand() - 0.5) * 0.35).toFixed(2)),
      })
    }
  return points
})()

export function ParamScatterDemo() {
  const actions = { group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }
  return (
    <>
      <p className="gal-note">
        演示数据：固定种子合成的 12 × 10 参数网格（快线 ×
        慢线），颜色是夏普比率；快线逼近慢线的组合没有结果（空心灰点）。点一个点看这组参数，琥珀环是最优。
      </p>
      <Row name="快线 × 慢线，颜色是夏普比率">
        <div className="gal-wide" data-gallery-pscatter="main" style={{ maxWidth: 720 }}>
          <ParamScatter
            actionLabels={actions}
            tableLabel="参数网格表"
            tableHead={['组合', '快线', '慢线', '夏普比率']}
            points={GRID}
            label="示例：快线与慢线周期的夏普比率网格"
            axes={{ x: '快线周期', y: '慢线周期' }}
            valueName="夏普比率"
            formatValue={(v) => v.toFixed(2)}
            bestLabel="最优"
            jumpLabel="跳到最优"
            noValue="没有结果"
            idle="点一个点，看这组参数"
            source="来源 / 演示数据（固定种子合成）"
          />
        </div>
      </Row>
    </>
  )
}

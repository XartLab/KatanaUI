// SPDX-License-Identifier: MIT
import { useLayoutEffect, useState } from 'react'
import { GroupedTable, countPassed, type GridColumn, type GridColumnLayout } from '../../src/blocks/index.ts'
import { IntradaySeries, formatCnAmount } from '../../src/cn/index.ts'
import { ToggleGroup, ToggleGroupItem } from '../../src/index.ts'
import {
  MatrixHeat,
  ValuationBand,
  type MatrixHeatColumn,
  type MatrixHeatRow,
  type MatrixHeatSort,
  type ValuationPoint,
} from '../../src/quant/index.ts'
import { minuteSeries, tradingClocks } from '../usage/intraday-demo-data.ts'

// A 股件包第 3 批（KatanaUI #260）的文档页演示。所有数据都是示例（页上写明）：股票、金额、晋级率、估值都是编的闭式公式，不是行情。文字由这里传（包里没有语言）。

/** 涨跌色只在根上换（tokens.css 的 :root[data-updown='cn']）：这一页挂着时根上是 data-updown="cn"（A 股红涨绿跌），离开还原。 */
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

// —— IntradaySeries ——
const CLOCKS = tradingClocks()
const AUCTION_CLOCKS = tradingClocks(true)
const MISSING = ['10:12', '10:13', '10:14']

export function IntradaySeriesDemo() {
  useCnUpdown()
  const [view, setView] = useState('all')
  const all = [
    {
      key: 'up',
      name: '涨停数',
      points: minuteSeries(CLOCKS, { base: 30, drift: 55, swing: 6, seed: 1, missing: MISSING }),
      previous: minuteSeries(CLOCKS, { base: 24, drift: 40, swing: 5, seed: 4 }),
      format: (value: number) => `${value} 家`,
    },
    {
      key: 'down',
      name: '跌停数',
      points: minuteSeries(CLOCKS, { base: 6, drift: -2, swing: 2, seed: 3 }),
      format: (value: number) => `${value} 家`,
    },
    {
      key: 'rate',
      name: '炸板率',
      axis: 'right' as const,
      points: minuteSeries(CLOCKS, { base: 14, drift: 8, swing: 3, seed: 2, round: 1 }),
      previous: minuteSeries(CLOCKS, { base: 18, drift: 4, swing: 3, seed: 5, round: 1 }),
      format: (value: number) => `${value.toFixed(1)}%`,
    },
  ]
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 820 }}>
      <p className="gal-note">
        示例数据：编出来的分钟线，不是行情。时间轴是
        09:30–15:00，午休压成中间一道细缝；涨停数与炸板率单位不同，一个在左轴、一个在右轴；虚线是「昨日同时段」。10:12–10:14
        三分钟没有数据，线在这里断开，不连过去。移动鼠标（或聚焦后按 ← →）读同一分钟的全部序列。
      </p>
      <ToggleGroup
        size="sm"
        aria-label="显示哪些序列"
        value={view}
        onValueChange={(next) => next && setView(next)}
        data-testid="intraday-toggle"
      >
        <ToggleGroupItem value="all">全部</ToggleGroupItem>
        <ToggleGroupItem value="count">只看涨跌停数</ToggleGroupItem>
        <ToggleGroupItem value="rate">只看炸板率</ToggleGroupItem>
      </ToggleGroup>
      <div data-testid="intraday-series">
        <IntradaySeries
          label="市场温度：涨停数、跌停数与炸板率（示例数据）"
          series={all.filter((item) => view === 'all' || (view === 'rate' ? item.key === 'rate' : item.key !== 'rate'))}
          labels={{
            empty: '没有选序列',
            previous: (name) => `${name} · 昨日同时段`,
            plotAria: (label, latest) => `${label}。最新：${latest}`,
          }}
        />
      </div>
      <p className="gal-note">
        画集合竞价（auction）：轴从 09:15 起，竞价与开盘之间也有一道缝；量能用柱（kind: bar），柱的轴自动包进 0。
      </p>
      <div data-testid="intraday-auction">
        <IntradaySeries
          auction
          height={160}
          label="大盘涨跌幅与成交额（含集合竞价，示例数据）"
          series={[
            {
              key: 'chg',
              name: '上证涨跌幅',
              points: minuteSeries(AUCTION_CLOCKS, { base: 0.1, drift: 0.6, swing: 0.35, seed: 6, round: 2 }),
              format: (value) => `${value.toFixed(2)}%`,
            },
            {
              key: 'amt',
              name: '分钟成交额',
              axis: 'right',
              kind: 'bar',
              points: minuteSeries(AUCTION_CLOCKS, { base: 40, drift: -10, swing: 25, seed: 8, round: 1 }),
              format: (value) => formatCnAmount(value * 1e8 * 0.1),
            },
          ]}
          formatRight={(value) => formatCnAmount(value * 1e7)}
          labels={{ empty: '暂无数据', previous: (name) => `${name} · 昨日同时段` }}
        />
      </div>
      <p className="gal-note">没有数据：写空态，不画样本。</p>
      <div data-testid="intraday-empty">
        <IntradaySeries series={[]} height={80} label="空态示例" labels={{ empty: '暂无分钟数据' }} />
      </div>
    </div>
  )
}

// —— GroupedTable ——
type Stock = {
  id: string
  name: string
  boards: number | null
  theme: string | null
  change: number
  amount: number
  promoted: boolean
}
const STOCKS: readonly Stock[] = [
  { id: 's1', name: '示例算力一', boards: 5, theme: '算力', change: 10.0, amount: 6.2e8, promoted: true },
  { id: 's2', name: '示例机器人', boards: 4, theme: '机器人', change: 10.0, amount: 3.2e8, promoted: true },
  { id: 's3', name: '示例低空', boards: 3, theme: '低空经济', change: 10.0, amount: 5.6e8, promoted: true },
  { id: 's4', name: '示例固态电池', boards: 3, theme: '电池', change: 9.98, amount: 1.9e8, promoted: false },
  { id: 's5', name: '示例芯片', boards: 2, theme: '算力', change: 10.01, amount: 8.4e8, promoted: true },
  { id: 's6', name: '示例电源', boards: 2, theme: '电池', change: 9.99, amount: 2.7e8, promoted: false },
  { id: 's7', name: '示例医药', boards: 2, theme: null, change: 8.2, amount: 4.1e8, promoted: false },
  { id: 's8', name: '示例消费', boards: 1, theme: '机器人', change: 10.0, amount: 1.2e8, promoted: true },
  { id: 's9', name: '示例传媒', boards: 1, theme: '低空经济', change: 10.0, amount: 0.9e8, promoted: false },
  { id: 's10', name: '示例军工', boards: 1, theme: '算力', change: 10.0, amount: 2.3e8, promoted: true },
  { id: 's11', name: '示例银行', boards: null, theme: null, change: 3.4, amount: 9.3e9, promoted: false },
  { id: 's12', name: '示例券商', boards: null, theme: '算力', change: 2.1, amount: 1.4e10, promoted: false },
]
const STOCK_COLUMNS: GridColumn<Stock>[] = [
  { id: 'name', type: 'text', value: (row) => row.name },
  { id: 'change', type: 'change', value: (row) => row.change },
  { id: 'amount', type: 'cnAmount', value: (row) => row.amount },
  { id: 'next', type: 'text', value: (row) => (row.promoted ? '晋级' : '—') },
]
const STOCK_LAYOUT: GridColumnLayout[] = [
  { id: 'name', label: '名称', width: 180, visible: true },
  { id: 'change', label: '涨跌幅', width: 90, visible: true },
  { id: 'amount', label: '成交额', width: 110, visible: true },
  { id: 'next', label: '次日', width: 80, visible: true },
]

type GroupMode = 'boards' | 'theme'

export function GroupedTableDemo() {
  useCnUpdown()
  const [mode, setMode] = useState<GroupMode>('boards')
  const [sort, setSort] = useState<{ id: string; desc: boolean } | null>(null)
  const [last, setLast] = useState('还没收起过')
  const byBoards = mode === 'boards'
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 620 }}>
      <p className="gal-note">
        示例数据：编出来的连板股，不是行情。每组一个组头：点三角（或聚焦后 ← → / Enter）收起、展开，组头写行数、晋级
        k/n，成交额合计对齐在「成交额」列下面；组按汇总排序（按连板数时高板在前，按题材时按成交额合计从大到小）；没分进组的放最后一组「其他」。点列头排序时组头不动、行在组内排。
      </p>
      <ToggleGroup
        size="sm"
        aria-label="按什么分组"
        value={mode}
        onValueChange={(next) => next && setMode(next as GroupMode)}
        data-testid="grouped-mode"
      >
        <ToggleGroupItem value="boards">按连板数</ToggleGroupItem>
        <ToggleGroupItem value="theme">按题材</ToggleGroupItem>
      </ToggleGroup>
      <p data-testid="grouped-last">收起回调：{last}</p>
      <div data-testid="grouped-table">
        <GroupedTable
          key={mode}
          label={byBoards ? '连板梯队（按连板数分组，示例数据）' : '连板梯队（按题材分组，示例数据）'}
          columns={STOCK_COLUMNS}
          layout={STOCK_LAYOUT}
          rows={STOCKS}
          rowId={(row) => row.id}
          groupBy={(row) => (byBoards ? (row.boards === null ? null : String(row.boards)) : row.theme)}
          groupHeading={(group) => (byBoards ? `${group.key} 连板` : `${group.key}`)}
          otherLabel="其他"
          groupMetric={(group) => (byBoards ? Number(group.key) : group.rows.reduce((sum, row) => sum + row.amount, 0))}
          groupSummary={(group) => {
            const { k, n } = countPassed(group.rows, (row) => row.promoted)
            return byBoards ? `晋级 ${k}/${n}` : `${k}/${n} 晋级`
          }}
          groupAggregates={{ amount: 'sum' }}
          summary={[{ id: 'total', label: '合计', columns: { amount: 'sum' } }]}
          sort={sort}
          onSortChange={setSort}
          onCollapsedChange={(key, collapsed) => setLast(`${key === '' ? '其他' : key} ${collapsed ? '收起' : '展开'}`)}
          fit
          maxHeight={460}
        />
      </div>
    </div>
  )
}

// —— MatrixHeat ——
const DAYS: MatrixHeatColumn[] = ['11-18', '11-19', '11-20', '11-21', '11-24', '11-25', '11-26'].map((day) => ({
  id: day,
  label: day,
}))
const LEVELS = ['首板', '2 连板', '3 连板', '4 连板及以上']
// [晋级数, 样本数]；null 是当天这个板位没有样本。
const PROMOTION: readonly (readonly (readonly [number, number] | null)[])[] = [
  [
    [18, 40],
    [22, 45],
    [9, 38],
    [26, 50],
    [14, 41],
    [20, 43],
    [16, 39],
  ],
  [
    [8, 12],
    [5, 14],
    [4, 9],
    [3, 11],
    [7, 10],
    [4, 12],
    [9, 13],
  ],
  [[2, 5], [3, 4], [0, 3], [1, 4], [2, 2], [1, 3], null],
  [[1, 2], null, [0, 2], [1, 1], [0, 1], null, [1, 1]],
]
const PROMOTION_ROWS: MatrixHeatRow[] = LEVELS.map((label, r) => ({
  id: `level${r}`,
  label,
  cells: PROMOTION[r]!.map((hit) =>
    hit === null
      ? { value: null, reason: '当天没有这个板位的样本' }
      : { value: Math.round((hit[0] / hit[1]) * 100), reason: `${hit[1]} 只里晋级 ${hit[0]} 只` },
  ),
}))
const THEME_NAMES = ['示例算力', '示例机器人', '示例低空', '示例固态电池', '示例医药']
const THEME_ROWS: MatrixHeatRow[] = THEME_NAMES.map((label, r) => ({
  id: `theme${r}`,
  label,
  cells: DAYS.map((_, c) =>
    r === 4 && c === 0
      ? { value: null, reason: '这天停牌' }
      : {
          value: Math.round((4.2 * Math.sin(r * 1.7 + c * 0.9) + (2 - r) * 0.6) * 10) / 10,
          reason: '题材成分股的平均涨幅（示例）',
        },
  ),
}))

export function MatrixHeatDemo() {
  useCnUpdown()
  const [sort, setSort] = useState<MatrixHeatSort | null>(null)
  const [picked, setPicked] = useState('还没点过格子')
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 760 }}>
      <p className="gal-note">
        示例数据：编出来的晋级率（板位 ×
        交易日），不是行情。格内写晋级率，底色是中性浓度五档；悬停或聚焦一格出值与原因；点列头把行按这一列排（降 → 升 →
        取消），点行头把列按这一行排；没有样本的格写「—」、不着色，原因在悬停窗里。
      </p>
      <p data-testid="matrix-picked">选中：{picked}</p>
      <div data-testid="matrix-heat">
        <MatrixHeat
          columns={DAYS}
          rows={PROMOTION_ROWS}
          formatValue={(value) => `${value}%`}
          sort={sort}
          onSortChange={setSort}
          onSelect={(row, column, value) => setPicked(`${row} · ${column} · ${value === null ? '—' : `${value}%`}`)}
          labels={{
            grid: '晋级率矩阵（板位 × 交易日，示例数据）',
            corner: '板位',
            value: '晋级率',
            reason: '原因',
            sortRows: (column) => `按 ${column} 给行排序`,
            sortColumns: (row) => `按「${row}」给列排序`,
            cell: (row, column, text, reason) => `${row}，${column}：${text}${reason ? `，${reason}` : ''}`,
            legend: { low: '低', high: '高' },
            none: '没有数据',
          }}
        />
      </div>
      <p className="gal-note">
        发散色阶（scale="diverging"）：题材 × 交易日的平均涨幅，正数涨色、负数跌色（红涨还是绿涨由根上的 data-updown
        定）、零不着色；下面这张根上设了 data-updown="cn"（红涨绿跌）。
      </p>
      <div data-testid="matrix-heat-diverging">
        <MatrixHeat
          scale="diverging"
          columns={DAYS}
          rows={THEME_ROWS}
          formatValue={(value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}`}
          labels={{
            grid: '题材平均涨幅矩阵（示例数据）',
            corner: '题材',
            value: '平均涨幅（%）',
            reason: '口径',
            sortRows: (column) => `按 ${column} 给行排序`,
            sortColumns: (row) => `按「${row}」给列排序`,
            cell: (row, column, text, reason) => `${row}，${column}：${text}${reason ? `，${reason}` : ''}`,
            legend: { low: '跌', high: '涨' },
          }}
        />
      </div>
    </div>
  )
}

// —— ValuationBand ——
const START = Date.UTC(2021, 10, 29)
const weekly = (count: number, value: (i: number) => number | null): ValuationPoint[] =>
  Array.from({ length: count }, (_, i) => ({
    time: new Date(START + i * 7 * 86_400_000).toISOString().slice(0, 10),
    value: value(i),
  }))
const PE = weekly(
  260,
  (i) => Math.round((12 + 3 * Math.sin(i / 23) + 1.6 * Math.sin(i / 7.5) + (i / 260) * 2.4) * 100) / 100,
)
// 市净率：中间 8 周缺值（比如数据源没给），线断开；当前点落在低分位。
const PB = weekly(260, (i) =>
  i >= 120 && i < 128
    ? null
    : Math.round((1.6 + 0.35 * Math.sin(i / 31) + 0.12 * Math.sin(i / 6) - (i / 260) * 0.45) * 1000) / 1000,
)

export function ValuationBandDemo() {
  useCnUpdown()
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 820 }}>
      <p className="gal-note">
        示例数据：260 周的编出来的市盈率，不是哪个指数的真实估值。背后的带是整段历史的 20 / 50 / 80
        分位（越高越深），右边标出各分位的估值，当前点标「估值 · P分位」；移动鼠标（或聚焦后按 ←
        →）读某一周的估值和这个值在整段历史里的分位。
      </p>
      <div data-testid="valuation-band">
        <ValuationBand
          label="示例指数市盈率（5 年周频，示例数据）"
          points={PE}
          formatValue={(value) => `${value.toFixed(1)} 倍`}
          labels={{
            empty: '暂无估值数据',
            percentile: (p) => `${p} 分位`,
            current: (value, rank) => `${value} · ${Math.round(rank)} 分位`,
            valueName: '市盈率',
            rankName: '历史分位',
            plotAria: (label, summary) => `${label}。${summary}`,
            summary: (value, rank) => `当前 ${value}，处在历史 ${Math.round(rank)} 分位`,
          }}
        />
      </div>
      <p className="gal-note">
        分位可配（这里是 10 / 50 / 90），缺值（中间 8 周没数据）断线、不当 0，也不进分位；当前点落在低分位：
      </p>
      <div data-testid="valuation-band-pb">
        <ValuationBand
          label="示例指数市净率（5 年周频，示例数据）"
          points={PB}
          percentiles={[10, 50, 90]}
          height={150}
          formatValue={(value) => `${value.toFixed(2)} 倍`}
          labels={{
            percentile: (p) => `${p} 分位`,
            current: (value, rank) => `${value} · ${Math.round(rank)} 分位`,
            valueName: '市净率',
            rankName: '历史分位',
            summary: (value, rank) => `当前 ${value}，处在历史 ${Math.round(rank)} 分位`,
          }}
        />
      </div>
    </div>
  )
}

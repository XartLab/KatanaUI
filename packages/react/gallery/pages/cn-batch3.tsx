// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { DataGrid, type GridColumn, type GridColumnLayout } from '../../src/blocks/index.ts'
import {
  AuctionBarCell,
  RangeScrubber,
  ThresholdGap,
  auctionRatio,
  formatCnAmount,
  scrubClock,
  scrubIndex,
  type ScrubPoint,
} from '../../src/cn/index.ts'

// 开盘啦对照第三批（KatanaUI #11）的文档页演示。所有数据都是示例（页上写明）：板块、股票、金额、偏离值、阈值都是编的，不是行情也不是哪个板块的规则。

// 示例的伪随机数：固定的线性同余，每次打开都一样。
function lcg(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

// 区间时间轴：每 5 分钟一根示例成交额柱，画到 10:42（「现在」）。
const NOW = '10:42'
const BAR_POINTS: readonly ScrubPoint[] = (() => {
  const next = lcg(7)
  const points: ScrubPoint[] = []
  for (let index = 0; index < 72; index += 5) {
    // 开盘头半小时量大，之后回落（示例形状）。
    const base = index < 30 ? 6e8 - index * 1.2e7 : 2.6e8
    points.push({ time: scrubClock(index), value: Math.round(base * (0.7 + next() * 0.6)) })
  }
  return points
})()

// 五个示例板块：每分钟一个示例指数与累计净流入。
type Board = { key: string; name: string; index: number[]; flow: number[] }
const BOARD_SEEDS: readonly (readonly [string, string, number, number, number])[] = [
  ['b1', '示例算力', 11, 0.004, 2.2e6],
  ['b2', '示例机器人', 23, 0.002, 1.1e6],
  ['b3', '示例银行', 37, -0.001, -6e5],
  ['b4', '示例医药', 41, 0.0005, 3e5],
  ['b5', '示例消费电子', 53, -0.002, -1.4e6],
]
const BOARDS: readonly Board[] = BOARD_SEEDS.map(([key, name, seed, drift, pull]) => {
  const next = lcg(seed)
  const index = [1000]
  const flow = [0]
  for (let minute = 1; minute <= 240; minute++) {
    index.push(index[minute - 1]! * (1 + drift / 10 + (next() - 0.5) * 0.004))
    flow.push(flow[minute - 1]! + pull + (next() - 0.5) * 4e6)
  }
  return { key, name, index, flow }
})

type Metric = 'change' | 'net' | 'strength'

function rankBoards(range: readonly [string, string], metric: Metric) {
  const from = scrubIndex(range[0]) ?? 0
  const to = scrubIndex(range[1]) ?? from
  const rows = BOARDS.map((board) => ({
    key: board.key,
    name: board.name,
    change: (board.index[to]! / board.index[from]! - 1) * 100,
    net: board.flow[to]! - board.flow[from]!,
  }))
  // 「强度」开盘啦没披露口径；演示用涨幅名次与净额名次之和（越小越强），只是示例口径。
  const order = (key: 'change' | 'net') => [...rows].sort((a, b) => b[key] - a[key]).map((row) => row.key)
  const byChange = order('change')
  const byNet = order('net')
  const strength = (key: string) => byChange.indexOf(key) + byNet.indexOf(key)
  return [...rows].sort((a, b) => (metric === 'strength' ? strength(a.key) - strength(b.key) : b[metric] - a[metric]))
}

export function RangeScrubberDemo() {
  const [range, setRange] = useState<[string, string]>(['09:30', NOW])
  const [metric, setMetric] = useState<Metric>('change')
  const ranked = rankBoards(range, metric)
  return (
    <>
      <p className="gal-note">
        示例数据：「现在」是 {NOW}，背景柱是编出来的每 5
        分钟成交额，下面五个板块的指数与净额也是编的。拖把手改起止，按住选区中间整段平移， 「近 N
        分」从现在往回数；下面的排序由演示页按选中的时段与口径现算（「强度」用涨幅名次加净额名次，只是示例口径）。
      </p>
      <div className="gal-wide" data-testid="range-scrubber" style={{ maxWidth: 820 }}>
        <RangeScrubber
          now={NOW}
          value={range}
          onValueChange={setRange}
          bars={BAR_POINTS}
          presets={[5, 15, 30, 60]}
          metrics={['change', 'net', 'strength']}
          metric={metric}
          onMetricChange={(next) => setMetric(next as Metric)}
        />
        <ol className="gal-rs-rank" data-testid="range-scrubber-rank" style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          {ranked.map((row) => (
            <li key={row.key} data-key={row.key} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {row.name} · 涨幅 {row.change >= 0 ? '+' : ''}
              {row.change.toFixed(2)}% · 净额 {formatCnAmount(row.net, { signed: true })}
            </li>
          ))}
        </ol>
      </div>
      <p className="gal-note">窄容器（480px），没给快捷钮与口径，全天：</p>
      <div className="gal-wide" data-testid="range-scrubber-narrow" style={{ maxWidth: 480 }}>
        <RangeScrubber defaultValue={['10:00', '14:00']} />
      </div>
    </>
  )
}

// 竞价量比条：示例竞价额（元），一列共用一把满刻度。
type AuctionRow = { id: string; name: string; amount: number; previous: number | null; limitBid?: number }
const AUCTION_ROWS: readonly AuctionRow[] = [
  { id: 'a1', name: '示例科技', amount: 3.12e8, previous: 9.6e7, limitBid: 1.85e8 },
  { id: 'a2', name: '示例电子', amount: 1.46e8, previous: 1.02e8 },
  { id: 'a3', name: '示例股份', amount: 6.8e7, previous: 1.2e8 },
  { id: 'a4', name: '示例新材', amount: 2.2e8, previous: null, limitBid: 9e7 },
]
const AUCTION_MAX = Math.max(...AUCTION_ROWS.flatMap((row) => [row.amount, row.previous ?? 0, row.limitBid ?? 0]))
const AUCTION_COLUMNS: readonly GridColumn<AuctionRow>[] = [
  { id: 'name', type: 'text', value: (row) => row.name },
  { id: 'amount', type: 'cnAmount', value: (row) => row.amount },
  {
    id: 'ratio',
    type: 'custom',
    text: (row) => auctionRatio(row.amount, row.previous)?.toFixed(2) ?? '—',
    sort: (row) => auctionRatio(row.amount, row.previous) ?? undefined,
    cell: (row) => (
      <AuctionBarCell amount={row.amount} previous={row.previous} limitBid={row.limitBid} max={AUCTION_MAX} />
    ),
  },
]
const AUCTION_LAYOUT: readonly GridColumnLayout[] = [
  { id: 'name', label: '名称', width: 110, visible: true },
  { id: 'amount', label: '竞价额', width: 90, visible: true },
  { id: 'ratio', label: '竞价量比', width: 200, visible: true },
]

export function AuctionBarCellDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：竞价额、昨日同期与涨停委买都是编的。放在 DataGrid 的 custom
        列里，一列共用一把满刻度（四行里最大的金额）， 实心段过了竖刻度就是比昨日同期多；按量比排序用 auctionRatio。
      </p>
      <div className="gal-wide" data-testid="auction-bar-grid" style={{ maxWidth: 460 }}>
        <DataGrid
          columns={AUCTION_COLUMNS}
          layout={AUCTION_LAYOUT}
          rows={AUCTION_ROWS}
          rowId={(row) => row.id}
          label="示例竞价量比"
          sort={null}
          onSortChange={() => {}}
          interactive={false}
        />
      </div>
      <p className="gal-note">单独一格：09:22 还在虚拟匹配，写「未出结果」：</p>
      <div className="gal-wide" data-testid="auction-bar-pending" style={{ maxWidth: 220 }}>
        <AuctionBarCell amount={1.1e8} previous={8e7} time="09:22" />
      </div>
    </>
  )
}

export function ThresholdGapDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：阈值 20%、预警线 16% 与各票的偏离值都是编的，不是哪个板块的规则（规则由调用方传）。四档各一行。
      </p>
      <div className="gal-wide" data-testid="threshold-gap" style={{ maxWidth: 420, display: 'grid', gap: 14 }}>
        <ThresholdGap label="示例科技" value={12.35} threshold={20} warnAt={16} period="3 日累计偏离" />
        <ThresholdGap label="示例电子" value={19.96} threshold={20} warnAt={16} period="3 日累计偏离" />
        <ThresholdGap label="示例股份" value={-21.2} threshold={20} warnAt={16} period="3 日累计偏离" />
        <ThresholdGap label="示例新材" value={24.6} threshold={20} ended period="3 日累计偏离" note="监管期至 示例日" />
      </div>
    </>
  )
}

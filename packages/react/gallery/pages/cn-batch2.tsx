// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button } from '../../src/index.ts'
import { DataGrid, type GridColumn, type GridColumnLayout } from '../../src/blocks/index.ts'
import {
  cnLabelsZh,
  AuctionStep,
  FlowRace,
  MiniKCardGrid,
  MoveFeed,
  SeatTable,
  TradingDatePicker,
  type AuctionPoint,
  type Candle,
  type FlowSeries,
  type MiniKItem,
  type MoveFeedLabels,
  type MoveItem,
  type Seat,
} from '../../src/cn/index.ts'
import { Row } from './parts.tsx'

// A 股件包第 2 批（#110）的文档页演示。所有数据都是示例（页上写明）：席位、股票、价格、金额都是编的，不是行情。

// 龙虎榜席位：买入侧与卖出侧各 6 个席位（多一个，看「只留前五」），次序故意打乱。
const SEATS_BUY: readonly Seat[] = [
  { name: '示例证券 · 示例路营业部', tag: '示例游资甲', buy: 1.268e8, sell: 2.3e6 },
  { name: '机构专用', tag: '机构', buy: 9.52e7, sell: 0 },
  { name: '示例证券 · 示例大道营业部', tag: '示例游资乙', buy: 8.1e7, sell: 3.04e7 },
  { name: '示例证券 · 示例街营业部', buy: 6.4e7, sell: null },
  { name: '沪股通专用', tag: '北向', buy: 5.5e7, sell: 4.2e7 },
  { name: '示例证券 · 示例园区营业部', tag: '示例游资丙', buy: 2.9e7, sell: 6e6 },
]
const SEATS_SELL: readonly Seat[] = [
  { name: '示例证券 · 示例广场营业部', buy: 1.2e6, sell: 7.7e7 },
  { name: '机构专用', tag: '机构', buy: 0, sell: 1.082e8 },
  { name: '示例证券 · 示例东路营业部', tag: '示例游资丁', buy: 3e6, sell: 9.1e7 },
  { name: '示例证券 · 示例西路营业部', buy: 2.5e7, sell: 6.3e7 },
  { name: '示例证券 · 示例南街营业部', buy: null, sell: 5.2e7 },
  { name: '示例证券 · 示例北街营业部', tag: '示例游资戊', buy: 8e6, sell: 3.9e7 },
]

export function SeatTableDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：席位名与金额都是编的。每侧按金额取前五，净额正涨负跌；取不到的格写「—」，不写 0。
      </p>
      <div className="gal-wide" data-testid="seat-table" style={{ maxWidth: 900 }}>
        <SeatTable buy={[...SEATS_BUY].reverse()} sell={SEATS_SELL} />
      </div>
      <p className="gal-note">窄容器（480px）上下排：</p>
      <div className="gal-wide" data-testid="seat-table-narrow" style={{ maxWidth: 480 }}>
        <SeatTable buy={SEATS_BUY} sell={SEATS_SELL} limit={3} />
      </div>
    </>
  )
}

// 竞价台阶：示例价格，昨收 10.00。
export const AUCTION_POINTS: readonly AuctionPoint[] = [
  { time: '09:15', price: 10.0, volume: 120 },
  { time: '09:16:30', price: 10.08, volume: 900 },
  { time: '09:17:40', price: 10.15, volume: 2100 },
  { time: '09:19', price: 10.12, volume: 3400 },
  { time: '09:20', price: 10.22, volume: 5200 },
  { time: '09:21:10', price: 10.3, volume: 7800 },
  { time: '09:22:30', price: 10.36, volume: 9100 },
  { time: '09:23:50', price: 10.4, volume: 11200 },
  { time: '09:25', price: 10.45, volume: 12600 },
]
const AUCTION_FALL: readonly AuctionPoint[] = [
  { time: '09:15', price: 10.0, volume: 80 },
  { time: '09:17', price: 9.94, volume: 600 },
  { time: '09:19:30', price: 9.9, volume: 1500 },
  { time: '09:21', price: 9.82, volume: 3300 },
  { time: '09:23', price: 9.76, volume: 4100 },
  { time: '09:25', price: 9.7, volume: 4600 },
]

type AuctionRow = { id: string; name: string; auction: { points: readonly AuctionPoint[]; prevClose: number } }
const AUCTION_ROWS: readonly AuctionRow[] = [
  { id: 'a1', name: '示例甲', auction: { points: AUCTION_POINTS, prevClose: 10 } },
  { id: 'a2', name: '示例乙', auction: { points: AUCTION_FALL, prevClose: 10 } },
  { id: 'a3', name: '示例丙', auction: { points: [], prevClose: 10 } },
]
const AUCTION_COLUMNS: readonly GridColumn<AuctionRow>[] = [
  { id: 'name', type: 'text', value: (row) => row.name },
  { id: 'auction', type: 'auctionStep', value: (row) => row.auction },
]
const AUCTION_LAYOUT: readonly GridColumnLayout[] = [
  { id: 'name', label: '名称', width: 110, visible: true },
  { id: 'auction', label: '竞价台阶', width: 150, visible: true },
]

export function AuctionStepDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：09:15–09:25 的撮合价画成台阶（价格在两个时刻之间不变），台阶下是匹配量柱；09:20 起不可撤单画一条分界；
        昨收给了就画参考线并按涨跌着色。
      </p>
      <Row>
        <div className="gal-wide" data-testid="auction-up" style={{ maxWidth: 360 }}>
          <AuctionStep points={AUCTION_POINTS} prevClose={10} />
        </div>
        <div className="gal-wide" data-testid="auction-down" style={{ maxWidth: 360 }}>
          <AuctionStep points={AUCTION_FALL} prevClose={10} />
        </div>
        <div className="gal-wide" data-testid="auction-noref" style={{ maxWidth: 360 }}>
          <AuctionStep points={AUCTION_POINTS} />
        </div>
        <div className="gal-wide" data-testid="auction-empty" style={{ maxWidth: 360 }}>
          <AuctionStep points={[]} />
        </div>
      </Row>
      <p className="gal-note">DataGrid 的列类型 auctionStep（迷你台阶，可按相对昨收的涨跌幅排序）：</p>
      <div data-testid="auction-grid" style={{ display: 'flex', width: '100%', maxWidth: 300, height: 130 }}>
        <DataGrid
          columns={AUCTION_COLUMNS}
          layout={AUCTION_LAYOUT}
          rows={AUCTION_ROWS}
          rowId={(row) => row.id}
          label="Example auction table"
          sort={null}
          onSortChange={() => {}}
          interactive={false}
          fit
        />
      </div>
    </>
  )
}

// 交易日历（示例）：周末休市，另加 10 月 1 日到 8 日休市；不是真实的交易所日历。
const CLOSED_EXAMPLE = new Set(['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'])
const exampleCalendar = (date: string) => {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  return weekday !== 0 && weekday !== 6 && !CLOSED_EXAMPLE.has(date)
}

export function TradingDatePickerDemo() {
  const [date, setDate] = useState<string | null>('2026-11-20')
  return (
    <>
      <p className="gal-note">
        示例日历：周末与 10 月 1–8 日休市（编的，不是交易所日历）。休市的日子灰着点不了；两侧按钮跳到上一个 /
        下一个交易日； 能选的范围是 2026-01-05 到 2026-11-27。
      </p>
      <Row>
        <TradingDatePicker
          value={date}
          onValueChange={setDate}
          calendar={exampleCalendar}
          min="2026-01-05"
          max="2026-11-27"
        />
        <span data-testid="trading-date-picked">已选：{date ?? '—'}</span>
      </Row>
    </>
  )
}

// 资金多线图：示例序列，每 10 分钟一个点（午休不画），用固定的三角函数造起伏，不是行情。
const FLOW_TIMES: readonly string[] = (() => {
  const times: string[] = []
  for (let minute = 9 * 60 + 30; minute <= 11 * 60 + 30; minute += 10) times.push(clock(minute))
  for (let minute = 13 * 60 + 10; minute <= 15 * 60; minute += 10) times.push(clock(minute))
  return times
})()
function clock(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}
const flowSeries = (key: string, name: string, scale: number, phase: number, drift: number): FlowSeries => ({
  key,
  name,
  points: FLOW_TIMES.map((time, index) => ({
    time,
    value: Math.round(scale * (Math.sin(index / 4 + phase) * 0.6 + (drift * index) / FLOW_TIMES.length)) * 1e6,
  })),
})
export const FLOW_SERIES: readonly FlowSeries[] = [
  flowSeries('s1', '示例算力', 380, 0.4, 1.4),
  flowSeries('s2', '示例机器人', 300, 1.2, 1.0),
  flowSeries('s3', '示例消费电子', 240, 2.2, 0.2),
  flowSeries('s4', '示例银行', 200, 0.2, -0.4),
  flowSeries('s5', '示例医药', 260, 3.1, -1.0),
  flowSeries('s6', '示例新能源', 320, 4.2, -1.6),
]

export function FlowRaceDemo() {
  return (
    <>
      <p className="gal-note">
        示例数据：六个编出来的板块，每 10 分钟一个累计净流入点。横轴 09:30–15:00，午休不占宽度（中间的虚线是
        11:30/13:00）；右端按最新值从大到小排名，标签自动错开；悬停一行，对应的线加粗。
      </p>
      <div className="gal-wide" data-testid="flow-race" style={{ maxWidth: 820 }}>
        <FlowRace series={FLOW_SERIES} />
      </div>
      <p className="gal-note">窄容器（480px）：</p>
      <div className="gal-wide" data-testid="flow-race-narrow" style={{ maxWidth: 480 }}>
        <FlowRace series={FLOW_SERIES} />
      </div>
    </>
  )
}

// 选股卡片：示例蜡烛，用固定的线性同余造，不是行情。
function makeCandles(seed: number, count: number, start: number, trend: number): Candle[] {
  let state = seed
  const next = () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
  const candles: Candle[] = []
  let price = start
  for (let i = 0; i < count; i++) {
    const open = price
    const close = Math.max(1, open * (1 + (next() - 0.5) * 0.05 + trend))
    const high = Math.max(open, close) * (1 + next() * 0.015)
    const low = Math.min(open, close) * (1 - next() * 0.015)
    candles.push({ open, high, low, close })
    price = close
  }
  return candles
}
const MINI_K_ITEMS: readonly MiniKItem[] = [
  { code: '600101', name: '示例甲', candles: makeCandles(11, 30, 12, 0.006) },
  { code: '600102', name: '示例乙', candles: makeCandles(23, 30, 20, -0.004) },
  { code: '000103', name: '示例丙', candles: makeCandles(37, 30, 8, 0.003) },
  { code: '000104', name: '示例丁', candles: makeCandles(41, 30, 31, 0.008) },
  { code: '300105', name: '示例戊', candles: makeCandles(59, 30, 15, -0.008) },
  { code: '300106', name: '示例己', candles: makeCandles(61, 30, 42, 0.001) },
  { code: '688107', name: '示例庚', candles: makeCandles(73, 30, 55, 0.005) },
  { code: '688108', name: '示例辛', candles: [] },
]

export function MiniKCardGridDemo() {
  const [columns, setColumns] = useState<2 | 3 | 4>(4)
  const [picked, setPicked] = useState<string | null>(null)
  return (
    <>
      <p className="gal-note">示例数据：蜡烛是编的。一行 2 / 3 / 4 只；点卡片联动；没有蜡烛的卡写「暂无 K 线」。</p>
      <Row name="每行">
        {([2, 3, 4] as const).map((n) => (
          <Button
            key={n}
            size="sm"
            variant={columns === n ? 'primary' : 'ghost'}
            aria-pressed={columns === n}
            data-testid={`mini-k-cols-${n}`}
            onClick={() => setColumns(n)}
          >
            {n} 只
          </Button>
        ))}
        <span data-testid="mini-k-picked">选中：{picked ?? '—'}</span>
      </Row>
      <div className="gal-wide" data-testid="mini-k-grid" style={{ maxWidth: 760 }}>
        <MiniKCardGrid
          items={MINI_K_ITEMS}
          columns={columns}
          onSelect={(item) => setPicked(`${item.code} ${item.name}`)}
        />
      </div>
    </>
  )
}

// 异动时间流：示例条目，名称、时刻、数值都是编的。
const MOVES: readonly MoveItem[] = [
  { id: 'm1', time: '09:31:05', name: '示例甲', code: '600101', type: 'rocket', value: 3.2 },
  { id: 'm2', time: '09:33:40', name: '示例乙', code: '000102', type: 'bigBuy', value: 2.35e7, unit: 'amount' },
  { id: 'm3', time: '09:36:12', name: '示例丙', code: '300103', type: 'sealUp', value: 20.01 },
  { id: 'm4', time: '09:41:50', name: '示例丁', code: '600104', type: 'dive', value: -4.6 },
  { id: 'm5', time: '09:45:03', name: '示例戊', code: '000105', type: 'bigSell', value: 1.82e7, unit: 'amount' },
  { id: 'm6', time: '09:52:27', name: '示例己', code: '688106', type: 'rebound', value: 2.4 },
  { id: 'm7', time: '10:03:19', name: '示例庚', code: '600107', type: 'openUp', value: 9.12 },
  { id: 'm8', time: '10:08:44', name: '示例辛', code: '000108', type: 'plunge', value: -3.1 },
  { id: 'm9', time: '10:15:30', name: '示例壬', code: '300109', type: 'rocket', value: 4.8 },
  { id: 'm10', time: '10:21:08', name: '示例癸', code: '600110', type: 'sealDown', value: -10.0 },
]
const PUSHED: readonly Omit<MoveItem, 'id' | 'time'>[] = [
  { name: '示例新甲', code: '600201', type: 'rocket', value: 3.9 },
  { name: '示例新乙', code: '000202', type: 'bigBuy', value: 3.1e7, unit: 'amount' },
  { name: '示例新丙', code: '300203', type: 'dive', value: -5.2 },
]

// 加密例子（#245，照 OKX「市场异动」）：币对、时间与涨跌幅都是编的。
const COIN_MOVES: readonly MoveItem[] = [
  { id: 'k1', time: '10:00:05', name: 'BTC-USDT', symbol: 'BTC-USDT-SWAP', type: 'rise5m', value: 1.24 },
  { id: 'k2', time: '10:01:12', name: 'ETH-USDT', symbol: 'ETH-USDT-SWAP', type: 'fall5m', value: -2.38 },
  { id: 'k3', time: '10:02:40', name: 'SOL-USDT', symbol: 'SOL-USDT-SWAP', type: 'rise5m', value: 3.05 },
  { id: 'k4', time: '10:04:21', name: 'BTC-USDT', symbol: 'BTC-USDT-SWAP', type: 'fall5m', value: -1.06 },
  { id: 'k5', time: '10:06:03', name: 'DOGE-USDT', symbol: 'DOGE-USDT-SWAP', type: 'rise5m', value: 4.7 },
  { id: 'k6', time: '10:07:48', name: 'BTC-USDT', symbol: 'BTC-USDT-SWAP', type: 'rise15m', value: 2.11 },
  { id: 'k7', time: '10:09:30', name: 'ETH-USDT', symbol: 'ETH-USDT-SWAP', type: 'rise5m', value: 1.87 },
]
const COIN_TYPES = [{ key: 'rise15m', label: '15 分钟涨幅', tone: 'up' as const }]
const COIN_LABELS: MoveFeedLabels = {
  ...cnLabelsZh.moveFeed,
  region: '市场异动',
  types: { ...cnLabelsZh.moveFeed.types, rise15m: '15 分钟涨幅' },
  onlyCurrent: '当前币对',
}

export function MoveFeedDemo() {
  const [symbol, setSymbol] = useState('BTC-USDT-SWAP')
  const [items, setItems] = useState<readonly MoveItem[]>(MOVES)
  const [picked, setPicked] = useState<string | null>(null)
  const push = () =>
    setItems((current) => {
      const base = PUSHED[current.length % PUSHED.length]!
      const minute = 10 * 60 + 22 + (current.length - MOVES.length)
      return [...current, { ...base, id: `n${current.length}`, time: `${clock(minute)}:15` }]
    })
  return (
    <>
      <p className="gal-note">
        示例数据：条目都是编的。一行一条（时间 · 名称 · 类型胶囊 · 数值），新的从顶上进；类型按涨 / 跌 / 量 / 板着色，
        可多选筛；点行联动。
      </p>
      <Row>
        <Button size="sm" data-testid="move-push" onClick={push}>
          推一条示例异动
        </Button>
        <span data-testid="move-picked">联动：{picked ?? '—'}</span>
      </Row>
      <div className="gal-wide" data-testid="move-feed" style={{ maxWidth: 560 }}>
        <MoveFeed
          items={items}
          selectedId={items.find((item) => `${item.code} ${item.name}` === picked)?.id ?? null}
          onSelect={(item) => setPicked(`${item.code} ${item.name}`)}
        />
      </div>
      <p className="gal-note">
        加密市场（照 OKX「市场异动」）：条目的 symbol 写币对，传 currentSymbol 就多一个「只看当前品种」勾选； 类型文字走
        labels.types（5 分钟涨幅 / 跌幅随包，15 分钟涨幅用 types 自定）。下面切换「当前品种」，勾选的筛选对象跟着换。
      </p>
      <Row>
        {['BTC-USDT-SWAP', 'ETH-USDT-SWAP'].map((id) => (
          <Button
            key={id}
            size="sm"
            variant={symbol === id ? 'primary' : 'default'}
            aria-pressed={symbol === id}
            onClick={() => setSymbol(id)}
          >
            {id}
          </Button>
        ))}
      </Row>
      <div className="gal-wide" data-testid="move-feed-crypto" style={{ maxWidth: 560 }}>
        <MoveFeed items={COIN_MOVES} types={COIN_TYPES} currentSymbol={symbol} labels={COIN_LABELS} />
      </div>
    </>
  )
}

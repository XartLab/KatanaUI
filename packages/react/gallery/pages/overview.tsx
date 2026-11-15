// SPDX-License-Identifier: MIT
import { useEffect, useState } from 'react'
import {
  KeyStats,
  PeerCards,
  PerformanceStrip,
  Watchlist,
  type PeerItem,
  type WatchlistRow,
} from '../../src/quant/index.ts'
import { CompareBar, RangeBar } from '../../src/index'
import { Row } from './parts'

// #53：对齐 TradingView 品种页（主会话 2026-11-15 实测）的一组件的演示。品种、公司与数字全是虚构的演示数据，不是行情，也不放真实公司标志（徽标是字母圆）。

const SAMPLE = '演示数据，不是行情'

const PERF = [
  { key: '1d', label: '1 day', change: 0.62 },
  { key: '5d', label: '5 days', change: -1.4 },
  { key: '1m', label: '1 month', change: 3.18 },
  { key: '3m', label: '3 months', change: 11.4 },
  { key: '6m', label: '6 months', change: -4.07 },
  { key: 'ytd', label: 'Year to date', change: 19.83 },
  { key: '1y', label: '1 year', change: 27.5 },
  { key: '5y', label: '5 years', change: 312.9 },
  { key: '10y', label: '10 years', change: 1840.2 },
  { key: 'all', label: 'All time', change: 142600 },
]

export function PerformanceStripDemo() {
  const [picked, setPicked] = useState('1y')
  return (
    <>
      <Row name="十个周期">
        <div className="gal-wide" data-gallery-perf style={{ maxWidth: 760 }}>
          <PerformanceStrip items={PERF} label="Performance" value={picked} onValueChange={setPicked} />
          <output data-gallery-picked>区间：{picked}</output>
        </div>
      </Row>
      <p className="gal-note">{SAMPLE}。点一格选中（灰底）并回调；涨跌幅过千写成 K%、M%。</p>
    </>
  )
}

const PEERS: readonly PeerItem[] = [
  ['AAA', 'Alpha Devices Incorporated', '212.40', 0.84],
  ['BRV', 'Bravo Semiconductor Holdings', '1,044.10', -2.31],
  ['CHL', 'Charlie Software', '418.77', 1.12],
  ['DLT', 'Delta Cloud Systems Ltd', '96.05', -0.2],
  ['ECH', 'Echo Networks', '57.90', 4.5],
  ['FXT', 'Foxtrot Instruments', '301.12', 0],
  ['GLF', 'Golf Platforms', '128.66', -1.05],
].map(([code, name, price, change]) => ({
  key: String(code),
  code: String(code),
  name: String(name),
  price: String(price),
  unit: 'USD',
  change: Number(change),
}))

export function PeerCardsDemo() {
  const [log, setLog] = useState('')
  return (
    <>
      <Row name="同业卡">
        <div className="gal-wide" data-gallery-peers style={{ maxWidth: 560 }}>
          <PeerCards
            items={PEERS}
            labels={{
              list: 'Peers',
              prev: 'Previous',
              next: 'Next',
              compare: 'Select to compare',
              add: (item) => `Add ${item.code} to compare`,
            }}
            onSelect={(item) => setLog(`open ${item.code}`)}
            onAdd={(item) => setLog(`add ${item.code}`)}
            onCompare={() => setLog('compare')}
          />
        </div>
        <output data-gallery-picked>{log}</output>
      </Row>
      <p className="gal-note">{SAMPLE}。徽标是字母圆；名称过长截断；箭头翻页，到头变灰。</p>
    </>
  )
}

export function KeyStatsDemo() {
  const [log, setLog] = useState('')
  return (
    <>
      <Row name="三列">
        <div className="gal-wide" data-gallery-keystats style={{ maxWidth: 560 }}>
          <KeyStats
            title="Key stats"
            onTitle={() => setLog('title')}
            onItem={(item) => setLog(item.key)}
            items={[
              { key: 'cap', label: 'Market cap', value: '3.41T', unit: 'USD', badge: 'Mega cap' },
              { key: 'pe', label: 'Price to earnings (P/E TTM)', value: '31.20' },
              { key: 'eps', label: 'Basic EPS (TTM)', value: '6.57', unit: 'USD' },
              { key: 'rev', label: 'Revenue (FY)', value: '391.04B', unit: 'USD' },
              { key: 'div', label: 'Dividend yield (indicated)', value: '0.44', unit: '%' },
              { key: 'beta', label: 'Beta (1Y)', value: '—' },
            ]}
          />
        </div>
        <output data-gallery-picked>{log}</output>
      </Row>
      <p className="gal-note">{SAMPLE}。徽标是中性灰胶囊；没有值写「—」。</p>
    </>
  )
}

export function RangeBarTvDemo() {
  const [last, setLast] = useState(212.4)
  return (
    <>
      <Row name="三角标（TradingView 右栏）">
        <div className="gal-wide" data-gallery-range="tv" style={{ maxWidth: 320 }}>
          <RangeBar
            title="Day's range"
            marker="triangle"
            low={209.1}
            high={214.8}
            value={last}
            label="Day's range"
            format={(v) => v.toFixed(2)}
          />
          <br />
          <RangeBar
            title="52wk range"
            marker="triangle"
            low={164.08}
            high={260.1}
            value={last}
            label="52wk range"
            format={(v) => v.toFixed(2)}
          />
        </div>
        <div className="gal-actions">
          <button type="button" data-gallery-range-set="low" onClick={() => setLast(209.1)}>
            最低
          </button>
          <button type="button" data-gallery-range-set="high" onClick={() => setLast(214.8)}>
            最高
          </button>
        </div>
      </Row>
      <Row name="成交量比较条">
        <div className="gal-wide" data-gallery-compare style={{ maxWidth: 320 }}>
          <CompareBar
            a={{ label: 'Volume', value: 59.2e6, text: '59.2M' }}
            b={{ label: 'Avg. volume (30D)', value: 74.6e6, text: '74.6M' }}
            label="Volume versus 30-day average"
          />
        </div>
      </Row>
      <p className="gal-note">{SAMPLE}。三角标指现价所在位置；比较条两条同比例尺，只用中性灰。</p>
    </>
  )
}

const WATCH: readonly WatchlistRow[] = [
  { key: 'a', code: 'AAA', name: 'Alpha Devices', last: 212.4, change: 1.77, changePct: 0.84, flagged: true },
  { key: 'b', code: 'BRV', name: 'Bravo Semi', last: 1044.1, change: -24.7, changePct: -2.31 },
  { key: 'c', code: 'CHL', name: 'Charlie Software', last: 418.77, change: 4.64, changePct: 1.12 },
  { key: 'd', code: 'DLT', name: 'Delta Cloud', last: 96.05, change: -0.19, changePct: -0.2 },
  { key: 'e', code: 'ECH', name: 'Echo Networks', last: 57.9, change: 2.5, changePct: 4.5 },
]

export function WatchlistDemo() {
  const [rows, setRows] = useState(WATCH)
  const [live, setLive] = useState(false)
  useEffect(() => {
    if (!live) return
    const id = window.setInterval(() => {
      setRows((prev) =>
        prev.map((r, i) => {
          const step = ((Date.now() / 1000 + i) % 2 < 1 ? 1 : -1) * 0.07
          return { ...r, last: +(r.last + step).toFixed(2), change: +(r.change + step).toFixed(2) }
        }),
      )
    }, 1500)
    return () => window.clearInterval(id)
  }, [live])
  return (
    <>
      <Row name="自选列表">
        <div className="gal-wide" data-gallery-watch style={{ maxWidth: 440 }}>
          <Watchlist
            rows={rows}
            labels={{
              columns: { symbol: 'Symbol', last: 'Last', chg: 'Chg', chgPct: 'Chg%' },
              list: 'Watchlist',
              empty: 'No symbols',
              flag: (row) => `Flag ${row.code}`,
            }}
            onFlag={(row, flagged) => setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, flagged } : r)))}
          />
        </div>
        <div className="gal-actions">
          <button
            type="button"
            data-gallery-tick
            onClick={() => setRows((prev) => prev.map((r, i) => (i === 0 ? { ...r, last: 212.46, change: 1.83 } : r)))}
          >
            AAA 涨到 212.46
          </button>
          <button
            type="button"
            data-gallery-tick-down
            onClick={() => setRows((prev) => prev.map((r, i) => (i === 1 ? { ...r, last: 1043.9, change: -24.9 } : r)))}
          >
            BRV 跌到 1043.90
          </button>
          <button type="button" onClick={() => setLive((v) => !v)}>
            {live ? '停止跳动' : '开始跳动'}
          </button>
        </div>
      </Row>
      <p className="gal-note">
        {SAMPLE}。点列头：升序、降序、回原顺序；价格变动时只有变了的尾数闪涨跌色，约 1 秒落回。
      </p>
    </>
  )
}

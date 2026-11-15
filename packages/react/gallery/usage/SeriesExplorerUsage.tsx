// SPDX-License-Identifier: MIT
import { SeriesExplorer, type SeriesPoint } from '../../src/blocks'

export function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 随机游走：从 start 起 count 个点，每步 ±step 内。 */

export function walk(seed: number, count: number, start = 100, step = 2): number[] {
  const next = seeded(seed)
  const out = [start]
  for (let i = 1; i < count; i++) out.push(+(out[i - 1]! + (next() - 0.5) * 2 * step).toFixed(2))
  return out
}

const SX_MONTHS = 24

const SX_OPENING = 50_000

const sxPoints = (deposit: number): SeriesPoint[] => {
  let equity = SX_OPENING
  return Array.from({ length: SX_MONTHS }, (_, m) => {
    const closed = m === 9
    const realized = closed ? 0 : Math.round(2400 * Math.sin(m / 2.5) + 400 + 60 * m)
    const fee = closed ? 0 : -(120 + 10 * (m % 5))
    const funding = closed ? 0 : m % 3 === 0 ? -60 : 45
    const net = realized + fee + funding
    equity += net + (m === 18 ? deposit : 0)
    return { at: Date.UTC(2025, m, 1), closed, values: { realized, fee, funding, net, equity } }
  })
}

const SX_POINTS = sxPoints(0)

const SX_POINTS_UNRECORDED = sxPoints(500)

const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toLocaleString('en-US')}`

const monthText = (at: number) => new Date(at).toISOString().slice(0, 7)

const SX_PROPS = {
  series: [
    { key: 'realized', label: '已实现', kind: 'bar' },
    { key: 'fee', label: '费税', kind: 'bar', cost: true },
    { key: 'funding', label: '资金费', kind: 'bar' },
    { key: 'net', label: '净盈亏', kind: 'line' },
  ],
  ranges: [
    { key: '3m', label: '3M', months: 3 },
    { key: '6m', label: '6M', months: 6 },
    { key: '12m', label: '12M', months: 12 },
    { key: 'all', label: '全部', months: null },
  ],
  kpis: [
    { key: 'net', label: '净盈亏', series: 'net', reduce: 'sum', format: signed, limit: -1500 },
    { key: 'realized', label: '已实现', series: 'realized', reduce: 'sum', format: signed },
    { key: 'fee', label: '费税', series: 'fee', reduce: 'sum', format: signed, lowerIsBetter: true },
  ],
  columns: [
    {
      key: 'realized',
      label: '已实现',
      text: (p: SeriesPoint) => signed(p.values.realized!),
      tone: (p: SeriesPoint) => p.values.realized ?? null,
    },
    { key: 'fee', label: '费税', text: (p: SeriesPoint) => signed(p.values.fee!) },
    {
      key: 'funding',
      label: '资金费',
      text: (p: SeriesPoint) => signed(p.values.funding!),
      tone: (p: SeriesPoint) => p.values.funding ?? null,
    },
    {
      key: 'net',
      label: '净盈亏',
      text: (p: SeriesPoint) => signed(p.values.net!),
      tone: (p: SeriesPoint) => p.values.net ?? null,
    },
  ],
  labels: {
    chart: 'P&L EXPLORER',
    ranges: '区间',
    metrics: '指标',
    compare: '对比上一期',
    previous: '上一期',
    table: '示例盈亏明细',
    time: '月份',
    empty: '没有数据',
    spark: (metric: string) => `${metric}走势（演示）`,
    limit: '月亏损限额',
    source: 'SOURCE / 演示数据（固定种子合成）· 2026-12 收盘',
    actions: { group: '图工具', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' },
    brush: { start: '窗口起点', end: '窗口终点', window: '窗口位置' },
    reconcile: { open: '期初', close: '期末', diff: '差额', ok: '对账一致', warn: '对账有差', unit: 'CNY' },
  },
  meta: '盈亏探索（演示）· RUN 2C91 · 2025-01 → 2026-12 · CNY',
  events: [
    { at: Date.UTC(2025, 5, 1), label: '费率上调' },
    { at: Date.UTC(2026, 1, 1), label: '换仓' },
    { at: Date.UTC(2026, 7, 1), label: '限额调整' },
  ],
  formatAt: monthText,
  formatValue: (v: number) => v.toLocaleString('en-US'),
  formatChange: (r: number) => `${r > 0 ? '+' : ''}${(r * 100).toFixed(1)}%`,
  reconcile: {
    net: 'net',
    equity: 'equity',
    openingEquity: SX_OPENING,
    format: (v: number) => v.toLocaleString('en-US'),
  },
} as const

export function SeriesExplorerUsage() {
  return (
    <>
      <div className="gal-wide" data-gallery-explorer="ok" style={{ maxWidth: 760 }}>
        <SeriesExplorer {...SX_PROPS} points={SX_POINTS} onExport={() => {}} />
      </div>
      <div className="gal-wide" data-gallery-explorer="mismatch" style={{ maxWidth: 760 }}>
        <SeriesExplorer {...SX_PROPS} points={SX_POINTS_UNRECORDED} defaultMetric={null} />
      </div>
    </>
  )
}

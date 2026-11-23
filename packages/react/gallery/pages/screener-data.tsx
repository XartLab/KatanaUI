// SPDX-License-Identifier: MIT
// 选股器演示的数据与列（#90）：16 只虚构的股票（代码、名称、数字全是编出来的，不是行情），徽标是自绘的灰色几何示意图，不是真实标志。
// 选股器页（filter-bar、column-set-tabs）、DataGrid 页的 comfortable 整页表与组件截图 data-grid-comfortable 共用这一份。
import type { ColumnSet, GridColumn, GridColumnLayout } from '../../src/blocks/index.ts'
import type { RatingLevel } from '../../src/quant/index.ts'
import { makeRng } from '../live-sim.ts'

export type Stock = {
  code: string
  name: string
  price: number
  change: number
  mcap: number
  pe: number
  sector: string
  yield: number
  rating: RatingLevel
  volume: number
  rvol: number
  low52: number
  high52: number
  earnings: number
  spark: readonly number[]
  logo: string | undefined
}

// 自绘的示意徽标：深灰圆底上一个浅灰几何形（方、三角、环、菱、条），只为让演示有图片徽标；颜色只在演示图里写死，组件不读。
const SHAPES = [
  '<rect x="10" y="10" width="12" height="12" rx="2"/>',
  '<path d="M16 9l8 14H8z"/>',
  '<circle cx="16" cy="16" r="7" fill="none" stroke="#d4d4d4" stroke-width="3"/>',
  '<path d="M16 8l8 8-8 8-8-8z"/>',
  '<path d="M9 11h14v3H9zM9 18h14v3H9z"/>',
]
const logo = (index: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#2f2f2f"/><g fill="#d4d4d4">${SHAPES[index % SHAPES.length]}</g></svg>`,
  )}`

type Seed = Omit<Stock, 'spark' | 'low52' | 'high52' | 'earnings' | 'logo'>
const SEEDS: readonly Seed[] = [
  {
    code: 'ALFA',
    name: '示例阿尔法科技',
    price: 356.27,
    change: 1.82,
    mcap: 5.18e12,
    pe: 34.1,
    sector: '科技',
    yield: 0.6,
    rating: 'strong-buy',
    volume: 4.28e7,
    rvol: 1.12,
  },
  {
    code: 'BETA',
    name: '示例贝塔零售',
    price: 142.5,
    change: -0.74,
    mcap: 3.4e11,
    pe: 21.4,
    sector: '消费',
    yield: 1.9,
    rating: 'buy',
    volume: 1.25e7,
    rvol: 0.84,
  },
  {
    code: 'GAMA',
    name: '示例伽马半导体',
    price: 612.9,
    change: 3.15,
    mcap: 1.1e12,
    pe: 48.7,
    sector: '科技',
    yield: 0.2,
    rating: 'strong-buy',
    volume: 3.06e7,
    rvol: 2.41,
  },
  {
    code: 'DELT',
    name: '示例德尔塔能源',
    price: 48.6,
    change: -1.2,
    mcap: 8.8e10,
    pe: 9.3,
    sector: '能源',
    yield: 4.8,
    rating: 'sell',
    volume: 8.9e6,
    rvol: 0.95,
  },
  {
    code: 'EPSI',
    name: '示例艾普西隆汽车',
    price: 17.35,
    change: 0.4,
    mcap: 5.6e10,
    pe: 12.8,
    sector: '工业',
    yield: 2.7,
    rating: 'neutral',
    volume: 2.2e7,
    rvol: 1.3,
  },
  {
    code: 'ZETA',
    name: '示例泽塔矿业',
    price: 9.12,
    change: -2.6,
    mcap: 1.9e10,
    pe: 7.1,
    sector: '材料',
    yield: 5.9,
    rating: 'strong-sell',
    volume: 5.4e6,
    rvol: 1.77,
  },
  {
    code: 'ETAX',
    name: '示例伊塔生物',
    price: 74.0,
    change: 0.0,
    mcap: 2.4e10,
    pe: 0,
    sector: '医疗',
    yield: 0,
    rating: 'neutral',
    volume: 9.1e5,
    rvol: 0.42,
  },
  {
    code: 'THET',
    name: '示例西塔金融',
    price: 211.8,
    change: 0.95,
    mcap: 4.6e11,
    pe: 14.2,
    sector: '金融',
    yield: 3.1,
    rating: 'buy',
    volume: 6.6e6,
    rvol: 0.73,
  },
  {
    code: 'IOTA',
    name: '示例约塔软件',
    price: 128.44,
    change: 2.37,
    mcap: 2.7e11,
    pe: 41.9,
    sector: '科技',
    yield: 0,
    rating: 'buy',
    volume: 1.9e7,
    rvol: 1.58,
  },
  {
    code: 'KAPA',
    name: '示例卡帕电信',
    price: 33.1,
    change: -0.31,
    mcap: 1.4e11,
    pe: 16.4,
    sector: '通信',
    yield: 5.2,
    rating: 'neutral',
    volume: 1.1e7,
    rvol: 0.66,
  },
  {
    code: 'LAMB',
    name: '示例兰姆达医药',
    price: 402.15,
    change: -1.86,
    mcap: 6.1e11,
    pe: 27.3,
    sector: '医疗',
    yield: 1.4,
    rating: 'buy',
    volume: 3.8e6,
    rvol: 1.21,
  },
  {
    code: 'MUXX',
    name: '示例缪克斯物流',
    price: 86.7,
    change: 0.58,
    mcap: 4.3e10,
    pe: 18.9,
    sector: '工业',
    yield: 2.1,
    rating: 'neutral',
    volume: 2.6e6,
    rvol: 0.88,
  },
  {
    code: 'NUXX',
    name: '示例纽克斯电力',
    price: 61.25,
    change: 1.04,
    mcap: 9.7e10,
    pe: 19.6,
    sector: '公用事业',
    yield: 3.6,
    rating: 'buy',
    volume: 4.4e6,
    rvol: 1.05,
  },
  {
    code: 'XIXX',
    name: '示例克西食品',
    price: 54.8,
    change: -0.12,
    mcap: 7.2e10,
    pe: 22.7,
    sector: '消费',
    yield: 2.4,
    rating: 'neutral',
    volume: 3.1e6,
    rvol: 0.57,
  },
  {
    code: 'OMIC',
    name: '示例奥密克地产',
    price: 22.4,
    change: -3.42,
    mcap: 1.2e10,
    pe: 0,
    sector: '地产',
    yield: 6.3,
    rating: 'strong-sell',
    volume: 1.5e7,
    rvol: 2.86,
  },
  {
    code: 'PIXX',
    name: '示例派克斯游戏',
    price: 188.6,
    change: 4.71,
    mcap: 2.1e11,
    pe: 52.4,
    sector: '通信',
    yield: 0,
    rating: 'strong-buy',
    volume: 2.3e7,
    rvol: 3.4,
  },
]

/** 30 个点的走势：固定种子随机游走，方向大致跟当日涨跌一致，最后整体缩放到终点等于现价（不在末端跳一下）。 */
function walk(seed: number, price: number, drift: number): number[] {
  const rng = makeRng(seed)
  const raw: number[] = []
  let value = 1
  for (let i = 0; i < 30; i += 1) {
    raw.push(value)
    value *= 1 + (rng() - 0.5) * 0.03 + drift * 0.002
  }
  const scale = price / raw.at(-1)!
  return raw.map((point) => Number((point * scale).toFixed(2)))
}

export const STOCKS: readonly Stock[] = SEEDS.map((seed, index) => {
  const rng = makeRng(90 + index)
  return {
    ...seed,
    // 一半行用图片徽标，一半用字母圆标（SymbolMark 没有图时的样子）。
    logo: index % 2 === 0 ? logo(index) : undefined,
    low52: Number((seed.price * (0.55 + rng() * 0.3)).toFixed(2)),
    high52: Number((seed.price * (1.05 + rng() * 0.35)).toFixed(2)),
    earnings: Date.UTC(2026, 10, 20 + ((index * 5) % 40)),
    spark: walk(900 + index, seed.price, Math.sign(seed.change)),
  }
})

const RATING_TEXT: Record<RatingLevel, string> = {
  'strong-sell': '强力卖出',
  sell: '卖出',
  neutral: '中性',
  buy: '买入',
  'strong-buy': '强力买入',
}

export const STOCK_COLUMNS: readonly GridColumn<Stock>[] = [
  {
    id: 'symbol',
    type: 'symbol',
    value: (row) => ({ code: row.code, name: row.name, icon: { src: row.logo } }),
    format: { symbolParts: ['logo', 'chip', 'name'] },
  },
  { id: 'price', type: 'price', value: (row) => row.price, format: { tick: 0.01, unit: 'USD' } },
  { id: 'change', type: 'change', value: (row) => row.change },
  { id: 'volume', type: 'compact', value: (row) => row.volume },
  {
    id: 'rvol',
    type: 'bar',
    value: (row) => row.rvol,
    format: { barMax: 3 },
  },
  { id: 'mcap', type: 'compact', value: (row) => row.mcap, format: { unit: 'USD' } },
  { id: 'pe', type: 'number', value: (row) => row.pe || null, format: { digits: 1 } },
  { id: 'yield', type: 'percent', value: (row) => row.yield || null },
  { id: 'rating', type: 'rating', value: (row) => row.rating, format: { ratingLabels: RATING_TEXT } },
  { id: 'sector', type: 'pill', value: (row) => row.sector },
  {
    id: 'trend',
    type: 'spark',
    value: (row) => row.spark,
    format: (row) => ({ label: `${row.code} 30 日走势（演示）` }),
  },
  {
    id: 'range',
    type: 'range',
    value: (row) => ({ low: row.low52, high: row.high52, value: row.price }),
    format: (row) => ({ label: `${row.code} 52 周区间` }),
  },
  { id: 'earnings', type: 'date', value: (row) => row.earnings },
]

export const STOCK_LAYOUT: readonly GridColumnLayout[] = [
  { id: 'symbol', label: '代码', width: 240, visible: true, fixed: true },
  { id: 'price', label: '价格', width: 120, visible: true },
  { id: 'change', label: '涨跌幅', width: 90, visible: true },
  { id: 'volume', label: '成交量', width: 100, visible: true },
  { id: 'rvol', label: '相对成交量', width: 130, visible: true },
  { id: 'mcap', label: '市值', width: 120, visible: true },
  { id: 'pe', label: '市盈率', sub: 'TTM', width: 90, visible: true },
  { id: 'yield', label: '股息率', sub: 'TTM', width: 90, visible: false },
  { id: 'rating', label: '分析师评级', width: 130, visible: true },
  { id: 'sector', label: '板块', width: 100, visible: true },
  { id: 'trend', label: '走势', sub: '30 日', width: 120, visible: false },
  { id: 'range', label: '52 周区间', width: 200, visible: false },
  { id: 'earnings', label: '下次财报', width: 110, visible: false },
]

export const STOCK_SETS: readonly ColumnSet[] = [
  {
    id: 'overview',
    label: '概览',
    columns: ['symbol', 'price', 'change', 'volume', 'rvol', 'mcap', 'pe', 'rating', 'sector'],
  },
  { id: 'trend', label: '走势', columns: ['symbol', 'price', 'change', 'trend', 'range', 'rvol'] },
  { id: 'valuation', label: '估值', columns: ['symbol', 'price', 'pe', 'mcap'] },
  { id: 'dividends', label: '分红', columns: ['symbol', 'price', 'yield', 'earnings', 'sector'] },
]

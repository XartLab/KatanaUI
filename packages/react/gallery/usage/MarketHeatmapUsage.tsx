// SPDX-License-Identifier: MIT
import { useEffect, useMemo, useState } from 'react'
import { PanelFrame, PanelFrameBody, PanelFrameHeader } from '../../src/blocks'
import {
  MarketHeatmap,
  type HeatmapColorBy,
  type HeatmapItem,
  type HeatmapScheme,
  type HeatmapSizeBy,
  type MarketHeatmapLabels,
} from '../../src/quant'
import { ToggleGroup, ToggleGroupItem } from '../../src/index'

const SAMPLE_MARK_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#2a2a2a"/></svg>',
)}`

function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

const HEAT_INDUSTRIES: [string, string][] = [
  ['半导体', '芯'],
  ['白酒', '酿'],
  ['银行', '银'],
  ['新能源', '能'],
  ['医药', '药'],
  ['券商', '券'],
  ['军工', '工'],
  ['软件', '软'],
]

const HEAT_ORDINALS = '甲乙丙丁戊己庚辛'

function makeStocks(): HeatmapItem[] {
  const rand = seeded(15)
  const out: HeatmapItem[] = []
  let n = 0
  HEAT_INDUSTRIES.forEach(([industry, mark], g) => {
    const count = g < 4 ? 8 : 7
    const tilt = (rand() - 0.5) * 3
    for (let i = 0; i < count; i += 1) {
      n += 1
      const cap = 1.2e10 * Math.exp(rand() * 3.6) * (g === 2 ? 3 : 1)
      const day = tilt + (rand() + rand() + rand() - 1.5) * 4
      out.push({
        code: String(600000 + n * 7).padStart(6, '0'),
        name: `示例${mark}${HEAT_ORDINALS[i]}`,
        group: industry,
        price: 4 + rand() * 180,
        size: { cap, turnover: cap * (0.004 + rand() * 0.03) },
        value: { day: Number(day.toFixed(2)), week: Number((day * 1.4 + (rand() - 0.5) * 6).toFixed(2)) },
      })
    }
  })
  return out
}

const CRYPTO_NAMES = [
  'ALFA',
  'BRAV',
  'CHAR',
  'DELT',
  'ECHO',
  'FOXT',
  'GOLF',
  'HOTL',
  'INDI',
  'JULI',
  'KILO',
  'LIMA',
  'MIKE',
  'NOVE',
  'OSCA',
  'PAPA',
  'QUEB',
  'ROME',
  'SIER',
  'TANG',
  'UNIF',
  'VICT',
  'WHIS',
  'XRAY',
  'YANK',
  'ZULU',
  'ARBO',
  'BOLT',
  'CEDA',
  'DUNE',
]

function makeCoins(): HeatmapItem[] {
  const rand = seeded(30)
  return CRYPTO_NAMES.map((code, i) => {
    const cap = 6e11 * Math.exp(-i * 0.28) * (0.7 + rand() * 0.6)
    const day = (rand() + rand() + rand() - 1.5) * 7
    return {
      code,
      name: `示例币 ${String(i + 1).padStart(2, '0')}`,
      price: 0.02 + rand() * 4000,
      size: { cap, turnover: cap * (0.02 + rand() * 0.12) },
      value: { day: Number(day.toFixed(2)), week: Number((day * 1.6 + (rand() - 0.5) * 12).toFixed(2)) },
    }
  })
}

// 示意图标：每个行业里市值最大的那只（共 4 只）传自绘的 SVG，演示「有图」的样子；其余是字母圆标。不是任何真实公司的标志。

function withSampleLogos(items: HeatmapItem[]): HeatmapItem[] {
  const top = new Map<string, HeatmapItem>()
  for (const item of items) {
    const old = top.get(item.group ?? '')
    if (!old || item.size.cap! > old.size.cap!) top.set(item.group ?? '', item)
  }
  const picked = new Set([...top.values()].sort((a, b) => b.size.cap! - a.size.cap!).slice(0, 4))
  return items.map((item) => (picked.has(item) ? { ...item, logo: SAMPLE_MARK_SRC } : item))
}

const STOCKS = withSampleLogos(makeStocks())

const COINS = makeCoins()

const HEAT_SIZE: HeatmapSizeBy[] = [
  { key: 'cap', label: '市值' },
  { key: 'turnover', label: '成交额' },
  { key: 'equal', label: '等大', equal: true },
]
// 涨跌幅固定一档 1%（±3%，TradingView 的做法）；周表现不给档宽，按这批值自动取。

const HEAT_COLOR: HeatmapColorBy[] = [
  { key: 'day', label: '涨跌幅', unit: '%', step: 1 },
  { key: 'week', label: '周表现', unit: '%' },
]

const HEAT_LABELS: MarketHeatmapLabels = {
  sizeBy: '大小',
  colorBy: '颜色',
  view: '视图',
  grouped: '分组',
  flat: '平铺',
  all: '全部',
  other: '其他',
  price: '价格',
  group: '行业',
  summary: { count: '只数', up: '上涨', down: '下跌' },
  segment: (range) => `隐藏或显示 ${range} 的格子`,
  list: '市场热力图',
  empty: '没有数据',
}

export function MarketHeatmapUsage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [scheme, setScheme] = useState<HeatmapScheme>('classic')
  const [market, setMarket] = useState('stocks')
  const [wide, setWide] = useState(false)
  const [live, setLive] = useState(false)
  const [tick, setTick] = useState(0)
  // 模拟更新：每 1.5 秒让一部分格子的涨跌幅挪一点（演示颜色过渡与翻方向的边框闪烁）；演示数据，不是行情。
  useEffect(() => {
    if (!live) return
    const timer = setInterval(() => setTick((n) => n + 1), 1500)
    return () => clearInterval(timer)
  }, [live])
  const stocks = useMemo(() => {
    if (tick === 0) return STOCKS
    const rand = seeded(1000 + tick)
    return STOCKS.map((item) =>
      rand() < 0.3
        ? { ...item, value: { ...item.value, day: Number((item.value.day! + (rand() - 0.5) * 3).toFixed(2)) } }
        : item,
    )
  }, [tick])
  const coins = market === 'coins'
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: wide ? undefined : 760 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <ToggleGroup size="sm" aria-label="数据" value={market} onValueChange={setMarket}>
          <ToggleGroupItem value="stocks">分行业的股票</ToggleGroupItem>
          <ToggleGroupItem value="coins">不分组的加密</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup size="sm" aria-label="配色" value={scheme} onValueChange={(v) => setScheme(v as HeatmapScheme)}>
          <ToggleGroupItem value="classic">经典</ToggleGroupItem>
          <ToggleGroupItem value="mono">单色</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          size="sm"
          aria-label="屏幕"
          value={wide ? 'wide' : 'small'}
          onValueChange={(v) => setWide(v === 'wide')}
        >
          <ToggleGroupItem value="small">小屏</ToggleGroupItem>
          <ToggleGroupItem value="wide">大屏 1920×1080</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          size="sm"
          aria-label="更新"
          value={live ? 'live' : 'still'}
          onValueChange={(v) => setLive(v === 'live')}
        >
          <ToggleGroupItem value="still">静止</ToggleGroupItem>
          <ToggleGroupItem value="live">模拟更新</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div style={{ overflow: 'auto' }}>
        <div style={{ height: wide ? 1080 : 620, width: wide ? 1920 : undefined }}>
          <PanelFrame focused aria-label={coins ? '加密热力图' : '股票热力图'}>
            <PanelFrameHeader heading={coins ? '加密热力图' : '股票热力图'} object="演示数据" />
            <PanelFrameBody>
              <MarketHeatmap
                key={`${market}-${wide}`}
                items={coins ? COINS : stocks}
                sizeBy={HEAT_SIZE}
                colorBy={HEAT_COLOR}
                labels={{ ...HEAT_LABELS, group: '行业' }}
                scheme={scheme}
                selected={selected}
                onSelect={setSelected}
              />
            </PanelFrameBody>
          </PanelFrame>
        </div>
      </div>
    </div>
  )
}

// 技术评级仪表（#20）的演示：读数与结论从合成价格算出来，不是行情；分数与个数在这里按「买 − 卖」除以总数现算，真实调用方自己算。

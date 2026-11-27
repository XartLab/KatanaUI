# MarketHeatmap

照 TradingView 的股票热力图：格子面积是所选的大小指标（市值、成交额或等大），颜色是所选指标落在七档色阶的哪一档，按行业分组或平铺。顶上一行汇总读数（只数、上涨、下跌），工具条用分段控件切大小、颜色、视图；点组名放大到只看这一组（面包屑返回，Esc 也行）；悬停出这只票的价格与各项读数；底部图例写出每一档的值边界，点一档就隐藏这一档的格子。A 股、港股、美股、加密共用，只换数据与分组；不认数据集，品种、指标、文字都由调用方传。排布与着色档用包里矩形树图的 layoutTreemap、colorStep。

## Provide

`*` marks a required prop.

### MarketHeatmap

放在 PanelFrame 里用，件自己撑满容器的高度（排布按真实像素算，随容器改变重排）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `HeatmapItem[]` | — | { symbol, name, group?, logo?, price?, size: Record<键, number>, value: Record<键, number \| null> }（旧名 code 留一个版本，@deprecated）。size 里不是正数的格子不画；value 是 null 画成灰（没有数）；没有 group 的品种归到 labels.other，所有品种都没有 group 就不分组、也不出视图切换。 |
| `sizeBy` | `HeatmapSizeBy[]` | — | 大小指标：{ key, label, equal?, format? }。key 对 item.size 的键；equal 为真是等大，不读 size；format 不给用 formatVolume。 |
| `colorBy` | `HeatmapColorBy[]` | — | 着色指标：{ key, label, unit?, digits?, format?, step? }。key 对 item.value 的键。step 是一档的宽（指标的单位），不给就按这批值的最大绝对值除以 3 再向上取到好数，载入与切指标时重算；写 1 就是 ±3%。 |
| `labels` | `MarketHeatmapLabels` | — | 工具条、面包屑、汇总读数、悬停卡片、图例读屏名、空态的文字，由调用方传。 |
| `defaultSizeBy / defaultColorBy` | `string` | — | 一开始用哪个大小、着色指标；默认各自的第一个。 |
| `defaultGrouped` | `boolean` | `true` | 一开始分不分组（有分组数据时）。 |
| `scheme` | `'classic' \| 'mono'` | `'classic'` | 配色。classic 涨跌色（跟 data-updown 互换）加中性灰；mono 同一灰阶从暗到亮。色盲友好第二步做。 |
| `formatPrice` | `(value: number) => string` | — | 悬停卡片上的价格写法；不给写 2 位小数。 |
| `selected` | `string \| null` | — | 选中的代码；选中的格子画 2px 白色内圈。 |
| `onSelect` | `(symbol: string) => void` | — | 点格子，或焦点在格子上按 Enter / Space。 |
| `cellActions` | `(item: HeatmapItem) => RowAction[]` | — | 格子的右键菜单（#23，一般传 symbolMenu(...)）：右键、菜单键、Shift+F10 出同一份品种菜单。格子小，不画悬停按钮。读屏名取 labels.cellMenu（可选）。不传就没有。 |
| `labels.display` | `HeatmapDisplayLabels` | — | 给了，工具条多三个显示开关（照 TradingView 热图，主会话 2026-11-15 实测）：Logo 开关、标题（无 / 代码 / 全名）、格内数值（无 / 价格 / 当前大小指标的值 / 着色指标的读数）。不给格子照旧。 |
| `labels.fullscreen` | `string` | — | 给了，工具条最右出全屏钮（容器 requestFullscreen），字是读屏名与提示。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useEffect, useMemo, useState } from 'react'
import { PanelFrame, PanelFrameBody, PanelFrameHeader } from '@katana-ui/react/blocks'
import {
  MarketHeatmap,
  type HeatmapColorBy,
  type HeatmapItem,
  type HeatmapScheme,
  type HeatmapSizeBy,
  type MarketHeatmapLabels,
} from '@katana-ui/react/quant'
import { ToggleGroup, ToggleGroupItem } from '@katana-ui/react'

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
        symbol: String(600000 + n * 7).padStart(6, '0'),
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
      symbol: code,
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
```

## States

- 色阶七档（−3…+3）：档 0 是以零为中心的中性灰，边界在 (k ± 0.5) × 档宽；最外两档一头开口。
- 格子够大才写字：宽 ≥ 40、高 ≥ 24 写代码，高 ≥ 40 再写一行读数；更小的靠悬停。字色按底色亮度现算黑白。
- 图例点一档：这一档的格子隐藏（位置保留，不重排），色块变淡、边界值划线；再点恢复。切着色指标时全部恢复。
- 放大：只剩这一组，大小与颜色设置保留；面包屑的「全部」或 Esc 返回。

## Don't

- 不要在件里写死中文、币种或数据集字段；指标、单位、文字都由调用方传。
- 没有数据时传空数组，件画空态，不要放样本格子。
- 不要用橙色表示数据；这件里没有橙色。

## Composition

```
MarketHeatmap（figure）
  汇总读数（只数 | 上涨 | 下跌）+ 面包屑
  工具条（大小 | 颜色 | 视图，分段控件）
  图（group）
    组块（组名按钮）
      格子（button：代码 + 读数）
    悬停卡片（徽标 + 代码 + 名称；价格、各着色指标、大小指标、分组）
  图例（七个按钮：色块 + 档中心值）
```

## Keyboard

- `Tab`：在组之间走（每组一个停靠点，组名按钮也是）
- `← → ↑ ↓`：在组内的格子间走，焦点所在格子出悬停卡片
- `Enter / Space`：选中当前格子
- `Esc`：放大状态下返回全部

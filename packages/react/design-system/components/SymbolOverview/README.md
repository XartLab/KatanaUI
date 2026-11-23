# SymbolOverview

对 TradingView 的 Symbol Overview 小组件（KatanaUI #147）：上面一排品种页签（代码、名称、最新价、涨跌幅），中间一张走势，底下一排区间按钮（1D、1M、3M、1Y、5Y、All，字由调用方给）。price 口径只画选中的那只（面积或折线）；percent 口径（它的 scaleMode Percentage）把所有品种按相对各自起点的涨跌幅叠在一张图上比，选中的那条加粗，页签上的色块兼作图例。悬停或键盘走出 LCD 读数，列出这一刻每只的值。换区间只回调，数据由调用方按区间换。

## Provide

`*` marks a required prop.

### SymbolOverview

items 是 { id, symbol, name?, last, changePct, values, times }：values 与 times 一一对应，横轴按时刻摆，几只品种的时刻可以不同。页签是 Radix Tabs，区间是 ToggleGroup。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly SymbolOverviewItem[]` | — | The symbols, in tab order. |
| `value` | `string` | — | Selected symbol id (controlled). |
| `defaultValue` | `string` | — | Selected symbol id at first render when uncontrolled; the first item by default. |
| `onValueChange` | `(id: string) => void` | — | Called with the id of the newly selected symbol. |
| `ranges` | `readonly SymbolOverviewRange[]` | — | Range buttons under the chart; none are drawn when omitted. |
| `range` | `string` | — | Selected range id (controlled). |
| `defaultRange` | `string` | — | Selected range id at first render when uncontrolled; the first range by default. |
| `onRangeChange` | `(id: string) => void` | — | Called with the newly selected range id; the caller loads that period's values. |
| `scale` | `'price' \| 'percent'` | `'price'` | Price draws only the selected symbol; percent overlays every symbol as the change from its own first value. |
| `chartType` | `'area' \| 'line'` | `'area'` | Area (line with a faint fill below) or plain line; area by default. |
| `formatPrice` | `FormatPrice` | `plainPrice` | Writes a price as text (tabs, axis and readout in price scale). |
| `formatTime` * | `(time: number) => string` | — | Writes a timestamp for the readout title and the time axis. |
| `chartHeight` | `number` | `200` | Height of the plot in pixels, 200 by default. |
| `labels` * | `SymbolOverviewLabels` | — | Texts for screen readers and the empty state, written by the caller (required). |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { SymbolOverview } from '@katana-ui/react/quotes'

const DAY = 86_400_000
const times = [0, 1, 2, 3, 4, 5].map((index) => Date.UTC(2026, 0, 5) + index * DAY)

export function SymbolOverviewUsage() {
  const [range, setRange] = useState('1m')
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <SymbolOverview
        items={[
          {
            id: 'a',
            symbol: 'AAA',
            last: 104.2,
            changePct: 4.2,
            values: [100, 101.5, 101, 102.8, 103.9, 104.2],
            times,
          },
          { id: 'b', symbol: 'BBB', last: 48.6, changePct: -2.8, values: [50, 49.8, 49.1, 49.4, 48.9, 48.6], times },
        ]}
        scale="percent"
        ranges={[
          { id: '1d', label: '1D' },
          { id: '1m', label: '1M' },
          { id: '12m', label: '1Y' },
        ]}
        range={range}
        onRangeChange={setRange}
        formatTime={(time) => new Date(time).toISOString().slice(5, 10)}
        labels={{ tabs: 'Symbols', ranges: 'Date range', chart: 'Comparison chart', empty: 'No data' }}
      />
    </div>
  )
}
```

## States

- price：选中那只一条 2px 线，chartType=area 时线下一层很淡的同色渐变；末端一个实心点。
- percent：每只一条线（颜色按 items 的次序取 series-*，切页签不换色），选中的 2px、其余 1.25px 淡显；纵轴是百分数，跨过 0 时画零线。
- 悬停或聚焦后按方向键：竖线 + LCD 读数（时刻、每只的值）；离开或失焦清掉。
- 选中那只有效值少于两个：走势的位置写 labels.empty。
- 区间：选中的按钮灰底（aria-pressed），不用蓝色。

## Don't

- 不要指望件按区间切数据：onRangeChange 回调后由调用方换 values 与 times。
- 不要在 price 口径叠几只不同价位的品种：比涨跌用 percent。
- 品种多于七只时第八只起都是「其他」色，看不清：拆成几张卡。

## Composition

```
SymbolOverview（Tabs）
  TabsList（TabsTrigger × n：色块 · 代码 · 名称 · 价 · ChangeText）
  TabsContent
    div[role=slider]（svg：网格 · 零线 · 面积 · 线 × n；纵轴刻度 · 末点 · 十字线 · LcdTooltip）
    div（横轴刻度）
  ToggleGroup（区间）
```

## Keyboard

- `← / →（页签上）`：换到前一只 / 后一只品种（Radix Tabs）
- `← / →（图上）`：走到前一个 / 后一个点，出读数
- `Shift + ← / →`：一次走三个点
- `Home / End`：走到第一个 / 最后一个点
- `Esc`：清掉读数
- `Tab / Enter`：到区间按钮、选中

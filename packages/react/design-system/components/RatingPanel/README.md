# RatingPanel

摆动指标、汇总、均线三个评级仪表并排（每个就是一个 RatingGauge，分界与指针照 rating-gauge-model），汇总居中放大；上方是调用方给的周期切换（如 1m、5m、15m、1h、4h、1D、1W、1M），每个仪表下写卖出 / 中性 / 买入的个数；悬停或 Tab 到一个仪表，名字那一行换成读数（带正负号两位小数的分数与档位词）。版式照 TradingView 品种页 Technicals 顶部的三个仪表，只取布局与交互；颜色走 Graphite 涨跌色与中性灰，不用 TradingView 蓝。只画不算：分数、个数、档位名都由调用方传。要明细表与枢轴点用 TechnicalRating。

## Provide

`*` marks a required prop.

### RatingPanel

gauges 从左到右，通常三个；primary 指定放大哪一个（默认中间）；timeframes / value / onValueChange 是受控的周期切换，不给 timeframes 就没有这一条；footer 放调用方写的一句（如免责）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `gauges` * | `readonly RatingPanelGauge[]` | — | The gauges from left to right, usually three: oscillators, summary and moving averages. |
| `labels` * | `RatingPanelLabels` | — | Zone names, count words and accessible names; the package has no built-in language. |
| `primary` | `string` | — | Key of the gauge drawn larger; the middle one when omitted. |
| `timeframes` | `readonly RatingPanelTimeframe[]` | — | Timeframe choices of the switch above the gauges; no switch when omitted or empty. |
| `value` | `string` | — | Selected timeframe value (controlled); the first one when omitted. |
| `onValueChange` | `(value: string) => void` | — | Called with the timeframe value when the switch changes. |
| `formatScore` | `(score: number) => string` | — | How the hover readout writes a score; defaults to a signed number with two decimals ("+0.32"). |
| `footer` | `ReactNode` | — | Extra content under the gauges, for example a one-line disclaimer written by the caller. |
| `className` | `string` | — | Extra class name on the root. |

### RatingPanelGauge

一个仪表：{ key, label, score（−1 到 +1）, counts: { sell, neutral, buy } }。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `key` * | `string` | — | Stable key of the gauge (DOM data-gauge), for example "oscillators", "summary" or "ma". |
| `label` * | `string` | — | Name above the gauge, for example "Oscillators"; also the accessible name. |
| `score` * | `number` | — | From -1 (strong sell) to +1 (strong buy); clamped, a non-finite number counts as 0 and reads as a dash. |
| `counts` * | `Readonly<Record<RatingPanelVerdict, number>>` | — | How many indicators say sell, neutral and buy. |

### RatingPanelLabels

五档名（从卖到买）、卖出 / 中性 / 买入三个字、整件与周期切换的读屏名；包里不带语言。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `zones` * | `readonly [string, string, string, string, string]` | — | Names of the five zones from sell to buy (strong sell, sell, neutral, buy, strong buy). |
| `verdict` * | `Readonly<Record<RatingPanelVerdict, string>>` | — | Words for the three counts under each gauge. |
| `panel` * | `string` | — | Accessible name of the whole panel, for example "Technical rating". |
| `timeframe` * | `string` | — | Accessible name of the timeframe switch, for example "Timeframe". |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RatingPanel, type RatingPanelLabels } from '@katana-ui/react/quotes'

const LABELS: RatingPanelLabels = {
  zones: ['Strong sell', 'Sell', 'Neutral', 'Buy', 'Strong buy'],
  verdict: { sell: 'Sell', neutral: 'Neutral', buy: 'Buy' },
  panel: 'Technical rating',
  timeframe: 'Timeframe',
}

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D', '1W', '1M'].map((value) => ({ value, label: value }))

// Demo counts, not market data.
const GAUGES = [
  { key: 'oscillators', label: 'Oscillators', score: 0.45, counts: { sell: 1, neutral: 4, buy: 6 } },
  { key: 'summary', label: 'Summary', score: 0.65, counts: { sell: 2, neutral: 5, buy: 19 } },
  { key: 'ma', label: 'Moving averages', score: 0.8, counts: { sell: 1, neutral: 1, buy: 13 } },
]

export function RatingPanelUsage() {
  const [timeframe, setTimeframe] = useState('1D')
  return (
    <RatingPanel
      gauges={GAUGES}
      labels={LABELS}
      timeframes={TIMEFRAMES}
      value={timeframe}
      onValueChange={setTimeframe}
    />
  )
}
```

## States

- 默认：三个仪表底边对齐，汇总那个宽 1.35 倍、档位词用标题字号，两侧用数据字号。
- 悬停或键盘聚焦一个仪表：底色提亮一档（--k-container-tertiary-background），名字那一行换成读数胶囊，按 snappy 弹簧（333ms）淡入；聚焦时另画 2px 焦点环。
- 档位偏卖（前两档）档位词与读数走跌色，偏买（后两档）走涨色，中性不上色；卖出个数走跌色、买入个数走涨色。
- 分数越界夹到 ±1；不是有限数按中性画，读数写「—」。
- 容器窄于 320px：汇总独占一行，另两个并排在下。

## Don't

- 不要在包里算评级：分数与个数由调用方算好传来。
- 不要只靠读数传达结论：档位词与个数一直在，读数只补分数。
- 要指标明细表、枢轴点用 technical-rating，不要在这件旁边自己拼。

## Composition

```
RatingPanel role=group
  ToggleGroup（周期，可选）
  div role=meter tabindex=0 × 3
    span（名字）
    RatingGauge（五段弧 · 指针 · 档位词 · 卖出 / 中性 / 买入个数）
    span（读数，aria-hidden）
  div（footer，可选）
```

## Keyboard

- `Tab`：走过周期切换与三个仪表；聚焦的仪表出读数
- `← / →`：在周期之间移动焦点，Enter / 空格选中

# SeasonalChart

对 TradingView 的 Seasonal Chart 小组件（KatanaUI #147；它的页面写「把各年的价格表现叠在一起的多年季节性图」）：横轴 1 月 1 日到 12 月 31 日，纵轴是相对各年第一个价的涨跌幅，几年叠在一张图上看某段时间是不是年年涨或年年跌。最新的一年（或 highlight）2px，其余淡显；上面一排年份开关（aria-pressed）隐去 / 显出一年，至少留一年；悬停或键盘走出 LCD 读数，列出这一天各年的涨跌幅。数据先用 seasonalSeries 按年切好再传，件不取数据。

## Provide

`*` marks a required prop.

### SeasonalChart

years 是 { year, points: { day, pct }[] }（day 是一年里的第几天，0 是 1 月 1 日）；月份的字在 labels.months（12 个）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `years` * | `readonly SeasonalYear[]` | — | Years to overlay, each with its points by day of year (build them with seasonalSeries). |
| `highlight` | `number` | — | Year drawn bold; the latest year by default. |
| `defaultHidden` | `readonly number[]` | `[]` | Years hidden at first render (uncontrolled); the legend toggles them. |
| `height` | `number` | `220` | Height of the plot in pixels, 220 by default. |
| `digits` | `number` | `2` | Number of decimals of the percentages in the readout, 2 by default. |
| `labels` * | `SeasonalChartLabels` | — | Texts for screen readers, month names and the empty state, written by the caller (required). |
| `source` | `string` | — | Small line under the chart (source, how the change is measured), written by the caller. |
| `className` | `string` | — | Extra class name on the root. |

### seasonalSeries(points, offsetMs)

points 是从旧到新的 { time, value }；按 UTC 加 offsetMs（交易所时区，东八区给 8 × 3600000）切年；同一天取最后一个；一年的第一个价是 0 时不要这一年。口径是相对这一年第一个价，TradingView 用年初开盘还是上年收盘待核对。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { SeasonalChart, seasonalSeries } from '@katana-ui/react/quant'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
// 每年三个价：年初、年中、年底（示例数据）。
const years = seasonalSeries(
  [2024, 2025].flatMap((year, index) => [
    { time: Date.UTC(year, 0, 2), value: 100 },
    { time: Date.UTC(year, 5, 28), value: 104 - index * 6 },
    { time: Date.UTC(year, 11, 30), value: 108 + index * 3 },
  ]),
)

export function SeasonalChartUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <SeasonalChart years={years} labels={{ chart: 'Seasonals', legend: 'Years', months: MONTHS, empty: 'No data' }} />
    </div>
  )
}
```

## States

- 默认：每年一条线，颜色按年份次序取 series-*，关掉一年不让其余换色；月初画淡虚线，跨过 0 画零线。
- 关掉的年：开关淡显、色块变空心，线不画；最后一条线不让关。
- 悬停或聚焦后按方向键：竖线 + 读数（「月 日」与每年的涨跌幅）；今年还没走到的日子不列今年。
- 没有至少两个点的年：画 labels.empty。

## Don't

- 不要把不同口径的数（价格、收益率）混进同一张图：先换成同一口径再切年。
- 年份多于七个时第八个起都是「其他」色：只留最近几年。

## Composition

```
SeasonalChart figure
  div[role=group]（button[aria-pressed] × 年：色块 · 年份）
  div[role=slider]（svg：网格 · 月初虚线 · 零线 · 线 × 年；纵轴刻度 · 十字线 · LcdTooltip）
  div（月份刻度）
  figcaption（来源）
```

## Keyboard

- `← / →（图上）`：前一天 / 后一天，出读数
- `Shift + ← / →`：一次走三天
- `Home / End`：到 1 月 1 日 / 12 月 31 日
- `Esc`：清掉读数
- `Tab / Enter / Space`：到年份开关、切换

# SeasonalChart

对 TradingView 的 Seasonal Chart 小组件（KatanaUI #147；它的页面写「把各年的价格表现叠在一起的多年季节性图」）：横轴是 366 格日历（1 月 1 日到 12 月 31 日，同一个日期每年同一格），纵轴是相对年初基准（上一年最后一个收盘价）的涨跌幅，几年叠在一张图上看某段时间是不是年年涨或年年跌。最新的一年（或 highlight）2px，其余淡显；上面一排年份开关（aria-pressed，各带这一年的涨跌幅）隐去 / 显出一年，至少留一年，可受控（hidden / onHiddenChange）；悬停或键盘走出 LCD 读数，列出这一天各年的涨跌幅；给了 actionLabels 右上有表格视图。数据先用 seasonalSeries 按年切好再传，件不取数据。

## Provide

`*` marks a required prop.

### SeasonalChart

years 是 { year, points: { day, pct }[] }（day 是 366 格日历的格：0 是 1 月 1 日，59 是 2 月 29 日，60 是 3 月 1 日）；月份的字在 labels.months（12 个）。hidden / onHiddenChange 受控图例，不给是内部状态（defaultHidden）；actionLabels（加 tableLabel、labels.month、onExport、onFullscreen）给了才画右上的图操作。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `years` * | `readonly SeasonalYear[]` | — | Years to overlay, each with its points by calendar slot (build them with seasonalSeries). |
| `highlight` | `number` | — | Year drawn bold; the latest year by default. |
| `defaultHidden` | `readonly number[]` | `[]` | Years hidden at first render (uncontrolled); the legend toggles them. |
| `hidden` | `readonly number[]` | — | Years hidden (controlled): with it the caller owns the legend state and defaultHidden is ignored. |
| `onHiddenChange` | `(hidden: number[]) => void` | — | Called with the new list of hidden years when a legend toggle is pressed; the last visible year cannot be hidden. |
| `height` | `number` | `220` | Height of the plot in pixels, 220 by default. |
| `digits` | `number` | `2` | Number of decimals of the percentages in the readout, legend and table, 2 by default. |
| `labels` * | `SeasonalChartLabels` | — | Texts for screen readers, month names and the empty state, written by the caller (required). |
| `actionLabels` | `ChartActionsLabels` | — | Names of the chart actions at the top right (table view, export, fullscreen); no actions when omitted. |
| `tableLabel` | `string` | — | Accessible name of the table view (one row per month, one column per shown year); labels.chart when omitted. |
| `onExport` | `() => void` | — | Export button of the chart actions; no button when omitted. |
| `onFullscreen` | `() => void` | — | Fullscreen button of the chart actions; no button when omitted. |
| `source` | `string` | — | Small line under the chart (source, how the change is measured), written by the caller. |
| `className` | `string` | — | Extra class name on the root. |

### seasonalSeries(points, offsetMs)

points 是从旧到新的 { time, value }；按 UTC 加 offsetMs（交易所时区，东八区给 8 × 3600000）切年；同一天取最后一个。基准是上一年最后一天的收盘，数据里没有上一年（或它是 0）时用这一年第一个价，基准是 0 时不要这一年（#147 起；之前一律用这一年第一个价）。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { SeasonalChart, seasonalSeries } from '@katana-ui/react/quant'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
// 每年三个收盘：年初、年中、年底；今年（2026）只走到 6 月 28 日（示例数据）。涨跌幅相对上一年最后一个收盘。
const DATES = [
  [0, 2],
  [5, 28],
  [11, 30],
] as const
const CLOSES: Record<number, readonly number[]> = { 2024: [100, 104, 108], 2025: [109, 103, 115], 2026: [116, 121] }
const years = seasonalSeries(
  Object.entries(CLOSES).flatMap(([year, closes]) =>
    closes.map((value, index) => ({ time: Date.UTC(Number(year), DATES[index]![0], DATES[index]![1]), value })),
  ),
)

export function SeasonalChartUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <SeasonalChart
        years={years}
        labels={{ chart: 'Seasonals', legend: 'Years', months: MONTHS, empty: 'No data', month: 'Month' }}
        actionLabels={{
          group: 'Chart actions',
          table: 'Table view',
          exportCsv: 'Export CSV',
          fullscreen: 'Fullscreen',
        }}
        tableLabel="Month-end change by year"
      />
    </div>
  )
}
```

## States

- 默认：每年一条线，颜色按年份次序取 series-*，关掉一年不让其余换色；月初画淡虚线，跨过 0 画零线。
- 关掉的年：开关淡显、色块变空心，线不画；最后一条线不让关。
- 悬停或聚焦后按方向键：竖线 + 读数（「月 日」与每年的涨跌幅）；往年最后一个点之后沿用到年底，今年还没走到的日子写「—」。
- 表格视图（右上按钮）：每月一行、每个看得见的年一列，写月末涨跌幅；图藏起来。
- 整张图窄于 520px：图例单独占一行，横轴只留单数月。
- 没有至少两个点的年：画 labels.empty。

## Don't

- 不要把不同口径的数（价格、收益率）混进同一张图：先换成同一口径再切年。
- 年份多于七个时第八个起都是「其他」色：只留最近几年。

## Composition

```
SeasonalChart figure
  div（div[role=group]（button[aria-pressed] × 年：色块 · 年份 · 涨跌幅）· ChartActions）
  ChartTable（表格视图）
  div[role=slider]（svg：网格 · 月初虚线 · 零线 · 线 × 年；纵轴刻度 · 十字线 · LcdTooltip）
  div（月份刻度）
  figcaption（来源）
```

## Keyboard

- `← / →（图上）`：前一天 / 后一天，出读数；没选中时第一下落在今年最后一个点
- `Shift + ← / →`：一次走三天
- `PageUp / PageDown`：上一个 / 下一个月初
- `Home / End`：到 1 月 1 日 / 12 月 31 日
- `Esc`：清掉读数
- `Tab / Enter / Space`：到年份开关、切换

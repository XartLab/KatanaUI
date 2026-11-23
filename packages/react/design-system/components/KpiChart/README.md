# KpiChart

大号当前值、较上期的变化（涨跌色），下面几条线并看（权益、回撤、夏普）：图例、首中末三处横轴字、提示窗跟着指针或方向键走，写这一点每条线的真值。两种纵轴：shared 同一单位共用一根轴（有刻度）；normalized 各自按最低到最高压到同一高度（单位不同的线并看，不画刻度）。扫读用 useScrubber，比例尺用 series-geometry，提示窗是 LcdTooltip，不另写一套（#1917 的分工）。线 2px 不填面、不用涨跌色。没有数据时写 emptyText。功能参照 affectUI 的 KPI Chart（affectui.com/components/kpi-chart，2026-11-23 读；Pro 件，页上没写许可证：只读说明、实现原创，不装它的 registry）；normalized 纵轴是我们加的。演示数据是固定种子合成的。

## Provide

`*` marks a required prop.

### KpiChart

图是 role=slider，aria-valuetext 写这一点每条线的值；index 可受控（几张图共用一个扫读点）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title` * | `string` | — | Card title. |
| `label` * | `string` | — | Accessible name of the chart. |
| `value` | `string` | — | Headline value, already formatted. |
| `delta` | `number \| null` | — | Change against the previous period as a fraction (0.12 is +12%); omit to hide. |
| `formatDelta` | `(delta: number) => string` | `defaultDelta` | How the change is written; defaults to a signed percent with one decimal. |
| `labels` * | `readonly string[]` | — | One label per point (dates); the axis writes the first, middle and last. |
| `tooltipLabels` | `readonly string[]` | — | Longer per-point headers for the tooltip; falls back to labels. |
| `series` * | `readonly KpiSeries[]` | — | Lines, about six at most. |
| `scale` | `KpiScale` | `'shared'` | shared (default): one y axis; normalized: each line scaled to its own range, no y ticks. |
| `format` | `(value: number) => string` | `String` | How values are written on the axis and in the tooltip; a line's own format wins in the tooltip. |
| `index` | `number \| null` | — | Controlled point index; null when nothing is marked. |
| `onIndexChange` | `(index: number \| null) => void` | — | Called when the marked point changes (pointer, arrows, Esc). |
| `defaultIndex` | `number` | — | Point marked while nobody scrubs; defaults to the last point. |
| `emptyText` * | `string` | — | Text in the plot when there is nothing to draw. |
| `footer` | `string` | — | Footer line, such as the source. |
| `height` | `number` | `DEFAULT_HEIGHT` | Plot height in pixels. |
| `className` | `string` | — | Extra class name on the root. |

### axisIndexes

纯函数：横轴写字的点（首、中、末）。

### kpiRange

纯函数：纵轴区间，normalized 固定 0..1。

### normalizeValues

纯函数：一条线压到 0..1，平线放中间，缺的点是 NaN。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { KpiChart } from '@katana-ui/react/quant'
import { DEMO_EQUITY } from '../research-data'

// 示例数据：研究报告页同一组固定种子合成的周频权益，取最后 52 周；回撤与滚动 12 周夏普由它算出来。三条线单位不同，用 normalized 纵轴。
const WEEKS = DEMO_EQUITY.slice(-53)
const SHOWN = WEEKS.slice(1)
const equity = SHOWN.map((p) => p.equity)
const returns = SHOWN.map((p, i) => p.equity / WEEKS[i]!.equity - 1)
const drawdown = SHOWN.map((p) => p.drawdown / p.equity)
const WINDOW = 12
const sharpe = returns.map((_, i) => {
  if (i + 1 < WINDOW) return null
  const slice = returns.slice(i + 1 - WINDOW, i + 1)
  const mean = slice.reduce((a, b) => a + b, 0) / WINDOW
  const sd = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / (WINDOW - 1))
  return sd > 0 ? (mean / sd) * Math.sqrt(52) : null
})
const day = (time: number) => new Date(time).toISOString().slice(5, 10)
const last = equity[equity.length - 1]!

export function KpiChartUsage() {
  return (
    <div className="gal-wide" style={{ maxWidth: 520 }} data-gallery-kpi="main">
      <KpiChart
        title="权益 · 回撤 · 滚动夏普（示例）"
        label="示例：KPI 图"
        value={Math.round(last).toLocaleString('en-US')}
        delta={last / equity[0]! - 1}
        labels={SHOWN.map((p) => day(p.time))}
        tooltipLabels={SHOWN.map((p) => p.title ?? '')}
        scale="normalized"
        series={[
          { key: 'equity', label: '权益', values: equity, format: (v) => Math.round(v).toLocaleString('en-US') },
          { key: 'drawdown', label: '回撤', values: drawdown, format: (v) => `${(v * 100).toFixed(1)}%` },
          { key: 'sharpe', label: '滚动夏普', values: sharpe, format: (v) => v.toFixed(2) },
        ]}
        emptyText="还没有回测结果"
        footer="来源 / 示例数据（固定种子合成）"
      />
    </div>
  )
}
```

## States

- 静止：标记点在 defaultIndex（不给是最后一点）。
- 扫读：十字线加 LCD 提示窗；靠右半边时提示窗翻到左边。
- shared：有网格与纵轴刻度；normalized：没有刻度，左侧留白收窄。
- 缺的点：线断开，提示窗写「–」。
- 没有数据：虚线框里写 emptyText，不画轴。

## Don't

- 不要超过六条线：拆成小多图（SmallMultiples）。
- 不要拿 normalized 比两条线谁高：高低只是各自的相对位置，看提示窗里的真值。
- 不要画几百个点的长序列：用 BrushChart 或权益曲线（带刷选）。

## Composition

```
KpiChart
  头（标题 · 当前值 · 变化）
  图例
  slider（svg 网格与线 · 纵轴刻度 · 标记点 · 十字线 · LcdTooltip）
  横轴（首中末）
  页脚
```

## Keyboard

- `← →`：上一点 / 下一点
- `Shift + ← →`：一次三点
- `Home / End`：第一点 / 最后一点
- `Esc`：清掉扫读点

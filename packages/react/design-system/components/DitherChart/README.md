# DitherChart

整张图都由方点拼出来的小图：先在低分辨率画布上画线、柱、堆叠、环、仪表、漏斗或热力，再按 Bayer 矩阵把透明度量化成有点没点，放大成像素风。与 DotMatrix 的分工：DotMatrix 是 SVG 里的固定点阵纹理，DitherChart 是整图。装饰性的概览，不可取值，读准数用 Sparkline 与 EquityCurve。

## Provide

`*` marks a required prop.

### DitherChart

画布图：读屏靠 description（必填）；颜色是 CSS 颜色，画前解析成实色，所以 token 也能用。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `data` * | `readonly DitherChartSeries[]` | — | One series each; donut, gauge and funnel read the first, heatmap draws one row per series, the others draw every series. |
| `description` * | `string` | — | What the chart says, in a sentence, for screen readers. |
| `variant` | `DitherChartVariant` | `'line'` | Which chart to draw. |
| `width` | `number` | `320` | Width in CSS pixels. |
| `height` | `number` | `180` | Height in CSS pixels. |
| `pixelSize` | `number` | `3` | Side of one dither pixel in CSS pixels. |
| `matrix` | `DitherChartMatrixOrder` | `4` | Bayer matrix order; a larger one gives finer gradations. |
| `palette` | `readonly string[]` | `['var(--accent)', 'var(--ink-300)']` | Any CSS colours, cycled per series (per slice for donut). |
| `animate` | `boolean` | `true` | Draw the chart in when it scrolls into view. |
| `className` | `string` | — | Extra class name on the figure. |

### DITHER_CHART_VARIANTS

常量：七种款式的名字。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { DitherChart } from '@katana-ui/react'

export function DitherChartUsage() {
  return (
    <DitherChart
      variant="line"
      description="Equity curve rising from 3 to 14"
      data={[{ points: [3, 5, 4, 7, 9, 8, 12, 14].map((value) => ({ value })) }]}
    />
  )
}
```

## States

- 进入视口：900ms 缓出画入（animate 为 false 直接画满）。
- 每个序列按 TONE_RAMP 取不同点阵密度，靠密度而不是只靠色相区分。
- matrix 2、4、8：越大渐变越细。

## Don't

- 不要拿它读精确数值：没有悬停与坐标。
- 不要放进要截图比对的页：画入动画与点阵都依赖设备像素比。

## Composition

```
DitherChart
  figure
    canvas（aria-hidden）
    span.sr-only（description）
```

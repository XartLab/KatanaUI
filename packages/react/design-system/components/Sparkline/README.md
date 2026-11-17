# Sparkline

一列数从旧到新，按容器的真实像素画（不拉伸、线宽 1.5px）。默认是线加线下渐变，最新值处有末端点；另有 line、baseline（基准上涨色下跌色）、bars、winloss（胜负格）四种画法。可加基准虚线、最高最低点、右端最新值、成交量、断点、单调曲线；interactive 时悬停出十字线与读数，键盘左右键走点。线色按最后值对基准（没基准按头尾），涨跌色跟涨跌配色走，没有数据只留「—」。

## Provide

`*` marks a required prop.

### Sparkline

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `values` * | `readonly SparkValue[]` | — | The values from oldest to newest; null or NaN breaks the line, and fewer than two valid values draws a dash. |
| `label` * | `string` | — | Accessible name as a whole sentence, including how "no data" is said; written by the caller in the UI language (required). |
| `tone` | `QuoteTone` | — | Color tone; follows the last value against the baseline, or the first-to-last change without one, when omitted. |
| `variant` | `SparklineVariant` | — | Drawing style: area (line with a gradient below, the default), line, baseline (up color above the baseline and down color below), bars, or winloss (Tufte win/loss cells). |
| `baseline` | `number` | — | Reference value such as the previous close; draws a dashed line, and splits colors in baseline and bars (winloss defaults to 0, bars to the first value). |
| `showLast` | `boolean` | — | Whether to draw a dot at the latest value (default true for area, line and baseline). |
| `lastLabel` | `string` | — | Latest value text shown at the right end, already formatted by the caller; the line leaves room for it. |
| `showExtremes` | `boolean` | — | Mark the highest and lowest values with a small dot each. |
| `extremeLabels` | `readonly [string, string]` | — | Texts for the highest and the lowest dots, in that order, already formatted by the caller; placed left or right of the dot to stay inside. |
| `interactive` | `boolean` | — | Show a crosshair, a snapped dot and a readout on hover, and walk the points with the arrow keys; keep it off for one chart per table row. |
| `format` | `(value: number, index: number) => string` | — | Turns a value into its readout text; defaults to the plain number. |
| `times` | `readonly string[]` | — | A time or date text for each value, shown before the value in the readout. |
| `onHover` | `(index: number \| null) => void` | — | Called with the hovered or keyboard-selected index, or null when it leaves. |
| `volumes` | `readonly SparkValue[]` | — | Volume for each value, drawn as thin bars in the bottom quarter without covering the line. |
| `volumeTone` | `'neutral' \| 'updown'` | — | Volume bar color: neutral (default) or follow the price change with the up and down colors. |
| `curve` | `SparkCurve` | — | Curve between points: linear (default) or monotone (smooth, never overshooting the data). |
| `width` | `number` | — | Width in pixels used before the container has been measured (server render, first frame); default 200. |
| `height` | `number` | — | Height in pixels used before the container has been measured; default 36. |
| `className` | `string` | — | Extra class name on the svg, written before is-<tone>. |
| `emptyClassName` | `string` | — | Extra class name on the dash shown when there is no data. |

### 纯函数

sparkPoints(values, width, height) 给 polyline 的点；sparkTone(values) 取头尾三态；quoteTone(change) 由一个涨跌数取三态（报价类的件共用）。几何（断点分段、基准切分、单调插值、设备像素对齐）在 katana/sparkline-model.ts，都是纯函数。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Sparkline } from '@katana-ui/react'

export function SparklineUsage() {
  return <Sparkline values={[10, 10.4, 10.2, 11, 11.8]} label="Price trend, up" />
}
```

## States

- 有数据：默认 area，一根线加线下渐变，末端点在最新值处；线色按最后值对基准，没基准按头尾（涨、跌、平）。
- line：只一根线；baseline：以基准为界，上面涨色、下面跌色，线与面积都分色；bars：每个值一根细柱；winloss：每个值只表示正负，等高小方块。
- 给了 baseline：画 1px 虚线（dash 2 2）；给了 lastLabel：右端写最新值，线留出位置不压字；showExtremes：最高最低各一个点，extremeLabels 在点旁写字，放不下自动换边。
- values 里的 null 或 NaN 是断点：线与面积在那里断开（午休、停牌），末端点取最后一个有效值。
- 值变化：末端点的光晕从 0 放大淡出一次，新点追加时线、面积与末端点一起平滑延伸；窗口左移不跳。
- interactive：悬停出竖向十字线、吸附到最近点的圆点和读数小框（贴边翻转不出界）；聚焦后左右键走点，Home / End 到头尾，Esc 退出。
- 有 volumes：底部四分之一高度画细量柱，价格线在它上方；volumeTone 为 updown 时按涨跌着色。
- 没有数据（有效值少于两个）：只留「—」，读屏名说清没有数据。

## Don't

- 不要在静态的折线上读具体数值：要数请配价格文字，或开 interactive。
- 表格里一行一个时不要开 interactive；行高很矮（如 22px）时用 showLast={false}。
- 不要把读数、标签、读屏名写死在包里：format、extremeLabels、lastLabel、label 都由调用方按界面语言传。
- 不要拿 bars 或 winloss 表达趋势：它们是逐点的涨跌与正负，趋势用 area 或 line。
- 不要给一个根本没有基准意义的数列硬传 baseline：画出的虚线会被当成昨收。

## Composition

```
Sparkline
  svg role=img（viewBox = 容器真实宽高；interactive 时 tabIndex=0）
    defs（线下渐变、基准分色的两块裁剪）
    量柱 · 基准虚线 · 面积 · 线（每段一个 M）· 柱 / 胜负格
    最高最低点与字 · 光晕 · 末端点 · 右端最新值
    悬停：十字线 · 吸附点 · 读数框
  span[aria-live]（interactive 时，节流播报当前点的读数）
```

## Keyboard

- `左 / 右方向键（interactive，聚焦时）`：走到前一个 / 后一个有效点，读屏播报读数
- `Home / End`：走到第一个 / 最后一个有效点
- `Esc`：退出读数，焦点留在图上

# Sparkline

一列数从旧到新，按容器的真实像素画（不拉伸、线宽 1.5px，高 80 以上 2px、圆角连接）。默认是线加线下渐变（贴线 22% 渐到 0），最新值处是实心点加常驻空心环；给毫秒时间戳与 domain 时横轴是整个交易时段、线只画到现在（对齐 TradingView Markets 页的日内图），可加右侧价格刻度、底部时间刻度与最新价价签；另有 line、baseline（基准上涨色下跌色）、bars、winloss（胜负格）四种画法。look 给两种可选画风（默认外观不变）：instrument 是把数据当科学档案来排版的仪器档案页（细线、一个信号色、点阵与角标、投影谱、极值与研究员批注、档案编号与来源行），ascii 是终端字形（块字符或盲文点阵、可换点阵字体）。可加基准虚线、最高最低点、右端最新值、成交量、断点、单调曲线；interactive 时悬停出一根竖线、吸附点与紧挨光标的三行读数（数值、日期、时间），键盘左右键走点。线色按最后值对基准（没基准按头尾），涨跌色跟涨跌配色走，没有数据只留「—」。

## Provide

`*` marks a required prop.

### Sparkline

值是数（从旧到新）；读数、标签、刻度字由调用方的 format 与 label 写。interactive 时才可聚焦、走点。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `values` * | `readonly SparkValue[]` | — | The values from oldest to newest; null or NaN breaks the line, and fewer than two valid values draws a dash. |
| `label` * | `string` | — | Accessible name as a whole sentence, including how "no data" is said; written by the caller in the UI language (required). |
| `tone` | `QuoteTone` | — | Color tone; follows the last value against the baseline, or the first-to-last change without one, when omitted. |
| `variant` | `SparklineVariant` | — | Drawing style: area (line with a gradient below, the default), line, baseline (up color above the baseline and down color below), bars, or winloss (Tufte win/loss cells). |
| `baseline` | `number` | — | Reference value such as the previous close; draws a dashed line, and splits colors in baseline and bars (winloss defaults to 0, bars to the first value). |
| `showLast` | `boolean` | — | Whether to draw a dot with a hollow ring at the latest value (default true for area, line and baseline); the ring pulses once when the value changes. |
| `lastLabel` | `string` | — | Latest value text shown at the right end, already formatted by the caller; the line leaves room for it. |
| `showExtremes` | `boolean` | — | Mark the highest and lowest values with a small dot each. |
| `extremeLabels` | `readonly [string, string]` | — | Texts for the highest and the lowest dots, in that order, already formatted by the caller; placed left or right of the dot to stay inside. |
| `interactive` | `boolean` | — | Show a vertical line, a snapped dot and a readout box beside the cursor on hover, and walk the points with the arrow keys; keep it off for one chart per table row. |
| `format` | `(value: number, index: number) => string` | — | Turns a value into its readout text; defaults to the plain number. |
| `times` | `readonly string[] \| readonly number[]` | — | Time of each value, one to one with values: millisecond timestamps place points by time (see domain and sessions), or texts shown under the value in the readout. |
| `domain` | `readonly [start: number, end: number]` | — | The whole time span of the x axis in milliseconds (such as a trading day); the line stops at the last point and the rest stays empty. |
| `sessions` | `readonly (readonly [start: number, end: number])[]` | — | Trading sessions in milliseconds (such as morning and afternoon); the gaps between them are squeezed out of the x axis and the line breaks there. |
| `formatTime` | `(time: number) => { date: string; time: string }` | — | Turns a timestamp into the date and time lines of the readout (and the time ticks); written by the caller so language and time zone are its own. |
| `axis` | `SparkAxis` | — | Price ticks on the right and time ticks at the bottom, for large charts only (ignored below 60px high). |
| `lastTag` | `boolean` | — | Draw the latest value as a filled tag on the right axis, in the up or down color with the matching text color. |
| `onHover` | `(index: number \| null) => void` | — | Called with the hovered or keyboard-selected index, or null when it leaves. |
| `volumes` | `readonly SparkValue[]` | — | Volume for each value, drawn as thin bars in the bottom quarter without covering the line. |
| `volumeTone` | `'neutral' \| 'updown'` | — | Volume bar color: neutral (default) or follow the price change with the up and down colors. |
| `curve` | `SparkCurve` | — | Curve between points: linear (default) or monotone (smooth, never overshooting the data). |
| `width` | `number` | — | Width in pixels used before the container has been measured (server render, first frame); default 200. |
| `height` | `number` | — | Height in pixels used before the container has been measured; default 36. |
| `className` | `string` | — | Extra class name on the svg, written before is-<tone>. |
| `emptyClassName` | `string` | — | Extra class name on the dash shown when there is no data. |
| `look` | `SparklineLook` | — | Overall look: default (market panel, unchanged), instrument (research sheet: hairline neutral ink, one signal color, graticule, corner marks, projection) or ascii (terminal glyphs). |
| `signal` | `string` | — | The one signal color of the instrument look, as a CSS color; default var(--accent). |
| `projection` | `boolean` | — | instrument only (height 80 and up): draw the distribution of the values on the right, sharing the vertical axis, with a line at the current value. |
| `projectionMode` | `'kde' \| 'histogram'` | — | How the projection is estimated: kde (default, Gaussian kernel with Silverman bandwidth) or histogram. |
| `annotation` | `{ index: number; text: string }` | — | instrument only: one analyst note on a point, a hand-drawn circle around values[index] plus a sentence in the signal color; text is written by the caller. |
| `meta` | `{ id?: string; source?: string }` | — | instrument only: a sheet header (top left) and a SOURCES footer (bottom left), both already written by the caller; left out when the chart is lower than 80px. |
| `reticle` | `boolean` | — | instrument only: draw a small registration cross at the center of the plot. |
| `glyphs` | `'blocks' \| 'braille'` | — | ascii only: block glyphs (one of ▁▂▃▄▅▆▇█ per column, more rows when tall) or braille dots (2 x 4 per character, continuous line). |
| `font` | `'mono' \| 'dot'` | — | ascii only: mono (default, --font-mono) or dot (the --font-dot pixel font). |
| `rows` | `number` | — | ascii only: number of text rows; defaults to as many 12px rows as fit the height. |

### 纯函数

sparkPoints(values, width, height) 给 polyline 的点；sparkTone(values) 取头尾三态；quoteTone(change) 由一个涨跌数取三态（报价类的件共用）。几何（断点分段、基准切分、单调插值、设备像素对齐、时间到横坐标与休市压缩、时间与价格刻度、读数框位置）在 quotes/sparkline-model.ts，都是纯函数。

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
- 给了数字 times（毫秒）：按时间定横坐标；给了 domain 整个时段是横轴，线只画到最后一个点，右边留空；domain 之外与休市里的点裁掉。不给 times 与 domain 仍按序号铺满整宽。
- 给了 sessions（如 A 股上午、下午）：时段之间的休市在横轴上压成一道 4px 的细缝，线与面积在那里断开。
- 给了 axis（高度 60px 以上才生效）：右侧价格刻度（默认 4 档，从最低均分到最高）与底部时间刻度（自动挑放得下的间隔，或按分钟数），挤在一起的刻度字丢掉；lastTag：右轴上涨跌色实底的最新价价签，字用对比色。
- 值变化：末端环外的光晕从 0 放大淡出一次（环本身常驻），新点追加时线、面积与末端点一起平滑延伸；窗口左移不跳。
- interactive：悬停出一根竖线（没有横线）、吸附到最近点的圆点和紧挨光标的读数框（HTML 三行：粗体数值、日期、时间，贴边左右翻转，不出容器；图太矮放不下时放到图上方）；只给了 times 没给 formatTime 时只显示数值；聚焦后左右键走点，Home / End 到头尾，Esc 退出。
- 有 volumes：底部四分之一高度画细量柱，价格线在它上方；volumeTone 为 updown 时按涨跌着色。
- 没有数据（有效值少于两个）：只留「—」，读屏名说清没有数据。
- look="instrument"（仪器档案）：1px 中性墨色线（不用涨跌色），底上是很淡的 + 点阵，四角 6px 的 L 形对位角标（reticle 加中心十字）；全图只有末端点与批注用信号色（--accent，可传 signal）；刻度是 2 到 3px 的短线加宽字距（0.15em）等宽小字；baseline 画成细虚线，interactive 悬停是横竖两条细线的十字准星加读数框。
- instrument 的大图（高 80 以上）：projection 在右侧画这列值的分布（默认高斯核密度、Silverman 带宽，projectionMode 可换直方图），与主图共享纵轴，横线标当前值，新点进来柱子平滑过渡；showExtremes 的最高最低是小十字加引线加 extremeLabels 写的 H / L；annotation 是一圈手绘圈（按下标播种，不随渲染变）加一句话；meta 是左上档案编号与左下 SOURCES 行。高度低于 80 时只画线、点阵与末端点。
- look="ascii"（终端字形）：整幅是一个 pre（aria-hidden），外层 role=img；glyphs 取 blocks（每列一个 ▁▂▃▄▅▆▇█，高了多行、每行 8 级）或 braille（盲文 2 × 4 点连续折线）；列数按容器宽与字宽算；默认中性墨色、最新一列信号色，给 tone 着涨跌色；font="dot" 换点阵字体。
- ascii 的断点那一列是空格，时段横轴按列映射、休市压成一列 ┊，baseline 是一行 ┄；新点进来整幅左移一列，新列先在字形集里乱跳几帧再落定（--dur-reorder）；interactive 的读数框照旧。

## Don't

- 不要在静态的折线上读具体数值：要数请配价格文字，或开 interactive。
- 表格里一行一个时不要开 interactive；行高很矮（如 22px）时用 showLast={false}。
- 不要把读数、标签、读屏名写死在包里：format、extremeLabels、lastLabel、label 都由调用方按界面语言传。
- 不要拿 bars 或 winloss 表达趋势：它们是逐点的涨跌与正负，趋势用 area 或 line。
- 不要给一个根本没有基准意义的数列硬传 baseline：画出的虚线会被当成昨收。
- 不要在 instrument 里再加第二个信号色或涨跌色：信号色只标「此刻要看的地方」（末端点、批注）。
- 不要把 ascii 放进要读准数的地方：字符画只给走势的形状，要数配文字或开 interactive。

## Composition

```
Sparkline
  svg role=img（viewBox = 容器真实宽高；interactive 时 tabIndex=0）
    defs（线下渐变、基准分色的两块裁剪）
    量柱 · 基准虚线 · 面积 · 线（每段一个 M）· 柱 / 胜负格
    最高最低点与字 · 光晕 · 末端点 · 右端最新值
    价格刻度 · 时间刻度 · 最新价价签
    悬停：竖线 · 吸附点 · 读数框（foreignObject 里的 HTML）
  span[aria-live]（interactive 时，节流播报当前点的读数）

look="instrument"
  svg role=img
    + 点阵 · 四角角标 · 眉头与 SOURCES 行
    价格刻度（短线 + 字）· 时间刻度 · 基准细虚线
    投影谱（脊线 · 横向细柱 · 当前值横线）· 线 · 极值（小十字 + 引线 + 字）· 批注（手绘圈 + 引线 + 字）· 末端点 · 价签
    悬停：横竖十字线 · 读数框

look="ascii"
  span[role=img]
    pre[aria-hidden]（每行一个 span，同色连续字符合并成一个节点）
    悬停：列光标 · 读数框
```

## Keyboard

- `左 / 右方向键（interactive，聚焦时）`：走到前一个 / 后一个有效点，读屏播报读数
- `Home / End`：走到第一个 / 最后一个有效点
- `Esc`：退出读数，焦点留在图上

# MiniChart

照 TradingView 的 Mini Chart 小组件（2026-11-18 在浏览器里看的）：卡片上一行「品种图标 + 代码 + 角标」，一行「最新价 单位 + 涨跌幅」，下面是走势（Sparkline 的 area：线 2px 圆角、线下很淡的同色渐变、末端实心点加空心环）。给了毫秒时间戳与 domain，线只画到现在、右边留空；live 时价格滚动、涨跌幅闪色。没有基准线与坐标轴，默认不开悬停。

## Provide

`*` marks a required prop.

### MiniChart

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `symbol` * | `string` | — | Symbol code, shown beside the icon (and the letters of the icon when it has no image). |
| `name` | `string` | — | Name of the symbol; the icon's accessible name, and its letters when the code has none (600519). |
| `logoSrc` | `string` | — | Image address of the icon; letters are drawn when omitted or when it fails to load. |
| `badge` | `string` | — | Small tag after the code, such as the period (D); written by the caller. |
| `price` * | `number` | — | The latest price. |
| `unit` | `string` | — | Unit after the price (USD, CNY), written by the caller. |
| `digits` | `number` | `2` | Number of decimal places of the price when formatPrice is not given. |
| `formatPrice` | `(price: number) => string` | — | Turns the price into text (thousands separators, locale); defaults to a plain fixed-point number. |
| `change` * | `number` | — | Change in percent (1.5 means +1.5%); decides the up, down or flat color of the card. |
| `values` * | `readonly (number \| null \| undefined)[]` | — | Price values for the chart from oldest to newest. |
| `times` | `SparklineProps['times']` | — | Millisecond timestamp of each value; with domain the line stops at the last point. |
| `domain` | `SparklineProps['domain']` | — | The whole time span of the chart in milliseconds. |
| `sessions` | `SparklineProps['sessions']` | — | Trading sessions in milliseconds; the gaps between them are squeezed out. |
| `formatTime` | `SparklineProps['formatTime']` | — | Turns a timestamp into the date and time lines of the hover readout. |
| `baseline` | `number` | — | Reference value such as the previous close; draws a dashed line (off by default, as in TradingView). |
| `interactive` | `boolean` | `false` | Hover readout and keyboard walking on the chart (off by default). |
| `look` | `SparklineProps['look']` | — | Look of the chart, passed to Sparkline: default (unchanged), instrument or ascii. |
| `chartHeight` | `number` | `80` | Height of the chart in pixels; 80 and above draws the line at 2px. |
| `live` | `boolean` | `false` | Live data: the price rolls when it changes and the change flashes the up or down color. |
| `onSelect` | `(event: MouseEvent<HTMLButtonElement>) => void` | — | When given the whole card is a button; keep interactive off then. |
| `labels` * | `{ card: string; chart: string }` | — | Texts for screen readers, written by the caller in the UI language (required). |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { MiniChart } from '@katana-ui/react'

export function MiniChartUsage() {
  return (
    <MiniChart
      symbol="AAA"
      name="Alpha"
      badge="D"
      price={11.8}
      unit="USD"
      change={1.8}
      values={[10, 10.4, 10.2, 11, 11.8]}
      labels={{ card: 'Alpha, up 1.8%', chart: 'Alpha price trend, up' }}
    />
  )
}
```

## States

- 默认：图标、代码、价格、涨跌幅与走势；涨跌色按 change（涨、跌、平）。
- 给了 times 与 domain（可加 sessions）：横轴是整个交易时段，线只画到最后一个点，右边留空；午休被压缩、线在那里断开。
- live：价格变了用 RollingText 滚动，涨跌幅闪一次涨跌色，走势新点追加时线平滑延伸、末端环放大淡出一次。
- 给了 onSelect：整张卡是按钮，悬停提亮、键盘焦点有环；不要同时开 interactive。
- look：原样交给走势的 Sparkline（instrument、ascii），卡片本身与默认外观不变。
- 没有走势数据（有效值少于两个）：走势的位置只留「—」。

## Don't

- 不要在包里写文字：角标、单位、读屏名都由调用方传。
- 不要给它加基准线与坐标轴：要它们用 Sparkline 的 baseline 与 axis。
- 不要在可点的卡上开 interactive：按钮里不该再有可聚焦的子元素。
- 不要拿它放进表格行：行内用 Sparkline，卡片用 MiniChart。

## Composition

```
MiniChart
  div[role=group] | button
    span（SymbolMark · 代码 · 角标）
    span（价 RollingText · 单位 · ChangeText）
    span > Sparkline
```

## Keyboard

- `Tab / Enter`：有 onSelect 时到卡上、触发

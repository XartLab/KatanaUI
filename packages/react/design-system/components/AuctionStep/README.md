# AuctionStep

09:15–09:25 集合竞价的撮合价画成台阶（价格在两个时刻之间不变，到下一个时刻才跳），台阶下是匹配量柱；09:20 起不可撤单画一条竖的虚分界，昨收给了就画横的虚参考线，台阶按最新撮合价对昨收着涨跌色（跟 data-updown，没有昨收不着色）；上方读数是最新撮合价、相对昨收的涨跌幅与匹配量。横轴只有这十分钟。同一套台阶还有迷你版 AuctionStepSpark，DataGrid 的 auctionStep 列类型用它（可按相对昨收的涨跌幅排序）。点由调用方给，不带行情。

## Provide

`*` marks a required prop.

### AuctionStep

渲染一个 figure（role=img），不透传别的属性。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `points` * | `readonly AuctionPoint[]` | — | Auction points between 09:15 and 09:25 (matched price and optionally matched volume); order does not matter, points outside the window are dropped. |
| `prevClose` | `number \| null` | — | Previous close for the dashed reference line, the change readout and the up / down tone; omit to draw none of them. |
| `digits` | `number` | `2` | Digits of the price readout; 2 by default. |
| `height` | `number` | `96` | Chart height in px; 96 by default. |
| `labels` | `AuctionStepLabels` | `cnLabelsZh.auctionStep` | Text pack; the Simplified Chinese default is used when omitted. |
| `className` | `string` | — | Extra class names. |

### AuctionStepSpark

迷你台阶：一个 16px 高的 svg，只画线；画不出时写「—」。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `points` * | `readonly AuctionPoint[] \| null \| undefined` | — | Auction points; same as AuctionStep. |
| `prevClose` | `number \| null` | — | Previous close for the tone; omit for a neutral line. |
| `width` | `number` | `64` | Width in px; 64 by default. |
| `height` | `number` | `16` | Height in px; 16 by default. |
| `className` | `string` | — | Extra class names. |

### AuctionPoint

一个竞价点：time、price、可选 volume；价取不到的点丢掉。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `time` * | `string` | — | Clock time such as "09:15" or "09:21:30". |
| `price` * | `number \| null` | — | Matched price; null drops the point. |
| `volume` | `number \| null` | — | Matched volume (the unit is the caller's); null draws no bar. |

### auctionSteps(points)

纯函数：丢掉不在 09:15–09:25、价取不到的点，按时刻排序。

### auctionSummary(steps, prevClose)

纯函数：最新价、相对昨收的涨跌幅、匹配量与方向；没有昨收方向是 flat。

### stepPath(steps, domain, width, height)

纯函数：台阶折线路径（先横后竖，没有斜线）。

### volumeBars(steps)

纯函数：量柱的位置、宽度与按最大量归一的高度。

### priceDomain(steps, prevClose)

纯函数：价格区间，含昨收，上下各留一成。

### auctionX(minutes)

纯函数：时刻在这十分钟里的位置，0 到 1。

### AUCTION_FROM / AUCTION_TO / AUCTION_CANCEL_CUTOFF

常量：09:15、09:25、09:20（自 0 点起的分钟数）。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { AuctionStep } from '@katana-ui/react/cn'

export function AuctionStepUsage() {
  return (
    <AuctionStep
      prevClose={10}
      points={[
        { time: '09:15', price: 10, volume: 120 },
        { time: '09:17:40', price: 10.15, volume: 2100 },
        { time: '09:20', price: 10.22, volume: 5200 },
        { time: '09:22:30', price: 10.36, volume: 9100 },
        { time: '09:25', price: 10.45, volume: 12_600 },
      ]}
      labels={{
        region: 'Opening auction',
        axis: { from: '09:15', cancelCutoff: 'No cancel from 09:20', to: '09:25' },
        price: 'Matched',
        volume: 'Volume',
        prevClose: 'Prev close',
        empty: 'No auction data',
        unavailable: 'Not available',
        aria: (last) => `Opening auction steps, last matched price ${last}`,
      }}
    />
  )
}
```

## States

- 有昨收：画参考线，读数带涨跌幅，台阶与读数按涨跌着色。
- 没有昨收：不画参考线，涨跌幅写「—」，线用中性灰。
- 只有一个点：画一小段横线，免得整条线消失。
- 一个点都没有：写一行空态文字。
- 匹配量取不到：对应的量柱不画，读数写「—」。

## Don't

- 不要把盘中分时点塞进来：不在 09:15–09:25 的点会被丢掉。
- 不要在包里取行情：点由调用方给。
- 不要传色值：线色只看最新价对昨收的方向。

## Composition

```
AuctionStep
  figure[role=img]
    读数（撮合价 · 涨跌幅 · 匹配量）
    svg（昨收线 · 09:20 分界 · 量柱 · 台阶线）
    横轴两端 09:15 · 09:25
```

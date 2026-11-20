# MarketPulse

一行横条：上涨占比半圆表盘（中间写百分比，下注「上涨占比」）、五个大数（上涨 / 下跌 / 涨停 / 跌停 / 平盘，涨红跌绿，平盘中性）、大数下两行小字读数（涨停池、昨日口径、成交额与主力净流入），最右嵌涨跌分布柱（DistributionBars）。读数只占三行高；取不到写「—」并可带原因（悬停），不写 0。信息结构取自复盘吧的看盘工作台，样子是 Graphite 的。

## Provide

`*` marks a required prop.

### MarketPulse

渲染一个 div（role=group），不透传别的属性。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `counts` * | `MarketPulseCounts` | — | The five big counts: rising, falling, limit-up, limit-down and flat. |
| `readings` | `MarketPulseReadings` | `{}` | The small readings under the counts; a missing one is written as a dash with its reason on hover. |
| `share` | `number \| null` | — | Share of rising stocks (0 to 1) for the half-dial; worked out from the counts when omitted, null writes a dash. |
| `basis` | `ReactNode` | — | A caller-written note after the yesterday readings (the basis date, for example). |
| `distribution` | `Pick<DistributionBarsProps, 'bins' \| 'totals' \| 'formatCount' \| 'empty'>` | — | The change distribution on the right; leave it out to draw none. |
| `labels` | `PulseLabels` | `cnLabelsZh.pulse` | Text pack; the Simplified Chinese default is used when omitted. |
| `className` | `string` | — | Extra class names. |

### MarketPulseCounts

五个大数：rising、falling、limitUp、limitDown、flat；各自是数或 { value, reason }。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `rising` * | `CnValue` | — | Number of rising stocks. |
| `falling` * | `CnValue` | — | Number of falling stocks. |
| `limitUp` * | `CnValue` | — | Number of limit-up stocks. |
| `limitDown` * | `CnValue` | — | Number of limit-down stocks. |
| `flat` * | `CnValue` | — | Number of flat stocks. |

### MarketPulseReadings

小字读数，都可选：缺的写「—」。金额单位是元，按万 / 亿写；highestBoard 是板数。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `nonStLimitUp` | `CnValue` | — | Limit-up stocks excluding ST, in the pool. |
| `broken` | `CnValue` | — | Stocks that touched the limit and opened. |
| `highestBoard` | `CnValue` | — | The highest board count. |
| `limitUpAmount` | `CnValue` | — | Turnover of the limit-up stocks, in yuan. |
| `sealEstimate` | `CnValue` | — | Estimated seal amount of the limit-up stocks, in yuan. |
| `yesterdayLimitUp` | `CnValue` | — | Yesterday's limit-up count. |
| `yesterdayLimitDown` | `CnValue` | — | Yesterday's limit-down count. |
| `yesterdayBroken` | `CnValue` | — | Yesterday's broken-limit count. |
| `turnover` | `CnValue` | — | Turnover of both markets, in yuan. |
| `turnoverForecast` | `CnValue` | — | Forecast turnover of both markets, in yuan. |
| `mainNetInflow` | `CnValue` | — | Main-force net inflow, in yuan (signed). |

### pulseShare(counts)

纯函数：上涨 /（上涨 + 下跌 + 平盘），任何一项取不到是 null。

### dialArc(share)

纯函数：半圆表盘的弧路径（viewBox 100×54）。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { MarketPulse } from '@katana-ui/react/cn'

export function MarketPulseUsage() {
  return (
    <MarketPulse
      counts={{ rising: 302, falling: 5239, limitUp: 30, limitDown: 62, flat: 31 }}
      readings={{ nonStLimitUp: 28, highestBoard: 4, turnover: { value: null, reason: 'Not provided yet' } }}
    />
  )
}
```

## States

- 占比由三个家数算；任何一个取不到，表盘不画弧、中间写「—」。也可以直接传 share。
- 读数取不到：写「—」，悬停写 reason（没给就写默认文案里的说明），不写 0。
- 主力净流入带正负号，涨色 / 跌色跟 data-updown。
- 给了 distribution 才在最右画分布柱；不给就不画。

## Don't

- 不要传色值：涨跌只靠语义色调。
- 不要在包里取数：数据源由调用方接，这里只摆。
- 不要加第四行读数：条的高度就是三行。

## Composition

```
MarketPulse
  表盘（半圆 · 占比 · 说明）
  五个大数
  小字读数 × 2 行
  涨跌分布（DistributionBars）
```

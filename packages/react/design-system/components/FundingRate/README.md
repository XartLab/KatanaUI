# FundingRate

账户四件之一（#104）：当前费率（带符号、正负着色，旁边写谁付谁）、预测费率、下次结算倒计时（HH:MM:SS，到点写 labels.due）、历史费率小柱状图（零线居中，按历史最大绝对值归一，悬停出时间与费率）。结算时间由调用方传，件里只算倒计时；now 可注入，不传就每秒读一次系统时钟。费率是百分数。

## Provide

`*` marks a required prop.

### FundingRate

费率与历史点都是百分数；nextSettlement 与 now 是毫秒时间戳。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `rate` * | `number` | — | Current rate in percent (0.01 means 0.01%). |
| `predictedRate` | `number \| null` | — | Predicted rate of the next settlement, in percent; omit when unknown. |
| `nextSettlement` * | `number` | — | Next settlement time in milliseconds. |
| `now` | `number` | — | Clock in milliseconds; omit to follow the system clock once a second. |
| `history` | `readonly FundingPoint[]` | — | Past rates from old to new. |
| `formatRate` | `(rate: number) => string` | `defaultFormatRate` | How a rate is written; defaults to a sign and four decimals (`+0.0100%`). |
| `labels` * | `FundingRateLabels` | — | Texts. |
| `className` | `string` | — | Extra class name on the root. |

### countdownTo

纯函数：到结算还剩多少，过点给 0。

### formatCountdown

纯函数：写成 HH:MM:SS。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `remaining` * | `number` | — | Milliseconds left, never negative. |
| `hours` * | `number` | — | Whole hours left, not wrapped at 24. |
| `minutes` * | `number` | — | Minutes left within the hour. |
| `seconds` * | `number` | — | Seconds left within the minute. |
| `due` * | `boolean` | — | The settlement time has been reached. |

### formatRate

纯函数：费率写成带符号的百分数。

### fundingBars

纯函数：历史柱归一高度。

### rateTone

纯函数：费率方向。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { FundingRate, type FundingPoint, type FundingRateLabels } from '@katana-ui/react/blocks'

// 演示数据：费率与历史都是编出来的（闭式公式）；每 8 小时结算一次，倒计时的终点是挂载后 2 小时 13 分 7 秒。
const EIGHT_HOURS = 8 * 3600 * 1000
export const FUNDING_HISTORY: readonly FundingPoint[] = Array.from({ length: 24 }, (_, i) => ({
  time: Date.UTC(2026, 10, 15) + i * EIGHT_HOURS,
  rate: +(0.012 * Math.sin(i / 2.2) + 0.004 * Math.cos(i * 1.3) - 0.001).toFixed(4),
}))

export const FUNDING_LABELS: FundingRateLabels = {
  region: '资金费率（演示数据）',
  current: '当前费率',
  predicted: '预测费率',
  nextSettlement: '下次结算',
  history: '历史费率',
  payer: { up: '多头付空头', down: '空头付多头', flat: '不收付' },
  due: '结算中',
  bar: (point, rate) => `${new Date(point.time).toISOString().slice(5, 16).replace('T', ' ')} ${rate}`,
}

export function FundingRateUsage() {
  const [settlement] = useState(() => Date.now() + (2 * 3600 + 13 * 60 + 7) * 1000)
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <FundingRate
        rate={0.01}
        predictedRate={0.0082}
        nextSettlement={settlement}
        history={FUNDING_HISTORY}
        labels={FUNDING_LABELS}
      />
    </div>
  )
}
```

## States

- 正费率涨色、负费率跌色、零不着色；旁边的文字写谁付谁。
- 倒计时每秒走一格；传了 now 就不走；到点后写 00:00:00 与 labels.due。
- 没有预测费率写「—」；没有历史不画小柱图。

## Don't

- 不要在件里读交易所结算时间表：由调用方算好传。
- 不要拿历史柱高度当绝对值比较：它按这段历史归一，悬停才是真值。

## Composition

```
FundingRate
  Lcd × 3
  历史小柱状图
```

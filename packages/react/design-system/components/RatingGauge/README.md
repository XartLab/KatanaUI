# RatingGauge

半圆分五段（强烈卖出到强烈买入），一根指针转到分数那一段，圆心下面写档位词，下面可再放卖出 / 中性 / 买入各几个。

## Provide

`*` marks a required prop.

### RatingGauge

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `score` * | `number` | — | From -1 (strong sell) to +1 (strong buy), split into five equal zones; out of range is clamped and a non-finite number counts as 0. |
| `zones` * | `readonly [string, string, string, string, string]` | — | Names of the five zones from sell to buy; the level word is taken from here too. |
| `label` * | `string` | — | Accessible name, required, for example "Technical rating". |
| `children` | `ReactNode` | — | Extra content under the level word (the counts of sell, neutral and buy). |
| `className` | `string` | — | Extra class name on the root. |

### ratingZone(score) / ratingAngle(score)

落在第几段（0 到 4）；指针转角（度，−90 到 +90）。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { RatingGauge } from '@katana-ui/react'

const ZONES = ['Strong sell', 'Sell', 'Neutral', 'Buy', 'Strong buy'] as const

export function RatingGaugeUsage() {
  return <RatingGauge score={0.3} zones={ZONES} label="Technical rating" />
}
```

## States

- 五段之一高亮，其余淡显；指针用 gentle 弹簧转到分数。
- 分数越界夹到边，不是有限数当 0（中性）。
- 可在档位词下放个数统计。

## Don't

- 不要在包里决定评级怎么算：分数与五个档位名由调用方传。
- 不要把中间一段当没有信号：中性是一个有效档位。

## Composition

```
RatingGauge
  svg（五段弧 · 指针 · 圆心）
  figcaption（档位词）
  div（children）
```

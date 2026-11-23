# PerformanceStrip

照 TradingView 品种页的 Performance 一行（2026-11-15 实测）：一排等宽格，上行周期（1 day … All time）、下行涨跌幅（涨跌色，过千写成 K%、M%）；点一格选中（灰底，aria-pressed）并回调，由调用方去切图表区间。数与周期名都由调用方传，件不算涨跌幅。选中用中性灰，不用 TV 的蓝。

## Provide

`*` marks a required prop.

### PerformanceStrip

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | `PerformanceItem[]` | — | { id（旧名 key）, label, change（百分数；没有写 null，画「—」）}。 |
| `value / defaultValue / onValueChange` | `string / string / (id) => void` | — | 选中的格子；不给 value 就自己记。 |
| `label` | `string` | — | 读屏名（role=group），必填。 |
| `digits` | `number` | `2` | 涨跌幅位数。 |

### formatPerformance(value, digits)

纯函数：+12.50%、+1.84K%、+142.60K%；不是有限数写「—」。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { PerformanceStrip } from '@katana-ui/react/quotes'

const ITEMS = [
  { id: '1d', label: '1 day', change: 0.62 },
  { id: '1m', label: '1 month', change: 3.18 },
  { id: '6m', label: '6 months', change: -4.07 },
  { id: '1y', label: '1 year', change: 27.5 },
  { id: '5y', label: '5 years', change: 312.9 },
]

export function PerformanceStripUsage() {
  const [picked, setPicked] = useState('1y')
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <PerformanceStrip items={ITEMS} label="Performance" value={picked} onValueChange={setPicked} />
    </div>
  )
}
```

## States

- 选中的格子灰底、aria-pressed=true；悬停提亮。
- 涨红跌绿由 data-updown 决定，平不着色。
- 没有数据的格写「—」。

## Don't

- 不要在件里算涨跌幅；由调用方传。
- 不要用蓝色表示选中。

## Composition

```
PerformanceStrip role=group
  button × n（周期名 · 涨跌幅）
```

## Keyboard

- `Tab / Space / Enter`：到格子上、选中

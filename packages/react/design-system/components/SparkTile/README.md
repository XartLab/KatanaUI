# SparkTile

KPI 瓦片：点阵小标签、LCD 数值、24px 迷你折线（可画阈值虚线）、一行变化说明；数据由调用方给，没有数据是空态，一行最多放 5 个。

## Provide

`*` marks a required prop.

### SparkTile

给了 onClick 整块就是按钮（点开该指标的完整图），不给是普通块。文案（标签、说明、读屏名）都由调用方传。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | — | 点阵小标签。 |
| `value` | `string \| null` | — | 已格式化的数值；null 是没有数据，写 —。 |
| `unit` | `string` | — | 数值后面的小字（/月、/ 150%）。 |
| `rollValue` | `number` | — | 给了数值就像里程表一样滚着变；不给直接换字。 |
| `series` | `readonly number[]` | — | 迷你线的数，从旧到新；少于两个数画不出线，写 —。 |
| `sparkLabel` | `string` | — | 线的读屏名（整句，含「没有数据」的说法）。 |
| `trendTone` | `'series' \| 'neutral'` | `'series'` | neutral 给越低越好的指标（线用 ink-300）。 |
| `threshold` | `number` | — | 阈值（跟 series 同一单位）：画 1px 琥珀虚线，纵向刻度把它算进去。 |
| `state` | `'normal' \| 'near' \| 'over'` | `'normal'` | near、over：边框转暗橙、说明转琥珀；over 另有一次 2px 脉冲。 |
| `delta` | `number` | — | 变化百分数，写成带符号带箭头的 ChangeText，涨跌色跟 data-updown。 |
| `note` | `ReactNode` | — | 变化行的小字说明；near、over 时要在这里写字。 |
| `onClick` | `() => void` | — | 给了就是按钮。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { SparkTile } from '@katana-ui/react/quant'

const asset = [18, 16, 17, 12, 13, 9, 10, 6, 4]

const drawdown = [4, 8, 6, 12, 10, 16, 12, 18, 14]

const stable = [10, 12, 9, 14, 11, 13, 10, 12, 11]

const exposure = [16, 14, 15, 10, 11, 8, 9, 5, 4]

export function SparkTileUsage() {
  const [clicks, setClicks] = useState(0)
  return (
    <>
      <div className="gal-grid-5" data-testid="spark-row">
        <SparkTile
          label="NET ASSET"
          value="2.42M"
          series={asset.map((v) => 20 - v)}
          sparkLabel="近 9 期净值走势"
          delta={1.31}
          note="今日"
        />
        <SparkTile
          label="DRAWDOWN"
          value="-3.1%"
          series={drawdown}
          sparkLabel="近 9 期回撤走势"
          trendTone="neutral"
          note="峰值 -6.8% · 02-14"
        />
        <SparkTile label="TURNOVER" value="0.62" unit="/月" series={stable} sparkLabel="近 9 期换手" note="稳定" />
        <SparkTile
          label="EXPOSURE"
          value="131"
          unit="/ 150%"
          series={exposure.map((v) => 20 - v)}
          sparkLabel="近 9 期敞口，虚线是上限"
          threshold={19}
          state="near"
          note="接近上限"
        />
        <SparkTile label="SHARPE 60D" value={null} series={[]} sparkLabel="夏普：没有数据" note="等待数据" />
      </div>

      <div className="gal-grid-5">
        <SparkTile
          label="FILLS"
          value={String(clicks)}
          series={stable}
          sparkLabel="近 9 期成交"
          delta={-0.8}
          note="点我 +1"
          onClick={() => setClicks((n) => n + 1)}
        />
      </div>
    </>
  )
}
```

## States

- 平常：bg-200 单元格加发丝边，线 1.5px series-1，末点橙。
- 接近 / 越过阈值：边框转暗橙，说明转琥珀；越过时脉冲一次。
- 没有数据：数值写 —，线的位置写 —，不画样本。
- 可点：悬停底色提亮，键盘聚焦画焦点环。

## Don't

- 一行不要超过 5 个；更多拆两行或进表格。
- 迷你线不画轴、网格、数值。
- 不要用颜色区分瓦片类型，只用标签；接近阈值要在说明里写字，不只靠边框颜色。
- 没有数据时不要传一列 0 凑数。

## Composition

```
SparkTile
  ChangeText
  RollingText（给了 rollValue 时）
```

## Keyboard

- `Enter / Space`：给了 onClick 时触发

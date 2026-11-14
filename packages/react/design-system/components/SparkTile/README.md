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
import { SparkTile } from '@katana-ui/react/quant'

export function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 随机游走：从 start 起 count 个点，每步 ±step 内。 */

export function walk(seed: number, count: number, start = 100, step = 2): number[] {
  const next = seeded(seed)
  const out = [start]
  for (let i = 1; i < count; i++) out.push(+(out[i - 1]! + (next() - 0.5) * 2 * step).toFixed(2))
  return out
}

const spark = (seed: number, base: number, drift: number, spread: number) =>
  walk(seed, 24, base, spread).map((v, i) => v + i * drift)

export function SparkTileUsage() {
  const days = Array.from({ length: 24 }, (_, i) => `D-${24 - i}`)
  const fmt = (v: number) => v.toFixed(2)
  return (
    <>
      <div
        className="gal-wide"
        data-gallery-spark
        style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}
      >
        <SparkTile
          label="NET ASSET"
          text="¥ 2.42M"
          value={2.42}
          series={spark(21, 100, 0.6, 2)}
          pointLabels={days}
          formatPoint={fmt}
          seriesLabel="净值走势（演示）"
          delta="+1.31% 今日"
          deltaTone="up"
        />
        <SparkTile
          label="DRAWDOWN"
          text="-3.1%"
          value={-3.1}
          series={spark(22, 10, -0.3, 1.5)}
          pointLabels={days}
          formatPoint={fmt}
          seriesLabel="回撤走势（演示）"
          trendTone="neutral"
          delta="峰值 -6.8% · 02-14"
        />
        <SparkTile
          label="SHARPE 60D"
          text="1.84"
          value={1.84}
          series={spark(23, 14, 0.1, 1.2)}
          pointLabels={days}
          formatPoint={fmt}
          seriesLabel="夏普走势（演示）"
          delta="区间 1.2–2.1"
        />
        <SparkTile
          label="TURNOVER"
          text="0.62"
          value={0.62}
          unit="/月"
          series={spark(24, 10, 0, 1.4)}
          pointLabels={days}
          formatPoint={fmt}
          seriesLabel="换手走势（演示）"
          delta="稳定"
        />
        <SparkTile
          label="EXPOSURE"
          text="131"
          value={131}
          unit="/ 150%"
          series={[110, 112, 111, 118, 117, 124, 122, 128, 131]}
          threshold={150}
          near
          formatPoint={fmt}
          seriesLabel="敞口走势（演示）"
          delta="接近上限"
        />
      </div>
    </>
  )
}

/** 演示用的 90 笔平仓：2026-10-08 起，间隔不等（有的隔几分钟、有的隔几小时），权益从 50,000 起，带一段回撤。 */
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

# SparkTile

KPI 行的瓦片：点阵标签、LCD 数值、24px 迷你折线（末点橙）、一行变化说明；有阈值画琥珀虚线，接近阈值边框转暗橙并脉冲一次。对设计稿的 SparkTile 卡。

## Provide

`*` marks a required prop.

### SparkTile

一行最多 5 个，由调用方的布局定。迷你线不画轴、不画网格、不标数值；悬停出 LCD tooltip。给 onOpen 就渲染成按钮（点开该指标的完整图）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | — | 点阵标签（大写短码）。 |
| `text / value` | `string \| null / number \| null` | — | 数值的显示文字与数；没有数据两个都传 null，显示「—」。数变化时逐位滚动。 |
| `unit` | `string` | — | 数值后的小字单位。 |
| `series` | `number[]` | — | 迷你线的数，从旧到新；少于两个数不画。 |
| `pointLabels / formatPoint` | `string[] / (v) => string` | — | 悬停 tooltip 的时间标签与值的写法。 |
| `delta / deltaTone` | `string / up \| down \| muted \| warn` | — | 变化行。up、down 用涨跌色（只给这行数字）。 |
| `threshold` | `number` | — | 上限或下限：画 1px 琥珀虚线，迷你线的范围把它包进来。 |
| `near` | `boolean` | — | 接近阈值：边框转暗橙、变化行转琥珀、脉冲一次。是否接近由调用方判（比例没有通用的出处）。 |
| `trendTone` | `series \| neutral` | `series` | neutral 用灰线，表示「越低越好」的指标。 |
| `seriesLabel` | `string` | — | 迷你线的读屏名。 |

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

- 默认：迷你线 series-1，末点橙。
- 越低越好：trendTone 为 neutral，线用 ink-300。
- 有阈值：琥珀虚线；near 时边框转暗橙。
- 没有数据：数值写「—」，不画迷你线。

## Don't

- 不要用颜色区分瓦片类型：只用标签。
- 不要在迷你线上画轴、网格或数值。
- 一行不超过 5 个：更多拆两行或进表格。

## Composition

```
SparkTile
  点阵标签
  LCD 数值（RollingText）
  迷你线（svg + 末点 + 阈值虚线 + LCD tooltip）
  变化行
```

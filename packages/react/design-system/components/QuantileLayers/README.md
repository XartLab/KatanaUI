# QuantileLayers

因子分层累计收益（卡 QuantileLayers）：层号是序数，线色取 seq-200 到 seq-600（暗到亮，最高层最亮），不用类别色也不用涨跌色。多空差是点阵纹理面加 ink-100 细线，线尾标最高层与最低层，最高层末点是强调色。悬停一层其余变 40%，点击锁定；扫读出 LCD 提示；底部一行结论（单调性灯加词、各项统计、来源）。图右上三件，表格视图必有。

## Provide

`*` marks a required prop.

### QuantileLayers

文字全由 props 传。分层多于 10 不画线，只给表格（卡写改热力图，热力图待做）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `layers` | `QuantileLayer[]` | — | { rank, label, points }；points 是累计收益，非有限数是缺口。 |
| `longShort` | `number[]` | — | 多空差序列（最高层减最低层）。 |
| `longShortLabel` | `string` | — | 多空差的名字。 |
| `labels` | `QuantileLayersLabels` | — | 读屏名、表格表头、单调性两个词、分层太多的提示、图右上三件的名字。 |
| `formatValue / formatX` | `function` | — | 数值与横轴格怎么写（纵轴、提示、表格）。 |
| `monotonic` | `boolean` | — | 单调性结论；不给就按期末累计收益是否随层号严格递增算。 |
| `stats` | `{ key, label, value }[]` | — | 结论行的统计（多空年化、换手、样本……），口径由调用方写好。 |
| `source` | `ReactNode` | — | 来源一行。 |
| `onExport / onFullscreen` | `() => void` | — | 不给就不画那个按钮；表格视图总有。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { QuantileLayers } from '@katana-ui/react/quant'

function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 正态分布样本（Box-Muller），均值与标准差自己给。 */

function gaussians(seed: number, count: number, mean: number, sd: number): number[] {
  const next = seeded(seed)
  const out: number[] = []
  while (out.length < count) {
    const u = Math.max(next(), 1e-9)
    const v = next()
    const r = Math.sqrt(-2 * Math.log(u))
    out.push(mean + sd * r * Math.cos(2 * Math.PI * v))
    if (out.length < count) out.push(mean + sd * r * Math.sin(2 * Math.PI * v))
  }
  return out
}

function layerSeries(monotone: boolean) {
  return [-22.5, -8, monotone ? 1 : -12, 11, 32].map((final, i) => {
    let sum = 0
    const months = gaussians(200 + i, 31, final / 31, 0.8)
    return { rank: i + 1, label: `Q${i + 1}`, points: months.map((month) => (sum += month)) }
  })
}

function QuantileCase({ monotone, id }: { monotone: boolean; id: string }) {
  const layers = layerSeries(monotone)
  const longShort = layers[4]!.points.map((value, i) => value - layers[0]!.points[i]!)
  const x = (i: number) => `${2024 + Math.floor(i / 12)}-${String(1 + (i % 12)).padStart(2, '0')}`
  const labels = {
    chart: '示例：因子分层累计收益',
    actions: { group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' },
    x: '日期',
    layers: '分层',
    table: '分层累计收益表',
    monotonicPass: '通过',
    monotonicFail: '未通过',
    monotonic: '单调性',
    tooMany: '分层多于 10，不画线。',
  }
  const stats = [
    // 多空年化 = 多空差期末累计（%）按 31 个月折成年的复合收益。
    {
      key: 'ls',
      label: '多空年化',
      value: `${((Math.pow(1 + longShort.at(-1)! / 100, 12 / 31) - 1) * 100).toFixed(1)} %`,
    },
    { key: 'turn', label: '换手', value: '0.62 /月' },
    { key: 'n', label: '样本', value: '31 期 · 4 280 只' },
  ]
  return (
    <div className="gal-wide" data-gallery-quantile={id}>
      <QuantileLayers
        layers={layers}
        longShort={longShort}
        title="MOM_RS_V3 · 5 分层累计超额"
        longShortLabel="Q5−Q1"
        labels={labels}
        formatValue={(value) => ({ value: value.toFixed(1), unit: '%' })}
        formatX={x}
        stats={stats}
        source="来源 / 演示数据 · 固定种子合成 · 非回测"
        onExport={() => {}}
      />
    </div>
  )
}

export function QuantileLayersUsage() {
  return (
    <>
      <QuantileCase monotone id="pass" />

      <QuantileCase monotone={false} id="fail" />
    </>
  )
}
```

## States

- 默认：每层一条 2px 线，多空差点阵面垫底，0 线 line-200，最高层末点强调色并标值。
- 悬停或聚焦一层按钮：其余层变 40%；点击锁定（再点解除）。
- 指针在图上移动或 ←→ 键：竖线加 LCD 提示，列各层与多空差的值。
- 单调性：灯加词，通过 / 不通过各一个词，不单靠颜色。

## Don't

- 不要用类别色或涨跌色画分层：层号是序数。
- 不要给多空线单独上色：用 ink-100 细线或点阵面。
- 不要超过 10 层画线：线挤成一团，改看表格或热力图。

## Composition

```
QuantileLayers
  ChartActions
  图（svg：网格 · 点阵面 · 0 线 · 多空线 · 分层线 · 竖线）+ 纵轴刻度 + 线尾标 + 末点 + LcdTooltip
  层按钮一排
  结论行 · 来源
```

## Keyboard

- `← / →`：扫读一格（Shift 三格），Home / End 到头尾，Esc 清掉
- `Tab / Enter`：层按钮：聚焦时淡出其余，Enter 锁定

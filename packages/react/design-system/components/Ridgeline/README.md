# Ridgeline

每组一条核密度曲线，上下叠着排，一眼比各组分布的位置、宽窄与形状（分位层、因子分组的收益分布）。带宽默认 Silverman 经验规则；给了基准线就画一条贯穿的虚线。分层是序数：线与点阵面取 seq 色阶（暗到亮），不用涨跌色。悬停或聚焦一条，其余变暗。功能参照 Arc Ridgeline，实现原创。

## Provide

`*` marks a required prop.

### Ridgeline

文字全由 props 传：每一条的整句在 describe 里。图是一个 role=group，每条一个带整句名的 role=img。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `groups` | `RidgeGroup[]` | — | { id, label, values: number[] }，从上到下排；不是有限数的值丢掉。 |
| `label` | `string` | — | 整张图的读屏名。 |
| `describe` | `(group, stats) => string` | — | 一条的整句（读屏名与读数行）；stats 有 n、mean、median、min、max。 |
| `formatValue` | `(value: number) => string` | `String` | 横轴刻度怎么写。 |
| `baseline` | `number` | — | 参照线的位置（如 0）；给了就画一条贯穿的虚线。 |
| `domain` | `[number, number]` | — | 横轴范围；不给取全体数据加两头各 3 个带宽。 |
| `bandwidth` | `number` | — | 核密度的带宽；不给每组用 Silverman 规则。 |
| `rowHeight` | `number` | `40` | 一行的高（viewBox 单位）。 |
| `overlap` | `number` | `2` | 最高的山峰是一行高的几倍；大于 1 山脊叠进上一行。视觉取值，待定。 |
| `idle` | `ReactNode` | — | 没有悬停也没有聚焦时读数行写什么。 |

### ridgelines(groups, options) / silvermanBandwidth(values)

silvermanBandwidth 是 h = 0.9 · min(σ, IQR / 1.34) · n^(−1/5)（Silverman 1986 式 3.31）；少于两个数或全相等返回 null，ridgelines 用范围的 1/50 兜底（待定）。gaussianKde(values, xs, h) 是高斯核密度，积分为 1。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { Ridgeline } from '@katana-ui/react/quant'

const ACTIONS = { group: '图的操作', table: '表格视图', exportCsv: '导出 CSV', fullscreen: '全屏' }

const view = (tableHead: string[], tableLabel: string) => ({
  actionLabels: ACTIONS,
  tableLabel,
  tableHead,
  onExport: () => {},
  onFullscreen: () => {},
  source: '来源 / 演示数据 · 固定种子合成 · 非行情',
})

// #1918：分布与关系类的件的演示。下面所有数据都是演示用的示例（在这个展示页里写死或用固定种子构造，不是行情，也不是真实的连接状态），页上也写明了；应用里没有样本数据。

/** 固定种子的伪随机（mulberry32）：同样的种子永远同样的演示数据，e2e 的几何断言才稳。 */

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

const LAYERS = [-1.2, -0.4, 0.1, 0.7, 1.5].map((mean, i) => ({
  id: `q${i + 1}`,
  label: `第 ${i + 1} 层`,
  values: gaussians(100 + i, 400, mean, 1.8),
}))

export function RidgelineUsage() {
  return (
    <>
      <div className="gal-wide" data-gallery-ridge="layers">
        <Ridgeline
          {...view(['分层', '说明'], '分层收益分布表')}
          groups={LAYERS}
          label="示例：因子分层的日收益分布"
          baseline={0}
          formatValue={(value) => `${value} %`}
          describe={(group, stats) =>
            `${group.label}：中位数 ${stats.median.toFixed(2)} %，均值 ${stats.mean.toFixed(2)} %，${stats.n} 个`
          }
          idle="悬停或用上下键选一层"
        />
      </div>

      <div className="gal-wide" data-gallery-ridge="plain">
        <Ridgeline
          {...view(['分层', '说明'], '分层收益分布表')}
          groups={LAYERS.slice(0, 3)}
          label="示例：前三层（无基准线）"
          rowHeight={28}
          overlap={1.5}
          describe={(group, stats) => `${group.label}：中位数 ${stats.median.toFixed(2)} %`}
        />
      </div>
    </>
  )
}

/** 8 个示例品种的再平衡前后权重（%）：写死的表，几项故意挨得很近（12.0 与 12.4、8.0 与 8.3），用来看标签防重叠。 */
```

## States

- 默认：每条是点阵纹理的面加顶线，中位数一根竖标；颜色按条的次序取 --k-heat-1 到 --k-heat-5（中性灰浓度）。
- 给了 baseline：多一条贯穿的虚线；涨跌色不出现（也不跟 data-updown 变）。
- 悬停或聚焦一条：其余变暗，读数行写这一条的整句。
- 取不出带宽的组（少于两个数或全相等）画成一个窄峰。

## Don't

- 不要用它比样本很少的组：核密度在几个点上画出的形状不可信，describe 里把个数写出来。
- 不要在数量级不同的组之间共用一条横轴：先标准化或分开画。
- 不要拿颜色表达涨跌：颜色只是层的次序，中位数竖标与读数行写出了数值。

## Composition

```
Ridgeline
  svg role=group
    g（刻度线与基准线）
    g role=img（一条：标签 · 底线 · 填充 · 顶线 · 中位数竖标）
  output（读数行）
```

## Keyboard

- `↑ / ↓`：焦点在条间移动，到头不绕回
- `Home / End`：跳到第一 / 最后一条

# Ridgeline

每组一条核密度曲线，上下叠着排，一眼比各组分布的位置、宽窄与形状（分位层、因子分组的收益分布）。带宽默认 Silverman 经验规则；给了基准线就按中位数在它上下涂涨跌色。悬停或聚焦一条，其余变暗。功能参照 Arc Ridgeline，实现原创。

## Provide

### Ridgeline

文字全由 props 传：每一条的整句在 describe 里。图是一个 role=group，每条一个带整句名的 role=img。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `groups` | `RidgeGroup[]` | — | { id, label, values: number[] }，从上到下排；不是有限数的值丢掉。 |
| `label` | `string` | — | 整张图的读屏名。 |
| `describe` | `(group, stats) => string` | — | 一条的整句（读屏名与读数行）；stats 有 n、mean、median、min、max。 |
| `formatValue` | `(value: number) => string` | `String` | 横轴刻度怎么写。 |
| `baseline` | `number` | — | 参照线的位置（如 0）；给了画虚线，并按中位数涂 pnl-up / pnl-down。 |
| `domain` | `[number, number]` | — | 横轴范围；不给取全体数据加两头各 3 个带宽。 |
| `bandwidth` | `number` | — | 核密度的带宽；不给每组用 Silverman 规则。 |
| `rowHeight` | `number` | `40` | 一行的高（viewBox 单位）。 |
| `overlap` | `number` | `2` | 最高的山峰是一行高的几倍；大于 1 山脊叠进上一行。视觉取值，待定。 |
| `idle` | `ReactNode` | — | 没有悬停也没有聚焦时读数行写什么。 |

### ridgelines(groups, options) / silvermanBandwidth(values)

silvermanBandwidth 是 h = 0.9 · min(σ, IQR / 1.34) · n^(−1/5)（Silverman 1986 式 3.31）；少于两个数或全相等返回 null，ridgelines 用范围的 1/50 兜底（待定）。gaussianKde(values, xs, h) 是高斯核密度，积分为 1。

## States

- 默认：每条是填充加顶线，中位数一根竖标；没有基准线时用中性色。
- 给了 baseline：中位数在它之上用涨色、之下用跌色（跟 data-updown 走），平用中性色。
- 悬停或聚焦一条：其余变暗，读数行写这一条的整句。
- 取不出带宽的组（少于两个数或全相等）画成一个窄峰。

## Don't

- 不要用它比样本很少的组：核密度在几个点上画出的形状不可信，describe 里把个数写出来。
- 不要在数量级不同的组之间共用一条横轴：先标准化或分开画。
- 不要拿颜色单独表达涨跌：中位数竖标与读数行写出了数值。

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

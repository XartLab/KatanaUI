# MetricCard

照 uiarc 的 Metric explorer 的结构：标题、大号当前值、较前日 / 周 / 月 / 年的变化（涨跌色）、迷你走势线（1 月 / 3 月 / 6 月 / 1 年分段）、可选阶段带（五档边界与文案由调用方给）、来源与更新时间一行；MetricCardGrid 把卡排成墙。组件只画不算，数据与文字都由调用方传，没有数据就是空态。

## Provide

### MetricCard

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `title / value / unit` | `string / string \| null / string` | — | 标题、已格式化的当前值（没有数据传 null，写 —）、数值后的小字。 |
| `changes` | `MetricChange[]` | — | { key, label, value（百分数，null 写 —） }，想放几个放几个，涨跌色带箭头。 |
| `ranges` | `MetricRange[]` | — | { key, label, values }：每段的走势（从旧到新）；多于一段时出分段控件。 |
| `range / defaultRange / onRangeChange` | `string / string / (key) => void` | — | 当前段；不给就内部管。 |
| `trendTone` | `'direction' \| 'neutral' \| 'inverse'` | — | 走势线着色：direction 头尾涨跌（默认）；neutral 中性灰白（恐惧贪婪、情绪分这类没有好坏方向的）；inverse 涨是坏（如 VIX），涨取跌色。 |
| `rangeLabel / sparkLabel` | `string` | — | 分段控件与走势线的读屏名（整句）。 |
| `stages / current` | `MetricStage[] / number` | — | 阶段带：{ label, from, to } 从低到高，current 是当前值；所在档全亮、其余 35%，带上一根竖线标当前，下面写档名。 |
| `source / updatedAt` | `ReactNode` | — | 来源与更新时间，底部一行。 |

### MetricCardGrid

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | `string` | — | 整墙的读屏名。 |
| `ranges / range / defaultRange / onRangeChange / rangeLabel` | `{ key, label }[] / string / string / (key) => void / string` | — | 共用区间分段，放在墙顶一次；传了它卡片不再各画分段控件，都按这个 key 取自己 ranges 里同 key 的一段。 |
| `minWidth` | `number` | — | 每张卡最小宽（px），默认 260；一行几张由容器宽决定。 |

## States

- 变化与走势线用涨跌色（跟 data-updown）；走势线颜色按所选区间的头尾涨跌。
- 阶段带从跌色经灰到涨色，当前档全亮；档名写在带下面，不只靠颜色。
- 没有数据：数值写 —，变化写 —，线的位置写 —，不画样本。

## Don't

- 不要在件里算指标、写死中文或写死阶段边界；都由调用方传。
- 不要把阶段带当买卖信号；它只是读数落在哪一档。
- 不要用橙色或蓝色画数据。

## Composition

```
MetricCardGrid
  MetricCard
    标题 | 分段控件（ToggleGroup）
    当前值
    变化（ChangeText）
    走势线（Sparkline）
    阶段带
    来源 · 更新时间
```

## Keyboard

- `Tab`：到分段控件（← → 移动，Space / Enter 选）

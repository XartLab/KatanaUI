# SparkTile

KPI 行的瓦片：点阵标签、LCD 数值、24px 迷你折线（末点橙）、一行变化说明；有阈值画琥珀虚线，接近阈值边框转暗橙并脉冲一次。对设计稿的 SparkTile 卡。

## Provide

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

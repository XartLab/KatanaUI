# QuantileLayers

因子分层累计收益（卡 QuantileLayers）：层号是序数，线色取 seq-200 到 seq-600（暗到亮，最高层最亮），不用类别色也不用涨跌色。多空差是点阵纹理面加 ink-100 细线，线尾标最高层与最低层，最高层末点是强调色。悬停一层其余变 40%，点击锁定；扫读出 LCD 提示；底部一行结论（单调性灯加词、各项统计、来源）。图右上三件，表格视图必有。

## Provide

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

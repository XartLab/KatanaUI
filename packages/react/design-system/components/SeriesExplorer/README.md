# SeriesExplorer

盈亏探索积木：区间按钮（3M / 6M / 12M / 全部）、KPI 卡（值加相对上一期的变化，数字滚动）、序列开关、「对比上一期」开关、堆叠柱加净盈亏线、下面的刷选条、明细表。功能参照 Arc 的 Revenue explorer。

## Provide

### SeriesExplorer

序列、区间、KPI、明细表的列都由调用方传，包里没有文案。点按时间从旧到新，at 是毫秒时间戳（UTC）；区间是最近 N 个日历月。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `points` | `{ at: number; values: Record<string, number> }[]` | — | 每个点一个时间戳与各序列的值（KPI 用到的、不画的值也放在这里）。 |
| `series` | `{ key, label, kind: "bar" \| "line", color? }[]` | — | bar 堆叠柱（正的往上叠、负的往下叠）；line 折线（净盈亏这类和柱同量级的）；color 不给取 --series-N。 |
| `ranges / defaultRange` | `{ key, label, months: number \| null }[]` | — | 区间按钮；months 是最近几个日历月，null 是全部；默认选最后一个。 |
| `kpis` | `{ key, label, series, reduce, format }[]` | — | 三张 KPI 卡：reduce 是 sum / last / avg，变化是相对上一期的比例。 |
| `columns` | `{ key, label, text, tone? }[]` | — | 明细表的列（第一列是时间，包里加）；tone 给了就按正负着涨跌色。 |
| `labels` | `{ chart, ranges, series, compare, previous, table, time, empty, brush }` | — | 所有说明文字（读屏名、开关字、表头、空态、刷选条三个手柄名）。 |
| `formatAt` | `(at: number) => string` | — | 时间写成什么：横轴、悬停框、明细表、刷选条读屏值都用它（时区与语言由调用方定）。 |
| `formatValue / formatChange` | `(value) => string` | — | 图上的数怎么写 / 相对上一期的变化（比例）怎么写。 |
| `chartHeight` | `number` | `220` | 图高（px）。 |

## States

- 默认：最后一个区间，三张 KPI、全部序列、对比关。
- 拖刷选条：窗口改了，区间按钮都不亮；点区间按钮回到那个区间。
- 对比上一期：窗口前面够长才可开，画第一条折线的上一期（虚线，按下标对齐）；不够长开关禁用。
- 序列关掉：柱或线消失，纵向范围重算；KPI 不跟着开关变（它们按区间算）。
- 扫读：竖线、悬停框（各序列的值）、明细表里对应的行一起亮。
- 没有点：只写空态。

## Don't

- 不要在包里算盈亏：已实现、手续费、净值都由调用方在 points 里给好。
- 不要把量级差很多的序列放进同一张图：柱与线共用一根纵轴，累计权益（上万）会把月度盈亏（几千）压成细条；要看权益另画一张。
- 不要用它画不按时间排的数据：点必须按时间从旧到新。
- 上一期没有或为 0 时变化写破折号，不要自己补一个百分比。

## Composition

```
SeriesExplorer
  ToggleGroup（区间）· Switch（对比上一期）
  KPI 卡 × n（RollingText）
  序列开关（aria-pressed 的按钮）
  图（div[role=group]：svg 堆叠柱 · 折线 · 虚线 · 十字线 · 悬停框）· 横轴
  BrushStrip
  明细表（region）
```

## Keyboard

- `← →`：图上：扫读前后一格；没选中时先落到最新一格
- `Shift + ← →`：一次三格
- `Home / End`：第一格 / 最后一格
- `Esc`：清掉选中
- `Tab`：区间 · 对比开关 · 序列开关 · 图 · 刷选条三个手柄 · 明细表

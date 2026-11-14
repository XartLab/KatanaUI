# SeriesExplorer

盈亏探索积木：一排 KPI 瓦片（SparkTile），点一张展开成下面的图面板；面板顶上是指标页签、区间切换、对比上一期、右上三件，图是该指标的序列（柱或线），下面是刷选条；顶行可以对账（期初到期末、差额、灯加词），页脚来源行。交互参照 Arc 的 Metric explorer，样子与内容照设计稿 IntradayPnL、PnLLedger、EquityCurve 三张卡。

## Provide

### SeriesExplorer

序列、区间、指标、明细表的列都由调用方传，包里没有文案。点按时间从旧到新，at 是毫秒时间戳（UTC）；区间是最近 N 个日历月。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `points` | `{ at, values, closed? }[]` | — | 每个点一个时间戳与各序列的值（指标用到的、不画的值——权益、出入金——也放在这里）。closed 是休市：图上画灰色竖带，时间轴不压缩。 |
| `series` | `{ key, label, kind: "bar" \| "line", color?, cost? }[]` | — | bar 柱；line 折线（2px，不填面，不用涨跌色）。颜色按在完整列表里的次序取 series-1..7，筛选不重新上色；cost 是成本类（费税），柱用 ink-100 不着色。 |
| `kpis` | `{ key, label, series, reduce, format, lowerIsBetter?, limit? }[]` | — | 每个指标一张瓦片、一个页签。limit 是限额线：图上红虚线、瓦片上琥珀虚线；lowerIsBetter 用灰色迷你线。 |
| `ranges / defaultRange` | `{ key, label, months: number \| null }[]` | — | 区间按钮；months 是最近几个日历月，null 是全部；默认选最后一个。 |
| `reconcile` | `{ net, equity, cashflow?, openingEquity, format }` | — | 对账：期末 − 期初 应等于 Σ净盈亏 + 出入金；对得上亮 ok 灯，否则 warn 灯并写差额。三个键指向 points 里的序列。 |
| `columns / labels` | `object` | — | 明细表的列（表格视图里）；所有说明文字（读屏名、开关字、来源行、对账的词、右上三件的名字、刷选条手柄名）。 |
| `formatAt / formatValue / formatChange` | `functions` | — | 时间（ISO 次序）、图上的数、相对上一期的变化各写成什么。 |
| `onExport / onFullscreen / defaultMetric` | `callbacks / string \| null` | — | 导出与全屏回调不给就不画按钮；初始展开哪个指标，null 是收起。 |
| `chartHeight` | `number` | `220` | 图高（px）。 |

## States

- 默认：展开第一个指标，最后一个区间，对比关。
- 点瓦片：展开那个指标的面板；再点同一张收起；Esc 先清扫读点、再收起。
- 切指标或区间：线平滑变形（Chromium），页签高亮滑过去。
- 拖刷选条：窗口改了，区间按钮都不亮；点区间按钮回到那个区间。
- 对比上一期：窗口前面够长才可开，画同一序列的上一期（灰色虚线，按下标对齐）；不够长开关禁用。
- 对账对不上：灯转琥珀，差额写在后面。
- 表格视图：右上角第一个按钮切到明细表（键盘可达）。

## Don't

- 不要在包里算盈亏：已实现、手续费、净值都由调用方在 points 里给好。
- 不要给线填面或用涨跌色：涨跌色只上数字（明细表的盈亏列、瓦片的变化行）。
- 不要给费税着色：成本不是亏损，柱用 ink-100。
- 不要用它画不按时间排的数据：点必须按时间从旧到新。
- 上一期没有或为 0 时变化写破折号，不要自己补一个百分比。

## Composition

```
SeriesExplorer
  对账顶行（LCD：期初 → 期末 · 差额 · 灯 + 词）
  SparkTile × n
  面板（页签 · 区间 · 对比 · ChartActions）
    图（div[role=slider]：svg 柱或线 · 休市带 · 限额线 · 末点 · LCD tooltip）或 表格视图
    BrushStrip
  来源行
```

## Keyboard

- `← →`：页签上：切指标；图上：扫读前后一点（没选中时先落到最新一点）
- `Shift + ← →`：图上一次三点
- `Home / End`：页签：第一个 / 最后一个指标；图：第一点 / 最后一点
- `Esc`：先清扫读点，再收起面板
- `Enter / Space`：瓦片：展开或收起

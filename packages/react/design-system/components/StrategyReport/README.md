# StrategyReport

回测结果的一整页，页签照 TradingView 策略测试器：概览（一排关键读数：净利润、总收益率、最大回撤、胜率、盈亏比、交易次数、夏普；下面是权益曲线与回撤，可叠同期买入持有）、绩效（全部 / 多 / 空三列的指标表）、交易分析（盈亏分布与持仓时长的直方图、连续盈亏条、读数清单）、风险比率（夏普、索提诺、卡玛、恢复因子、回撤与上冲）、交易列表（DataGrid，每笔进出场、数量、盈亏、累计、最大浮盈浮亏，行可展开看信号与持仓时长）、属性（参数与回测设置的分组键值）。顶上「全部 / 多 / 空」管概览、交易分析与交易列表；绩效与风险比率三列并排，当前那列加亮。指标全由逐笔平仓算，口径写在 strategy-report-model.ts 的注释里（夏普与索提诺按日收益年化，年化日数由 periodsPerYear 给）。结构参照 TradingView 策略测试器帮助页（2026-11-15 读到概览页；其余页签没读到页面，按需求稿的结构做，待核对）。演示数据是固定种子合成的，页上与小标都写明。

## Provide

### StrategyReport

页签与多空的状态在件内；数据、数字格式与全部文字由调用方传，件不认识任何应用或交易所，包里没有语言。高度由外层给（件撑满外层，每页自己滚；交易列表的表撑满页签区）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `trades` | `ReportTrade[]` | — | { id, side: long | short, entryTime, exitTime（毫秒）, entryPrice, exitPrice, quantity, pnl（已扣费）, maxRunup（≥ 0）, maxDrawdown（≤ 0）, entrySignal?, exitSignal? }。不用排序，件按平仓时间算。 |
| `initialCapital` | `number` | — | 初始资金：总收益率、回撤比例、年化收益按它算。 |
| `periodsPerYear / riskFree` | `number` | `252 / 0` | 夏普与索提诺的年化日数（A 股、美股 252，加密 365）与年化无风险利率（小数）。 |
| `benchmark` | `{ name: string; at: (time: number) => number }` | — | 同期买入持有：给一个时刻，返回那时的买入持有权益（起点是初始资金）。不给就不画虚线与概览里的买入持有读数。 |
| `properties` | `{ id, title, rows: { label, value }[] }[]` | — | 属性页：参数与回测设置，分组的键值，值已是写好的字。 |
| `format` | `StrategyReportFormat` | — | money、percent（0.12 → 12%）、price、quantity、time、duration（毫秒）必填；ratio（默认两位小数）与 axisTime（图横轴的短时刻）可选。件不格式化数值。 |
| `labels` | `StrategyReportLabels` | — | 全部文字：tabs、side、metrics（每个指标名）、equity（权益曲线的标题、线名、读屏名与图自带的文字）、analysis（直方图每根柱与连续条每一笔的整句）、list（列名、多空、展开行的字）、empty。 |
| `badge` | `string` | — | 页签行右端的小标，如「演示数据」。 |
| `defaultTab / defaultSide` | `string` | — | 起始页签与多空，默认概览与全部。 |
| `onTabChange / onSideChange` | `callback` | — | 页签或多空变了通知调用方（可选）。 |
| `onExport` | `(csv, fileName) => void` | — | 给了，交易列表的表头菜单里出「导出 CSV」。 |

### computeReport(trades, options)

逐笔平仓 → 全部读数与权益曲线的纯函数（净盈亏、盈亏因子、胜率、盈亏比、期望、连胜连亏、最大回撤与上冲、回撤段、夏普、索提诺、卡玛、年化、恢复因子）；没有亏损时盈亏因子、盈亏比是 null。件内部用它，调用方想在别处出同样的数也可以直接调。

## States

- 没有交易（或筛选后没有）：概览、交易分析、交易列表写 labels.empty；绩效与风险比率照常出表，数值为 0 或「—」。
- 读数算不出来（没有亏损的盈亏因子、日收益全相同的夏普）写「—」，不写 0。
- 涨跌色只给字；直方图与连续条的面用中档涨跌色（灰是持平），没有橙色与蓝色。
- 多空切换时，绩效与风险比率三列不变，当前那列加亮；别的页按所选的多空重算。

## Don't

- 不要传已经汇总好的指标：件只收逐笔平仓，这样多空、绩效、分布的数永远对得上。
- 不要把演示数据当回测结果：真实回测的接入在应用里另做。
- 不要在件里写文字：指标名、列名、整句都由 labels 传。

## Composition

```
StrategyReport
  Tabs
    顶行：TabsList（line）· 小标 · ToggleGroup（全部 / 多 / 空）
    概览：关键读数条 · EquityCurve（权益与回撤，可带买入持有）
    绩效 / 风险比率：table（三列：全部、多、空）
    交易分析：直方图 svg × 2 · 连续盈亏条 · dl
    交易列表：DataGrid（renderSubRow 展开）
    属性：分组 dl
```

## Keyboard

- `← / →`：在页签间移动（Radix Tabs）
- `Tab`：页签行、多空切换、各页里的图与表之间移动
- `→ / ←`：交易列表里：焦点所在行展开 / 收起

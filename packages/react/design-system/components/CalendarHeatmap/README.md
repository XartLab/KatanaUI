# CalendarHeatmap

月历格：底色是收益（或换手）的低饱和发散热力，格内日期左上、数值右下，左下点阵事件点（最多 3 个，更多写 +n）；休市日灰底写「休」，今天强调色描边，周标 W40。切「事件」视图时格子不着色。mode 为 year 是整年的格子。对设计稿的 Calendar 卡；功能参照 Arc 的 Activity heatmap。

## Provide

### CalendarHeatmap

日期是不带时区的日历日 YYYY-MM-DD，按 UTC 零点算。外观读 CSS 变量，见 theme/chart-kit.css 开头。年视图用的是整年的格子（一周一列），不是 12 个缩小月历（待定：第一版先做整年格子）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `days` | `{ date, value, open?, events? }[]` | — | value 没有数据传 null（与 0 持平分开）；open 为 false 是休市日；events 是事件点（tone 为 holding / high 的画琥珀点）。 |
| `mode / month` | `month \| year / YYYY-MM` | `month` | 月历显示哪个月（不给取最晚那天所在的月）；year 用 from / to。 |
| `view` | `pnl \| turnover \| events` | `pnl` | 收益用发散色；换手用序数色 seq；事件视图格子不着色、列事件文字。 |
| `today` | `string` | — | 今天：强调色描边；晚于今天的日子不着色、只有事件点。 |
| `weekStart` | `0 \| 1` | `1` | 一周从周日（0）还是周一（1）起。 |
| `weekdayLabels / monthLabels / weekLabel / closedLabel` | `strings` | — | 星期、月份、周标（W40）与「休」，文字由调用方按界面语言传。 |
| `formatValue / describe` | `functions` | — | 格里的数值怎么写；选中的一天读成一句（读数行与读屏）。 |
| `total / toolbar` | `{ text, value } / ReactNode` | — | 顶行右侧的月合计（按正负用涨跌色）；左边放视图切换与月份说明。 |
| `actionLabels / tableHeads` | `object` | — | 右上角三件与表格视图的文字；导出与全屏回调不给就不画，表格视图总有。 |
| `onSelect` | `(date: string) => void` | — | 点一天或选中后按 Enter（写联动 range）。 |

## States

- 默认：开市日按收益着色，休市日灰底写「休」，今天描边。
- 格色：发散色浅档是大多数，深档只给超月内 80 分位的格；全饱和不出现。
- 换手视图：序数色，格从暗到亮。
- 事件视图：格子不着色，每格最多列两条事件文字。
- 没有数据的日子：只有日期与「·」，与持平（中点灰）不同。

## Don't

- 不要用涨跌色填格：涨跌色不上面积，只有月合计的数字用。
- 不要拿颜色深浅读精确值：数在格子右下，颜色只给方向与大概多大。
- 不要做 streak、「连胜」计数。
- 不要传带时区的时间戳：传日历日字符串，休市与否由调用方（交易日历）定。

## Composition

```
CalendarHeatmap
  顶行（toolbar · 月合计 · 表格视图 / 导出 / 全屏）
  月历 div[role=grid]（周标 · 每天一个 button：日期 · 数值 · 事件点）或 年视图 svg
  LCD tooltip · 读数行（aria-live）· 色例
```

## Keyboard

- `← →`：前后一天；没选中时先落到最后一天
- `↑ ↓`：前后一周
- `Home / End`：区间第一天 / 最后一天
- `Enter`：触发 onSelect
- `Esc`：清掉选中

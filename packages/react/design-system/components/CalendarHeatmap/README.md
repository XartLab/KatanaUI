# CalendarHeatmap

一年的每日盈亏：一周一列、一天一格，涨跌两套发散色（跟涨跌配色走），深浅按 |值| 占最大 |值| 的比例分四档。补设计稿 Calendar 卡缺的发散热力底色。功能参照 Arc 的 Activity heatmap。

## Provide

### CalendarHeatmap

日期是不带时区的日历日 YYYY-MM-DD，按 UTC 零点算，不碰本地时区与夏令时。整张图画在一个 svg 里，按容器宽等比缩放。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `days` | `{ date: string; value: number }[]` | — | 每天一个值；缺的日子画成没数据（只有淡边），与值为 0（持平）分开。 |
| `from / to` | `string` | — | 起止日（含）；不给取 days 里最早与最晚的。 |
| `weekStart` | `0 \| 1` | `1` | 一周从周日（0）还是周一（1）起。 |
| `weekdayLabels` | `string[7]` | — | 按 JS 星期下标（0 是周日）写；左边隔行显示。文字由调用方传。 |
| `monthLabels` | `string[12]` | — | 一月到十二月；写在每个月第一天所在的列上方。 |
| `describe` | `(date, value \| null) => string` | — | 选中的一天读成一句（下面一行与读屏用）。 |
| `label` | `string` | — | 整张图的读屏名（必填）。 |
| `legend` | `{ down, up }` | — | 色例两端的字；不给不画色例。 |
| `max` | `number` | — | 整张图 |值| 的最大值；不给取 days 里的。几张图共用一把色阶时传。 |
| `onSelect` | `(date: string) => void` | — | 点一天或选中后按 Enter。 |

## States

- 默认：每天一格，涨跌各四档，持平是中性底色。
- 没数据的日子：透明、只有淡边，与持平不同。
- 悬停或键盘选中：这一格描亮边，下面一行读出这一天。
- 没有任何数据：最大值为 0，所有格都是 0 档。

## Don't

- 不要拿颜色深浅读精确值：数在选中后的读数里，格子只给「大概多大、哪个方向」。
- 四档的比例是照 GitHub 贡献图的惯例定的，不是盈亏数据的分布；用真实数据前先看分布（待定）。
- 不要传带时区的时间戳：传日历日字符串，哪天算哪天由调用方（交易日历）决定。

## Composition

```
CalendarHeatmap
  svg[role=group]（月份标签 · 星期标签 · 每天一个 rect）
  读数行（aria-live）
  色例
```

## Keyboard

- `← →`：前后一周（同一行换列）；没选中时先落到最后一天
- `↑ ↓`：前后一天
- `Home / End`：区间第一天 / 最后一天
- `Enter`：触发 onSelect
- `Esc`：清掉选中

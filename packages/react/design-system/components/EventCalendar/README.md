# EventCalendar

照 TradingView 日历的用法：顶上是类别页签（经济 / 财报 / 分红 / IPO，同一件、不同列集，给了哪类数据才有哪个页签），区间分段（昨天 / 今天 / 明天 / 本周 / 下周 / 自定义），重要程度三档格条按钮，国家多选。表按日分组，日期分隔行粘顶，今天那天插「现在」线。经济：时间（带时区）、国家、事件、重要程度条、实际 / 预期 / 前值，实际好于预期涨色、差于预期跌色，已发布的行退一档、未发布的写倒计时；点开一行看说明、来源、历史值小图、下次发布。财报：时段（盘前 / 盘后）、公司、EPS 与营收的实际 / 预期、市值。分红：每股金额、股息率、派息日。IPO：交易所、发行价区间、股数、募资额、状态。数据、现在、时区、文字都由调用方传。

## Provide

### EventCalendar

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `events` | `EconomicEvent[]` | — | 经济事件：{ id, at（毫秒）, region, regionName, flag?, name, importance（1–3）, actual?, forecast?, previous?（格式化好的文字）, tone?（up / down / flat：实际对预期的好坏）, description?, source?, history?（数字，从旧到新）, nextAt? }。给了说明 / 来源 / 历史值 / 下次发布任一项，这一行才能点开。 |
| `earnings / dividends / ipos` | `EarningsEvent[] / DividendEvent[] / IpoEvent[]` | — | 可选；给了哪类就多一个页签。数字都是原值（EPS、营收、市值、每股金额、股息率百分数），件按 formatVolume 等写；财报的实际对预期自己比，高于预期用涨色。分红的 at 是除权日，派息日用 payAt。 |
| `labels` | `EventCalendarLabels` | — | 类别、区间、重要程度、国家多选、各类列名、盘前盘后、倒计时、「现在」、详情小标题、日期标题、空态等文字，由调用方传。 |
| `now` | `number` | — | 现在（毫秒）：今天 / 本周 / 下周、倒计时与「现在」线从它算；件里不读时钟。 |
| `timeZone / locale` | `string` | — | 显示时区（IANA）与语言：分天、时间格式（时间列头带时区缩写）、周起点（周一）都按它。 |
| `defaultRange` | `'yesterday' \| 'today' \| 'tomorrow' \| 'week' \| 'next'` | — | 起始区间，默认今天。 |
| `defaultCategory` | `CalendarCategory` | — | 起始类别，默认经济。 |
| `rowActions` | `(event, category) => RowAction[]` | — | 悬停或键盘聚焦一行时浮在行尾的图标按钮（RowActions），不占列宽；右键出同一份菜单。 |

## States

- 涨色 / 跌色：经济事件的实际值按 tone 上色，不给 tone 不上色；财报 EPS 与营收高于预期涨色、低于预期跌色。
- 已发布：时间与事件名退一档；未发布：实际写「—」，还没到点的在下面写倒计时（「45 分后」）。
- 现在线：只在今天那天的经济 / 财报页出现，插在已过与未到的行之间。
- 行展开：点一行或在行上按 Enter / 空格，详情行在它下面；再点收起。

## Don't

- 不要把橙色用在数据上。
- 不要在件里写死中文或国家表；文字与国家由调用方传。
- 没有数据时不要放样本行，传空数组。

## Composition

```
EventCalendar
  类别页签（经济 | 财报 | 分红 | IPO）
  筛选条：区间分段（昨天 | 今天 | 明天 | 本周 | 下周 | 自定义）| 重要程度三档按钮（仅经济）| 国家多选 | 条数
  列头
  table
    天（rowgroup）：粘顶的日期标题
      行：按类别不同的列（行尾悬停浮出 RowActions）
      现在线（今天）
      详情行（经济，点开后）
```

## Keyboard

- `Tab`：在行间移动焦点
- `Enter / 空格`：展开或收起有详情的行

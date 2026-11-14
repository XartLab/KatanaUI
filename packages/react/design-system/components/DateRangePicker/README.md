# DateRangePicker

起点—终点两个可逐段打字的日期框，右边的日历按钮打开双月日历，左边一列预设：今天、本周、本月、年初至今，不在预设里的显示「自定义」。回放、台账、报告的区间用它。功能参照 Arc，实现原创。

## Provide

### DateRangePicker

值是 { start, end } 一对 YYYY-MM-DD（含两头），按哪个时区解读由调用方定。底座是 react-aria 的 DateField 与 RangeCalendar；浮层用我们的 Popover。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `{ start: string; end: string } \| null` | — | 当前区间；null 是没选。 |
| `onValue` | `(range: DateRange) => void` | — | 凑成合法区间（起点不晚于终点）才回调；只填了一头不回调。 |
| `today` | `string` | — | 今天（YYYY-MM-DD），预设从它算。由调用方按显示时区算好传进来，件里不读时钟。 |
| `weekStart` | `'mon' \| 'sun'` | `'mon'` | 一周从哪天起；「本周」是它到今天。A 股与国际交易所都是周一。 |
| `min / max` | `string` | — | 能选的最早、最晚日期。 |
| `labels` | `DateRangeLabels` | — | 文字：start、end、pickRange、calendar、previousMonth、nextMonth、presets、preset（今天 / 本周 / 本月 / 年初至今）、custom；包里不带语言。 |
| `locale` | `string` | — | 给 react-aria 的语言：中文界面 zh-CN，英文界面 en-CA。 |

## States

- 框内：起点、终点各一个分段输入；终点早于起点标红，不上报。
- 预设：口径是截至今天（本周 = 周起始日到今天，本月 = 1 号到今天，年初至今 = 1 月 1 日到今天）；当前区间正好是某个预设时它高亮。
- 区间不在预设里：预设列末尾显示「自定义」。
- 日历：双月；点两下选起止，起止之间的日子是淡底；选完自动收起。

## Don't

- 不要在件里取「今天」：时区是应用的事，由 today 传进来。
- 预设是截至今天，不含未来的日子；要未来区间（日历、事件预告）另做，别改这组预设的口径。
- 单日选择用 DateTimeInput，别拿起止同一天凑。

## Composition

```
DateRangePicker
  DateField（起点）
  DateField（终点）
  Popover
    预设按钮 × 4 + 自定义
    RangeCalendar（两个 CalendarGrid）
```

## Keyboard

- `← → / Tab`：在日期框的年、月、日各段间走；数字直接打，↑↓ 加减
- `日历按钮 Enter / 空格`：打开日历，焦点进日历
- `方向键 / PageUp / PageDown`：日历里移动日期、翻月
- `Enter / 空格`：日历里选起点，再选终点；选完收起
- `Esc`：收起日历，焦点回到按钮

# DateRangePicker

起点—终点两个可逐段打字的日期框，右边的日历按钮打开双月日历，左边一列预设：今天、本周、本月、年初至今，不在预设里的显示「自定义」。回放、台账、报告的区间用它。功能参照 Arc，实现原创。

## Provide

`*` marks a required prop.

### DateRangePicker

值是 { start, end } 一对 YYYY-MM-DD（含两头），按哪个时区解读由调用方定。底座是 react-aria 的 DateField 与 RangeCalendar；浮层用我们的 Popover。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `{ start: string; end: string } \| null` | — | 当前区间；null 是没选。 |
| `onValueChange` | `(range: DateRange) => void` | — | 凑成合法区间（起点不晚于终点）才回调；只填了一头不回调。旧名 onValue 留一个版本（@deprecated）。 |
| `today` | `string` | — | 今天（YYYY-MM-DD），预设从它算。由调用方按显示时区算好传进来，件里不读时钟。 |
| `weekStart` | `'mon' \| 'sun'` | `'mon'` | 一周从哪天起；「本周」是它到今天。A 股与国际交易所都是周一。 |
| `min / max` | `string` | — | 能选的最早、最晚日期。 |
| `events` | `Record<string, CalendarDayEvent[]> \| (day: string) => CalendarDayEvent[]` | — | 可选（#226）：每天的事件（{ label, tone? }）；有事件的格子画小点，悬停与聚焦读出。不传就没有。 |
| `insight` | `{ text: string; icon?: ReactNode; tone?: Severity }` | — | 可选（#226）：日历脚上一行「图标加一句话」。 |
| `labels` | `DateRangeLabels` | — | 文字：start、end、pickRange、calendar、previousMonth、nextMonth、presets、preset（今天 / 本周 / 本月 / 年初至今）、custom；包里不带语言。 |
| `locale` | `string` | — | 给 react-aria 的语言：中文界面 zh-CN，英文界面 en-CA。 |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { DateRangePicker, type DateRange, type DateRangeLabels } from '@katana-ui/react'

const RANGE_LABELS: DateRangeLabels = {
  start: '起点',
  end: '终点',
  pickRange: '选择区间',
  calendar: '区间日历',
  previousMonth: '上个月',
  nextMonth: '下个月',
  presets: '常用区间',
  preset: { today: '今天', week: '本周', month: '本月', ytd: '年初至今' },
  custom: '自定义',
}

// 演示固定「今天」是 2026-11-14（周六），预设与截图才不随真实日期变；应用里由显示时区算出来传进去。

export function DateRangePickerUsage() {
  const [range, setRange] = useState<DateRange | null>({ start: '2026-11-09', end: '2026-11-14' })
  return (
    <>
      <DateRangePicker value={range} onValueChange={setRange} today="2026-11-14" labels={RANGE_LABELS} locale="zh-CN" />
      <output data-gallery-range>{range ? `${range.start} ~ ${range.end}` : '未选'}</output>

      <DateRangePicker
        value={null}
        onValueChange={() => {}}
        today="2026-11-14"
        min="2026-01-01"
        max="2026-12-31"
        labels={RANGE_LABELS}
        locale="zh-CN"
      />
    </>
  )
}

// 演示用的分类树（不是真实的品种库或数据集）。
```

## States

- 框内：起点、终点各一个分段输入；终点早于起点标红，不上报。
- 预设：口径是截至今天（本周 = 周起始日到今天，本月 = 1 号到今天，年初至今 = 1 月 1 日到今天）；当前区间正好是某个预设时它高亮。
- 区间不在预设里：预设列末尾显示「自定义」。
- 日历：双月；点两下选起止，起止之间的日子是淡底；选完自动收起。
- 事件点与洞察（可选，#226）：传 events（按 YYYY-MM-DD 的表或查询函数）后，有事件的格子下画 4px 的小点（最多 3 个，按语气着色，选中格上改成选中前景）；一天超过 3 件事时只画 2 个点，第 3 个位置换成「+」；悬停或键盘聚焦在这格上，日历脚的读数行（固定一行高，放不下的截断，悬停的 title 给全文）写出当天的事，没有悬停时读选中日（区间日历读起点）；实心底的格子（单月选中格、区间起止两头）上点换成选中前景，区间中段保留语气色。传 insight 后脚上多一行「图标加一句话」。两样都不传，DOM 与样子与原来一致。

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

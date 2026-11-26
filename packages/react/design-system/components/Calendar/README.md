# Calendar

单独摆在页上的月历：选一天、翻月，非交易日用 unavailable 灰掉并加删除线。样子与 DateTimeInput 弹层里的日历同一套（.k-cal*），外面多一圈 container 的边与底；今天字提亮加下划线。行为底座是 react-aria 的 Calendar，日期一律 YYYY-MM-DD 字符串。

## Provide

`*` marks a required prop.

### Calendar

月份名、星期名按 locale 由 react-aria 写；两个翻页钮的读屏名由 labels 给。value 传空字符串表示没选。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `events` | `CalendarEventSource` | — | Events by day (a YYYY-MM-DD table or a lookup function): days with events get dots, hover or focus reads them out. |
| `insight` | `CalendarInsight` | — | One line under the calendar: an icon and a sentence, for example "Avoided the 11-27 half day". |
| `value` | `string` | — | Selected day, YYYY-MM-DD (controlled); '' for none. |
| `defaultValue` | `string` | — | Selected day at first (uncontrolled). |
| `onValueChange` | `(day: string) => void` | — | Called with the picked day, YYYY-MM-DD. |
| `min` | `string` | — | Earliest day that can be picked (YYYY-MM-DD); earlier days are disabled and the previous button stops there. |
| `max` | `string` | — | Latest day that can be picked (YYYY-MM-DD). |
| `unavailable` | `(day: string) => boolean` | — | Days that are shown but cannot be picked (non-trading days, holidays): return true for YYYY-MM-DD to grey it out. |
| `defaultFocusedValue` | `string` | — | Which month opens when nothing is selected (YYYY-MM-DD of any day in it); defaults to today's month. |
| `weekStart` | `WeekStart` | `'mon'` | First column of the week: mon (default) or sun. |
| `locale` * | `string` | — | BCP 47 locale for month and weekday names, for example 'zh-CN'. |
| `label` * | `string` | — | Accessible name of the calendar. |
| `labels` * | `CalendarLabels` | — | Accessible names of the two month buttons. |
| `disabled` | `boolean` | — | Disable the whole calendar. |
| `className` | `string` | — | Extra class names on the calendar's outer element. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Calendar } from '@katana-ui/react'

/** Weekends cannot be picked (an example; pass your own trading calendar). */
const isWeekend = (day: string) => [0, 6].includes(new Date(`${day}T00:00:00Z`).getUTCDay())

export function CalendarUsage() {
  const [day, setDay] = useState('2026-11-20')
  return (
    <Calendar
      label="Go to date"
      locale="en-US"
      labels={{ previousMonth: 'Previous month', nextMonth: 'Next month' }}
      value={day}
      onValueChange={setDay}
      unavailable={isWeekend}
    />
  )
}
```

## States

- 选中：selectable bold 的底、字 600 粗。
- 今天（没选中时）：字提到 primary、600 粗、下划线。
- min / max 之外：降色、点不了，翻页钮到头变禁用。
- unavailable 返回 true 的日子：降色加删除线、点不了（休市、周末）。
- weekStart：mon（默认）或 sun 开头。
- 禁用：整张 45% 不透明度。
- 事件点与洞察（可选，#226）：传 events（按 YYYY-MM-DD 的表或查询函数）后，有事件的格子下画 4px 的小点（最多 3 个，按语气着色，选中格上改成选中前景）；一天超过 3 件事时只画 2 个点，第 3 个位置换成「+」；悬停或键盘聚焦在这格上，日历脚的读数行（固定一行高，放不下的截断，悬停的 title 给全文）写出当天的事，没有悬停时读选中日（区间日历读起点）；实心底的格子（单月选中格、区间起止两头）上点换成选中前景，区间中段保留语气色。传 insight 后脚上多一行「图标加一句话」。两样都不传，DOM 与样子与原来一致。

## Don't

- 要输入框加弹层的用 DateTimeInput，选区间的用 DateRangePicker；这一件只给页面上常驻的日历。
- 不要在件里写交易日历：哪天休市由调用方给 unavailable。
- 不要只靠降色说不可选：删除线是件自带的，别用 className 去掉。

## Composition

```
Calendar（I18nProvider + react-aria Calendar）
  头部：上个月 | 月份标题 | 下个月
  日格表（grid）
```

## Keyboard

- `← → ↑ ↓`：按天、按周移动焦点
- `PageUp / PageDown`：上一月 / 下一月
- `Shift + PageUp / PageDown`：上一年 / 下一年
- `Home / End`：到这一周的头 / 尾
- `Enter / Space`：选中焦点所在的那天

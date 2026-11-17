# DateTimeInput

可以逐段打字的「年-月-日」与「时:分」，日期框右边的日历按钮打开日历；不随浏览器语言变格式。

## Provide

`*` marks a required prop.

### DateTimeInput

值一律是字符串（日期 YYYY-MM-DD，时刻 HH:mm 或 HH:mm:ss，空串是没填完）；按哪个时区解读由调用方定。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` * | `string` | — | Field name used to build the accessible names: the date is read as "<label> date", the time as "<label> time". |
| `date` * | `string` | — | The date as YYYY-MM-DD. |
| `onDate` * | `(value: string) => void` | — | Called with the new date. |
| `time` | `string` | — | The time as HH:mm or HH:mm:ss; omit it (and onTime) for a date-only field. |
| `onTime` | `(value: string) => void` | — | Called with the new time. |
| `seconds` | `boolean` | `false` | Include seconds in the time. |
| `min` | `string` | — | Earliest selectable date (YYYY-MM-DD); days outside the range are disabled and typed dates outside it are marked invalid. |
| `max` | `string` | — | Latest selectable date (YYYY-MM-DD). |
| `size` | `'sm' \| 'md'` | — | sm is 26px high; md (the default) is 30px. |
| `autoFocus` | `boolean` | — | Focus the field on mount, like the native attribute. |
| `className` | `string` | — | Extra class name on the root. |
| `labels` * | `DateTimeLabels` | — | Accessible names and button names (the package ships no text; the caller passes them in the UI language). |
| `locale` * | `string` | — | Locale for react-aria: zh-CN or en-CA, both year-month-day. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { DateTimeInput, type DateTimeLabels } from '@katana-ui/react'

const LABELS: DateTimeLabels = {
  date: (label) => `${label} date`,
  pickDate: (label) => `Pick ${label} date`,
  calendar: (label) => `${label} calendar`,
  time: (label) => `${label} time`,
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
}

export function DateTimeInputUsage() {
  const [date, setDate] = useState('2026-11-14')
  const [time, setTime] = useState('09:30')
  return (
    <DateTimeInput
      label="Start"
      labels={LABELS}
      locale="en-CA"
      date={date}
      onDate={setDate}
      time={time}
      onTime={setTime}
    />
  )
}
```

## States

- 默认、聚焦、错误（日期或时间不合法）。
- 日期框右边的日历按钮打开日历。

## Don't

- 不要依赖浏览器语言的日期格式：这个件不随它变。
- 不要传 Date 对象或时间戳：值是字符串，时区由调用方换算好再传。
- 选区间用 DateRangePicker，别并排放两个 DateTimeInput。

## Composition

```
DateTimeInput
  DateField（年 月 日各一段）
  Popover
    Calendar
  TimeField（时 分 [秒]）
```

## Keyboard

- `0–9`：在当前段打字，满了跳到下一段
- `← →`：在段之间走
- `↑ ↓`：当前段加减
- `Backspace`：清空当前段
- `Enter（日历按钮上）`：打开日历；日历里方向键选日

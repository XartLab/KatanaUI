# TradingDatePicker

只能选交易日的日期选择：日期按钮点开日历（沿用 DateTimeInput 的日历皮肤，行为底座是 UI SDK 的 Calendar），休市的日子灰着点不了；两侧的按钮直接跳到上一个 / 下一个交易日（跳过周末与长假）。交易日历由调用方传，可以是一组 YYYY-MM-DD（数组或 Set），也可以是判定函数；包里不带日历数据，也不读时钟。min / max 圈出能选的范围，前后按钮到边界禁用。

## Provide

`*` marks a required prop.

### TradingDatePicker

渲染一个 span；值是 YYYY-MM-DD 字符串，onValueChange 只会收到交易日。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` * | `string \| null` | — | The selected trading day as YYYY-MM-DD; null means nothing picked. |
| `onValueChange` * | `(date: string) => void` | — | Called with a trading day only; closed days are never reported. |
| `calendar` * | `TradingCalendar` | — | The trading calendar: a set or array of open days (YYYY-MM-DD), or a function that says whether a day is open. |
| `min` | `string` | — | Earliest selectable day (YYYY-MM-DD); earlier days are disabled and the previous button stops there. |
| `max` | `string` | — | Latest selectable day (YYYY-MM-DD); later days are disabled and the next button stops there. |
| `labels` | `TradingDatePickerLabels` | `cnLabelsZh.tradingDate` | Text pack; the Simplified Chinese default is used when omitted. |
| `locale` | `string` | `'zh-CN'` | Locale for month names and week start: zh-CN by default. |
| `className` | `string` | — | Extra class names. |

### tradingDayTest(calendar)

纯函数：交易日历（数组、Set 或函数）转成判定函数；写不对的日期不是交易日。

### shiftTradingDay(date, calendar, step, range)

纯函数：沿一个方向找下一个交易日（不含起点），超出 min / max 或扫了 40 天没找到返回 null。

### latestTradingDayOnOrBefore(date, calendar, range)

纯函数：不晚于 date 的最近交易日（自己是交易日就是它）。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { TradingDatePicker } from '@katana-ui/react/cn'

// The calendar is yours: a set of open days, or a function. Here weekends are closed.
const isOpen = (date: string) => {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  return weekday !== 0 && weekday !== 6
}

export function TradingDatePickerUsage() {
  const [date, setDate] = useState<string | null>('2026-11-20')
  return (
    <TradingDatePicker
      value={date}
      onValueChange={setDate}
      calendar={isOpen}
      locale="en-CA"
      labels={{
        pick: 'Pick a trading day',
        calendar: 'Trading calendar',
        previousMonth: 'Previous month',
        nextMonth: 'Next month',
        previousDay: 'Previous trading day',
        nextDay: 'Next trading day',
        placeholder: 'Pick a day',
        closed: 'Closed',
      }}
    />
  )
}
```

## States

- 默认：中间按钮写选中的日期，点开日历；前后按钮跳交易日。
- 休市的日子：日历里灰色加删除线，点不了，键盘也走不到选中。
- 选中的日子本身休市（调用方传了休市日）：日期文字灰色加删除线，data-closed 标出。
- value 为 null：按钮写占位字；前后按钮禁用。
- 到 min / max 或再往前往后没有交易日：对应方向的按钮禁用。

## Don't

- 不要在包里放交易日历数据：日历由调用方按交易所与年份传。
- 不要用它选任意日期或区间：用 DateTimeInput、DateRangePicker。
- 不要在 onValueChange 里再校验是不是交易日：休市的日子到不了回调。

## Composition

```
TradingDatePicker
  上一个交易日按钮
  日期按钮 → Popover
    Calendar（UI SDK，休市日 unavailable）
  下一个交易日按钮
```

## Keyboard

- `← → ↑ ↓`：在日历里移动日子
- `PageUp / PageDown`：上 / 下一个月
- `Enter / Space`：选中；休市的日子选不中
- `Esc`：关闭日历

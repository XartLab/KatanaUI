# EventCalendar

按日分组的事件表：时间、国家 / 地区（旗帜图或字母圆标）、事件名、重要程度（1–3 格亮度条）、实际 / 预期 / 前值。实际值好于预期用涨色、差于预期用跌色，好坏方向由调用方按事件给；未公布写「—」，还没到点的写倒计时。顶上：今天 / 本周 / 下周 / 自定义区间，重要程度芯片，国家多选，「只看高重要」开关。数据、现在、时区、文字都由调用方传。

## Provide

### EventCalendar

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `events` | `CalendarEvent[]` | — | { id, at（毫秒）, region, regionName, flag?, name, importance（1–3）, actual?, forecast?, previous?（格式化好的文字）, tone?（up / down / flat：实际对预期的好坏）}。 |
| `labels` | `EventCalendarLabels` | — | 区间、芯片、国家多选、列名、倒计时、日期标题、空态等文字，由调用方传。 |
| `now` | `number` | — | 现在（毫秒）：今天 / 本周 / 下周与倒计时从它算；件里不读时钟。 |
| `timeZone / locale` | `string` | — | 显示时区（IANA）与语言：分天、时间格式、周起点（周一）都按它。 |
| `defaultRange` | `'today' \| 'week' \| 'next'` | — | 起始区间，默认本周。 |
| `renderActions` | `(event) => ReactNode` | — | 悬停或键盘聚焦一行时出现在行尾的操作（RowActions 落地前的槽）。 |

## States

- 涨色 / 跌色：实际值按 tone 上色；不给 tone 不上色。
- 未公布：实际写「—」；还没到点的在下面写倒计时（「45 分后」）。
- 只看高重要：开着时重要程度芯片置灰，只留最高一档。

## Don't

- 不要把橙色用在数据上。
- 不要在件里写死中文或国家表；文字与国家由调用方传。
- 没有数据时不要放样本行，传空数组。

## Composition

```
EventCalendar
  筛选条：分段（今天 | 本周 | 下周 | 自定义）| 重要程度芯片 | 国家多选 | 只看高重要 | 条数
  列头
  table
    天（rowgroup）：日期标题
      行：时间 | 旗帜 + 代码 | 事件 | 重要程度条 | 实际 | 预期 | 前值 | 行尾操作
```

## Keyboard

- `Tab`：在行间移动焦点

# RangeScrubber

一条 09:30–15:00 的交易时段轴（午休不占宽度，中间一条竖虚线是 11:30/13:00，每半小时一根刻度），在上面拖出一个时段，调用方拿它去算板块与个股的区间涨幅、净额、强度并排序（功能参照开盘啦「区间统计」，交互照 TradingView 图表底部的区间选择）。按住选区中间整段平移，按两端改起止，按在选区外近的那个把手跳过去；「近 N 分钟」快捷钮从现在往回数交易分钟；口径切换（涨幅 / 净额 / 强度，键名由调用方给）。「现在」之后的时段盖一层斜纹、选不进去。背景柱（每分钟成交额之类）可不给，选区里的亮、外面的暗。回调给的是时刻：起点正好在午休那一点写 13:00，终点写 11:30。

## Provide

`*` marks a required prop.

### RangeScrubber

渲染一个 section：读数行（时段 · 快捷钮 · 口径）、轴、刻度。时段可受控也可不受控。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `readonly [string, string]` | — | The selected session span as clock times, such as ["09:30", "10:15"] (controlled). |
| `defaultValue` | `readonly [string, string]` | — | The initial span when uncontrolled; the whole elapsed session when omitted. |
| `onValueChange` | `(value: [string, string]) => void` | — | Called with the new span as clock times; a start on the lunch point reads 13:00, an end reads 11:30. |
| `now` | `string` | — | Clock time of the latest data, such as "10:42"; later minutes have not happened and cannot be selected. |
| `bars` | `readonly ScrubPoint[]` | — | Background bars (turnover per minute and the like), each drawn to the next point's time; none when omitted. |
| `presets` | `readonly number[]` | — | Quick spans in trading minutes back from now, such as [5, 15, 30, 60]; no buttons when omitted. |
| `metrics` | `readonly string[]` | — | Keys of the ranking measures to switch between, such as ["change", "net", "strength"]; names come from labels.metrics. |
| `metric` | `string` | — | The selected measure (controlled). |
| `defaultMetric` | `string` | — | The initially selected measure when uncontrolled; the first of `metrics` when omitted. |
| `onMetricChange` | `(metric: string) => void` | — | Called with the newly selected measure key. |
| `labels` | `RangeScrubberLabels` | `cnLabelsZh.rangeScrubber` | Text pack; the Simplified Chinese default is used when omitted. |
| `className` | `string` | — | Extra class names. |

### ScrubPoint

一根背景柱：time（这一段的起点时刻）与 value（取不到是 null）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `time` * | `string` | — | Clock time of the bucket start, such as "09:31". |
| `value` * | `number \| null` | — | The bar height (turnover, volume and the like); null leaves a gap. |

### scrubIndex(clock)

纯函数：时刻 → 轴上第几个交易分钟（0 到 240），午休贴到 11:30，竞价与盘后返回 null。

### scrubClock(index, side)

纯函数：交易分钟 → HH:MM；午休那一点起点写 13:00、终点写 11:30。

### scrubNow(now)

纯函数：「现在」在轴上的位置；不给是全天。

### scrubRange(range, now) / scrubRangeOf(value, now)

纯函数：两端排好、夹在 0 到 now 之间；后者从时刻读。

### shiftRange(range, delta, now)

纯函数：整段平移，宽度不变，撞边就停。

### presetRange(minutes, now)

纯函数：从 now 往回数 N 个交易分钟，不早于 09:30。

### scrubBars(points)

纯函数：背景柱的位置与相对高度，每根画到下一个点。

### SCRUB_TICKS / SCRUB_LUNCH

常量：每半小时一根的刻度（整点与午休是大刻度）与午休那一点（120）。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RangeScrubber } from '@katana-ui/react/cn'

export function RangeScrubberUsage() {
  const [range, setRange] = useState<[string, string]>(['09:30', '10:42'])
  const [metric, setMetric] = useState('change')
  return (
    <RangeScrubber
      now="10:42"
      value={range}
      onValueChange={setRange}
      presets={[5, 15, 30]}
      metrics={['change', 'net']}
      metric={metric}
      onMetricChange={setMetric}
    />
  )
}
```

## States

- 默认：开盘到现在整段选中；读数写起止时刻与交易分钟数。
- 拖把手：改起点或终点，两把手不交叉；拖选区中间：整段平移。
- 按在选区外：近的那个把手跳到这里，接着拖。
- 给了 now：之后的时段盖斜纹，把手与选区都过不去。
- 选区正好等于某个「近 N 分钟」：那个快捷钮标按下。
- 没给 presets / metrics：读数行只有时段。

## Don't

- 不要按钟表时间拉开午休：轴是 240 个交易分钟。
- 不要在包里算区间涨幅、净额或强度：口径与排序由调用方做，件只给时段与口径键。
- 不要拿它选日期：跨日用 TradingDatePicker 或 DateRangePicker。

## Composition

```
RangeScrubber
  读数行（起止 · 分钟数）· 快捷钮 ToggleGroup · 口径 ToggleGroup
  轴（背景柱 · 午休虚线 · 未到斜纹 · 选区 · 两个 role=slider 把手）
  刻度（每半小时，整点写字）
```

## Keyboard

- `← →`：把手移一分钟
- `PageUp / PageDown`：把手移十分钟
- `Home / End`：把手去 09:30 / 现在
- `Tab`：在把手、快捷钮、口径之间移动

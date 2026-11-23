# CnBasics

A 股件包的第 0 层（纯函数，不带 React）：formatCnAmount 把金额写成万 / 亿；时段轴认 09:15–09:25 竞价、09:30–11:30、13:00–15:00，午休与 09:25–09:30 不占宽度；cnLabelsZh 是随包的简体中文默认文案，可以整份换；取不到的数写「—」并可带原因（readCnValue）。不带数据源与交易日历数据。DataGrid 的列类型 cnAmount 用 formatCnAmount 写金额（靠右、按数排序；format.cnAmount.signed 为真时正数涨色、负数跌色，用于净流入）。

## Provide

`*` marks a required prop.

### formatCnAmount(value, { abbreviate, digits, signed }, units)

≥1 亿写「x.xx亿」，≥1 万写「x万」（不到 100 万保留一位小数，之后取整），否则原样；null、NaN 写「—」，不写 0。接口跟 formatQuantity 同一套。

### cnAxisPosition(minutes)

时刻在时间轴上的位置 0–1；早于 09:15、晚于 15:00 返回 null。

### cnPhaseOf(minutes)

集合竞价 / 早盘 / 午盘 / 尾盘（14:30 起）。

### cnTradingMinutesBetween(from, to)

两个时刻之间实际交易的分钟数。

### parseClock(text) / formatClock(minutes)

「09:31」「09:31:05」与自 0 点起的分钟数互转。

### CN_SESSIONS、CN_AXIS_MINUTES、CN_LATE_FROM

时段表、时间轴总宽（250 分钟）、尾盘起点常量。

### cnLabelsZh

默认文案；每个件的 labels 属性读它的一段，整份换掉就是别的语言。

### readCnValue(value)

读数：数，或 null，或 { value, reason }；非有限数当作取不到。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { cnAxisPosition, cnPhaseOf, formatCnAmount, parseClock } from '@katana-ui/react/cn'

export function CnBasicsUsage() {
  const minute = parseClock('13:00')
  return (
    <p>
      {formatCnAmount(123_456_789)} {cnPhaseOf(minute)} {cnAxisPosition(minute)}
    </p>
  )
}
```

## States

- 金额：≥1 亿「1.23亿」，≥1 万「12.5万」，否则原样；负数带 -，signed 给正数带 +。
- cnAmount 列：成交额、封单额、市值写万 / 亿不着色；净流入给 format.cnAmount.signed，正数涨色、负数跌色；取不到写「—」。
- 时间轴：竞价 10 分钟、上午 120、下午 120，共 250 分钟；落在 09:25–09:30 或午休里的时刻贴到前一段末尾。
- 取不到：null 写「—」，原因放悬停，不写 0。

## Don't

- 不要在包里放交易日历或数据源：哪天开市、数从哪来由调用方传。
- 不要把文字写死在调用处：从 cnLabelsZh 取，或整份换成自己的语言。

## Composition

```
formatCnAmount
cnAxisPosition · cnPhaseOf · cnTradingMinutesBetween
cnLabelsZh
```

# FlowRace

每个板块一条分钟累计净流入线，横轴是 09:30–15:00 的时段轴（午休不占宽度，中间一条竖虚线标 11:30/13:00），0 轴一条虚线；右端按最新值从大到小排成一列标签（名次、名字、带正负号的万 / 亿），标签错开不重叠。线只用语义色调：最新值为正取涨色、为负取跌色（跟 data-updown），第一名的线粗一点；悬停或聚焦某一行标签，对应的线加粗、其余变淡。默认画前 8 名。序列由调用方给，取不到的点断线，不当 0。

## Provide

`*` marks a required prop.

### FlowRace

渲染一个 section；右端排行是一个 ol，每行可聚焦。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `series` * | `readonly FlowSeries[]` | — | One cumulative net-inflow series per sector: minute points with a clock time and a value in yuan. |
| `limit` | `number` | `8` | How many lines to draw, from the top of the ranking; 8 by default. |
| `height` | `number` | `240` | Chart height in px; 240 by default. |
| `labels` | `FlowRaceLabels` | `cnLabelsZh.flowRace` | Text pack; the Simplified Chinese default is used when omitted. |
| `className` | `string` | — | Extra class names. |

### FlowSeries

一个板块：key、name 与分钟点 points（时刻与累计净流入，元）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `key` * | `string` | — | Stable key of the sector. |
| `name` * | `string` | — | Sector name shown on the label. |
| `points` * | `readonly FlowPoint[]` | — | Minute points of the cumulative net inflow. |

### flowX(minutes)

纯函数：时刻在 09:30–15:00 时段轴上的位置，0 到 1，午休不占宽度；09:30 前返回 null。

### flowLines(series)

纯函数：整理序列（丢掉写不对或早于 09:30 的点、排序、取最新值）。

### rankLines(lines)

纯函数：按最新值从大到小排名，取不到的排最后。

### flowDomain(lines)

纯函数：纵轴区间，含 0，上下各留一成。

### flowPath(line, domain, width, height)

纯函数：折线路径，取不到的点断开。

### flowY(value, domain, height)

纯函数：值落到纵轴的 y（上小下大）。

### spreadFlowLabels(targets, gap, min, max)

纯函数：把挤在一起的标签推开到至少 gap，次序不变，不出界。

### FLOW_START / FLOW_MINUTES

常量：09:30 与一天的 240 个交易分钟。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { FlowRace } from '@katana-ui/react/cn'

export function FlowRaceUsage() {
  return (
    <FlowRace
      series={[
        {
          key: 'chips',
          name: 'Chips',
          points: [
            { time: '09:30', value: 0 },
            { time: '10:30', value: 180_000_000 },
            { time: '11:30', value: 260_000_000 },
            { time: '14:00', value: 410_000_000 },
            { time: '15:00', value: 520_000_000 },
          ],
        },
        {
          key: 'banks',
          name: 'Banks',
          points: [
            { time: '09:30', value: 0 },
            { time: '10:30', value: -90_000_000 },
            { time: '11:30', value: -150_000_000 },
            { time: '14:00', value: -60_000_000 },
            { time: '15:00', value: -120_000_000 },
          ],
        },
        {
          key: 'robots',
          name: 'Robots',
          points: [
            { time: '09:30', value: 0 },
            { time: '10:30', value: 60_000_000 },
            { time: '11:30', value: 210_000_000 },
            { time: '14:00', value: 300_000_000 },
            { time: '15:00', value: 330_000_000 },
          ],
        },
      ]}
      labels={{
        region: 'Sector money flow',
        ranking: 'Ranking',
        axis: { from: '09:30', mid: '11:30/13:00', to: '15:00' },
        empty: 'No flow data',
        unavailable: 'Not available',
        rankAria: (rank, name, value) => `No. ${rank} ${name} ${value}`,
      }}
    />
  )
}
```

## States

- 默认：前 8 名各一条线，右端按最新值排名，标签自动错开。
- 悬停或聚焦一行标签：对应的线加粗，其余退到 25%。
- 最新值为负：线与数值取跌色；零或取不到取中性灰。
- 某个点取不到：线在这里断开，不连过去也不当 0。
- 没有序列：写一行空态文字。

## Don't

- 不要按时间比例拉开午休：横轴是 240 个交易分钟。
- 不要传色值或给每条线单独上色：区分靠右端排行与粗细。
- 不要在包里取数：累计净流入由调用方算好传。

## Composition

```
FlowRace
  线图 svg（0 轴 · 午休分界 · 每板块一条线）· 纵轴两端读数
  右端排行 ol（名次 · 名字 · 最新值）
  横轴 09:30 · 11:30/13:00 · 15:00
```

## Keyboard

- `Tab`：在右端排行的行之间移动，聚焦的那一行对应的线加粗

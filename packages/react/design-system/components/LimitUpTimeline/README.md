# LimitUpTimeline

蛇形时刻轴：按分钟聚合封板时刻成站点（时间胶囊），一行 perRow 站，奇数行左到右、偶数行右到左，行尾拐弯、箭头指向较新的时刻、标「越来越早」；站点下挂小卡（名称、连板徽标、题材、成交额万 / 亿，20cm 等标板块）；站点按时段着色（集合竞价 / 早盘 / 午盘 / 尾盘）。顶上有排序（最新在前 / 最早在前）、时段图例（站数与只数）、题材 chip 筛。站点等距，午休与 09:25–09:30 不占宽度。梯队表用 LimitLadder，不在这里。

## Provide

`*` marks a required prop.

### LimitUpTimeline

渲染一个 section；排序与题材筛选都可受控也可不受控。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` * | `readonly TimelineItem[]` | — | The limit-up stocks with their first-seal time; the timeline groups them by minute. |
| `order` | `TimelineOrder` | — | Sort order (controlled): latest first or earliest first. |
| `defaultOrder` | `TimelineOrder` | `'latest'` | Initial sort order when uncontrolled; latest first by default. |
| `onOrderChange` | `(order: TimelineOrder) => void` | — | Called with the new order. |
| `theme` | `string \| null` | — | The theme filter (controlled); null means all themes. |
| `defaultTheme` | `string \| null` | `null` | Initial theme filter when uncontrolled; all themes by default. |
| `onThemeChange` | `(theme: string \| null) => void` | — | Called with the new theme filter. |
| `perRow` | `number` | `7` | How many stations fit in one row of the snake; 7 by default. |
| `onSelect` | `(item: TimelineItem) => void` | — | Called when a stock card is picked; without it the cards are plain. |
| `labels` | `TimelineLabels` | `cnLabelsZh.timeline` | Text pack; the Simplified Chinese default is used when omitted. |
| `className` | `string` | — | Extra class names. |

### TimelineItem

一只票：code、name、time（首次封板时刻）、可选 streak、themes、amount（元）、board。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `code` * | `string` | — | Stock code, unique within the timeline. |
| `name` * | `string` | — | Stock name. |
| `time` | `string \| null` | — | First-seal time ("09:31" or "09:31:05"); one that is missing or outside trading hours is left off the axis. |
| `streak` | `number \| StreakValue \| null` | — | Boards in a row, shown as a StreakBadge. |
| `themes` | `readonly string[]` | — | Themes of the stock; the first is written on the card and the filter chips use all of them. |
| `amount` | `number \| null` | — | Turnover in yuan (written in wan or yi); a dash when unavailable. |
| `board` | `BoardKind \| null` | — | Board kind; a mark is drawn for the 20cm and 30cm boards and ST. |

### groupStations(items, order)

纯函数：同一分钟并成一站，排好序；没有时刻或不在交易时间内的放 untimed。

### phaseSummary(stations)

纯函数：四个时段各自的站数与只数。

### themeCounts(items)

纯函数：题材 chip，按票数从多到少。

### filterByTheme(items, theme)

纯函数：按题材筛，null 是全部。

### snakeRows(stations, perRow)

纯函数：蛇形分行，奇数行 ltr、偶数行 rtl。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { LimitUpTimeline } from '@katana-ui/react/cn'

export function LimitUpTimelineUsage() {
  return (
    <LimitUpTimeline
      items={[
        { code: '600001', name: 'Alpha', time: '09:36', streak: 2, themes: ['Robotics'], amount: 3.2e8 },
        { code: '300002', name: 'Beta', time: '14:49', streak: 1, themes: ['Chips'], amount: 5.6e7, board: 'gem' },
      ]}
      perRow={7}
    />
  )
}
```

## States

- 最新在前（默认）：第一行从最新的站开始，箭头指向较新的一侧，行尾写「越来越早」；最早在前时反过来写「越来越晚」。
- 时段图例带计数（n 站 m 只），按当前筛选算；题材 chip 带票数，点一下筛，再点「全部」恢复。
- 没有封板时刻、或不在 09:15–15:00 的票不上轴，上面一行字报数。
- 没有票：写空态；成交额取不到写「—」。
- 给了 onSelect：小卡是按钮，可 Tab、Enter。

## Don't

- 不要按时间比例拉开站点：午休不占宽度，站点等距排。
- 不要传色值：时段色是 token。
- 不要在包里取数：封板时刻与成交额由调用方给。

## Composition

```
LimitUpTimeline
  标题与汇总
  顶栏（排序 ToggleGroup · 时段图例 · 题材 chip）
  蛇形行
    站点（时间胶囊 · 轨道 · 小卡）
      小卡（名称 · StreakBadge · BoardMark · 题材 · 成交额）
```

## Keyboard

- `Tab`：到排序、题材 chip、小卡（给了 onSelect 时）
- `Enter / Space`：切换排序与题材，或选中小卡

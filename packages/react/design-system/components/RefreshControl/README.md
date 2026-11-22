# RefreshControl

自动刷新的间隔分段（TradingView 筛选器是 10 秒 / 1 分钟 / 不刷新）+ 立即刷新钮 + 上次刷新时刻 + 下次倒计时。受控：间隔、上次时刻、在不在刷都由调用方给，到点调 onRefresh；标签页隐藏时停，回来过了点马上刷。

## Provide

`*` marks a required prop.

### RefreshControl

options 每项 { value 毫秒（0 是不刷新）, label }；文字都在 labels。refreshing 时图标转圈、倒计时停、钮 aria-disabled（不丢焦点）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `options` * | `readonly RefreshOption[]` | — | Segments to pick from; each value is milliseconds, 0 is off. |
| `interval` * | `number` | — | Current interval in milliseconds (controlled); 0 is off. |
| `onIntervalChange` * | `(interval: number) => void` | — | Called with the picked interval in milliseconds. |
| `lastRefreshed` * | `number \| null` | — | When the data was last refreshed (epoch ms); null before the first refresh. |
| `onRefresh` * | `() => void` | — | Refresh now (the button, and each time the countdown runs out). |
| `refreshing` | `boolean` | `false` | A refresh is in flight: the icon spins and the countdown waits. |
| `labels` * | `RefreshControlLabels` | — | All text: interval group name, refresh button name, the last / next prefixes. |
| `formatTime` | `(time: number) => string` | `formatRefreshClock` | Writes the last-refresh time; default local HH:MM:SS. |
| `pauseWhenHidden` | `boolean` | `true` | Stop counting while the tab is hidden; default true. |
| `className` | `string` | — | Extra class name on the root. |

### useAutoRefresh({ interval, lastRefreshed, onRefresh, refreshing?, pauseWhenHidden? })

只要计时不要界面时用：返回离下次刷新的毫秒数（关着、在刷、标签页隐藏时是 null）；同一个到点时刻只调一次 onRefresh。

### formatRemaining / formatRefreshClock

倒计时写 12s / 1:05；时刻写本地 HH:MM:SS。

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RefreshControl } from '@katana-ui/react'

// 照 TradingView 筛选器的三档：10 秒 / 1 分钟 / 不刷新（演示里「刷新」等 600ms 假装在拉数据）。
const OPTIONS = [
  { value: 10_000, label: '10 秒' },
  { value: 60_000, label: '1 分钟' },
  { value: 0, label: '不刷新' },
]

export function RefreshControlUsage() {
  const [interval, setRefreshInterval] = useState(10_000)
  const [last, setLast] = useState<number | null>(() => Date.now())
  const [refreshing, setRefreshing] = useState(false)
  const [count, setCount] = useState(0)
  const refresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setLast(Date.now())
      setCount((n) => n + 1)
      setRefreshing(false)
    }, 600)
  }
  return (
    <div data-gallery-refresh data-count={count}>
      <RefreshControl
        options={OPTIONS}
        interval={interval}
        onIntervalChange={setRefreshInterval}
        lastRefreshed={last}
        onRefresh={refresh}
        refreshing={refreshing}
        labels={{ interval: '自动刷新', refresh: '立即刷新', last: '上次', next: '下次' }}
      />
    </div>
  )
}
```

## States

- 开着：「下次 12s」每秒走一格，到 0 调 onRefresh。
- 在刷：图标转圈，倒计时不显示。
- 不刷新：没有倒计时，只有上次时刻与立即刷新。
- 还没刷过：上次那段写 labels.never（默认 —）。

## Don't

- 不要把倒计时放进 aria-live：每秒读一遍太吵。
- 不要在包里拉数据：onRefresh 里调用方自己拉，拉完更新 lastRefreshed。

## Composition

```
RefreshControl
  ToggleGroup（间隔）
  立即刷新钮
  上次 <time> · 下次 倒计时
```

## Keyboard

- `Tab`：走到间隔分段（按钮组，aria-pressed 标当前档）与刷新钮
- `Enter / Space`：选间隔；在刷新钮上立即刷新

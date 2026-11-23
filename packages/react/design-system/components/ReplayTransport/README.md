# ReplayTransport

历史回放的操作条：播放 / 暂停、逐根、倍速选择（倍数列表由调用方传，件不写死）、可拖的进度条（Scrubber）、当前回放时刻读数（LCD）、「跳到时刻」输入、「按 N 个 tick 跳过」；多图共用一个时钟时写「同步中 · N 个面板」。件不走时钟：当前时刻与是否在播由 props 回来，用户的意图（播放、跳到哪、几倍速、跳几个 tick）经回调发出，时钟与数据在调用方的引擎里。时刻默认按 UTC 写 YYYY-MM-DD HH:MM:SS，formatTime / parseTime 可换。功能参照 MultiCharts Data Replay（2026-11-21 读官方功能页，控制条细节未实看，待核对）。演示的时钟与时间都是编的。

## Provide

`*` marks a required prop.

### ReplayTransport

time / start / end 是毫秒时间戳。onSeek 在拖动时连续触发，调用方按需节流。syncedPanels 大于 1 才显示「同步中」。全部文字经 labels 传。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `time` * | `number` | — | Current replay time as a millisecond timestamp, supplied by the caller's clock. |
| `start` * | `number` | — | Start of the replay range as a millisecond timestamp (left end of the progress bar). |
| `end` * | `number` | — | End of the replay range as a millisecond timestamp (right end of the progress bar). |
| `playing` * | `boolean` | — | Whether the replay clock is running; the main button shows Pause while it is. |
| `speed` * | `number` | — | Current speed multiplier. |
| `speeds` * | `readonly number[]` | — | Speed multipliers to offer, in the order shown; the caller decides them, nothing is hard-coded. |
| `onPlay` * | `() => void` | — | Called when Play is clicked. |
| `onPause` * | `() => void` | — | Called when Pause is clicked. |
| `onStep` * | `() => void` | — | Called when Step is clicked: advance by one bar. |
| `onSpeedChange` * | `(speed: number) => void` | — | Called with the chosen multiplier when a speed is picked. |
| `onSeek` * | `(time: number) => void` | — | Called with the target time in ms when the bar is dragged, moved by keyboard, or a time is jumped to; fires continuously while dragging, so throttle if needed. |
| `onSkipTicks` * | `(ticks: number) => void` | — | Called with N when Skip is clicked: jump forward by N ticks. |
| `defaultSkipTicks` | `number` | `100` | Initial value of the skip-ticks input; defaults to 100. |
| `syncedPanels` | `number` | — | Number of chart panels sharing this clock; the synced hint shows only when it is greater than 1. |
| `formatTime` | `(time: number) => string \| null` | `formatReplayTime` | Writes a time as text; defaults to UTC `YYYY-MM-DD HH:MM:SS`. |
| `parseTime` | `(text: string) => number \| null` | `parseReplayTime` | Reads the jump-to-time input into milliseconds, null when unreadable; defaults to `YYYY-MM-DD[ HH:MM[:SS]]` in UTC. |
| `formatSpeed` | `(speed: number) => string` | `defaultFormatSpeed` | Writes a speed multiplier as text; defaults to `2×`. |
| `labels` * | `ReplayTransportLabels` | — | All text; the package has no language of its own. |
| `disabled` | `boolean` | — | Disable every control and the key shortcuts. |
| `className` | `string` | — | Extra class name on the root. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ReplayTransport } from '@katana-ui/react'

// 最小用法：时间是编的演示数据；真应用里 time 与 playing 来自回放引擎的时钟。
const START = Date.UTC(2026, 0, 5, 9, 30)
const END = Date.UTC(2026, 0, 5, 15, 0)

export function ReplayTransportUsage() {
  const [time, setTime] = useState(START + 3_600_000)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(2)
  return (
    <div style={{ maxWidth: 720 }}>
      <ReplayTransport
        time={time}
        start={START}
        end={END}
        playing={playing}
        speed={speed}
        speeds={[1, 2, 5, 10]}
        syncedPanels={3}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onStep={() => setTime((t) => Math.min(END, t + 60_000))}
        onSpeedChange={setSpeed}
        onSeek={setTime}
        onSkipTicks={(n) => setTime((t) => Math.min(END, t + n * 1000))}
        labels={{
          group: '回放控制',
          play: '播放',
          pause: '暂停',
          step: '逐根',
          speed: '倍速',
          progress: '回放进度',
          time: '回放时刻',
          jumpTo: '跳到时刻',
          jump: '跳转',
          invalidTime: '时刻格式不对',
          skipTicks: '跳过 tick 数',
          skip: '跳过',
          synced: (n) => `同步中 · ${n} 个面板`,
        }}
      />
    </div>
  )
}
```

## States

- 暂停：主按钮写「播放」。
- 播放中：主按钮写「暂停」，根上带 data-playing。
- 倍速：当前档按下；speed 不在 speeds 里时一档都不按下。
- 多图同步：syncedPanels > 1 时出灯加「同步中 · N 个面板」。
- 跳到时刻读不出：输入框标红并出提示（role=alert），不发 onSeek。
- 跳过 tick 数不是正整数：输入框标红，「跳过」灰掉。
- 禁用：整条按钮、输入与进度条不可操作，键位不响应。

## Don't

- 不要在件里加定时器推进时间：时钟只有调用方一个，免得和引擎各算一份。
- 不要把倍速写死 1 2 5 10：能跑几倍是引擎的事，从 speeds 传。
- 要看一个品种当下的运行状态用 PortfolioRunGrid，不用它。

## Composition

```
ReplayTransport
  Button × 2（播放 / 暂停、逐根）
  ToggleGroup（倍速）
  Lcd（时刻）
  Led + 文字（同步中）
  Scrubber（进度）
  Input + Button × 2（跳到时刻、跳过 tick）
```

## Keyboard

- `k`：播放 / 暂停（焦点不在输入框与进度条上时）
- `.`：逐根前进
- `[ / ]`：减速 / 加速一档
- `← →（在进度条上）`：走一小步；Shift 走十步
- `Home / End（在进度条上）`：到起点 / 终点
- `Enter（在输入框里）`：提交「跳到时刻」或「跳过 tick」

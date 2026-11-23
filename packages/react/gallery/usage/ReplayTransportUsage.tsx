// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ReplayTransport } from '../../src/index'

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

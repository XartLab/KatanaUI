// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { ReplayTransport, type ReplayTransportLabels } from './replay-transport.tsx'
import {
  formatReplayTime,
  neighbourSpeed,
  parseReplayTime,
  parseSkipTicks,
  progressStep,
  transportCommand,
} from './replay-transport-model.ts'

// 键盘与时刻读写是纯逻辑，在这里直接测；拖进度条、真按键在 e2e 里用浏览器验。

const labels: ReplayTransportLabels = {
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
}
const START = Date.UTC(2026, 0, 5, 9, 30)
const END = Date.UTC(2026, 0, 5, 15, 0)
const noop = () => {}
const render = (extra: Partial<Parameters<typeof ReplayTransport>[0]> = {}) =>
  renderToStaticMarkup(
    <ReplayTransport
      time={START + 3_600_000}
      start={START}
      end={END}
      playing={false}
      speed={2}
      speeds={[1, 2, 5, 10]}
      onPlay={noop}
      onPause={noop}
      onStep={noop}
      onSpeedChange={noop}
      onSeek={noop}
      onSkipTicks={noop}
      labels={labels}
      {...extra}
    />,
  )

describe('时刻读写', () => {
  it('UTC 写法往返一致', () => {
    expect(formatReplayTime(START)).toBe('2026-01-05 09:30:00')
    expect(parseReplayTime('2026-01-05 09:30:00')).toBe(START)
    expect(parseReplayTime('2026-01-05T09:30')).toBe(START)
    expect(parseReplayTime('2026-01-05')).toBe(Date.UTC(2026, 0, 5))
  })
  it('读不出的返回 null，滚过月的日期也算读不出', () => {
    for (const bad of ['', 'abc', '2026-02-31', '2026-1-5', '09:30']) expect(parseReplayTime(bad)).toBeNull()
    expect(formatReplayTime(Number.NaN)).toBeNull()
  })
  it('跳过 tick 数只认正整数', () => {
    expect(parseSkipTicks('100')).toBe(100)
    expect(parseSkipTicks(' 5 ')).toBe(5)
    for (const bad of ['', '0', '-3', '1.5', 'x']) expect(parseSkipTicks(bad)).toBeNull()
  })
  it('进度条步长至少 1 毫秒', () => {
    expect(progressStep(0, 5)).toBe(1)
    expect(progressStep(0, 10_000)).toBe(10)
  })
})

describe('键位', () => {
  const body = { tagName: 'DIV', role: null }
  it('k 播放 / 暂停，. 逐根，[ 减速，] 加速', () => {
    expect(transportCommand({ key: 'k' }, body)).toBe('toggle')
    expect(transportCommand({ key: '.' }, body)).toBe('step')
    expect(transportCommand({ key: '[' }, body)).toBe('slower')
    expect(transportCommand({ key: ']' }, body)).toBe('faster')
    expect(transportCommand({ key: 'x' }, body)).toBeNull()
  })
  it('按钮上照认；输入框与滑块上不认；带 Ctrl / Alt / Meta 不认', () => {
    expect(transportCommand({ key: 'k' }, { tagName: 'BUTTON', role: null })).toBe('toggle')
    expect(transportCommand({ key: 'k' }, { tagName: 'INPUT', role: null })).toBeNull()
    expect(transportCommand({ key: '.' }, { tagName: 'DIV', role: 'slider' })).toBeNull()
    expect(transportCommand({ key: 'k', ctrlKey: true }, body)).toBeNull()
    expect(transportCommand({ key: 'k', metaKey: true }, body)).toBeNull()
  })
  it('相邻倍速：两端停住，当前不在列表里就取最近的一档', () => {
    const speeds = [10, 1, 5, 2]
    expect(neighbourSpeed(speeds, 2, 1)).toBe(5)
    expect(neighbourSpeed(speeds, 2, -1)).toBe(1)
    expect(neighbourSpeed(speeds, 10, 1)).toBe(10)
    expect(neighbourSpeed(speeds, 1, -1)).toBe(1)
    expect(neighbourSpeed(speeds, 3, 1)).toBe(5)
    expect(neighbourSpeed([], 1, 1)).toBeNull()
  })
})

describe('ReplayTransport 的结构', () => {
  it('倍速列表由调用方传：只画传进来的几档，当前档按下', () => {
    const html = render({ speeds: [0.5, 3], speed: 3 })
    expect(html.match(/data-speed="/g)).toHaveLength(2)
    expect(html).toContain('0.5×')
    expect(html).toMatch(/aria-pressed="true"[^>]*data-speed="3"|data-speed="3"[^>]*aria-pressed="true"/)
  })
  it('播放中按钮写「暂停」，没在播写「播放」', () => {
    expect(render({ playing: true })).toContain('data-action="pause"')
    expect(render({ playing: false })).toContain('data-action="play"')
  })
  it('进度条是带名字的滑块，范围与读数跟着 start / end / time 走', () => {
    const html = render()
    expect(html).toContain('role="slider"')
    expect(html).toContain('aria-label="回放进度"')
    expect(html).toContain(`aria-valuemin="${START}"`)
    expect(html).toContain(`aria-valuemax="${END}"`)
    expect(html).toContain(`aria-valuenow="${START + 3_600_000}"`)
  })
  it('当前回放时刻用 LCD 读数', () => {
    const html = render()
    expect(html).toContain('2026-01-05 10:30:00')
    expect(html).toContain('回放时刻')
  })
  it('多图共用一个时钟（面板数大于 1）才显示「同步中」', () => {
    expect(render({ syncedPanels: 3 })).toContain('同步中 · 3 个面板')
    expect(render({ syncedPanels: 1 })).not.toContain('同步中')
    expect(render()).not.toContain('同步中')
  })
  it('跳过 tick 的输入默认 100，数不对时按钮灰掉由 parseSkipTicks 管', () => {
    expect(render()).toContain('value="100"')
    expect(render({ defaultSkipTicks: 25 })).toContain('value="25"')
  })
  it('disabled 时按钮与输入都禁用', () => {
    const html = render({ disabled: true })
    expect(html.match(/disabled=""/g)!.length).toBeGreaterThanOrEqual(6)
    // 没禁用时播放键可点（「跳转」因为输入是空的另行灰掉）。
    expect(/<button[^>]*data-action="play"[^>]*>/.exec(render())![0]).not.toContain('disabled=""')
  })
})

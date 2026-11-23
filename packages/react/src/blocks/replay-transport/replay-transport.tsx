// SPDX-License-Identifier: MIT
// 回放控制条：播放 / 暂停、逐根、倍速、跳到时刻、按 N 个 tick 跳过、可拖进度条、当前回放时刻读数；
// 多图共用一个时钟时写「同步中 · N 个面板」。
// 功能参照 MultiCharts Data Replay（2026-11-21 读官方功能页，控制条细节未实看，待核对），实现原创。
// 为什么件不走时钟：回放的时钟在调用方（引擎、数据源），件只把用户的意图（播放、跳到哪、几倍速）发出去，当前时刻与播放状态由 props 回来；
// 这样同一条控制条能接单图、多图共用时钟的场景，也不会和引擎各算一份时间。
// 复用：进度条是 Scrubber，读数是 Lcd，倍速是 ToggleGroup，输入是 Input，灯是 Led。
import { useState, type KeyboardEvent } from 'react'
import { Button } from '../../primitives/button.tsx'
import { Input } from '../../primitives/input.tsx'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group.tsx'
import { Lcd } from '../../katana/lcd.tsx'
import { Led } from '../../katana/led.tsx'
import { Scrubber } from '../../katana/scrubber.tsx'
import { cn } from '../../lib/cn.ts'
import { clamp } from '../../lib/num.ts'
import {
  formatReplayTime,
  neighbourSpeed,
  parseReplayTime,
  parseSkipTicks,
  progressStep,
  transportCommand,
} from './replay-transport-model.ts'

export type ReplayTransportLabels = {
  /** 整条的读屏名。 */
  group: string
  play: string
  pause: string
  /** 逐根：前进一根 K 线。 */
  step: string
  /** 倍速组的读屏名。 */
  speed: string
  /** 进度条的名字（写在条里，也是读屏名）。 */
  progress: string
  /** 时刻读数的小标。 */
  time: string
  /** 「跳到时刻」输入框的读屏名。 */
  jumpTo: string
  /** 「跳到时刻」按钮。 */
  jump: string
  /** 时刻读不出时的提示（也进读屏）。 */
  invalidTime: string
  /** 「跳过 tick」输入框的读屏名。 */
  skipTicks: string
  /** 「跳过 tick」按钮。 */
  skip: string
  /** 多图共用一个时钟时的整句，如「同步中 · 3 个面板」。 */
  synced: (panels: number) => string
}

export type ReplayTransportProps = {
  /**
   * Current replay time as a millisecond timestamp, supplied by the caller's clock.
   * 当前回放时刻（毫秒时间戳）；由调用方的时钟给。
   */
  time: number
  /**
   * Start of the replay range as a millisecond timestamp (left end of the progress bar).
   * 回放区间的起点（毫秒时间戳），进度条左端。
   */
  start: number
  /**
   * End of the replay range as a millisecond timestamp (right end of the progress bar).
   * 回放区间的终点（毫秒时间戳），进度条右端。
   */
  end: number
  /**
   * Whether the replay clock is running; the main button shows Pause while it is.
   * 回放是否在走；在走时主按钮写「暂停」。
   */
  playing: boolean
  /**
   * Current speed multiplier.
   * 当前倍速。
   */
  speed: number
  /**
   * Speed multipliers to offer, in the order shown; the caller decides them, nothing is hard-coded.
   * 可选的倍速，由调用方传，件不写死（引擎支持几档是引擎的事）。
   */
  speeds: readonly number[]
  /**
   * Called when Play is clicked.
   * 点播放。
   */
  onPlay: () => void
  /**
   * Called when Pause is clicked.
   * 点暂停。
   */
  onPause: () => void
  /**
   * Called when Step is clicked: advance by one bar.
   * 逐根前进。
   */
  onStep: () => void
  /**
   * Called with the chosen multiplier when a speed is picked.
   * 选了一档倍速。
   */
  onSpeedChange: (speed: number) => void
  /**
   * Called with the target time in ms when the bar is dragged, moved by keyboard, or a time is jumped to; fires continuously while dragging, so throttle if needed.
   * 拖进度条、键盘移进度条、或「跳到时刻」：给出目标时刻（毫秒）。拖动时会连续触发，调用方按需节流。
   */
  onSeek: (time: number) => void
  /**
   * Called with N when Skip is clicked: jump forward by N ticks.
   * 点「跳过」：往前跳 N 个 tick。
   */
  onSkipTicks: (ticks: number) => void
  /**
   * Initial value of the skip-ticks input; defaults to 100.
   * 「跳过」输入框的初始值。
   */
  defaultSkipTicks?: number
  /**
   * Number of chart panels sharing this clock; the synced hint shows only when it is greater than 1.
   * 共用这个时钟的图表面板数；大于 1 才显示「同步中」。
   */
  syncedPanels?: number
  /**
   * Writes a time as text; defaults to UTC `YYYY-MM-DD HH:MM:SS`.
   * 时刻写成文字；省略是 UTC 的 `YYYY-MM-DD HH:MM:SS`。
   */
  formatTime?: (time: number) => string | null
  /**
   * Reads the jump-to-time input into milliseconds, null when unreadable; defaults to `YYYY-MM-DD[ HH:MM[:SS]]` in UTC.
   * 「跳到时刻」输入读成毫秒；读不出返回 null；省略时认 `YYYY-MM-DD[ HH:MM[:SS]]`，按 UTC。
   */
  parseTime?: (text: string) => number | null
  /**
   * Writes a speed multiplier as text; defaults to `2×`.
   * 倍速写成文字，省略是「2×」。
   */
  formatSpeed?: (speed: number) => string
  /**
   * All text; the package has no language of its own.
   * 全部文字；包里没有语言。
   */
  labels: ReplayTransportLabels
  /**
   * Disable every control and the key shortcuts.
   * 整条禁用，键位也不响应。
   */
  disabled?: boolean
  /** Extra class name on the root. */
  className?: string
}

const Glyph = ({ d }: { d: string }) => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
    <path d={d} />
  </svg>
)
const PLAY = 'M4.5 3v10l8-5z'
const PAUSE = 'M4 3h3v10H4zM9 3h3v10H9z'
const STEP = 'M3 3v10l7-5zM11 3h2v10h-2z'
const defaultFormatSpeed = (speed: number) => `${speed}×`

export function ReplayTransport({
  time,
  start,
  end,
  playing,
  speed,
  speeds,
  onPlay,
  onPause,
  onStep,
  onSpeedChange,
  onSeek,
  onSkipTicks,
  defaultSkipTicks = 100,
  syncedPanels,
  formatTime = formatReplayTime,
  parseTime = parseReplayTime,
  formatSpeed = defaultFormatSpeed,
  labels,
  disabled,
  className,
}: ReplayTransportProps) {
  const [jumpText, setJumpText] = useState('')
  const [jumpBad, setJumpBad] = useState(false)
  const [skipText, setSkipText] = useState(String(defaultSkipTicks))
  const ticks = parseSkipTicks(skipText)
  const shownTime = clamp(time, start, Math.max(start, end))
  const toggle = () => (playing ? onPause() : onPlay())

  const jump = () => {
    const target = parseTime(jumpText)
    if (target === null) return setJumpBad(true)
    setJumpBad(false)
    onSeek(clamp(target, start, Math.max(start, end)))
  }
  const skip = () => {
    if (ticks !== null) onSkipTicks(ticks)
  }
  // 输入框里按回车即提交；别的键不拦。
  const submitOnEnter = (action: () => void) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    action()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    const target = event.target as HTMLElement
    const command = transportCommand(event, { tagName: target.tagName, role: target.getAttribute('role') })
    if (command === null) return
    event.preventDefault()
    if (command === 'toggle') toggle()
    else if (command === 'step') onStep()
    else {
      const next = neighbourSpeed(speeds, speed, command === 'faster' ? 1 : -1)
      if (next !== null && next !== speed) onSpeedChange(next)
    }
  }

  return (
    <div
      className={cn('k-replay', className)}
      role="group"
      aria-label={labels.group}
      data-slot="replay-transport"
      data-playing={playing ? '' : undefined}
      onKeyDown={onKeyDown}
    >
      <div className="k-replay-row">
        <div className="k-replay-buttons">
          <Button
            size="sm"
            variant="primary"
            data-action={playing ? 'pause' : 'play'}
            disabled={disabled}
            onClick={toggle}
          >
            <Glyph d={playing ? PAUSE : PLAY} />
            {playing ? labels.pause : labels.play}
          </Button>
          <Button size="sm" data-action="step" disabled={disabled} onClick={onStep}>
            <Glyph d={STEP} />
            {labels.step}
          </Button>
        </div>
        <ToggleGroup
          size="sm"
          aria-label={labels.speed}
          value={speeds.includes(speed) ? String(speed) : null}
          onValueChange={(value) => onSpeedChange(Number(value))}
          disabled={disabled}
          data-slot="replay-speed"
        >
          {speeds.map((item) => (
            <ToggleGroupItem key={item} value={String(item)} data-speed={item}>
              {formatSpeed(item)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Lcd label={labels.time} value={formatTime(shownTime)} tone="accent" inline />
        {syncedPanels !== undefined && syncedPanels > 1 && (
          <span className="k-replay-sync" role="status" data-slot="replay-sync">
            <Led tone="accent" label={labels.synced(syncedPanels)} />
            <span>{labels.synced(syncedPanels)}</span>
          </span>
        )}
      </div>
      <Scrubber
        label={labels.progress}
        value={shownTime}
        min={start}
        max={Math.max(start, end)}
        step={progressStep(start, end)}
        ticks={0}
        format={(value) => formatTime(value) ?? '—'}
        onValueChange={disabled ? undefined : onSeek}
      />
      <div className="k-replay-row">
        <span className="k-replay-field">
          <Input
            size="sm"
            aria-label={labels.jumpTo}
            aria-invalid={jumpBad || undefined}
            value={jumpText}
            placeholder={formatTime(shownTime) ?? ''}
            disabled={disabled}
            onChange={(event) => {
              setJumpText(event.target.value)
              setJumpBad(false)
            }}
            onKeyDown={submitOnEnter(jump)}
          />
          <Button size="sm" data-action="jump" disabled={disabled || jumpText.trim() === ''} onClick={jump}>
            {labels.jump}
          </Button>
          {jumpBad && (
            <span className="k-replay-bad" role="alert">
              {labels.invalidTime}
            </span>
          )}
        </span>
        <span className="k-replay-field">
          <Input
            size="sm"
            inputMode="numeric"
            aria-label={labels.skipTicks}
            aria-invalid={ticks === null || undefined}
            value={skipText}
            disabled={disabled}
            onChange={(event) => setSkipText(event.target.value)}
            onKeyDown={submitOnEnter(skip)}
            className="k-replay-ticks"
          />
          <Button size="sm" data-action="skip" disabled={disabled || ticks === null} onClick={skip}>
            {labels.skip}
          </Button>
        </span>
      </div>
    </div>
  )
}

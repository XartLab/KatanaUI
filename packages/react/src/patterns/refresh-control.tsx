// SPDX-License-Identifier: MIT
// 自动刷新控件（#77 第 5 条，#22 G12）：间隔分段（TradingView 筛选器是「10 秒 / 1 分钟 / 不刷新」）+ 立即刷新钮 + 上次刷新时刻 + 下次倒计时。
// 受控：间隔（interval）、上次刷新时刻（lastRefreshed）、是否在刷（refreshing）都由调用方给；到点时调 onRefresh，调用方拉完数据再更新 lastRefreshed。
// 计时（useAutoRefresh）：以 lastRefreshed + interval 为到点时刻，每秒走一次倒计时；正在刷时不计；标签页隐藏时停（不白拉数据），回来时过了点就马上刷一次（照 G12「隐藏标签页时暂停」）。
// 文字（读屏名、「上次」「下次」）由调用方传；时刻默认写本地 HH:MM:SS，倒计时写 12s / 1:05。
import { RotateCwIcon } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'

export type RefreshOption = {
  /** Interval in milliseconds; 0 means off. */
  value: number
  /** Segment text (10s, 1m, Off). */
  label: string
}

export type RefreshControlLabels = {
  /** 间隔分段的读屏名（「自动刷新」）。 */
  interval: string
  /** 立即刷新钮的读屏名与提示。 */
  refresh: string
  /** 「上次」「下次」两段的前缀。 */
  last: string
  next: string
  /** 还没刷过时上次那段写什么（「—」）。 */
  never?: string
}

const subscribeVisibility = (notify: () => void) => {
  if (typeof document === 'undefined') return () => {}
  document.addEventListener('visibilitychange', notify)
  return () => document.removeEventListener('visibilitychange', notify)
}
const visibleNow = () => typeof document === 'undefined' || document.visibilityState !== 'hidden'

/** 倒计时的字：60 秒以内写「12s」，以上写「1:05」。 */
export function formatRemaining(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000))
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** 本地时刻 HH:MM:SS。 */
export const formatClock = (time: number): string =>
  new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(
    time,
  )

export type UseAutoRefreshOptions = {
  /** Interval in milliseconds; 0 or less is off. */
  interval: number
  /** When the data was last refreshed (epoch ms); null before the first refresh (counts from mount). */
  lastRefreshed: number | null
  onRefresh: () => void
  /** A refresh is in flight: the countdown waits. */
  refreshing?: boolean
  /** Stop while the tab is hidden; default true. */
  pauseWhenHidden?: boolean
}

/** 自动刷新的计时：返回离下次刷新还有多少毫秒（关着或在刷时是 null）。到点调 onRefresh。 */
export function useAutoRefresh({
  interval,
  lastRefreshed,
  onRefresh,
  refreshing = false,
  pauseWhenHidden = true,
}: UseAutoRefreshOptions): number | null {
  const visible = useSyncExternalStore(subscribeVisibility, visibleNow, () => true)
  const [mountedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const refresh = useRef(onRefresh)
  // 同一个到点时刻只刷一次：调用方异步拉数据、没给 refreshing 时，不会每秒再催一遍。
  const fired = useRef<number | null>(null)
  useEffect(() => {
    refresh.current = onRefresh
  }, [onRefresh])
  const active = interval > 0 && !refreshing && (visible || !pauseWhenHidden)
  const due = (lastRefreshed ?? mountedAt) + interval

  useEffect(() => {
    if (!active) return
    const tick = () => {
      const at = Date.now()
      setNow(at)
      if (at >= due && fired.current !== due) {
        fired.current = due
        refresh.current()
      }
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [active, due])

  return active ? Math.max(0, due - now) : null
}

export type RefreshControlProps = {
  /** Segments to pick from; each value is milliseconds, 0 is off. */
  options: readonly RefreshOption[]
  /** Current interval in milliseconds (controlled); 0 is off. */
  interval: number
  /** Called with the picked interval in milliseconds. */
  onIntervalChange: (interval: number) => void
  /** When the data was last refreshed (epoch ms); null before the first refresh. */
  lastRefreshed: number | null
  /** Refresh now (the button, and each time the countdown runs out). */
  onRefresh: () => void
  /** A refresh is in flight: the icon spins and the countdown waits. */
  refreshing?: boolean
  /** All text: interval group name, refresh button name, the last / next prefixes. 文字全由调用方给。 */
  labels: RefreshControlLabels
  /** Writes the last-refresh time; default local HH:MM:SS. */
  formatTime?: (time: number) => string
  /** Stop counting while the tab is hidden; default true. */
  pauseWhenHidden?: boolean
  /** Extra class name on the root. */
  className?: string
}

/** 自动刷新：间隔分段 + 立即刷新 + 上次时刻 + 下次倒计时（受控）。 */
export function RefreshControl({
  options,
  interval,
  onIntervalChange,
  lastRefreshed,
  onRefresh,
  refreshing = false,
  labels,
  formatTime = formatClock,
  pauseWhenHidden = true,
  className,
}: RefreshControlProps) {
  const remaining = useAutoRefresh({ interval, lastRefreshed, onRefresh, refreshing, pauseWhenHidden })
  return (
    <div className={cn('k-refresh', className)} data-slot="refresh-control" data-refreshing={refreshing || undefined}>
      <ToggleGroup
        size="sm"
        aria-label={labels.interval}
        value={String(interval)}
        onValueChange={(next) => {
          if (next !== '') onIntervalChange(Number(next))
        }}
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={String(option.value)}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <button
        type="button"
        className={cn('k-refresh-now', focusRing)}
        data-slot="refresh-now"
        aria-label={labels.refresh}
        title={labels.refresh}
        aria-disabled={refreshing || undefined}
        onClick={() => {
          if (!refreshing) onRefresh()
        }}
      >
        <RotateCwIcon size={14} aria-hidden="true" />
      </button>
      <span className="k-refresh-meta" data-slot="refresh-meta">
        <span>
          {labels.last}{' '}
          <time dateTime={lastRefreshed === null ? undefined : new Date(lastRefreshed).toISOString()}>
            {lastRefreshed === null ? (labels.never ?? '—') : formatTime(lastRefreshed)}
          </time>
        </span>
        {remaining === null ? null : (
          <span data-slot="refresh-countdown">
            {labels.next} {formatRemaining(remaining)}
          </span>
        )}
      </span>
    </div>
  )
}

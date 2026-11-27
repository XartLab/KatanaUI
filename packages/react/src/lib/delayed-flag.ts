// SPDX-License-Identifier: MIT
// 「晚出、出了就留够」的旗子：on 变真以后等 delay 毫秒才变真（快的等待不闪），变真以后至少留 min 毫秒才允许变假（出了不一闪而过）。
// 出处：kubai Vibe Design Tips 017「加载状态」规则 2：300ms 后才出现的，至少留 500ms，写一个 helper 到处用。
// 纯定时器逻辑，不碰 React：createDelayedFlag 给加载闸门（katana/loading-gate.ts）用，useDelayedFlag 给 Button 的 pending、MeasuredSkeleton 用；规则本身用假计时器测。
import { useEffect, useRef, useState } from 'react'

/** 按钮进行中的转圈：等了多久才出（毫秒）。kubai 017：单个动作 0.3 到 3s，300ms 内不出单独的指示。 */
export const PENDING_DELAY_MS = 300
/** 出了以后至少留多久（毫秒）。kubai 017：出现了的至少留 500ms。 */
export const PENDING_MIN_MS = 500

export type DelayedFlagOptions = { delay: number; min: number }

export type DelayedFlag = {
  /** 旗子现在的值（已经出了没有）。 */
  readonly visible: boolean
  /** on 变了：真开始等 delay；假则在留够 min 以后才变假（没出过就什么也不发生）。 */
  set(on: boolean): void
  /** 清掉所有定时器，不再回调。 */
  dispose(): void
}

/**
 * 旗子的状态机。onChange 只在值真的变了时调：出了（true）、收了（false）。
 * 选项用函数取，调用方改了 delay / min 下一次 set 就用新值。
 */
export function createDelayedFlag(
  options: DelayedFlagOptions | (() => DelayedFlagOptions),
  onChange: (visible: boolean) => void,
): DelayedFlag {
  const read = typeof options === 'function' ? options : () => options
  let visible = false
  let shownAt = 0
  let showTimer: ReturnType<typeof setTimeout> | undefined
  let hideTimer: ReturnType<typeof setTimeout> | undefined
  const change = (next: boolean) => {
    if (visible === next) return
    visible = next
    onChange(next)
  }
  return {
    get visible() {
      return visible
    },
    set(on) {
      if (on) {
        // 正等着收：取消，旗子一直留着；已经出了或已经在等出：什么也不做。
        clearTimeout(hideTimer)
        hideTimer = undefined
        if (visible || showTimer !== undefined) return
        showTimer = setTimeout(() => {
          showTimer = undefined
          shownAt = Date.now()
          change(true)
        }, read().delay)
        return
      }
      clearTimeout(showTimer)
      showTimer = undefined
      if (!visible || hideTimer !== undefined) return
      const left = read().min - (Date.now() - shownAt)
      if (left <= 0) change(false)
      else
        hideTimer = setTimeout(() => {
          hideTimer = undefined
          change(false)
        }, left)
    },
    dispose() {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
      showTimer = undefined
      hideTimer = undefined
    },
  }
}

/**
 * 在 on 为真并等了 delay 毫秒以后才为真；出了以后至少留 min 毫秒。on 一直不够 delay 就变回假，旗子从不出现。
 * 例：按钮转圈 useDelayedFlag(pending, 300, 500)。
 */
export function useDelayedFlag(on: boolean, delay: number = PENDING_DELAY_MS, min: number = PENDING_MIN_MS): boolean {
  const [visible, setVisible] = useState(false)
  const latest = useRef<DelayedFlagOptions>({ delay, min })
  const flag = useRef<DelayedFlag | null>(null)
  useEffect(() => {
    latest.current = { delay, min }
  }, [delay, min])
  useEffect(() => {
    const created = createDelayedFlag(() => latest.current, setVisible)
    flag.current = created
    return () => {
      created.dispose()
      flag.current = null
    }
  }, [])
  useEffect(() => {
    flag.current?.set(on)
  }, [on])
  return visible
}

/**
 * 停在整圈上：从 startedAt 起一直在转，每圈 turnMs；现在要停，还要转多久才到整圈（毫秒）。刚好在整圈上是 0。
 * 图标本身就是动作的按钮（刷新、同步）用：至少转一整圈，停的时候停在整圈上（kubai 017）。
 */
export function remainingToWholeTurn(elapsed: number, turnMs: number): number {
  if (!(turnMs > 0)) return 0
  if (!(elapsed > 0)) return turnMs
  const into = elapsed % turnMs
  return into === 0 ? 0 : turnMs - into
}

/** 图标转一圈的毫秒数：kubai 017 写「至少一圈 640ms」。 */
export const SPIN_TURN_MS = 640

/**
 * on 为真时立刻转（没有延迟）；on 变假以后继续转到整圈才停，所以至少转一整圈，也不会停在半圈上。
 * 返回值是「现在该不该转」，CSS 动画的周期要与 SPIN_TURN_MS 一致。
 */
export function useSpinWholeTurns(on: boolean, turnMs: number = SPIN_TURN_MS): boolean {
  const [spinning, setSpinning] = useState(on)
  const startedAt = useRef(0)
  // 开始转：渲染时就判，第一帧就在转（不等 effect）。
  if (on && !spinning) setSpinning(true)
  useEffect(() => {
    if (on) {
      startedAt.current = Date.now()
      return
    }
    if (!startedAt.current) return
    const wait = remainingToWholeTurn(Date.now() - startedAt.current, turnMs)
    startedAt.current = 0
    const timer = setTimeout(() => setSpinning(false), wait)
    return () => clearTimeout(timer)
  }, [on, turnMs])
  return on || spinning
}

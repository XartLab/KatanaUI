// SPDX-License-Identifier: MIT

// 「加载中」的闸门：开始等以后 500ms 内到了不出骨架（免得一闪），超过了才出；之后到 2s 改说「仍在加载」，到 10s 转成带重试的琥珀条（states.md 加载态）。
// 参照 Kobra Skeleton（kobra.systems/components/skeleton，2026-10-26 读自其页面）：只取量（延迟之后出、出过才揭示），不搬代码。
// 纯定时器逻辑，不碰 React：组件只负责把 onPhase 接到 state 上，规则本身用假计时器测。
// 最短停留（#251 批 A，kubai Vibe Design Tips 017 规则 2「出现了的至少留 500ms」）：骨架出了以后至少留 minShown，
// 数据要是在骨架刚出 10ms 时到，等满再交出内容，免得骨架一闪就没。「出」与「留」的状态机是 lib/delayed-flag.ts 的 createDelayedFlag，按钮的 pending 用同一份。
import { createDelayedFlag } from '../lib/delayed-flag.ts'

/** 开始等以后多久才出骨架。 */
export const LOADING_DELAY_MS = 500
/** 骨架出了以后，等到多久（从开始等算）改说「仍在加载」。states.md 加载态：超过 2s。 */
export const LOADING_SLOW_MS = 2000
/** 等到多久（从开始等算）转成带重试的琥珀条。states.md 加载态：超过 10s。 */
export const LOADING_TIMEOUT_MS = 10_000

/** 骨架出现之后的三段：loading 是「加载 X」，slow 是「仍在加载」，timeout 是琥珀条加重试。 */
export type LoadingPhase = 'loading' | 'slow' | 'timeout'

/** 骨架出了以后至少留多久，再交出内容。kubai Vibe Design Tips 017：出现了的至少留 500ms（与按钮转圈的最短停留同一个值）。 */
export const LOADING_MIN_SHOWN_MS = 500

export type LoadingTiming = { delay: number; slow: number; timeout: number; minShown?: number }

export const LOADING_TIMING: LoadingTiming = {
  delay: LOADING_DELAY_MS,
  slow: LOADING_SLOW_MS,
  timeout: LOADING_TIMEOUT_MS,
  minShown: LOADING_MIN_SHOWN_MS,
}

export type LoadingGate = {
  /** 停止等待并立刻收尾（组件卸载）。返回骨架是否真的出现过：出过才揭示，没出过内容直接出现。 */
  stop(): boolean
  /**
   * 内容到了：没出过骨架就立刻调 onDone；出过但还没留够 minShown，等满了再调（期间骨架继续显示）。返回取消函数：
   * 等待期间数据又变回「在等」时取消，骨架照旧留着。stop() 仍可随时调。
   */
  release(onDone: () => void): () => void
}

/** 三个时刻各一个定时器，都从开始等算起；到了就把新的一段交给 onPhase。 */
export function startLoadingGate(
  onPhase: (phase: LoadingPhase) => void,
  timing: LoadingTiming = LOADING_TIMING,
): LoadingGate {
  let done: (() => void) | undefined
  // 骨架出没出过：旗子收了（留够了）以后也要记得，卸载时据此决定内容要不要揭示。
  let shown = false
  const flag = createDelayedFlag({ delay: timing.delay, min: timing.minShown ?? 0 }, (visible) => {
    if (visible) {
      shown = true
      onPhase('loading')
    } else {
      const finish = done
      done = undefined
      finish?.()
    }
  })
  flag.set(true)
  const timers = [
    setTimeout(() => {
      onPhase('slow')
    }, timing.slow),
    setTimeout(() => {
      onPhase('timeout')
    }, timing.timeout),
  ]
  const clearAll = () => {
    for (const timer of timers) clearTimeout(timer)
    flag.dispose()
  }
  return {
    stop() {
      clearAll()
      return shown
    },
    release(onDone) {
      done = onDone
      if (!flag.visible) {
        // 骨架没出过（500ms 内到了，或还在等出）：不留，立刻交出。
        flag.set(false)
        done = undefined
        onDone()
        return () => {}
      }
      flag.set(false)
      return () => {
        done = undefined
        flag.set(true)
      }
    },
  }
}

/** 骨架最多画几行：高的面板也只画这么多，免得铺出几百个节点。 */
export const MAX_SKELETON_ROWS = 60

/**
 * 撑满面板主体的骨架该画几行：量到的容器高度除以一行的高度取整，封顶 MAX_SKELETON_ROWS；
 * 还没量到（没有高度，或行高读不出来）就用 fallback。
 */
export function skeletonRows(height: number | null, rowHeight: number, fallback: number): number {
  if (height === null || !(height > 0) || !(rowHeight > 0)) return fallback
  return Math.min(MAX_SKELETON_ROWS, Math.floor(height / rowHeight))
}

/** 骨架每行的宽度（占容器的百分比）：第一行 40%，最后一行 70%，中间满宽；只有一行时取 70%。 */
export function skeletonWidths(lines: number): number[] {
  const count = Math.min(MAX_SKELETON_ROWS, Math.max(1, Math.floor(lines)))
  return Array.from({ length: count }, (_, i) => (i === 0 && count > 1 ? 40 : i === count - 1 ? 70 : 100))
}

// SPDX-License-Identifier: MIT

// 「加载中」的闸门：开始等以后 500ms 内到了不出骨架（免得一闪），超过了才出；之后到 2s 改说「仍在加载」，到 10s 转成带重试的琥珀条（states.md 加载态）。
// 参照 Kobra Skeleton（kobra.systems/components/skeleton，2026-10-26 读自其页面）：只取量（延迟之后出、出过才揭示），不搬代码。
// 纯定时器逻辑，不碰 React：组件只负责把 onPhase 接到 state 上，规则本身用假计时器测。

/** 开始等以后多久才出骨架。 */
export const LOADING_DELAY_MS = 500
/** 骨架出了以后，等到多久（从开始等算）改说「仍在加载」。states.md 加载态：超过 2s。 */
export const LOADING_SLOW_MS = 2000
/** 等到多久（从开始等算）转成带重试的琥珀条。states.md 加载态：超过 10s。 */
export const LOADING_TIMEOUT_MS = 10_000

/** 骨架出现之后的三段：loading 是「加载 X」，slow 是「仍在加载」，timeout 是琥珀条加重试。 */
export type LoadingPhase = 'loading' | 'slow' | 'timeout'

export type LoadingTiming = { delay: number; slow: number; timeout: number }

export const LOADING_TIMING: LoadingTiming = {
  delay: LOADING_DELAY_MS,
  slow: LOADING_SLOW_MS,
  timeout: LOADING_TIMEOUT_MS,
}

export type LoadingGate = {
  /** 停止等待（内容到了或组件卸载）。返回骨架是否真的出现过：出过才揭示，没出过内容直接出现。 */
  stop(): boolean
}

/** 三个时刻各一个定时器，都从开始等算起；到了就把新的一段交给 onPhase。 */
export function startLoadingGate(
  onPhase: (phase: LoadingPhase) => void,
  timing: LoadingTiming = LOADING_TIMING,
): LoadingGate {
  let shown = false
  const timers = [
    setTimeout(() => {
      shown = true
      onPhase('loading')
    }, timing.delay),
    setTimeout(() => {
      onPhase('slow')
    }, timing.slow),
    setTimeout(() => {
      onPhase('timeout')
    }, timing.timeout),
  ]
  return {
    stop() {
      for (const timer of timers) clearTimeout(timer)
      return shown
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

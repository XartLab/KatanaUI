// SPDX-License-Identifier: AGPL-3.0-only
// 分步进度条的纯逻辑（katana/step-player.tsx 的文件头写了出处）：走到一步的末尾时下一步是什么。

export type StepArrival = { kind: 'advance'; index: number } | { kind: 'loop' } | { kind: 'finish' }

/** 第 index 步（0 起）放完了：还有下一步就前进；最后一步放完，loop 回第一步，否则结束。 */
export function arrive(index: number, count: number, loop: boolean): StepArrival {
  if (index < count - 1) return { kind: 'advance', index: index + 1 }
  return loop ? { kind: 'loop' } : { kind: 'finish' }
}

/** 把任何传进来的步序夹进 0 到 count-1；不是有限数当 0。 */
export function clampStep(index: number, count: number): number {
  if (!Number.isFinite(index)) return 0
  return Math.min(Math.max(0, Math.trunc(index)), Math.max(0, count - 1))
}

/** 每一步的时长（毫秒）：步上自己写了就用它，否则用整体的；不是正数的当 0（那一步不自己走）。 */
export function stepDuration(own: number | undefined, fallback: number): number {
  const value = own ?? fallback
  return Number.isFinite(value) && value > 0 ? value : 0
}

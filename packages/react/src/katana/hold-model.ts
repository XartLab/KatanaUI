// SPDX-License-Identifier: MIT
// 按住确认（HoldToConfirm）的进度规则（纯函数，组件与单测共用）。
// 时长的出处：按住 2 秒填满、松手 200ms 线性退回，取自 Emil Kowalski 的 hold-to-delete 写法（instagit.com/emilkowalski/skills 的
// 「How to Implement a Hold-to-Delete Pattern」，HOLD_DURATION = 2000，松手 200ms ease-out 退回，2026-11-14 读）。那篇只写了指针，
// 没写键盘；键盘按住空格 / 回车沿用同一组时长（自定）。2 秒对「全平、全撤、停策略」是否合适没有实测，调用方按动作的紧迫程度改 holdMs，默认值待定。

/** 按住多久填满（毫秒）。待定：出处只给了删除场景。 */
export const HOLD_MS = 2000
/** 松手后从满格退回空格要多久（毫秒）。 */
export const RELEASE_MS = 200

/** 过了 dt 毫秒之后的进度（0 到 1）：按着就往满走，松着就往空退。 */
export function stepProgress(
  progress: number,
  dt: number,
  holding: boolean,
  holdMs = HOLD_MS,
  releaseMs = RELEASE_MS,
): number {
  const next = holding ? progress + dt / holdMs : progress - dt / releaseMs
  return Math.min(1, Math.max(0, next))
}

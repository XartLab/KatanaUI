// SPDX-License-Identifier: MIT
// 改自 SmoothUI ai-context-meter（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 上下文用量的纯逻辑：token 数的紧凑写法、用量占比、占比落在哪一档（决定环的色相）。

const KILO = 1000
const MEGA = 1_000_000
/** 一万以下保留一位小数：1,800 写成「2k」是谎话。 */
const DECIMAL_BELOW = 10 * KILO

/** 紧凑的 token 数：842、1.8k、62k、1.0M。纯数字加单位字母，不带中文。 */
export function formatTokenCount(tokens: number): string {
  const value = Math.max(0, Number.isFinite(tokens) ? tokens : 0)
  if (value >= MEGA) return `${(value / MEGA).toFixed(1)}M`
  if (value >= DECIMAL_BELOW) return `${Math.round(value / KILO)}k`
  if (value >= KILO) return `${(value / KILO).toFixed(1)}k`
  return String(Math.round(value))
}

/** 已用占比，夹在 0 到 1；窗口大小非正时是 0。 */
export function contextFraction(used: number, limit: number): number {
  return limit > 0 ? Math.min(1, Math.max(0, used / limit)) : 0
}

export type ContextLevel = 'ok' | 'warning' | 'danger'

export const DEFAULT_WARNING_AT = 0.8
export const DEFAULT_DANGER_AT = 0.95

/** 占比到了哪一档。越过阈值只换色相、不换大小：环在警告点变大会读成「进展不错」，跟要传达的相反。 */
export function contextLevel(
  fraction: number,
  warningAt = DEFAULT_WARNING_AT,
  dangerAt = DEFAULT_DANGER_AT,
): ContextLevel {
  if (fraction >= dangerAt) return 'danger'
  if (fraction >= warningAt) return 'warning'
  return 'ok'
}

// SPDX-License-Identifier: MIT
// 数字框的取值规则（纯函数，组件与单测共用）。
// 拖动改值的约定：按住数字框左右拖，向右变大、向左变小；Shift 粗调（一格 ×10），Alt 精调（一格 ×0.1）；方向键同理。
// 出处：网页里拖数值的主流做法是 Figma 的（Alt / Option 拖动是更精细，Figma 论坛的官方答复，forum.figma.com 「option drag to change
// values is inconsistent」，2026-10-17 读）；Shift 粗调 ×10 是主会话照 Figma 的方向键约定定的（原文未读）。灵敏度是 Claude 定的：
// 常速 4px 一档。粗调不用 Ctrl（Mac 上 Ctrl + 点击会变成右键）。

/** 常速：每拖多少像素改一档（一档 = step）。 */
export const SCRUB_PX_PER_STEP = 4
/** 精调时步长已经是整数（不能再切成十分之一）：改成每拖这么多像素才走一档，速度同样是常速的十分之一。 */
export const SCRUB_SLOW_PX_PER_STEP = 40
/** Shift 粗调：一格改十档。 */
export const SCRUB_COARSE_STEPS = 10
/** Alt 精调：小数步长的一格是步长的十分之一。 */
export const SCRUB_FINE_DIVISOR = 10
/** 按下去后挪过这么多像素才算拖动，之前的是点击（点进去打字）。 */
export const SCRUB_THRESHOLD_PX = 3

export type ScrubKeys = { shift: boolean; alt: boolean }
export type ScrubMode = 'normal' | 'fine' | 'coarse'

export type Range = { min?: number; max?: number; step: number }

/** 同时按了：Alt 优先（要精调的人不想被粗调带跑）。 */
export const scrubMode = (keys: ScrubKeys): ScrubMode => (keys.alt ? 'fine' : keys.shift ? 'coarse' : 'normal')

/**
 * 这个模式下一格走多少、要拖多少像素。
 * 精调：步长小于 1（小数框）时一格是步长的十分之一；步长是整数的框（根数、像素、百分比）仍按整数走，只是慢十倍（拖 40px 一档），
 * 免得整数设置被调出 0.1 这种存不进去的值。
 */
export function stepPlan(mode: ScrubMode, step: number): { px: number; increment: number } {
  if (mode === 'coarse') return { px: SCRUB_PX_PER_STEP, increment: step * SCRUB_COARSE_STEPS }
  if (mode === 'fine')
    return step < 1
      ? { px: SCRUB_PX_PER_STEP, increment: step / SCRUB_FINE_DIVISOR }
      : { px: SCRUB_SLOW_PX_PER_STEP, increment: step }
  return { px: SCRUB_PX_PER_STEP, increment: step }
}

/**
 * 夹进范围。结果里的 -0 归一成 0：`Number((-1e-11).toFixed(10))` 与 `Number('-0')` 都得 -0，
 * `Object.is` 与 `toLocaleString` 之类的格式化都会把它当成另一个值（显示成 "-0"）；`-0 + 0` 是 0。
 */
export const clampTo = (value: number, { min, max }: Pick<Range, 'min' | 'max'>): number =>
  Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value)) + 0

/**
 * 夹进范围，只去掉浮点尾巴（0.1 + 0.2 之类）。不把结果拉回以 0 为原点的步长网格：步进以当前值为基准（0.1、步长 0.5，
 * 上键得 0.6），合法但没对齐的值（打字打进去的、别处写进来的）照样能按步长调。文件头引的出处（Figma 的拖动约定）只定了修饰键与倍率，没有要求对齐网格。
 */
export function tidy(value: number, range: Pick<Range, 'min' | 'max'>): number {
  return clampTo(Number(value.toFixed(10)), range)
}

/** 从 start 开始，水平拖了 dx 像素（向右为正）之后的值。 */
export function scrubbed(start: number, dx: number, mode: ScrubMode, range: Range): number {
  const { px, increment } = stepPlan(mode, range.step)
  return tidy(start + Math.trunc(dx / px) * increment, range)
}

/** 上下方向键 / PageUp、PageDown：direction 为 1 是变大；Shift 与拖动一样是十档，Alt 是精调；PageUp / PageDown 总是十档。 */
export function nudged(value: number, direction: 1 | -1, keys: ScrubKeys, range: Range, page = false): number {
  const { increment } = stepPlan(page ? 'coarse' : scrubMode(keys), range.step)
  return tidy(value + direction * increment, range)
}

/** 打字时的值：不是数（空串、只有负号、字母）返回 null，是数就夹进范围（不对齐步长：打字的人说了算）。 */
export function typed(text: string, range: Pick<Range, 'min' | 'max'>): number | null {
  if (text.trim() === '') return null
  const next = Number(text)
  return Number.isFinite(next) ? clampTo(next, range) : null
}

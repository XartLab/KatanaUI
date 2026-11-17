// SPDX-License-Identifier: MIT
import BigNumber from 'bignumber.js'

// 十进制字符串走一格（价格、数量框的 − / + 与方向键）：价格与数量不经 JS 浮点（决策记录 0014），所以用 bignumber.js。
// 独立实例，配置只写这一处、不动全局；出处：bignumber.js 文档的 clone / EXPONENTIAL_AT，2026-11-14 读自 npm 包的类型定义。
// 搬自应用的 stepValue（下单面板，#253 / #387），行为不变。
const D = BigNumber.clone({ EXPONENTIAL_AT: 1e9 })

// 只认普通十进制写法（没有指数、千分位、空白）。
const PLAIN = /^-?\d+(\.\d+)?$/
const parse = (text: string) => (PLAIN.test(text) ? new D(text) : null)

/**
 * 按 step 走 direction 个方向的一格（multiplier 格，Shift 十格传 10）。
 * - value 为空框时从 base 起；两个都没有、或不是十进制写法，返回 null。
 * - step 为 0 按 1 走。
 * - value 不在 step 的整数倍上时，第一格先往走的方向对齐到格子上（multiplier 大于 1 时再多走 multiplier - 1 格）。
 * - 结果小于等于 0 返回 null（价格与数量没有零和负数，调用方不动）。
 * 返回 `toFixed()` 的规范字符串。
 */
export function stepDecimal(
  value: string,
  base: string | null,
  step: string,
  direction: 1 | -1,
  multiplier = 1,
): string | null {
  const from = parse(value.trim() === '' ? (base ?? '') : value.trim())
  const size = parse(step)
  if (!from || !size) return null
  const unit = size.isZero() ? size.plus(1) : size
  const snapped = from
    .div(unit)
    .integerValue(direction === 1 ? D.ROUND_CEIL : D.ROUND_FLOOR)
    .times(unit)
  const steps = snapped.eq(from) ? multiplier : multiplier - 1
  const next = snapped.plus(unit.times(direction * steps))
  return next.gt(0) ? next.toFixed() : null
}

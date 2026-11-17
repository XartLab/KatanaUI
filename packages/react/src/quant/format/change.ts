// SPDX-License-Identifier: MIT
// 涨跌的写法与方向。方向（tone）由「按显示的位数舍入之后」的值定：写出来是 0.00% 的不着色，文字和颜色不会一个说涨一个说平。

import type { Tone } from '../../lib/tone.ts'

export type { Tone }

const rounded = (value: number, digits: number): number => Number(value.toFixed(digits))

/** 方向：舍入到 digits 位之后大于 0 是涨，小于 0 是跌，其余（含不是有限数）是平。字符串里的「−」（U+2212）当负号。 */
export function toneOf(value: number | string | null | undefined, digits = 8): Tone {
  if (value === null || value === undefined) return 'flat'
  const number = typeof value === 'string' ? Number(value.replace('−', '-')) : value
  if (!Number.isFinite(number)) return 'flat'
  const at = rounded(number, digits)
  return at > 0 ? 'up' : at < 0 ? 'down' : 'flat'
}

/** 涨跌幅（已经是百分数，1.5 就是 1.5%）：正数带 +，负数带 -，舍入成零不带号。 */
export function formatPercentChange(value: number, digits = 2): string {
  const at = rounded(value, digits)
  return `${at > 0 ? '+' : ''}${at === 0 ? (0).toFixed(digits) : at.toFixed(digits)}%`
}

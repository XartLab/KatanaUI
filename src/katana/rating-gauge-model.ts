// SPDX-License-Identifier: MIT
// 评级仪表的几何与分档（纯函数）：半圆从左（−1，强烈卖出）到右（+1，强烈买入）分五段，指针按分数转。

export const RATING_ZONES = 5
export const GAUGE_CX = 100
export const GAUGE_CY = 100
export const GAUGE_R = 84

const clampScore = (score: number) => (Number.isFinite(score) ? Math.min(1, Math.max(-1, score)) : 0)

/**
 * 五段的分界，照 TradingView「Technical Ratings」的阈值（tradingview.com/support/solutions/43000614331，2026-11-14 读；
 * 用户 2026-11-14 定评级照它的规则，#1888）：小于 −0.5 强烈卖出，−0.5 到 −0.1 卖出，−0.1 到 0.1 中性，0.1 到 0.5 买入，大于 0.5 强烈买入。
 * 正好落在 ±0.1 的算中性，落在 ±0.5 的算卖出 / 买入（帮助页写「−0.1 to 0.1」中性、「above 0.5」强买）。
 */
export const RATING_BOUNDS = [-1, -0.5, -0.1, 0.1, 0.5, 1] as const

/** 分数（−1 到 +1）落在第几段（0 到 4，从左到右）；不是有限数落在中间那段。 */
export function ratingZone(score: number): number {
  const s = clampScore(score)
  if (s < -0.5) return 0
  if (s < -0.1) return 1
  if (s <= 0.1) return 2
  if (s <= 0.5) return 3
  return 4
}

/** 指针转角（度，0 指正上方，−90 指最左，+90 指最右）。 */
export const ratingAngle = (score: number): number => clampScore(score) * 90

const point = (deg: number, r: number) => {
  const rad = (deg * Math.PI) / 180
  return [GAUGE_CX + r * Math.sin(rad), GAUGE_CY - r * Math.cos(rad)] as const
}

/** 第 index 段的弧（SVG path 的 d）：段与段之间留 gap 度的缝。 */
export function zoneArc(index: number, gap = 3): string {
  // 弧按分界画（跟指针的转角同一把尺子），指针指到哪一段，就是哪一档。
  const a0 = ratingAngle(RATING_BOUNDS[index]) + gap / 2
  const a1 = ratingAngle(RATING_BOUNDS[index + 1]) - gap / 2
  const [x0, y0] = point(a0, GAUGE_R)
  const [x1, y1] = point(a1, GAUGE_R)
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${GAUGE_R} ${GAUGE_R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

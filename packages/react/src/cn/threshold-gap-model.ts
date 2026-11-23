// SPDX-License-Identifier: MIT
// 异动阈值差读数（ThresholdGap，KatanaUI #11 第 10 项）的纯函数：离阈值还差多少、处在哪一档。单位都是百分点。
// 阈值（连续几个交易日的累计偏离值达到多少算异常波动）是交易所规则，各板块不同，包里不带，由调用方传；偏离值可正可负，按绝对值比。

/** Where a stock stands: watched, near the warning line, triggered, or past its supervision period. */
export type ThresholdGapState = 'watch' | 'near' | 'triggered' | 'ended'

const known = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value)

/** 离阈值还差多少（百分点）：阈值 − |偏离值|；正数是还差、0 或负数是已达到（负数的绝对值是超出多少）。任一方取不到返回 null。 */
export function thresholdGap(value: number | null | undefined, threshold: number): number | null {
  if (!known(value) || !known(threshold) || threshold <= 0) return null
  return Math.round((threshold - Math.abs(value)) * 1e6) / 1e6
}

/**
 * 处在哪一档：监管期结束由调用方说（ended）；|偏离值| 达到阈值是已触发；达到预警线是临近；其余是监控中。
 * 偏离值取不到返回 null（不猜）。
 */
export function thresholdState(
  value: number | null | undefined,
  threshold: number,
  warnAt?: number,
  ended = false,
): ThresholdGapState | null {
  if (ended) return 'ended'
  const gap = thresholdGap(value, threshold)
  if (gap === null || !known(value)) return null
  if (gap <= 0) return 'triggered'
  return known(warnAt) && Math.abs(value) >= warnAt ? 'near' : 'watch'
}

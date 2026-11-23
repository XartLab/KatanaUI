// SPDX-License-Identifier: MIT
/**
 * Pure model of AccountEquity: margin ratio, its risk level against the caller's thresholds, and the bands and marker position of the risk bar.
 * 账户权益概览的纯函数：保证金率、按调用方阈值分档、风险条的分段与指针位置。阈值是调用方的（各家交易所口径不同），件里不写死。
 */
import { clamp } from '../../lib/num.ts'

export type MarginLevel = 'safe' | 'warn' | 'danger'

/**
 * Thresholds of the margin ratio, in percent.
 * `higher` (default): a higher ratio is riskier (used margin over equity); warn and danger are the ratios at and above which the level starts, danger above warn.
 * `lower`: a lower ratio is riskier (equity over maintenance margin); warn and danger are the ratios at and below which the level starts, danger below warn.
 */
export type MarginThresholds = {
  /** Ratio, in percent, at which the warn level starts. */
  warn: number
  /** Ratio, in percent, at which the danger level starts. */
  danger: number
  /** Which way is riskier: `higher` (default) or `lower`. */
  direction?: 'higher' | 'lower'
}

/** Margin ratio in percent: used margin over equity; null when equity is not positive. */
export function marginRatioOf(usedMargin: number, equity: number): number | null {
  if (!(equity > 0) || !Number.isFinite(usedMargin)) return null
  return (usedMargin / equity) * 100
}

/** Level of a ratio against the thresholds; a ratio at a threshold counts as the riskier level. */
export function marginLevel(ratio: number | null, thresholds: MarginThresholds): MarginLevel | null {
  if (ratio === null || Number.isNaN(ratio)) return null
  const { warn, danger, direction = 'higher' } = thresholds
  if (direction === 'lower') return ratio <= danger ? 'danger' : ratio <= warn ? 'warn' : 'safe'
  return ratio >= danger ? 'danger' : ratio >= warn ? 'warn' : 'safe'
}

/** The top of the risk bar when the caller gives none: 1.5 times the outer threshold for `higher`, twice the warn threshold for `lower`. */
export function defaultScaleMax(thresholds: MarginThresholds): number {
  return thresholds.direction === 'lower' ? thresholds.warn * 2 : Math.max(thresholds.warn, thresholds.danger) * 1.5
}

export type RiskBand = { level: MarginLevel; from: number; to: number }

/** The three bands of the bar, from the low end to the high end of 0..scaleMax; `from` and `to` are values, clamped to the scale. */
export function riskBands(thresholds: MarginThresholds, scaleMax: number): RiskBand[] {
  const { warn, danger, direction = 'higher' } = thresholds
  const at = (value: number) => clamp(value, 0, scaleMax)
  return direction === 'lower'
    ? [
        { level: 'danger', from: 0, to: at(danger) },
        { level: 'warn', from: at(danger), to: at(warn) },
        { level: 'safe', from: at(warn), to: scaleMax },
      ]
    : [
        { level: 'safe', from: 0, to: at(warn) },
        { level: 'warn', from: at(warn), to: at(danger) },
        { level: 'danger', from: at(danger), to: scaleMax },
      ]
}

/** Marker position on the bar, 0 to 1; beyond the scale it sits at the edge. */
export function riskPosition(ratio: number | null, scaleMax: number): number | null {
  if (ratio === null || !(scaleMax > 0)) return null
  return clamp(ratio / scaleMax, 0, 1)
}

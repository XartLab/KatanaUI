// SPDX-License-Identifier: MIT
// 实验卡的纯逻辑（KATANAview #1908）：在一个指标上谁领先、相对基准差多少、差得是好是坏。指标的方向（越大越好还是越小越好）由调用方给，
// 这里不认识任何指标名。不带 React 与 DOM。

/** One measured metric of an experiment. */
export type ExperimentMetric = {
  /** Stable key, also the key into each variant's values. */
  id: string
  /** Metric name shown in the switch. */
  label: string
  /** How a value is written; defaults to String. */
  format?: (value: number) => string
  /** Smaller values win (drawdown, slippage). */
  lowerIsBetter?: boolean
}

/** One variant (parameter set or strategy) of an experiment. */
export type ExperimentVariant = {
  /** Stable key. */
  id: string
  /** Short badge such as A, B, C. */
  badge: string
  /** Variant name. */
  name: string
  /** One value per metric id; null when the metric was not measured. */
  values: Readonly<Record<string, number | null>>
  /** This variant is the baseline the others are compared with. */
  control?: boolean
  /** Sample size behind the values (trades, days); omit when unknown. */
  samples?: number
  /** Confidence that the difference to the baseline is real, 0..1; omit when not computed. */
  confidence?: number
}

const finite = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/** 基准：标了 control 的第一个；都没标就取第一个。没有变体时 null。 */
export function baselineOf(variants: readonly ExperimentVariant[]): ExperimentVariant | null {
  return variants.find((variant) => variant.control) ?? variants[0] ?? null
}

/** 在这个指标上领先的变体（按方向取最大或最小，跳过没测出的）；并列取靠前的；都没测出是 null。 */
export function leaderOf(
  variants: readonly ExperimentVariant[],
  metric: Pick<ExperimentMetric, 'id' | 'lowerIsBetter'>,
): ExperimentVariant | null {
  let best: ExperimentVariant | null = null
  for (const variant of variants) {
    const value = variant.values[metric.id]
    if (!finite(value)) continue
    const top = best?.values[metric.id]
    if (best === null || !finite(top) || (metric.lowerIsBetter ? value < top : value > top)) best = variant
  }
  return best
}

/**
 * 相对基准的变化（小数，0.12 是 +12%）：(值 − 基准) ÷ |基准|。基准是 0、任一边没测出、或就是基准自己时 null（不写变化）。
 * 用绝对值做分母：基准是负数（亏损）时，往正方向走仍是正的变化。
 */
export function relativeChange(value: number | null | undefined, base: number | null | undefined): number | null {
  if (!finite(value) || !finite(base) || base === 0) return null
  return (value - base) / Math.abs(base)
}

/** Whether a change is an improvement for this metric. */
export type ChangeVerdict = 'better' | 'worse' | 'same'

/** 变化是好是坏：越小越好的指标，变小才是好。null 或 0 是 same。 */
export function changeVerdict(change: number | null, lowerIsBetter = false): ChangeVerdict {
  if (change === null || change === 0) return 'same'
  return change > 0 !== lowerIsBetter ? 'better' : 'worse'
}

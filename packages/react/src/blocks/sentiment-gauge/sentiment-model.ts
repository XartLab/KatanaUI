// SPDX-License-Identifier: MIT
/**
 * Data types of SentimentGauge and the pure helpers that turn days into band segments.
 * 情绪周期读数（#11）的数据形状与纯函数。情绪分与阶段都由调用方算好传进来，件里不带口径：这里只把逐日的阶段并成连续的段，算昨日差。
 */
import type { RegimeColor, RegimeSegment } from '../regime-strip/regime-strip-model.ts'
import type { SeverityExt } from '../../lib/severity.ts'

/** One stage of the sentiment cycle (冰点、修复、发酵、高潮、退潮…), defined by the caller. 一个阶段：名字、带上的类别色，可选读数仪表的语气。 */
export type SentimentStage = {
  id: string
  name: string
  /** Band color: series-1…7 (a category, not good or bad). 带上的类别色。 */
  color: RegimeColor
  /** Tone of the gauge needle while today is in this stage; defaults to accent. 今天落在这一阶段时仪表的语气。 */
  tone?: SeverityExt
}

/** One trading day: the caller's score and the stage the caller assigned. 一个交易日：调用方算的情绪分与调用方判的阶段。 */
export type SentimentDay = {
  /** Day label, already formatted (「11-18」). 日期，调用方写好。 */
  date: string
  score: number
  /** SentimentStage.id. */
  stage: string
}

/** A side metric drawn as a small line (limit-ups, streak height, losers, seal rate). 旁边的一项小线图。 */
export type SentimentMetric = {
  key: string
  label: string
  /** One value per day, same order as days. 跟 days 一一对应。 */
  values: readonly number[]
  /** How a value of this metric is written (count, percent…). 这一项的写法。 */
  format: (value: number) => string
}

/** Consecutive days with the same stage merged into band segments; day i spans [i, i + 1]. 逐日阶段并成连续段（第 i 天占 [i, i+1]）。 */
export function stageSegments(days: readonly SentimentDay[]): RegimeSegment[] {
  const out: RegimeSegment[] = []
  days.forEach((day, index) => {
    const last = out.at(-1)
    if (last && last.state === day.stage && last.to === index) last.to = index + 1
    else out.push({ from: index, to: index + 1, state: day.stage })
  })
  return out
}

/** Today minus yesterday; null without two finite scores. 今天比昨天：不够两天或不是有限数给 null。 */
export function scoreDelta(days: readonly SentimentDay[]): number | null {
  const today = days.at(-1)?.score
  const prev = days.at(-2)?.score
  if (today === undefined || prev === undefined || !Number.isFinite(today) || !Number.isFinite(prev)) return null
  return today - prev
}

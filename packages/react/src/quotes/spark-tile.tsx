// SPDX-License-Identifier: MIT
// SparkTile：MetricCard variant="tile" 的旧名（2026-11-18 读数壳合一，体检 §1）。照旧能用，属性原样映射到 MetricCard：
// delta → changePct、sparkLabel → labels.spark、state → status、onClick → onSelect。新代码直接写 <MetricCard variant="tile" />。
import type { AriaAttributes, ReactNode } from 'react'
import { MetricCard } from './metric-card.tsx'
import type { SparkTileState } from './metric-tile.tsx'

export { sparkTileShape, type SparkTileState } from './metric-tile.tsx'

export type SparkTileProps = AriaAttributes &
  Partial<Record<`data-${string}`, string>> & {
    /** Small dot-matrix label (NET ASSET). */
    label: string
    /** Formatted value; null when there is no data. */
    value: string | null
    /** Small text after the value (/mo, / 150%). */
    unit?: string
    /** When given the changed digits roll like an odometer. */
    rollValue?: number
    /** Values of the mini line, oldest to newest; fewer than two draws a dash. */
    series: readonly number[]
    /** Accessible name of the mini line (a whole sentence, including how to say no data). */
    sparkLabel: string
    /** series is the normal line color; neutral is for lower-is-better metrics. */
    trendTone?: 'series' | 'neutral'
    /** Threshold in the series unit, drawn as an amber dashed line. */
    threshold?: number
    /** normal, near or over the threshold; also write it in note. */
    state?: SparkTileState
    /** Change as a percentage (1.5 means 1.5%). */
    delta?: number
    /** Small text next to the change; near and over must say it here, not only by color. */
    note?: ReactNode
    /** When given the whole tile is a button. */
    onClick?: () => void
    /** Extra class name on the root. */
    className?: string
  }

/**
 * KPI tile; the same as MetricCard with variant="tile".
 * @deprecated Use `<MetricCard variant="tile" />` (delta → changePct, sparkLabel → labels.spark, state → status, onClick → onSelect).
 */
export function SparkTile({ delta, sparkLabel, state, onClick, label, ...rest }: SparkTileProps) {
  return (
    <MetricCard
      variant="tile"
      {...rest}
      label={label}
      changePct={delta}
      labels={{ spark: sparkLabel }}
      status={state}
      onSelect={onClick}
    />
  )
}

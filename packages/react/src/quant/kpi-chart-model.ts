// SPDX-License-Identifier: MIT
// KPI 图的纯逻辑（KATANAview #1908）：几条线共用一根纵轴（shared），或各自按自己的最低到最高压到 0..1（normalized，权益、回撤、夏普这种单位不同的线并看）。
// 不带 React 与 DOM；比例尺、刻度与路径用 lib/chart/series-geometry.ts，这里不另写一套。
import { extent, type Domain } from '../lib/chart/series-geometry.ts'

/** One line of KpiChart. */
export type KpiSeries = {
  /** Stable key. */
  key: string
  /** Line name in the legend and tooltip. */
  label: string
  /** One value per point; null where the value is missing (the line breaks there). */
  values: readonly (number | null)[]
  /** CSS color; defaults to the series palette in order. */
  color?: string
  /** How this line's values are written in the tooltip; defaults to the chart's format. */
  format?: (value: number) => string
}

/** shared: one y axis for all lines; normalized: each line scaled to its own min..max (units differ). */
export type KpiScale = 'shared' | 'normalized'

const finite = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/** 有没有可画的数：任一条线有一个有限数就算有（0 也是数据：回撤 0 是真的没回撤）。 */
export const hasKpiData = (series: readonly KpiSeries[]): boolean =>
  series.some((line) => line.values.some((value) => finite(value)))

/** 点数：取最长的那条线。 */
export const kpiCount = (series: readonly KpiSeries[]): number =>
  Math.max(0, ...series.map((line) => line.values.length))

/** 一条线压到 0..1：最低是 0、最高是 1；整条线一样高时放在 0.5；缺的点是 NaN（画线时断开）。 */
export function normalizeValues(values: readonly (number | null)[]): number[] {
  const nums = values.filter(finite)
  if (nums.length === 0) return values.map(() => Number.NaN)
  const lo = Math.min(...nums)
  const hi = Math.max(...nums)
  return values.map((value) => (finite(value) ? (hi === lo ? 0.5 : (value - lo) / (hi - lo)) : Number.NaN))
}

/** 画线用的数（缺的点是 NaN）：shared 原样，normalized 压到 0..1。 */
export function plotValues(line: KpiSeries, scale: KpiScale): number[] {
  return scale === 'normalized' ? normalizeValues(line.values) : line.values.map((v) => (finite(v) ? v : Number.NaN))
}

/** 纵轴区间：shared 取所有线的最低到最高；normalized 固定 [0, 1]。 */
export function kpiRange(series: readonly KpiSeries[], scale: KpiScale): Domain {
  if (scale === 'normalized') return [0, 1]
  return extent(series.flatMap((line) => line.values.filter(finite)))
}

/** 横轴写字的点：第一个、中间、最后一个（照 affectUI KPI Chart：只标首、中、末三处，2026-11-23 读），去重。 */
export function axisIndexes(count: number): number[] {
  if (count <= 0) return []
  return [...new Set([0, Math.floor((count - 1) / 2), count - 1])]
}

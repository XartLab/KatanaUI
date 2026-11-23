// SPDX-License-Identifier: MIT
// SeriesExplorer 的纯逻辑：区间怎么取、KPI 怎么算、相对上一期的变化、堆叠柱怎么叠、图的纵向范围。
// 约定：点按时间从旧到新，at 是毫秒时间戳；区间是 [start, end) 的点下标（含起不含终）。

export type SeriesPoint = {
  /** 毫秒时间戳（UTC）。 */
  at: number
  /** 每个序列在这一点的值，键是序列的 key；缺的当作没有。 */
  values: Readonly<Record<string, number>>
  /** 休市（午休、夜盘间隙、节假日）：图上画 bg-100 竖带，时间轴不压缩（压缩会让斜率失真）。 */
  closed?: boolean
}

export type SeriesDef = {
  key: string
  label: string
  /** bar：堆叠柱（正的从 0 往上叠、负的从 0 往下叠）；line：折线（净值、权益这类）。 */
  kind: 'bar' | 'line'
  /** 柱或线的颜色，CSS 颜色或设计 token 的变量；不给按下标取序列色（--series-1 到 --series-7 轮着用）。 */
  color?: string
  /** 成本类（费税）：柱用 ink-100，不着色（成本不是亏损）。 */
  cost?: boolean
}

export type RangeDef = {
  key: string
  label: string
  /** 取最近几个日历月（UTC）；null 是全部。 */
  months: number | null
}

export type KpiDef = {
  key: string
  label: string
  /** 算哪个序列。 */
  series: string
  /** sum：区间内求和；last：区间最后一点；avg：区间内平均。 */
  reduce: 'sum' | 'last' | 'avg'
  format: (value: number) => string
  /** 越低越好的指标：迷你线用 ink-300（SparkTile 的 trendTone）。 */
  lowerIsBetter?: boolean
  /** 限额线（数值）：图上画 signal-red 虚线，迷你线画琥珀虚线，纵轴把它包进来。 */
  limit?: number
}

export type Window = readonly [start: number, end: number]

/**
 * 最近 months 个日历月的窗口：起点是「最后一点的日期往前推 months 个月」之后的第一个点，终点是全部。
 * 推月份按 UTC 日历（31 日往前推到没有 31 日的月，Date.UTC 会顺延，等于推到下月初，对「最近几个月」够用）。
 * months 为 null、点不足，窗口是全部。
 */
export function rangeWindow(points: readonly SeriesPoint[], months: number | null): Window {
  const count = points.length
  if (count === 0) return [0, 0]
  if (months === null) return [0, count]
  const last = new Date(points[count - 1]!.at)
  const from = Date.UTC(last.getUTCFullYear(), last.getUTCMonth() - months, last.getUTCDate())
  const start = points.findIndex((point) => point.at > from)
  return [start === -1 ? count - 1 : start, count]
}

/** 紧挨在窗口前面、一样长的上一期；前面没有足够的点就是 null（不拿不完整的一期去比）。 */
export function previousWindow(window: Window): Window | null {
  const length = window[1] - window[0]
  return window[0] - length >= 0 && length > 0 ? [window[0] - length, window[0]] : null
}

const valueOf = (point: SeriesPoint, key: string): number | null => {
  const value = point.values[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/** 窗口内某个序列的求和 / 末值 / 平均，只算有值的点；一个有值的点都没有返回 null。 */
export function reduceWindow(
  points: readonly SeriesPoint[],
  window: Window,
  key: string,
  reduce: KpiDef['reduce'],
): number | null {
  const values = points
    .slice(window[0], window[1])
    .map((point) => valueOf(point, key))
    .filter((value): value is number => value !== null)
  if (values.length === 0) return null
  if (reduce === 'last') return values[values.length - 1]!
  const sum = values.reduce((a, b) => a + b, 0)
  return reduce === 'sum' ? sum : sum / values.length
}

/** 相对上一期的变化：(这期 - 上期) / |上期|；上期没有或为 0 返回 null（不除零、不编一个百分比）。 */
export function changeRatio(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null
  return (current - previous) / Math.abs(previous)
}

export type StackSegment = { key: string; from: number; to: number }

/** 一个点上的堆叠：正的从 0 往上按序列次序叠，负的从 0 往下叠；缺的与 0 不占位置。 */
export function stackPoint(point: SeriesPoint, keys: readonly string[]): StackSegment[] {
  let up = 0
  let down = 0
  const out: StackSegment[] = []
  for (const key of keys) {
    const value = valueOf(point, key)
    if (value === null || value === 0) continue
    if (value > 0) {
      out.push({ key, from: up, to: up + value })
      up += value
    } else {
      out.push({ key, from: down, to: down + value })
      down += value
    }
  }
  return out
}

/** 图的纵向范围：窗口里所有堆叠的两端与所有折线的值，再加上 0。 */
export function chartExtent(
  points: readonly SeriesPoint[],
  window: Window,
  barKeys: readonly string[],
  lineKeys: readonly string[],
  extra: readonly (number | null)[] = [],
): readonly [number, number] {
  let lo = 0
  let hi = 0
  const take = (value: number | null) => {
    if (value === null) return
    lo = Math.min(lo, value)
    hi = Math.max(hi, value)
  }
  for (const point of points.slice(window[0], window[1])) {
    for (const segment of stackPoint(point, barKeys)) {
      take(segment.from)
      take(segment.to)
    }
    for (const key of lineKeys) take(valueOf(point, key))
  }
  extra.forEach(take)
  return [lo, hi]
}

export { valueOf as pointValue }

export type Reconcile = { open: number; close: number; net: number; cashflow: number; diff: number }

/**
 * 对账（PnLLedger 顶行）：期末 − 期初 应等于 区间内净盈亏之和 + 出入金；差额 diff 不为 0 就是对不上。
 * 期初是窗口前一个点的权益（窗口从第一个点起用 openingEquity）。权益、净盈亏、出入金是三个序列的键，权益不画在图上。
 */
export function reconcileWindow(
  points: readonly SeriesPoint[],
  window: Window,
  keys: { net: string; equity: string; cashflow?: string },
  openingEquity: number,
): Reconcile | null {
  if (window[1] <= window[0]) return null
  const close = valueOf(points[window[1] - 1]!, keys.equity)
  const open = window[0] === 0 ? openingEquity : valueOf(points[window[0] - 1]!, keys.equity)
  if (close === null || open === null) return null
  const net = reduceWindow(points, window, keys.net, 'sum') ?? 0
  const cashflow = keys.cashflow === undefined ? 0 : (reduceWindow(points, window, keys.cashflow, 'sum') ?? 0)
  return { open, close, net, cashflow, diff: close - open - net - cashflow }
}

/**
 * 状态带与时间轴对齐用的比例尺：时间 t 落在窗口里「第几格的左缘」（0 到 1）。
 * 状态段是左闭右开 [from, to)：from 取第一个 at ≥ from 的格子左缘，to 取最后一个 at < to 的格子右缘，所以相邻的段严丝合缝、不重叠，
 * 并且跟图里一格一点（band）的横轴同一份刻度。at 要从小到大排。纯函数。
 */
export function regimeScale(ats: readonly number[]): (time: number) => number {
  const count = ats.length
  return (time) => {
    if (count === 0) return 0
    let before = 0
    while (before < count && ats[before]! < time) before += 1
    return before / count
  }
}

/** 时间 at 落在哪一段（[from, to)）里：返回那一段的状态 id，不在任何段里是 null。纯函数。 */
export function regimeAt(segments: readonly { from: number; to: number; state: string }[], at: number): string | null {
  return segments.find((segment) => at >= segment.from && at < segment.to)?.state ?? null
}

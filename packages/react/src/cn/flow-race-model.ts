// SPDX-License-Identifier: MIT
// 板块资金多线图（FlowRace，#110）的纯函数：分钟累计序列落到时段轴上（午休不占宽度）、按最新值排名、右端标签错开不重叠。
// 值是累计净流入（元），可正可负；取不到的点断线，不当 0。

import { cnTradingMinutesBetween, parseClock } from './session.ts'

/** 横轴从 09:30 开始（竞价阶段没有分钟累计），到 15:00 共 240 个交易分钟。 */
export const FLOW_START = 9 * 60 + 30
export const FLOW_MINUTES = 240

export type FlowPoint = {
  /** Clock time such as "09:31". */
  time: string
  /** Cumulative net inflow in yuan; null breaks the line. */
  value: number | null
}
export type FlowSeries = {
  /** Stable key of the sector. */
  key: string
  /** Sector name shown on the label. */
  name: string
  /** Minute points of the cumulative net inflow. */
  points: readonly FlowPoint[]
}

/** 时刻在 09:30–15:00 时段轴上的位置，0 到 1；午休不占宽度；09:30 之前或写不对返回 null。 */
export function flowX(minutes: number | null): number | null {
  const span = cnTradingMinutesBetween(FLOW_START, minutes)
  return span === null ? null : span / FLOW_MINUTES
}

export type FlowLine = {
  key: string
  name: string
  /** 横坐标 0 到 1 与累计值；取不到的点是 value = null（线在这里断）。 */
  points: { x: number; value: number | null }[]
  /** 最新一个有值的点的值；一个都没有是 null。 */
  last: number | null
}

/** 整理序列：时刻写不对或早于 09:30 的点丢掉，按时刻排序（同一时刻后到的在后），取最新值。 */
export function flowLines(series: readonly FlowSeries[]): FlowLine[] {
  return series.map((entry) => {
    const points = entry.points
      .map((point, index) => ({ x: flowX(parseClock(point.time)), index, point }))
      .filter((item): item is { x: number; index: number; point: FlowPoint } => item.x !== null)
      .sort((a, b) => a.x - b.x || a.index - b.index)
      .map(({ x, point }) => ({
        x,
        value: typeof point.value === 'number' && Number.isFinite(point.value) ? point.value : null,
      }))
    const last = [...points].reverse().find((point) => point.value !== null)?.value ?? null
    return { key: entry.key, name: entry.name, points, last }
  })
}

/** 按最新值从大到小排名；最新值取不到的排最后，同值保持传入次序。 */
export function rankLines(lines: readonly FlowLine[]): FlowLine[] {
  return lines
    .map((line, index) => ({ line, index }))
    .sort((a, b) => {
      const known = Number(b.line.last !== null) - Number(a.line.last !== null)
      if (known !== 0) return known
      if (a.line.last !== null && b.line.last !== null && a.line.last !== b.line.last) return b.line.last - a.line.last
      return a.index - b.index
    })
    .map((entry) => entry.line)
}

/** 纵轴区间：含 0（累计值以 0 为基准）、上下各留一成；一条数都没有返回 null。 */
export function flowDomain(lines: readonly FlowLine[]): [number, number] | null {
  const values = lines.flatMap((line) => line.points.map((point) => point.value).filter((v): v is number => v !== null))
  if (values.length === 0) return null
  const lo = Math.min(0, ...values)
  const hi = Math.max(0, ...values)
  const pad = (hi - lo) * 0.1 || 1
  return [lo < 0 ? lo - pad : lo, hi > 0 ? hi + pad : hi]
}

/** 折线路径：x 乘宽、值落到纵轴；取不到的点断开。 */
export function flowPath(line: FlowLine, domain: readonly [number, number], width: number, height: number): string {
  const span = domain[1] - domain[0] || 1
  let d = ''
  let pen = false
  for (const point of line.points) {
    if (point.value === null) {
      pen = false
      continue
    }
    const x = (point.x * width).toFixed(2)
    const y = (height - ((point.value - domain[0]) / span) * height).toFixed(2)
    d += `${pen ? 'L' : 'M'}${x} ${y}`
    pen = true
  }
  return d
}

/**
 * 右端标签错开：targets 是各标签想放的纵坐标（px，按从上到下的次序给），相邻两个至少隔 gap，整体夹在 [min, max] 内；
 * 次序不变，只往两边推开。放不下时（个数 × gap 超过可用高度）把 gap 压小。
 */
export function spreadFlowLabels(targets: readonly number[], gap: number, min: number, max: number): number[] {
  const n = targets.length
  if (n === 0) return []
  const step = n > 1 ? Math.min(gap, (max - min) / (n - 1)) : gap
  const out = targets.map((value) => Math.min(max, Math.max(min, value)))
  for (let i = 1; i < n; i++) out[i] = Math.max(out[i]!, out[i - 1]! + step)
  out[n - 1] = Math.min(out[n - 1]!, max)
  for (let i = n - 2; i >= 0; i--) out[i] = Math.min(out[i]!, out[i + 1]! - step)
  for (let i = 1; i < n; i++) out[i] = Math.max(out[i]!, out[i - 1]! + step)
  return out
}

/** 值落到纵轴的 y（px，上小下大）。 */
export const flowY = (value: number, domain: readonly [number, number], height: number): number =>
  height - ((value - domain[0]) / (domain[1] - domain[0] || 1)) * height

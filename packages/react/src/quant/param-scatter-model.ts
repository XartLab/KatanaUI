// SPDX-License-Identifier: MIT
// ParamScatter（参数优化散点图）的纯逻辑：值域与色阶、最优点、方向键找邻居。不带 React 与 DOM。
// TradingView 没有这张图（策略测试器不做参数网格），照通用的参数扫描做法：两个参数为轴、点的颜色是目标值、点选看这组参数的读数。
import { scatterLayout, type ScatterFrame } from '../lib/chart/scatter-model.ts'

export type ParamPoint = {
  id: string
  x: number
  y: number
  /** 目标值（夏普、净利润……）；没跑出结果是 null，画成空心灰点。 */
  value: number | null
}

export type ParamRamp = 'auto' | 'sequential' | 'diverging'

export function valueRange(points: readonly ParamPoint[]): { min: number; max: number } | null {
  const values = points.map((p) => p.value).filter((v): v is number => v !== null && Number.isFinite(v))
  return values.length === 0 ? null : { min: Math.min(...values), max: Math.max(...values) }
}

/** auto：目标值跨过 0 用发散色阶（负与正两色），否则用单色阶。 */
export function resolveRamp(ramp: ParamRamp, range: { min: number; max: number } | null): 'sequential' | 'diverging' {
  if (ramp !== 'auto') return ramp
  return range !== null && range.min < 0 && range.max > 0 ? 'diverging' : 'sequential'
}

/** 值在色阶上的位置：单色阶 0..1；发散色阶 -1..1，两侧各自按到端点的距离取（0 恒在中间）。 */
export function rampPosition(
  value: number,
  range: { min: number; max: number },
  ramp: 'sequential' | 'diverging',
): number {
  if (ramp === 'sequential') return range.max === range.min ? 0.5 : (value - range.min) / (range.max - range.min)
  if (value >= 0) return range.max <= 0 ? 0 : Math.min(1, value / range.max)
  return range.min >= 0 ? 0 : Math.max(-1, -(value / range.min))
}

/** 色阶的颜色（CSS color-mix，端点是主题 token）：单色阶从暗灰到亮灰；发散色阶以中灰为中点，负侧跌色、正侧涨色，不用橙与蓝。 */
export function rampColor(position: number, ramp: 'sequential' | 'diverging'): string {
  const t = Math.min(1, Math.max(-1, position))
  if (ramp === 'sequential')
    return `color-mix(in srgb, var(--k-content-primary-foreground) ${Math.round(t * 100)}%, var(--k-content-tertiary-foreground))`
  const end = t >= 0 ? 'var(--div-pos-200)' : 'var(--div-neg-200)'
  return `color-mix(in srgb, ${end} ${Math.round(Math.abs(t) * 100)}%, var(--k-content-tertiary-foreground))`
}

/** 色条的渐变停靠点（与 rampColor 同一套端点）。 */
export function rampGradient(ramp: 'sequential' | 'diverging'): string {
  return ramp === 'sequential'
    ? 'linear-gradient(90deg, var(--k-content-tertiary-foreground), var(--k-content-primary-foreground))'
    : 'linear-gradient(90deg, var(--div-neg-200), var(--k-content-tertiary-foreground), var(--div-pos-200))'
}

/** 最优点的下标：goal 是 max 取最大、min 取最小；同值取靠前的；没有有效值是 -1。 */
export function bestIndex(points: readonly ParamPoint[], goal: 'max' | 'min'): number {
  let best = -1
  points.forEach((point, index) => {
    if (point.value === null || !Number.isFinite(point.value)) return
    if (best < 0) best = index
    else {
      const current = points[best]!.value!
      if (goal === 'max' ? point.value > current : point.value < current) best = index
    }
  })
  return best
}

export type ParamLayout = {
  xTicks: { value: number; at: number }[]
  yTicks: { value: number; at: number }[]
  xy: { x: number; y: number }[]
}

export function paramLayout(
  points: readonly ParamPoint[],
  frame: ScatterFrame,
  options: { xDomain?: readonly [number, number]; yDomain?: readonly [number, number] } = {},
): ParamLayout {
  const out = scatterLayout(
    [{ id: 'p', label: '', points: points.map((p) => ({ x: p.x, y: p.y, label: p.id })) }],
    frame,
    { ...options, arrowSize: 0 },
  )
  return { xTicks: out.xTicks, yTicks: out.yTicks, xy: out.series[0]!.points }
}

/**
 * 方向键：在屏幕坐标里找该方向最近的点（方向半平面内，距离里横纵偏离那一维加倍计，所以先走正前方）；该方向没有点时留在原地。
 * Home / End：到屏幕上最左 / 最右的点。其余键返回 null。
 */
export function moveParam(xy: readonly { x: number; y: number }[], from: number, key: string): number | null {
  const at = xy[from]
  if (at === undefined) return null
  if (key === 'Home' || key === 'End') {
    let pick = from
    xy.forEach((p, i) => {
      if (key === 'Home' ? p.x < xy[pick]!.x : p.x > xy[pick]!.x) pick = i
    })
    return pick
  }
  const dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[key]
  if (dir === undefined) return null
  let best = from
  let bestScore = Infinity
  xy.forEach((p, i) => {
    if (i === from) return
    const along = (p.x - at.x) * dir[0]! + (p.y - at.y) * dir[1]!
    if (along <= 0) return
    const across = Math.abs((p.x - at.x) * dir[1]! + (p.y - at.y) * dir[0]!)
    const score = along ** 2 + (2 * across) ** 2
    if (score < bestScore) {
      bestScore = score
      best = i
    }
  })
  return best
}

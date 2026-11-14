// SPDX-License-Identifier: MIT
// ConnectedScatter 的纯逻辑：两轴范围、像素坐标、终点箭头、键盘移动。功能参照 Arc Connected scatter（uiarc.dev，2026-11-14 读），实现原创。
import { linearScale, niceTicks } from './chart-scale.ts'

export type ScatterPoint = {
  x: number
  y: number
  /** 这个点的整句（读屏名与读数行）：如「2026-03：波动 12%，收益 8%」。 */
  label: string
}
export type ScatterSeries = { id: string; label: string; points: readonly ScatterPoint[] }

export type ScatterFrame = { width: number; height: number; left: number; top: number; right: number; bottom: number }

export type ScatterLayout = {
  xTicks: { value: number; at: number }[]
  yTicks: { value: number; at: number }[]
  series: {
    id: string
    /** 像素坐标，与输入的点一一对应。 */
    points: { x: number; y: number }[]
    /** 终点处沿最后一段方向的小三角（三个顶点）；少于两个点或最后一段长为 0 时为 null。 */
    arrow: [number, number][] | null
  }[]
}

/** 数据范围按 pad 比例向两头放宽（默认 5%）再取好看的刻度；单点或全相等时左右各放 1。 */
function extent(values: readonly number[], pad: number): [number, number] {
  const finite = values.filter((value) => Number.isFinite(value))
  if (finite.length === 0) return [0, 1]
  const lo = Math.min(...finite)
  const hi = Math.max(...finite)
  if (lo === hi) return [lo - 1, hi + 1]
  const margin = (hi - lo) * pad
  const ticks = niceTicks(lo - margin, hi + margin, 5)
  return [Math.min(lo - margin, ticks[0] ?? lo), Math.max(hi + margin, ticks.at(-1) ?? hi)]
}

/** 一个终点箭头：尖在 tip，沿 (dx, dy) 方向，长 size、底宽 size 的 0.8 倍。 */
export function arrowHead(
  tip: { x: number; y: number },
  dx: number,
  dy: number,
  size: number,
): [number, number][] | null {
  const length = Math.hypot(dx, dy)
  if (length === 0) return null
  const ux = dx / length
  const uy = dy / length
  const bx = tip.x - ux * size
  const by = tip.y - uy * size
  const half = size * 0.4
  return [
    [tip.x, tip.y],
    [bx - uy * half, by + ux * half],
    [bx + uy * half, by - ux * half],
  ]
}

export function scatterLayout(
  series: readonly ScatterSeries[],
  frame: ScatterFrame,
  options: { xDomain?: readonly [number, number]; yDomain?: readonly [number, number]; arrowSize?: number } = {},
): ScatterLayout {
  const all = series.flatMap((item) => item.points)
  const xDomain =
    options.xDomain ??
    extent(
      all.map((p) => p.x),
      0.05,
    )
  const yDomain =
    options.yDomain ??
    extent(
      all.map((p) => p.y),
      0.05,
    )
  const sx = linearScale([xDomain[0], xDomain[1]], [frame.left, frame.width - frame.right])
  const sy = linearScale([yDomain[0], yDomain[1]], [frame.height - frame.bottom, frame.top])
  const size = options.arrowSize ?? 8
  return {
    xTicks: niceTicks(xDomain[0], xDomain[1], 6).map((value) => ({ value, at: sx(value) })),
    yTicks: niceTicks(yDomain[0], yDomain[1], 5).map((value) => ({ value, at: sy(value) })),
    series: series.map((item) => {
      const points = item.points.map((p) => ({ x: sx(p.x), y: sy(p.y) }))
      const last = points.at(-1)
      const before = points.at(-2)
      return {
        id: item.id,
        points,
        arrow: last && before ? arrowHead(last, last.x - before.x, last.y - before.y, size) : null,
      }
    }),
  }
}

/**
 * 键盘：← → 沿时间在同一条轨迹的点上走（到头不绕回）；↑ ↓ 去上一条 / 下一条轨迹的同一位置（位置超出那条的点数就落在它的最后一个点）；Home / End 去这条的第一 / 最后一个点。
 * counts 是各条轨迹的点数；返回新的 [轨迹, 点]，不处理的键返回 null。
 */
export function moveScatter(
  at: readonly [number, number],
  key: string,
  counts: readonly number[],
): [number, number] | null {
  const [s, i] = at
  const clamp = (series: number, index: number): [number, number] => [
    series,
    Math.min(Math.max(0, index), Math.max(0, (counts[series] ?? 1) - 1)),
  ]
  switch (key) {
    case 'ArrowRight':
      return clamp(s, i + 1)
    case 'ArrowLeft':
      return clamp(s, i - 1)
    case 'ArrowDown':
      return clamp(Math.min(counts.length - 1, s + 1), i)
    case 'ArrowUp':
      return clamp(Math.max(0, s - 1), i)
    case 'Home':
      return clamp(s, 0)
    case 'End':
      return clamp(s, (counts[s] ?? 1) - 1)
    default:
      return null
  }
}

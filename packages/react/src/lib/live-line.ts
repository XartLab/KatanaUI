// SPDX-License-Identifier: MIT
// 走势线新来一个点时，让线平滑延伸而不是整条重画：旧线的每个点从原来的位置走到新位置，新点从旧线的末端长出来，LIVE_REORDER_MS（240ms），缓动取 --ease-snappy。
// 折线的 points 与路径的 d 不能用 CSS 动画，所以用 requestAnimationFrame 逐帧插值写回属性；React 渲染出来的终点就是最终形状，插值只是起点到终点的过场，被打断就从当前看到的形状接着走。
// 只在「末尾追加一点」与「窗口左移一格再追加」时才延伸；换区间、整列重算这类大改直接换，不做过场（会把另一条线说成这条线长出来的）。
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { LIVE_REORDER_MS } from './live.ts'

export type LinePoint = readonly [number, number]

const sameRun = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((v, i) => v === b[i])

/** 新数据相对旧数据怎么变的：append 是末尾多了一点，slide 是第一个点出窗、末尾进一个点，其余（换区间、重算）是 null。纯函数。 */
export function lineGrowth(prev: readonly number[], next: readonly number[]): 'append' | 'slide' | null {
  if (prev.length >= 2 && next.length === prev.length + 1 && sameRun(prev, next.slice(0, -1))) return 'append'
  if (prev.length >= 2 && next.length === prev.length && sameRun(prev.slice(1), next.slice(0, -1))) return 'slide'
  return null
}

/** 点数不够时用最后一个点补到 count 个：新点从旧线的末端长出来。纯函数。 */
export function padPoints(points: readonly LinePoint[], count: number): LinePoint[] {
  const last = points[points.length - 1]
  if (!last) return []
  return Array.from({ length: count }, (_, i) => points[i] ?? last)
}

/** 两组等长的点按 t（0 到 1）插值。纯函数。 */
export function lerpPoints(from: readonly LinePoint[], to: readonly LinePoint[], t: number): LinePoint[] {
  return to.map(([x, y], i) => {
    const [fx, fy] = from[i]!
    return [fx + (x - fx) * t, fy + (y - fy) * t] as const
  })
}

/** 把 CSS 的 linear(0, 0.05, …, 1) 缓动读成函数（等间距的停靠点，之间线性）：JS 要跟 --ease-snappy 同一条曲线，不另写一条。读不出来就线性。纯函数。 */
export function easeOf(css: string): (t: number) => number {
  const stops = [...css.matchAll(/-?\d*\.?\d+/g)].map((m) => Number(m[0]))
  if (!/^\s*linear\(/.test(css) || stops.length < 2) return (t) => t
  return (t) => {
    const at = Math.min(1, Math.max(0, t)) * (stops.length - 1)
    const i = Math.min(stops.length - 2, Math.floor(at))
    return stops[i]! + (stops[i + 1]! - stops[i]!) * (at - i)
  }
}

/**
 * 在 el 的 attr（polyline 的 points 或 path 的 d）上做延伸过场：values 是这条线的原始数（判断是不是追加），coords 是已经算好的坐标，format 把坐标写成属性值。
 * 过场期间元素带 data-extending（样式与测试都能认）；有非有限坐标（断开的线）时直接换。
 */
export function useLineExtend(
  ref: RefObject<SVGElement | null>,
  attr: 'points' | 'd',
  values: readonly number[],
  coords: readonly LinePoint[],
  format: (points: readonly LinePoint[]) => string,
): void {
  const prev = useRef<{ values: readonly number[]; sig: string } | null>(null)
  const shown = useRef<readonly LinePoint[]>(coords)
  const frame = useRef(0)
  const sig = format(coords)
  useLayoutEffect(() => {
    const el = ref.current
    const before = prev.current
    if (before?.sig === sig) return
    prev.current = { values, sig }
    if (!el) return
    const growth = before ? lineGrowth(before.values, values) : null
    const finite = coords.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
    cancelAnimationFrame(frame.current)
    el.removeAttribute('data-extending')
    if (!growth || !finite || typeof requestAnimationFrame !== 'function') {
      shown.current = coords
      return
    }
    const from = padPoints(shown.current, coords.length)
    if (from.length !== coords.length) {
      shown.current = coords
      return
    }
    const ease = easeOf(getComputedStyle(el).getPropertyValue('--ease-snappy'))
    const started = performance.now()
    el.setAttribute('data-extending', '')
    el.setAttribute(attr, format(from))
    shown.current = from
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / LIVE_REORDER_MS)
      const at = t >= 1 ? coords : lerpPoints(from, coords, ease(t))
      el.setAttribute(attr, format(at))
      shown.current = at
      if (t < 1) frame.current = requestAnimationFrame(step)
      else el.removeAttribute('data-extending')
    }
    frame.current = requestAnimationFrame(step)
  })
  useEffect(() => () => cancelAnimationFrame(frame.current), [])
}

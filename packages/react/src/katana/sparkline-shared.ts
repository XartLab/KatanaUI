// SPDX-License-Identifier: MIT
// 迷你图三种画风（default、instrument、ascii）共用的小工具：量容器、设备像素比、字体重算、读屏节流、时间轴时段。从 sparkline.tsx 原样搬出，行为没改。
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import type { LinePoint } from '../lib/live-line.ts'
import { onTextMeasureReset } from '../lib/text-measure.ts'
import { timeSpans, type SparkSpan } from './sparkline-model.ts'
import type { SparklineProps } from './sparkline.tsx'

/** 量 svg 在页面上的真实宽高（ResizeObserver）；量到之前用调用方给的或默认值。 */
export function useBox(ref: RefObject<Element | null>, fallbackW: number, fallbackH: number) {
  const [box, setBox] = useState({ w: fallbackW, h: fallbackH })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = (w: number, h: number) => {
      if (!(w > 0 && h > 0)) return
      setBox((prev) => (Math.abs(prev.w - w) < 0.01 && Math.abs(prev.h - h) < 0.01 ? prev : { w, h }))
    }
    const rect = el.getBoundingClientRect()
    read(rect.width, rect.height)
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const size = entries[entries.length - 1]?.contentRect
      if (size) read(size.width, size.height)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return box
}

/** 设备像素比（线与柱按它对齐）；缩放页面或换到另一块屏幕时跟着变。 */
export function useDpr(): number {
  const [dpr, setDpr] = useState(1)
  useLayoutEffect(() => {
    const read = () => setDpr(window.devicePixelRatio || 1)
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [])
  return dpr
}

/** 字体变了（Web 字体加载完、DPR 变了）文字量出来的宽要重算。 */
export function useTextEpoch(): number {
  const [epoch, setEpoch] = useState(0)
  useEffect(() => onTextMeasureReset(() => setEpoch((n) => n + 1)), [])
  return epoch
}

/** 读屏播报要节流：一直按住方向键时不一句一句念，停下 ms 后才更新。 */
export function useThrottledText(text: string, ms = 300): string {
  const [shown, setShown] = useState('')
  const last = useRef(0)
  useEffect(() => {
    const wait = text === '' ? 0 : Math.max(0, last.current + ms - performance.now())
    const timer = setTimeout(() => {
      last.current = performance.now()
      setShown(text)
    }, wait)
    return () => clearTimeout(timer)
  }, [text, ms])
  return shown
}

export const isStamps = (times: SparklineProps['times']): times is readonly number[] =>
  !!times && times.length > 0 && typeof times[0] === 'number'

/** 横轴要按哪些交易时段排：给了 domain 取它，没给用 sessions 的头尾，再没有用时间戳的最早到最晚；排不出来返回空数组（退回按序号铺）。 */
export function resolveSpans(
  stamps: readonly number[],
  domain: SparklineProps['domain'],
  sessions: SparklineProps['sessions'],
): SparkSpan[] {
  const finite = stamps.filter(Number.isFinite)
  const edge = sessions?.length
    ? ([Math.min(...sessions.map((s) => s[0])), Math.max(...sessions.map((s) => s[1]))] as const)
    : finite.length
      ? ([Math.min(...finite), Math.max(...finite)] as const)
      : null
  const span = domain ?? edge
  return span ? timeSpans({ domain: span, sessions }) : []
}

/** 价格没配格式时写成最多两位小数的原数。 */
export const plainPrice = (value: number) => String(Math.round(value * 100) / 100)

/** 把圆挪到一个点上（延伸过场里每帧调用）。 */
export function moveTo(el: SVGElement, point: LinePoint | undefined) {
  if (!point || !Number.isFinite(point[1])) return
  el.setAttribute('cx', String(point[0]))
  el.setAttribute('cy', String(point[1]))
}

/** 读根节点上的一个 CSS 变量（服务端渲染里没有 document，返回空串）。 */
export function getComputedStyleSafe(name: string): string {
  return typeof document === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

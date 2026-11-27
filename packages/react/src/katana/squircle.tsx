// SPDX-License-Identifier: MIT
// 改自 SmoothUI squircle（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 平滑圆角（超椭圆）：把元素用 clip-path 裁成「曲率连续」的圆角矩形，比 border-radius 的圆弧过渡柔和（苹果图标那种角）。smoothing 为 0 就是普通圆角。
// 注意：裁切会把 CSS 边框、阴影、焦点环一并裁掉，所以 border 属性改成沿同一条曲线画一层 SVG 描边（线宽 2、一半被裁掉，剩 1px 的线），不要在里面放要伸出去的东西。
// 与原件的差别：原件的 border 只是 CSS 边框（角上会被裁断），这里换成沿曲线的描边；描边色取 --line-200；默认半径 12（原件 24，我们的件圆角都小）；路径算法没改（超椭圆指数 2 + 4×smoothing）。
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { clamp } from '../lib/num.ts'

const DEFAULT_RADIUS = 12
const DEFAULT_SMOOTHING = 0.6
// 超椭圆的指数：2 是圆，越大越方；smoothing 0 到 1 映射到 2 到 6。
const EXPONENT_BASE = 2
const EXPONENT_RANGE = 4
// 折线逼近每个角：半径越大取点越多，12 到 48 个，每像素半径 0.5 个。
const MIN_SAMPLES = 12
const MAX_SAMPLES = 48
const SAMPLES_PER_PX = 0.5

type Point = { x: number; y: number }
const fmt = ({ x, y }: Point) => `${x.toFixed(2)},${y.toFixed(2)}`

function quadrant(radius: number, exponent: number): Point[] {
  const samples = Math.round(clamp(radius * SAMPLES_PER_PX, MIN_SAMPLES, MAX_SAMPLES))
  return Array.from({ length: samples }, (_, i) => {
    const t = (Math.PI / 2) * ((i + 1) / samples)
    return { x: radius * Math.cos(t) ** (2 / exponent), y: radius * Math.sin(t) ** (2 / exponent) }
  })
}

/** 给 `clip-path: path(...)` 用的 SVG 路径：四个角沿超椭圆走的圆角矩形。 */
export function squirclePath(
  width: number,
  height: number,
  radius = DEFAULT_RADIUS,
  smoothing = DEFAULT_SMOOTHING,
): string {
  if (width <= 0 || height <= 0) return ''
  const r = clamp(radius, 0, Math.min(width, height) / 2)
  if (r <= 0) return `M0,0 L${width},0 L${width},${height} L0,${height} Z`
  const q = quadrant(r, EXPONENT_BASE + clamp(smoothing, 0, 1) * EXPONENT_RANGE)
  const topRight = q.map(({ x, y }) => ({ x: width - r + y, y: r - x }))
  const bottomRight = q.map(({ x, y }) => ({ x: width - r + x, y: height - r + y }))
  const bottomLeft = q.map(({ x, y }) => ({ x: r - y, y: height - r + x }))
  const topLeft = q.map(({ x, y }) => ({ x: r - x, y: r - y }))
  return [
    `M${r.toFixed(2)},0`,
    `L${(width - r).toFixed(2)},0`,
    ...topRight.map((p) => `L${fmt(p)}`),
    `L${width.toFixed(2)},${(height - r).toFixed(2)}`,
    ...bottomRight.map((p) => `L${fmt(p)}`),
    `L${r.toFixed(2)},${height.toFixed(2)}`,
    ...bottomLeft.map((p) => `L${fmt(p)}`),
    `L0,${r.toFixed(2)}`,
    ...topLeft.map((p) => `L${fmt(p)}`),
    'Z',
  ].join(' ')
}

export type SquircleProps = {
  /** Element to render, a div by default. */
  as?: ElementType
  /** What goes inside the shape. */
  children?: ReactNode
  /** Corner radius in pixels. */
  radius?: number
  /** 0 is a plain round corner, 1 pushes the curve far into the edges. */
  smoothing?: number
  /** Draw a hairline along the curve; a CSS border would be clipped. */
  border?: boolean
  /** Extra class name on the element. */
  className?: string
  /** Inline style on the element; size and background go here. */
  style?: CSSProperties
}

export function Squircle({
  as,
  children,
  radius = DEFAULT_RADIUS,
  smoothing = DEFAULT_SMOOTHING,
  border = false,
  className,
  style: own,
}: SquircleProps) {
  const Wrapper = as ?? 'div'
  const ref = useRef<HTMLElement | null>(null)
  const [box, setBox] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => {
      const rect = element.getBoundingClientRect()
      setBox({ width: rect.width, height: rect.height })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  // 只走生成的路径这一条：CSS 的 corner-shape: squircle 是固定形状，会忽略 smoothing，两条路渲染出的角不一样。
  const clipPath = useMemo(() => {
    if (box.width === 0 || box.height === 0) return undefined
    const path = squirclePath(box.width, box.height, radius, smoothing)
    return path ? `path('${path}')` : undefined
  }, [box.height, box.width, radius, smoothing])
  const outline = useMemo(
    () => (border ? squirclePath(box.width, box.height, radius, smoothing) : ''),
    [border, box.height, box.width, radius, smoothing],
  )
  const style: CSSProperties = { ...own, borderRadius: radius, clipPath }
  return (
    <Wrapper ref={ref} data-slot="squircle" style={style} className={cn(border && 'relative', className)}>
      {children}
      {outline && (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0" width={box.width} height={box.height}>
          <path d={outline} fill="none" stroke="var(--line-200)" strokeWidth={2} />
        </svg>
      )}
    </Wrapper>
  )
}

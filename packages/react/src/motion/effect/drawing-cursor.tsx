// SPDX-License-Identifier: MIT
// 改自 SmoothUI drawing-cursor（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）。光标手绘：指针划过留下一条会渐渐消失的线，画布叠在内容上，线宽随速度变细；只在有精确指针的设备上启用。相对原件：去掉 useReducedMotion；没有笔迹时停掉 rAF，指针再动才起（原件不暂停就一直空转）；默认色走 token。
import { cn } from '../../lib/cn.ts'
import type { ReactNode, Ref } from 'react'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { MAX_DPR, clamp } from '../shared.ts'

export type DrawingCursorHandle = {
  /** Erase every stroke at once. */
  clear: () => void
  /** Export the current canvas as a data URL. */
  toDataURL: (type?: string, quality?: number) => string
}

export type DrawingCursorProps = {
  /** Canvas composite operation used for the strokes. */
  blend?: GlobalCompositeOperation
  /** Content drawn over; the canvas sits above it and never blocks the pointer. */
  children?: ReactNode
  /** Extra classes for the wrapper. */
  className?: string
  /** Erase all strokes when the pointer leaves the area. */
  clearOnLeave?: boolean
  /** Stroke color: any CSS color or a var(--token). */
  color?: string
  /** Milliseconds for a stroke to fade out; 0 keeps strokes forever. */
  decay?: number
  /** Stroke width in pixels at rest. */
  lineWidth?: number
  /** Stop drawing and fading; existing strokes freeze. */
  paused?: boolean
  /** Imperative handle with `clear` and `toDataURL`. */
  ref?: Ref<DrawingCursorHandle>
  /** Curve smoothing, 0 (polyline) to 1 (round). */
  smoothing?: number
  /** Thin the stroke as the pointer speeds up. */
  taper?: boolean
}

type StrokePoint = { time: number; width: number; x: number; y: number }
type Stroke = { points: StrokePoint[] }

const DEFAULT_COLOR = 'var(--accent)'
const DEFAULT_LINE_WIDTH = 3
const DEFAULT_DECAY = 800
const DEFAULT_SMOOTHING = 0.5
const STROKE_BREAK_MS = 120
const MIN_WIDTH_FACTOR = 0.35
const SPEED_TO_WIDTH_SCALE = 0.12
const MAX_POINTS_PER_STROKE = 600
const MAX_STROKES = 40

const getPointerCoordinates = (event: PointerEvent, rect: DOMRect): { x: number; y: number }[] => {
  const coalesced = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : null
  const events = coalesced && coalesced.length > 0 ? coalesced : [event]
  return events.map((coalescedEvent) => ({
    x: coalescedEvent.clientX - rect.left,
    y: coalescedEvent.clientY - rect.top,
  }))
}

export const DrawingCursor = ({
  blend = 'source-over',
  children,
  className,
  clearOnLeave = true,
  color = DEFAULT_COLOR,
  decay = DEFAULT_DECAY,
  lineWidth = DEFAULT_LINE_WIDTH,
  paused = false,
  ref,
  smoothing = DEFAULT_SMOOTHING,
  taper = true,
}: DrawingCursorProps) => {
  const [isPointerCapable, setIsPointerCapable] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>([])
  const activeStrokeRef = useRef<Stroke | null>(null)
  const rafRef = useRef<number | null>(null)
  const sizeRef = useRef({ height: 0, width: 0 })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    // oxlint-disable-next-line react/set-state-in-effect -- 挂载后才知道环境，必须在 effect 里设
    setIsPointerCapable(mediaQuery.matches)
    const handleChange = (event: MediaQueryListEvent) => {
      setIsPointerCapable(event.matches)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const isMounted = isPointerCapable

  useImperativeHandle(
    ref,
    () => ({
      clear: () => {
        strokesRef.current = []
        activeStrokeRef.current = null
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      },
      toDataURL: (type?: string, quality?: number) => canvasRef.current?.toDataURL(type, quality) ?? '',
    }),
    [],
  )

  useEffect(() => {
    if (!isMounted) {
      return
    }
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!(container && canvas)) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sizeRef.current = { height: rect.height, width: rect.width }
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    let lastPointTime = 0

    const pushPoint = (x: number, y: number, time: number) => {
      const isNewStroke = !activeStrokeRef.current || time - lastPointTime > STROKE_BREAK_MS
      if (isNewStroke) {
        const stroke: Stroke = { points: [] }
        activeStrokeRef.current = stroke
        strokesRef.current.push(stroke)
        if (strokesRef.current.length > MAX_STROKES) {
          strokesRef.current.shift()
        }
      }
      const stroke = activeStrokeRef.current
      if (!stroke) {
        return
      }
      const previous = stroke.points.at(-1)
      let width = lineWidth
      if (taper && previous) {
        const dt = Math.max(1, time - previous.time)
        const distance = Math.hypot(x - previous.x, y - previous.y)
        const speed = distance / dt
        const factor = clamp(1 - speed * SPEED_TO_WIDTH_SCALE, MIN_WIDTH_FACTOR, 1)
        width = lineWidth * factor
      }
      stroke.points.push({ time, width, x, y })
      if (stroke.points.length > MAX_POINTS_PER_STROKE) {
        stroke.points.shift()
      }
      lastPointTime = time
      wake()
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      const coordinates = getPointerCoordinates(event, rect)
      for (const point of coordinates) {
        pushPoint(point.x, point.y, performance.now())
      }
    }

    const handlePointerLeave = () => {
      activeStrokeRef.current = null
      if (clearOnLeave) {
        strokesRef.current = []
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    container.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    })
    container.addEventListener('pointerleave', handlePointerLeave, {
      passive: true,
    })

    const drawStroke = (stroke: Stroke, now: number) => {
      const { points } = stroke
      if (points.length < 2) {
        return
      }
      if (points.length === 2) {
        const [start, end] = points
        const age = decay > 0 ? clamp(1 - (now - end.time) / decay, 0, 1) : 1
        if (age <= 0) {
          return
        }
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.globalAlpha = age
        ctx.strokeStyle = color
        ctx.lineWidth = end.width
        ctx.stroke()
        return
      }
      for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1]
        const curr = points[i]
        const next = points[i + 1]
        const age = decay > 0 ? clamp(1 - (now - curr.time) / decay, 0, 1) : 1
        if (age <= 0) {
          continue
        }
        const midPrevX = (prev.x + curr.x) / 2
        const midPrevY = (prev.y + curr.y) / 2
        const midNextX = (curr.x + next.x) / 2
        const midNextY = (curr.y + next.y) / 2
        const startX = prev.x + (midPrevX - prev.x) * smoothing
        const startY = prev.y + (midPrevY - prev.y) * smoothing
        const endX = next.x + (midNextX - next.x) * smoothing
        const endY = next.y + (midNextY - next.y) * smoothing
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.quadraticCurveTo(curr.x, curr.y, endX, endY)
        ctx.globalAlpha = age
        ctx.strokeStyle = color
        ctx.lineWidth = curr.width
        ctx.stroke()
      }
    }

    const draw = () => {
      const now = performance.now()
      const { width, height } = sizeRef.current
      ctx.clearRect(0, 0, width, height)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalCompositeOperation = blend

      for (const stroke of strokesRef.current) {
        if (decay > 0) {
          while (stroke.points.length > 0 && now - stroke.points[0].time > decay) {
            stroke.points.shift()
          }
        }
        drawStroke(stroke, now)
      }

      strokesRef.current = strokesRef.current.filter((stroke) => stroke.points.length > 0)

      // 没有笔迹了就停循环，指针再动（pushPoint 里的 wake）才起。
      if (!paused && strokesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(draw)
      } else {
        rafRef.current = null
      }
    }
    const wake = () => {
      if (!paused && rafRef.current === null) {
        rafRef.current = requestAnimationFrame(draw)
      }
    }
    wake()

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      resizeObserver.disconnect()
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [blend, clearOnLeave, color, decay, isMounted, lineWidth, paused, smoothing, taper])

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {children}
      {isMounted ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <canvas className="h-full w-full" ref={canvasRef} />
        </div>
      ) : null}
    </div>
  )
}

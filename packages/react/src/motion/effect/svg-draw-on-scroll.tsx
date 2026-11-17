// SPDX-License-Identifier: MIT
// 改自 SmoothUI svg-draw-on-scroll（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）。SVG 随滚动描线：路径的笔画长度跟滚动进度走，多条路径依次画，顶端可挂一个标记点。相对原件：去掉 useReducedMotion，ScrollOffset 类型抽到 ../shared.ts。
import { cn } from '../../lib/cn.ts'
import {
  type MotionValue,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'
import { type ReactNode, type RefObject, useCallback, useEffect, useMemo, useRef } from 'react'
import type { ScrollOffset } from '../shared.ts'

/** 弹簧参数照原件（SmoothUI svg-draw-on-scroll）。 */
const SPRING_CONFIG = { damping: 28, mass: 0.4, stiffness: 240 } as const
// Finishes drawing while the artwork is still mid-viewport rather than on its
// way out, so the completed stroke is something you actually get to look at.
const DEFAULT_OFFSET: ScrollOffset = ['start 0.9', 'end 0.6']
const DEFAULT_VIEW_BOX = '0 0 100 100'
const DEFAULT_STROKE_WIDTH = 2
const DEFAULT_STROKE = 'currentColor'
const MARKER_KEY_SLICE = 8

export interface SvgDrawOnScrollProps {
  /** Extra classes for the wrapper. */
  className?: string
  /** Ref to a scrollable ancestor that drives progress instead of the window. */
  container?: RefObject<HTMLElement | null>
  /** Rides the tip of the drawn stroke, positioned from the path's own geometry. */
  marker?: ReactNode
  /** Motion `useScroll` offset tuple, e.g. ["start 0.9", "end 0.3"]. */
  offset?: ScrollOffset
  /** Freeze fully drawn once complete instead of undrawing on scroll-up. */
  once?: boolean
  /** Single path's `d`. Ignored if `paths` is also provided. */
  path?: string
  /** Multiple paths, drawn one after another across the scroll range. */
  paths?: string[]
  /** Stroke color; CSS color or var(--token). */
  stroke?: string
  /** Stroke width in viewBox units. */
  strokeWidth?: number
  /** SVG viewBox of the path data. */
  viewBox?: string
}

interface DrawPathProps {
  d: string
  progress: MotionValue<number>
  range: [number, number]
  stroke: string
  strokeWidth: number
}

const clampUnit = (value: number) => Math.min(1, Math.max(0, value))

const DrawPath = ({ d, progress, range, stroke, strokeWidth }: DrawPathProps) => {
  const pathLength = useTransform(progress, range, [0, 1])

  return (
    <motion.path
      d={d}
      fill="none"
      pathLength={1}
      stroke={stroke}
      strokeLinecap="round"
      strokeWidth={strokeWidth}
      style={{ pathLength }}
    />
  )
}

export function SvgDrawOnScroll({
  path,
  paths,
  viewBox = DEFAULT_VIEW_BOX,
  strokeWidth = DEFAULT_STROKE_WIDTH,
  stroke = DEFAULT_STROKE,
  marker,
  offset = DEFAULT_OFFSET,
  container,
  once = false,
  className,
}: SvgDrawOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const measureRef = useRef<SVGPathElement>(null)
  const maxProgressRef = useRef(0)

  const pathList = useMemo(() => (paths && paths.length > 0 ? paths : path ? [path] : []), [paths, path])
  const combinedD = useMemo(() => pathList.join(' '), [pathList])

  const { scrollYProgress } = useScroll({ container, offset, target: ref })

  const monotonicProgress = useTransform(scrollYProgress, (latest) => {
    if (!once) {
      return latest
    }
    maxProgressRef.current = Math.max(maxProgressRef.current, latest)
    return maxProgressRef.current
  })
  const spring = useSpring(monotonicProgress, SPRING_CONFIG)

  // The marker is positioned from the path's own geometry rather than CSS
  // `offset-path`. `offset-path: path()` measures in the element's CSS pixel
  // space, but the `d` is written in viewBox units — so any viewBox that is not
  // 1:1 with the rendered box (which is the normal case, since the SVG scales
  // with `preserveAspectRatio`) left the marker floating away from the stroke
  // it is supposed to ride. `getPointAtLength` + `getScreenCTM` resolve the
  // point through the exact same transform the browser used to paint the line.
  const markerX = useMotionValue(0)
  const markerY = useMotionValue(0)

  const syncMarker = useCallback(
    (latest: number) => {
      const pathElement = measureRef.current
      const wrapper = ref.current

      if (!(pathElement && wrapper)) {
        return
      }

      const totalLength = pathElement.getTotalLength()
      const matrix = pathElement.getScreenCTM()

      if (!(totalLength && matrix)) {
        return
      }

      const progress = clampUnit(latest)
      const point = pathElement.getPointAtLength(progress * totalLength)
      const screenPoint = new DOMPoint(point.x, point.y).matrixTransform(matrix)
      const rect = wrapper.getBoundingClientRect()

      markerX.set(screenPoint.x - rect.left)
      markerY.set(screenPoint.y - rect.top)
    },
    [markerX, markerY],
  )

  useMotionValueEvent(spring, 'change', syncMarker)

  // Also sync on mount and on resize: the scroll value can sit still for the
  // whole life of the component (reduced motion, or simply an untouched page)
  // and the mapping changes whenever the SVG is laid out at a new size.
  useEffect(() => {
    const wrapper = ref.current

    if (!(marker && combinedD && wrapper)) {
      return
    }

    syncMarker(spring.get())

    const observer = new ResizeObserver(() => syncMarker(spring.get()))
    observer.observe(wrapper)

    return () => observer.disconnect()
  }, [marker, combinedD, spring, syncMarker])

  return (
    <div className={cn('relative', className)} ref={ref}>
      <svg
        aria-hidden="true"
        className="h-full w-full"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
      >
        {pathList.map((d, index) => (
          <DrawPath
            d={d}
            key={`svg-draw-on-scroll-path-${index}-${d.slice(0, MARKER_KEY_SLICE)}`}
            progress={spring}
            range={[index / pathList.length, (index + 1) / pathList.length]}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        ))}
        {/* Never painted — it exists only so the marker has a single, stable
            geometry to measure against, including across multiple paths. */}
        {marker && combinedD ? <path d={combinedD} fill="none" ref={measureRef} stroke="none" /> : null}
      </svg>
      {marker && combinedD ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0"
          style={{ x: markerX, y: markerY }}
        >
          <div className="-translate-x-1/2 -translate-y-1/2">{marker}</div>
        </motion.div>
      ) : null}
    </div>
  )
}

// SPDX-License-Identifier: MIT
// 改自 SmoothUI svg-clip-mask（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）。SVG 形状裁切：内容按一条 objectBoundingBox 路径（内置 blob、拱、菱形、波浪，或自定义）裁成异形，可循环变形、随滚动换形、悬停换形。相对原件：去掉 useReducedMotion，ScrollOffset 类型抽到 ../shared.ts。
import { cn } from '../../lib/cn.ts'
import { motion, useMotionValueEvent, useScroll } from 'motion/react'
import { type ReactNode, type RefObject, useEffect, useId, useRef, useState } from 'react'
import type { ScrollOffset } from '../shared.ts'

/** 缓动曲线照原件（SmoothUI svg-clip-mask）：路径插值是 tween，不走弹簧。 */
const EASE_MOVE = [0.645, 0.045, 0.355, 1] as const
const TRANSITION_DURATION = 0.3
const DEFAULT_MORPH_DURATION = 4
// The mask has to finish opening while the frame is still in view; the full
// enter-to-exit range parks the fully-revealed state off-screen.
const DEFAULT_SCROLL_OFFSET: ScrollOffset = ['start 0.9', 'end 0.6']

const PRESET_PATHS = {
  arch: 'M0,1 L0,0.4 C0,0.18 0.18,0 0.5,0 C0.82,0 1,0.18 1,0.4 L1,1 Z',
  blob: 'M0.5,0.02 C0.75,0.02 0.98,0.25 0.98,0.5 C0.98,0.75 0.75,0.98 0.5,0.98 C0.25,0.98 0.02,0.75 0.02,0.5 C0.02,0.25 0.25,0.02 0.5,0.02 Z',
  diamond: 'M0.5,0 L1,0.5 L0.5,1 L0,0.5 Z',
  wave: 'M0,0.3 C0.25,0.05 0.75,0.55 1,0.3 L1,1 L0,1 Z',
} as const

export type SvgClipMaskShape = 'blob' | 'arch' | 'diamond' | 'wave' | 'custom'
export type SvgClipMaskAnimate = 'none' | 'morph' | 'scroll' | 'hover'

export interface SvgClipMaskProps {
  /**
   * "morph" cycles through morphPaths forever, "scroll" steps through them as
   * the container scrolls, "hover" swaps to morphPaths[0] on hover.
   */
  animate?: SvgClipMaskAnimate
  /** Content clipped by the shape. */
  children: ReactNode
  /** Extra classes for the wrapper. */
  className?: string
  /** Ref to a scrollable ancestor that drives "scroll" mode instead of the window. */
  container?: RefObject<HTMLElement | null>
  /** Seconds for one full "morph" loop. */
  duration?: number
  /**
   * Paths to cycle between for "morph"/"scroll"/"hover". They must all share
   * the same command structure (same sequence of M/L/C/Z and point counts) —
   * browsers interpolate matching parameters positionally, so mismatched
   * structures snap instead of morphing smoothly.
   */
  morphPaths?: string[]
  /** Custom path data, in objectBoundingBox (0..1) coordinates. Required when shape is "custom". */
  path?: string
  /** Named shape or a custom path in 0 to 1 coordinates. */
  shape?: SvgClipMaskShape
}

const useHoverCapable = (enabled: boolean) => {
  const [isHoverCapable, setIsHoverCapable] = useState(false)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    // oxlint-disable-next-line react/set-state-in-effect -- 挂载后才知道环境，必须在 effect 里设
    setIsHoverCapable(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setIsHoverCapable(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [enabled])

  return isHoverCapable
}

export function SvgClipMask({
  children,
  shape = 'blob',
  path,
  animate = 'none',
  morphPaths,
  duration = DEFAULT_MORPH_DURATION,
  container,
  className,
}: SvgClipMaskProps) {
  const clipId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const isHoverCapable = useHoverCapable(animate === 'hover')
  const [isHovered, setIsHovered] = useState(false)
  const [scrollIndex, setScrollIndex] = useState(0)

  const basePath = shape === 'custom' ? (path ?? PRESET_PATHS.blob) : PRESET_PATHS[shape]
  const paths = morphPaths && morphPaths.length > 1 ? morphPaths : [basePath]

  const { scrollYProgress } = useScroll({
    container,
    offset: DEFAULT_SCROLL_OFFSET,
    target: ref,
  })

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    if (animate !== 'scroll' || paths.length < 2) {
      return
    }
    const index = Math.min(paths.length - 1, Math.floor(value * paths.length))
    setScrollIndex(index)
  })

  const isMorphing = animate === 'morph' && paths.length > 1

  const activeD = (() => {
    if (animate === 'none' || isMorphing) {
      return paths[0]
    }
    if (animate === 'scroll') {
      return paths[scrollIndex] ?? paths[0]
    }
    if (animate === 'hover') {
      return isHoverCapable && isHovered ? (paths[1] ?? paths[0]) : paths[0]
    }
    return paths[0]
  })()

  return (
    <div
      // 不定宽：裁切路径按 objectBoundingBox 算，形状跟着外框走，外框的尺寸由调用方给（className 或父级）。
      // 加 w-fit 会压过调用方的普通类（工具类不分层），文档站的 .gal-fx-sq 就被撑成内容宽、形状被拉扁（2026-11-18 退回）。
      className={cn('relative', className)}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      ref={ref}
    >
      <svg aria-hidden="true" className="absolute h-0 w-0">
        <defs>
          <clipPath clipPathUnits="objectBoundingBox" id={clipId}>
            <motion.path
              animate={isMorphing ? { d: paths } : { d: activeD }}
              initial={false}
              transition={
                isMorphing
                  ? {
                      duration,
                      ease: EASE_MOVE,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: 'loop',
                    }
                  : { duration: TRANSITION_DURATION, ease: EASE_MOVE }
              }
            />
          </clipPath>
        </defs>
      </svg>
      <div
        className="h-full w-full"
        style={{
          clipPath: `url(#${clipId})`,
          WebkitClipPath: `url(#${clipId})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

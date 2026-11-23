// SPDX-License-Identifier: MIT
// 改自 SmoothUI scroll-image-reveal（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）。滚动揭图：图片随滚动进度用擦除、帘子、圆形、百叶或缩放揭开，里面的图再做反向视差。相对原件：去掉 useReducedMotion，默认圆角换成 token，ScrollOffset 类型抽到 ../shared.ts。
import { cn } from '../../lib/cn.ts'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { type RefObject, useRef } from 'react'
import type { ScrollOffset } from '../shared.ts'

const DEFAULT_PARALLAX_PX = 60
const CIRCLE_MAX_RADIUS_PERCENT = 90
const BLIND_BAND_SIZE_PX = 40
const SCALE_START = 1.12
const FULL_SCALE = 1
const FULL_OPACITY = 1
const REVEAL_SPEED_MULTIPLIER = 2.5
/** 弹簧参数照原件（SmoothUI scroll-image-reveal）。 */
const SPRING_CONFIG = { damping: 32, mass: 0.4, stiffness: 260 } as const
// The payoff has to land while the frame is still comfortably in view. Running
// the full enter-to-exit range finishes the reveal as the element leaves, so
// the moment it was built for happens off-screen.
const DEFAULT_OFFSET: ScrollOffset = ['start 0.9', 'end 0.6']
const DEFAULT_ROUNDED = 'rounded-[var(--radius-md)]'
const NO_CLIP = 'inset(0% 0% 0% 0%)'

export type ScrollImageRevealMask = 'wipe' | 'curtain' | 'circle' | 'blinds' | 'scale'

export type ScrollImageRevealDirection = 'left' | 'right' | 'up' | 'down'

export interface ScrollImageRevealProps {
  /** Accessible description of the image. Required. */
  alt: string
  /** Extra classes for the wrapper. */
  className?: string
  /** Ref to a scrollable ancestor that drives progress instead of the window. */
  container?: RefObject<HTMLElement | null>
  /** Reveal direction. Only left/right apply to "wipe" and "blinds"; only up/down apply to "curtain". */
  direction?: ScrollImageRevealDirection
  /** How the image is uncovered while scrolling. */
  mask?: ScrollImageRevealMask
  /** Motion `useScroll` offset tuple, e.g. ["start end", "end start"]. */
  offset?: ScrollOffset
  /** Freeze the reveal once fully open instead of re-hiding on scroll-up. */
  once?: boolean
  /** Counter-parallax travel of the image, in pixels. */
  parallax?: number
  /** Tailwind rounded-* class applied to the frame; defaults to the token radius. */
  rounded?: string
  /** Image URL. */
  src: string
}

const clampUnit = (value: number) => Math.min(1, Math.max(0, value))

const buildClipPath = (
  mask: ScrollImageRevealMask,
  direction: ScrollImageRevealDirection,
  progress: number,
): string => {
  const hiddenPercent = clampUnit(1 - progress) * 100

  if (mask === 'wipe') {
    return direction === 'right' ? `inset(0% 0% 0% ${hiddenPercent}%)` : `inset(0% ${hiddenPercent}% 0% 0%)`
  }

  if (mask === 'curtain') {
    return direction === 'down' ? `inset(${hiddenPercent}% 0% 0% 0%)` : `inset(0% 0% ${hiddenPercent}% 0%)`
  }

  if (mask === 'circle') {
    const radius = clampUnit(progress) * CIRCLE_MAX_RADIUS_PERCENT
    return `circle(${radius}% at 50% 50%)`
  }

  return NO_CLIP
}

const buildBlindsMask = (direction: ScrollImageRevealDirection, progress: number): string => {
  const revealPx = clampUnit(progress) * BLIND_BAND_SIZE_PX
  const axis = direction === 'left' || direction === 'right' ? 'to right' : 'to bottom'

  return `repeating-linear-gradient(${axis}, black 0px, black ${revealPx}px, transparent ${revealPx}px, transparent ${BLIND_BAND_SIZE_PX}px)`
}

export function ScrollImageReveal({
  src,
  alt,
  mask = 'wipe',
  direction = 'left',
  parallax = DEFAULT_PARALLAX_PX,
  offset = DEFAULT_OFFSET,
  container,
  once = false,
  rounded = DEFAULT_ROUNDED,
  className,
}: ScrollImageRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const maxRevealRef = useRef(0)

  const { scrollYProgress } = useScroll({ container, offset, target: ref })
  const baseSpring = useSpring(scrollYProgress, SPRING_CONFIG)

  const revealProgress = useTransform(baseSpring, (latest) => {
    const scaled = clampUnit(latest * REVEAL_SPEED_MULTIPLIER)
    if (!once) {
      return scaled
    }
    maxRevealRef.current = Math.max(maxRevealRef.current, scaled)
    return maxRevealRef.current
  })

  // The mask lives on the frame, not the image: the image is deliberately
  // taller than the frame so the parallax has somewhere to travel, and a clip
  // measured against that oversized box would never line up with the edges.
  const clipPath = useTransform(revealProgress, (latest) =>
    mask === 'blinds' || mask === 'scale' ? NO_CLIP : buildClipPath(mask, direction, latest),
  )

  const maskImage = useTransform(revealProgress, (latest) =>
    mask !== 'blinds' ? 'none' : buildBlindsMask(direction, latest),
  )

  // Scales *down* into place from an overscan, never up from smaller than the
  // frame — scaling up from 0.85 would expose the background at the edges.
  const scale = useTransform(revealProgress, (latest) =>
    mask !== 'scale' ? FULL_SCALE : SCALE_START + (FULL_SCALE - SCALE_START) * clampUnit(latest),
  )

  const revealOpacity = useTransform(revealProgress, (latest) => (mask !== 'scale' ? FULL_OPACITY : clampUnit(latest)))

  const overscan = Math.abs(parallax)

  const parallaxY = useTransform(baseSpring, (latest) => overscan - latest * overscan * 2)

  return (
    <motion.div
      className={cn('relative overflow-hidden', rounded, className)}
      ref={ref}
      style={{
        clipPath,
        maskImage,
        WebkitMaskImage: maskImage,
      }}
    >
      <motion.img
        alt={alt}
        className="absolute inset-x-0 w-full object-cover"
        decoding="async"
        src={src}
        style={{
          // Overscan on both edges so the counter-parallax never drags the
          // image off its own frame and leaves a strip of background behind.
          height: `calc(100% + ${overscan * 2}px)`,
          opacity: revealOpacity,
          scale,
          top: -overscan,
          y: parallaxY,
        }}
      />
    </motion.div>
  )
}

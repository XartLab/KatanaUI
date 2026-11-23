// SPDX-License-Identifier: MIT
// 改自 SmoothUI cursor-image-trail（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）。光标图迹：指针在区域里移动时，每隔一段距离在光标处放一张图，带随机倾斜，进场弹出、退场淡出；只在有精确指针的设备上启用。相对原件：去掉 useReducedMotion；指针不在区域里且没有残影时停掉 rAF（原件一直空转）；圆角与阴影换成 token。
import { cn } from '../../lib/cn.ts'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { clamp } from '../shared.ts'

export interface CursorTrailImage {
  /** Alt text of the image (the trail itself is decorative and hidden from readers). */
  alt: string
  src: string
}

export interface CursorImageTrailProps {
  /** Content the trail is laid over; it receives the pointer. */
  children: ReactNode
  /** Extra classes for the wrapper. */
  className?: string
  /** Pointer travel in pixels between two spawned images. */
  distance?: number
  /** Side of each square image in pixels. */
  imageSize?: number
  /** Images cycled through in order; every image needs its own `alt`. */
  images: CursorTrailImage[]
  /** How long one image lives in milliseconds; fast strokes live longer. */
  lifetime?: number
  /** Maximum images alive at once. */
  poolSize?: number
  /** Maximum random tilt in degrees, either direction. */
  rotate?: number
  /** How strongly pointer speed enlarges and prolongs an image. */
  velocityScale?: number
}

interface TrailSlot {
  active: boolean
  duration: number
  rotation: number
  scale: number
  startTime: number
  x: number
  y: number
}

const DEFAULT_POOL_SIZE = 12
const DEFAULT_DISTANCE = 90
const DEFAULT_LIFETIME = 700
const DEFAULT_ROTATE = 12
const DEFAULT_VELOCITY_SCALE = 0.5
const DEFAULT_IMAGE_SIZE = 96
const ENTER_RATIO = 0.25
const EXIT_RATIO = 0.35
const MAX_FRAME_DELTA_MS = 50

const easeOutQuint = (t: number) => 1 - (1 - t) ** 5
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

const createSlots = (poolSize: number, lifetime: number): TrailSlot[] =>
  Array.from({ length: poolSize }, () => ({
    active: false,
    duration: lifetime,
    rotation: 0,
    scale: 1,
    startTime: 0,
    x: 0,
    y: 0,
  }))

export const CursorImageTrail = ({
  children,
  className,
  distance = DEFAULT_DISTANCE,
  imageSize = DEFAULT_IMAGE_SIZE,
  images,
  lifetime = DEFAULT_LIFETIME,
  poolSize = DEFAULT_POOL_SIZE,
  rotate = DEFAULT_ROTATE,
  velocityScale = DEFAULT_VELOCITY_SCALE,
}: CursorImageTrailProps) => {
  const [isHoverDevice, setIsHoverDevice] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const slotRefs = useRef<(HTMLImageElement | null)[]>([])
  const slotStateRef = useRef<TrailSlot[]>(createSlots(poolSize, lifetime))
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const isInsideRef = useRef(false)
  const lastFrameRef = useRef<{ t: number; x: number; y: number } | null>(null)
  const lastSpawnRef = useRef<{ x: number; y: number } | null>(null)
  const nextSlotRef = useRef(0)
  const nextImageRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    // oxlint-disable-next-line react/set-state-in-effect -- 挂载后才知道环境，必须在 effect 里设
    setIsHoverDevice(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setIsHoverDevice(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const effectEnabled = isHoverDevice && images.length > 0

  useEffect(() => {
    if (!effectEnabled) {
      return
    }

    const container = containerRef.current
    if (!container) {
      return
    }

    slotStateRef.current = createSlots(poolSize, lifetime)
    nextSlotRef.current = 0
    nextImageRef.current = 0
    lastFrameRef.current = null
    lastSpawnRef.current = null

    const spawn = (x: number, y: number, velocity: number) => {
      const slotIndex = nextSlotRef.current % poolSize
      nextSlotRef.current += 1
      const imageIndex = nextImageRef.current % images.length
      nextImageRef.current += 1

      const image = images[imageIndex]
      const el = slotRefs.current[slotIndex]
      if (!(el && image)) {
        return
      }

      el.src = image.src
      el.alt = image.alt

      const speedFactor = clamp(velocity * velocityScale, 0, 1)
      const rotation = (Math.random() * 2 - 1) * rotate

      slotStateRef.current[slotIndex] = {
        active: true,
        duration: lifetime * (1 + speedFactor * 0.6),
        rotation,
        scale: 1 + speedFactor * 0.5,
        startTime: performance.now(),
        x,
        y,
      }
    }

    const tick = (now: number) => {
      if (pointerRef.current && isInsideRef.current) {
        const rect = container.getBoundingClientRect()
        const x = pointerRef.current.x - rect.left
        const y = pointerRef.current.y - rect.top

        let velocity = 0
        if (lastFrameRef.current) {
          const dt = Math.min(now - lastFrameRef.current.t, MAX_FRAME_DELTA_MS)
          if (dt > 0) {
            const dx = x - lastFrameRef.current.x
            const dy = y - lastFrameRef.current.y
            velocity = Math.hypot(dx, dy) / dt
          }
        }
        lastFrameRef.current = { t: now, x, y }

        if (lastSpawnRef.current) {
          const dx = x - lastSpawnRef.current.x
          const dy = y - lastSpawnRef.current.y
          if (Math.hypot(dx, dy) >= distance) {
            spawn(x, y, velocity)
            lastSpawnRef.current = { x, y }
          }
        } else {
          lastSpawnRef.current = { x, y }
        }
      }

      for (let i = 0; i < slotStateRef.current.length; i++) {
        const slot = slotStateRef.current[i]
        const el = slotRefs.current[i]
        if (!(slot?.active && el)) {
          continue
        }

        const elapsed = now - slot.startTime
        const progress = clamp(elapsed / slot.duration, 0, 1)

        let opacity: number
        let scale: number

        if (progress <= ENTER_RATIO) {
          const enterProgress = progress / ENTER_RATIO
          const eased = easeOutQuint(enterProgress)
          opacity = eased
          scale = eased * slot.scale
        } else if (progress >= 1 - EXIT_RATIO) {
          const exitProgress = (progress - (1 - EXIT_RATIO)) / EXIT_RATIO
          const eased = easeInOutCubic(exitProgress)
          opacity = 1 - eased
          scale = slot.scale * (1 - eased * 0.15)
        } else {
          opacity = 1
          ;({ scale } = slot)
        }

        el.style.transform = `translate3d(${slot.x}px, ${slot.y}px, 0) translate(-50%, -50%) rotate(${slot.rotation}deg) scale(${scale})`
        el.style.opacity = String(opacity)

        if (progress >= 1) {
          slot.active = false
          el.style.opacity = '0'
        }
      }

      // 指针不在区域里、残影也播完了：停掉循环，下次指针进来再起。
      if (isInsideRef.current || slotStateRef.current.some((slot) => slot.active)) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
      }
    }
    const wake = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY }
      isInsideRef.current = true
      wake()
    }
    const handlePointerEnter = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY }
      isInsideRef.current = true
      lastSpawnRef.current = null
      lastFrameRef.current = null
      wake()
    }
    const handlePointerLeave = () => {
      isInsideRef.current = false
    }

    container.addEventListener('pointermove', handlePointerMove)
    container.addEventListener('pointerenter', handlePointerEnter)
    container.addEventListener('pointerleave', handlePointerLeave)
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerenter', handlePointerEnter)
      container.removeEventListener('pointerleave', handlePointerLeave)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [effectEnabled, images, poolSize, lifetime, distance, rotate, velocityScale])

  return (
    <div className={cn('relative overflow-hidden', className)} ref={containerRef}>
      {children}
      {effectEnabled ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
          {Array.from({ length: poolSize }).map((_, index) => (
            <img
              alt=""
              className="absolute top-0 left-0 rounded-[var(--radius-md)] object-cover opacity-0 shadow-[var(--lift)] will-change-transform"
              draggable={false}
              // biome-ignore lint/suspicious/noArrayIndexKey: pool slots are positional and never reorder
              key={index}
              ref={(el) => {
                slotRefs.current[index] = el
              }}
              src={images[0]?.src}
              style={{ height: imageSize, width: imageSize }}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

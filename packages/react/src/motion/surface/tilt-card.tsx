// SPDX-License-Identifier: MIT
// 改自 SmoothUI tilt-card（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { motion, useMotionTemplate, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { useFinePointer } from '../../lib/fine-pointer.ts'

// 倾斜卡：指针在卡上移动时卡跟着转（最大 maxTilt 度），一道高光跟着指针走，可选让带 data-tilt-depth（0 到 1）的子元素按深度错位出视差。
// 适用：首页、营销页、功能介绍的卡片。不进交易主界面：行情与下单区的东西要稳，不该随指针晃。
// 只在有精细指针的设备上动（触屏没有悬停）；键盘聚焦时给一个固定的小倾斜。弹簧与默认值是原件的常量。

/** 原件的默认：最大倾斜 12 度、透视 900px、悬停放大 1.03、高光不透明度 0.25。 */
const DEFAULTS = { maxTilt: 12, perspective: 900, scale: 1.03, glareOpacity: 0.25 }
/** 原件的弹簧（bounce 0.1 · 0.25s），键盘聚焦时的倾斜比例，视差位移的最大 px。 */
const SPRING = { bounce: 0.1, duration: 0.25 }
const FOCUS_TILT_RATIO = 0.35
const PARALLAX_PX = 24

export type TiltCardProps = {
  /** What goes inside. */
  children: ReactNode
  /** Draw a highlight that follows the pointer. */
  glare?: boolean
  /** Peak opacity of the highlight, 0 to 1. */
  glareOpacity?: number
  /** Tilt at the card edge, degrees. */
  maxTilt?: number
  /** Shift children marked data-tilt-depth by their depth. */
  parallax?: boolean
  /** CSS perspective, px. */
  perspective?: number
  /** Scale while tilted. */
  scale?: number
  /** Extra classes for the root element. */
  className?: string
}

export function TiltCard({
  children,
  glare = true,
  glareOpacity = DEFAULTS.glareOpacity,
  maxTilt = DEFAULTS.maxTilt,
  parallax = false,
  perspective = DEFAULTS.perspective,
  scale = DEFAULTS.scale,
  className,
}: TiltCardProps) {
  const fine = useFinePointer()
  const host = useRef<HTMLDivElement>(null)
  const rotateX = useSpring(0, SPRING)
  const rotateY = useSpring(0, SPRING)
  const scaleValue = useSpring(1, SPRING)
  const glareX = useSpring(50, SPRING)
  const glareY = useSpring(50, SPRING)
  const glareStrength = useSpring(0, SPRING)
  // 光晕强度是 motion 值（0–1），先换成百分比再拼进 color-mix，颜色走 token。
  const glarePct = useTransform(glareStrength, (v) => v * 100)
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, color-mix(in srgb, var(--ink-100) ${glarePct}%, transparent), transparent 60%)`

  const moveDepth = (nx: number, ny: number) => {
    host.current?.querySelectorAll<HTMLElement>('[data-tilt-depth]').forEach((el) => {
      const depth = Math.min(1, Math.max(0, Number.parseFloat(el.dataset.tiltDepth ?? '0') || 0))
      el.style.transform = `translate3d(${nx * depth * PARALLAX_PX}px, ${ny * depth * PARALLAX_PX}px, 0)`
    })
  }
  useEffect(() => {
    if (!parallax) moveDepth(0, 0)
  }, [parallax])

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = host.current?.getBoundingClientRect()
    if (!rect) return
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1
    rotateY.set(nx * maxTilt)
    rotateX.set(-ny * maxTilt)
    scaleValue.set(scale)
    glareX.set(50 + nx * 50)
    glareY.set(50 + ny * 50)
    glareStrength.set(glareOpacity)
    if (parallax) moveDepth(nx, ny)
  }
  const reset = () => {
    rotateX.set(0)
    rotateY.set(0)
    scaleValue.set(1)
    glareStrength.set(0)
    if (parallax) moveDepth(0, 0)
  }

  return (
    <div style={{ perspective }} className={cn('inline-block', className)}>
      <motion.div
        ref={host}
        data-slot="tilt-card"
        className="relative overflow-hidden rounded-[var(--radius-overlay)] border border-alpha-white-6 bg-surface-3"
        style={{ rotateX, rotateY, scale: scaleValue, transformStyle: 'preserve-3d' }}
        {...(fine
          ? {
              onPointerMove: onMove,
              onPointerLeave: reset,
              onFocus: () => {
                rotateX.set(maxTilt * FOCUS_TILT_RATIO)
                rotateY.set(-maxTilt * FOCUS_TILT_RATIO)
                scaleValue.set(scale)
              },
              onBlur: reset,
            }
          : {})}
      >
        {children}
        {glare ? (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: glareBackground }}
          />
        ) : null}
      </motion.div>
    </div>
  )
}

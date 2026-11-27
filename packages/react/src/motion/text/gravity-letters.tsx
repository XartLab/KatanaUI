// SPDX-License-Identifier: MIT
// 改自 SmoothUI gravity-letters（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 文字的每个字被「放开」后受重力掉到容器底、弹几下、静下来；再触发就被弹簧拉回原位。物理在 gravity-model.ts（纯函数），这里管测量、帧循环与触发。
// 我们的改动：读屏名靠 sr-only 的整句；触发方式 click 时是 role=button + aria-pressed，键盘 Enter / 空格可用；没有 prefers-reduced-motion 分支（项目规定）。
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn.ts'
import { fallStep, reformStep, type LetterPhysics } from './gravity-model.ts'
import { segmentGraphemes } from './split.ts'

export type GravityLettersTrigger = 'click' | 'hover' | 'inView' | 'manual'

export type GravityLettersProps = {
  /** Fraction of vertical speed kept after hitting the floor or a wall, from 0 to 1. */
  bounce?: number
  /** Extra class names for the root element. */
  className?: string
  /** Controls whether the letters have fallen; leave out to let `trigger` decide. */
  collapsed?: boolean
  /** Fraction of horizontal speed lost on each floor hit, from 0 to 1. */
  friction?: number
  /** Downward acceleration in pixels per second squared. */
  gravity?: number
  /** Called when the letters fall or return. */
  onCollapsedChange?: (collapsed: boolean) => void
  /** Largest sideways speed a letter is thrown with, in pixels per second. */
  spread?: number
  /** Milliseconds between one letter being released and the next. */
  stagger?: number
  /** The text to drop. */
  text: string
  /** hover or click drops and restores the letters, inView drops them once on entering the view, manual leaves it to `collapsed`. */
  trigger?: GravityLettersTrigger
}

type Phase = 'falling' | 'idle' | 'reforming' | 'settled'
type Origin = { height: number; width: number; x: number; y: number }

// 来源：SmoothUI 原件的默认值。
const DEFAULT_GRAVITY = 1200
const DEFAULT_BOUNCE = 0.35
const DEFAULT_FRICTION = 0.4
const DEFAULT_SPREAD = 140
const DEFAULT_STAGGER = 40
const MAX_DT_SECONDS = 0.05
const MAX_SPIN = 180

/** Letters that fall to the bottom of their box, bounce and rest, then spring back: a playful empty state or a "market dropped" headline. */
export function GravityLetters({
  bounce = DEFAULT_BOUNCE,
  className,
  collapsed: collapsedProp,
  friction = DEFAULT_FRICTION,
  gravity = DEFAULT_GRAVITY,
  onCollapsedChange,
  spread = DEFAULT_SPREAD,
  stagger = DEFAULT_STAGGER,
  text,
  trigger = 'hover',
}: GravityLettersProps) {
  const letters = useMemo(() => segmentGraphemes(text), [text])
  const controlled = collapsedProp !== undefined
  const [inner, setInner] = useState(false)
  const collapsed = controlled ? Boolean(collapsedProp) : inner
  const notify = useRef(onCollapsedChange)
  useEffect(() => {
    notify.current = onCollapsedChange
  })
  const setCollapsed = useCallback(
    (next: boolean) => {
      if (!controlled) setInner(next)
      notify.current?.(next)
    },
    [controlled],
  )

  const container = useRef<HTMLDivElement>(null)
  const measureRefs = useRef<(HTMLSpanElement | null)[]>([])
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([])
  const origins = useRef<Origin[]>([])
  const physics = useRef<LetterPhysics[]>([])
  const phase = useRef<Phase>('idle')
  const raf = useRef<number | null>(null)
  const lastTick = useRef<number | null>(null)
  const config = useRef({ bounce, friction, gravity, spread, stagger })
  useEffect(() => {
    config.current = { bounce, friction, gravity, spread, stagger }
  }, [bounce, friction, gravity, spread, stagger])

  const placeIdle = useCallback(() => {
    letterRefs.current.forEach((el, i) => {
      const origin = origins.current[i]
      if (el && origin) el.style.transform = `translate3d(${origin.x}px, ${origin.y}px, 0) rotate(0deg)`
    })
  }, [])

  // 先把每个字在文档流里的位置量出来（隐藏的测量层），再让可见层用绝对定位的 transform 复现它，物理才有坐标可算。
  useLayoutEffect(() => {
    const root = container.current
    if (!root) return
    const measure = () => {
      const box = root.getBoundingClientRect()
      origins.current = measureRefs.current.map((el) => {
        if (!el) return { height: 0, width: 0, x: 0, y: 0 }
        const rect = el.getBoundingClientRect()
        return { height: rect.height, width: rect.width, x: rect.left - box.left, y: rect.top - box.top }
      })
      if (phase.current === 'idle') placeIdle()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [letters, placeIdle])

  const startLoop = useCallback(() => {
    if (raf.current !== null) return
    lastTick.current = null
    const tick = (now: number) => {
      const dt = Math.min((now - (lastTick.current ?? now)) / 1000, MAX_DT_SECONDS)
      lastTick.current = now
      const root = container.current
      if (!root) {
        raf.current = null
        return
      }
      const rect = root.getBoundingClientRect()
      const { bounce: b, friction: f, gravity: g } = config.current
      let active = false
      physics.current.forEach((p, i) => {
        const el = letterRefs.current[i]
        const origin = origins.current[i]
        if (!(el && origin)) return
        if (phase.current === 'falling') {
          if (now < p.releaseAt) {
            active = true
            return
          }
          if (p.settled) return
          active = true
          fallStep(p, dt, {
            bounce: b,
            floorLimit: rect.height - origin.y - origin.height,
            friction: f,
            gravity: g,
            leftLimit: -origin.x,
            rightLimit: rect.width - origin.x - origin.width,
          })
        } else if (phase.current === 'reforming') {
          if (p.settled) return
          if (reformStep(p, dt)) active = true
        }
        el.style.transform = `translate3d(${origin.x + p.dx}px, ${origin.y + p.dy}px, 0) rotate(${p.angle}deg)`
      })
      if (active) {
        raf.current = requestAnimationFrame(tick)
      } else {
        raf.current = null
        phase.current = phase.current === 'falling' ? 'settled' : 'idle'
        if (phase.current === 'idle') placeIdle()
      }
    }
    raf.current = requestAnimationFrame(tick)
  }, [placeIdle])

  useEffect(() => {
    if (collapsed) {
      if (origins.current.length === 0) return
      const now = performance.now()
      const { spread: s, stagger: st } = config.current
      physics.current = letters.map((_, index) => ({
        angle: 0,
        angularVel: (Math.random() * 2 - 1) * MAX_SPIN,
        dx: 0,
        dy: 0,
        releaseAt: now + index * st,
        settled: false,
        vx: (Math.random() * 2 - 1) * s,
        vy: 0,
      }))
      phase.current = 'falling'
      startLoop()
    } else {
      if (physics.current.length === 0) return
      for (const p of physics.current) p.settled = false
      phase.current = 'reforming'
      startLoop()
    }
    // letters 变化时不重放，只在 collapsed 翻转时触发。
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed])

  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
    },
    [],
  )

  useEffect(() => {
    const root = container.current
    if (trigger !== 'inView' || !root) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setCollapsed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [trigger, setCollapsed])

  const hover = trigger === 'hover'
  const click = trigger === 'click'
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (click && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      setCollapsed(!collapsed)
    }
  }
  return (
    <div
      aria-pressed={click ? collapsed : undefined}
      className={cn('relative isolate min-h-24 overflow-hidden select-none', className)}
      data-phase={collapsed ? 'collapsed' : 'rest'}
      data-slot="gravity-letters"
      onBlur={hover ? () => setCollapsed(false) : undefined}
      onClick={click ? () => setCollapsed(!collapsed) : undefined}
      onFocus={hover ? () => setCollapsed(true) : undefined}
      onKeyDown={click ? onKeyDown : undefined}
      onPointerEnter={hover ? () => setCollapsed(true) : undefined}
      onPointerLeave={hover ? () => setCollapsed(false) : undefined}
      ref={container}
      role={click ? 'button' : undefined}
      tabIndex={hover || click ? 0 : undefined}
    >
      <span className="sr-only">{text}</span>
      <div aria-hidden="true" className="pointer-events-none invisible flex flex-wrap">
        {letters.map((char, index) => (
          <span
            className="inline-block whitespace-pre"
            key={index}
            ref={(el) => {
              measureRefs.current[index] = el
            }}
          >
            {char}
          </span>
        ))}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {letters.map((char, index) => (
          <span
            className="absolute top-0 left-0 inline-block whitespace-pre will-change-transform"
            key={index}
            ref={(el) => {
              letterRefs.current[index] = el
            }}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  )
}

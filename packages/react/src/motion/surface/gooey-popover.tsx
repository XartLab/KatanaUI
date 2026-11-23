// SPDX-License-Identifier: MIT
// 改自 SmoothUI gooey-popover（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { animate, AnimatePresence, motion, useMotionValue } from 'motion/react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { focusRing } from '../../lib/focus.ts'

// 软糖弹出层：触发的圆钮点开，一块「液体」从圆钮里长出来变成内容面板，收起时又缩回圆钮里。
// 液体感来自 SVG 的 goo 滤镜（高斯模糊 + 提高 alpha 对比度，把靠近的形状融在一起），滤镜层只画形状，文字与控件在不加滤镜的上层，所以字不糊。
// 适用：首页或营销页里的一个小彩蛋式入口；交易主界面的弹层用 Popover，这个会在圆钮与面板之间出现没有语义的形变。
// 原件用 gsap 做时间线（新依赖，且 gsap 在 npm 上带它自己的许可）；这里改用已有的 motion 的 animate，时长与缓动照原件（power1.in ≈ easeIn，内容在 57.5% 处淡入）。
// 内容高度用 ResizeObserver 量一个隐藏镜像（原件是 100ms 与 500ms 两次定时量，内容变了就量不准）。

const GOO_STD_DEVIATION = 10
const GOO_ALPHA_MULTIPLIER = 24
const GOO_ALPHA_OFFSET = -10
const CONTENT_RADIUS = 18

export type GooeyPopoverProps = {
  /** The panel's content. */
  children: ReactNode
  /** Icon in the round trigger. */
  trigger: ReactNode
  /** Spoken name of the trigger (required). */
  triggerLabel: string
  /** Whether the panel is open (controlled). */
  open?: boolean
  /** Called when it opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Open above or below the trigger. */
  side?: 'top' | 'bottom'
  /** Gap between trigger and panel in px. */
  sideOffset?: number
  /** Panel width in px. */
  contentWidth?: number
  /** Diameter of the trigger in px. */
  triggerSize?: number
  /** Duration of the morph in seconds. */
  speed?: number
  /** Extra classes for the root element. */
  className?: string
}

export function GooeyPopover({
  children,
  trigger,
  triggerLabel,
  open: openProp,
  onOpenChange,
  side = 'top',
  sideOffset = 24,
  contentWidth = 240,
  triggerSize = 44,
  speed = 0.25,
  className,
}: GooeyPopoverProps) {
  const filterId = `goo-${useId().replace(/:/g, '')}`
  const [inner, setInner] = useState(false)
  const open = openProp ?? inner
  const root = useRef<HTMLDivElement>(null)
  const measure = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  const [shown, setShown] = useState(false)
  const set = (next: boolean) => {
    setInner(next)
    onOpenChange?.(next)
  }

  // 形状的几何：全部用 motion value，由 animate 推着走。
  const w = useMotionValue(triggerSize)
  const h = useMotionValue(triggerSize)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const r = useMotionValue(triggerSize / 2)
  const inOpacity = useMotionValue(0)
  const inY = useMotionValue(16)

  useEffect(() => {
    const node = measure.current
    if (!node) return
    const observer = new ResizeObserver(() => setHeight(node.scrollHeight))
    observer.observe(node)
    setHeight(node.scrollHeight)
    return () => observer.disconnect()
  }, [])

  const left = triggerSize / 2 - contentWidth / 2
  const top = side === 'top' ? -(height + sideOffset) : triggerSize + sideOffset

  useEffect(() => {
    if (!height) return
    const ease = 'easeIn' as const
    const controls: { stop: () => void }[] = []
    if (open) {
      setShown(true)
      inOpacity.set(0)
      inY.set(16)
      for (const [value, to] of [
        [w, contentWidth],
        [h, height],
        [x, left],
        [y, top],
        [r, CONTENT_RADIUS],
      ] as const)
        controls.push(animate(value, to, { duration: speed, ease }))
      controls.push(animate(inOpacity, 1, { duration: speed * 0.75, delay: speed * 0.575, ease: 'easeOut' }))
      controls.push(animate(inY, 0, { duration: speed * 0.75, delay: speed * 0.575, ease: 'easeOut' }))
    } else {
      controls.push(animate(inOpacity, 0, { duration: speed * 0.4, ease }))
      controls.push(animate(inY, 8, { duration: speed * 0.4, ease }))
      for (const [value, to] of [
        [w, triggerSize],
        [h, triggerSize],
        [x, 0],
        [y, 0],
        [r, triggerSize / 2],
      ] as const)
        controls.push(animate(value, to, { duration: speed, delay: speed * 0.2, ease }))
      const timer = window.setTimeout(() => setShown(false), speed * 1000 * 1.2)
      controls.push({ stop: () => window.clearTimeout(timer) })
    }
    return () => controls.forEach((c) => c.stop())
  }, [open, height, contentWidth, left, top, speed, triggerSize, w, h, x, y, r, inOpacity, inY])

  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) set(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') set(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const blobClass = 'absolute top-0 left-0 bg-surface-4'
  return (
    <div
      ref={root}
      data-slot="gooey-popover"
      className={cn('relative', className)}
      style={{ width: triggerSize, height: triggerSize }}
    >
      <svg aria-hidden="true" width="0" height="0" className="absolute">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation={GOO_STD_DEVIATION} result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${GOO_ALPHA_MULTIPLIER} ${GOO_ALPHA_OFFSET}`}
            />
          </filter>
        </defs>
      </svg>
      {/* 滤镜层：圆钮的底与展开的形状一起过 goo 滤镜，靠近时融在一起。 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ filter: `url(#${filterId})` }}>
        <div className={cn(blobClass, 'rounded-full')} style={{ width: triggerSize, height: triggerSize }} />
        {shown ? <motion.div className={blobClass} style={{ width: w, height: h, x, y, borderRadius: r }} /> : null}
      </div>
      <button
        type="button"
        aria-label={triggerLabel}
        aria-expanded={open}
        onClick={() => set(!open)}
        className={cn(
          'relative z-10 flex cursor-pointer items-center justify-center rounded-full text-ink-2 hover:text-ink',
          focusRing,
        )}
        style={{ width: triggerSize, height: triggerSize }}
      >
        {trigger}
      </button>
      <AnimatePresence>
        {shown ? (
          <motion.div
            role="group"
            className="absolute top-0 left-0 z-10 overflow-hidden border border-alpha-white-6"
            style={{ width: w, height: h, x, y, borderRadius: r, opacity: inOpacity }}
          >
            <motion.div style={{ y: inY }} className="k-text-body p-4 text-ink-2">
              {children}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {/* 隐藏镜像：只为量内容高度（不进读屏树与 Tab 顺序）。 */}
      <div
        aria-hidden="true"
        inert
        className="pointer-events-none invisible absolute top-0 left-0"
        style={{ width: contentWidth }}
      >
        <div ref={measure} className="k-text-body p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

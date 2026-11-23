// SPDX-License-Identifier: MIT
// 改自 SmoothUI glass-card（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { motion, useSpring } from 'motion/react'
import { useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { useFinePointer } from '../../lib/fine-pointer.ts'

// 玻璃卡：毛玻璃底（背景模糊 + 淡色）、内沿的一线高光、随指针移动的镜面高光与顶边扫光，悬停时轻轻抬起。适用：首页、营销页压在图或渐变上的卡片；
// 压在纯色底上它就是一块灰，没有意义，也不进交易主界面。
// 没搬的：原件边缘的折射环（SVG feDisplacementMap 做的玻璃弯折，只有 Chromium 支持 backdrop-filter 引用 SVG 滤镜，在别的引擎上会退成没有效果，还很吃填充率）；
// 保留毛玻璃、边缘彩色色散的淡渐变、镜面高光与抬起，这几样跨引擎都一致。弹簧是原件的临界阻尼（光落在玻璃上应当安定，不摇晃）。

/** 原件的弹簧与抬起量。 */
const SPRING = { damping: 34, mass: 0.5, stiffness: 250 } as const
const LIFT = { scale: 1.006, y: -3 }
const SPECULAR_SIZE = 260
/** 原件的色散边：一侧偏青、一侧偏品红（玻璃弯折光时会把它分开）。 */
const CHROMATIC_RIM =
  // 原件写死的青、品红两色换成 token 混色：跟主题走。
  'linear-gradient(125deg, color-mix(in oklab, var(--signal-blue) 40%, transparent) 0%, transparent 36%, transparent 64%, color-mix(in oklab, var(--signal-red) 34%, transparent) 100%)'

export type GlassCardProps = {
  /** What goes inside. */
  children: ReactNode
  /** Backdrop blur in px. */
  blur?: number
  /** Corner radius in px. */
  radius?: number
  /** Frosted tint, any CSS colour; a token such as var(--alpha-white-6) works. */
  tint?: string
  /** Follow the pointer with a highlight and lift on hover. */
  interactive?: boolean
  /** Draw the coloured dispersion at the edges. */
  dispersion?: boolean
  /** Extra classes for the root element. */
  className?: string
}

export function GlassCard({
  children,
  blur = 11,
  radius = 20,
  tint = 'var(--alpha-white-6)',
  interactive = true,
  dispersion = true,
  className,
}: GlassCardProps) {
  const fine = useFinePointer()
  const [hover, setHover] = useState(false)
  const sx = useSpring(0, SPRING)
  const sy = useSpring(0, SPRING)
  const tracks = interactive && fine

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    sx.set(event.clientX - rect.left - SPECULAR_SIZE / 2)
    sy.set(event.clientY - rect.top - SPECULAR_SIZE / 2)
  }

  const surface: CSSProperties = {
    borderRadius: radius,
    background: tint,
    backdropFilter: `blur(${blur}px) saturate(1.4)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(1.4)`,
    boxShadow:
      'inset 0 1px 0 var(--alpha-white-12), inset 0 0 0 1px var(--alpha-white-6), 0 26px 60px -26px color-mix(in srgb, var(--bg-000) 60%, transparent)',
  }

  return (
    <motion.div
      data-slot="glass-card"
      animate={tracks && hover ? LIFT : { scale: 1, y: 0 }}
      transition={SPRING}
      onPointerEnter={tracks ? () => setHover(true) : undefined}
      onPointerLeave={tracks ? () => setHover(false) : undefined}
      onPointerMove={tracks ? onMove : undefined}
      className={cn('relative isolate overflow-hidden', className)}
      style={surface}
    >
      {dispersion ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: CHROMATIC_RIM, borderRadius: radius }}
        />
      ) : null}
      {tracks ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 transition-opacity duration-200"
          style={{
            x: sx,
            y: sy,
            width: SPECULAR_SIZE,
            height: SPECULAR_SIZE,
            opacity: hover ? 1 : 0,
            background:
              'radial-gradient(closest-side, color-mix(in srgb, var(--ink-100) 30%, transparent), color-mix(in srgb, var(--ink-100) 7%, transparent) 48%, transparent 74%)',
          }}
        />
      ) : null}
      <div className="relative z-10 p-5">{children}</div>
    </motion.div>
  )
}

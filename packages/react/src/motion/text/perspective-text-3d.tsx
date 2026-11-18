// SPDX-License-Identifier: MIT
// 改自 SmoothUI perspective-text-3d（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 文字摆在一个 3D 平面上，行或词沿 Z 轴错开深度，整个平面随滚动进度、指针位置倾斜，或固定一个角度。
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { Fragment, useEffect, useRef, useState, type RefObject } from 'react'
import { cn } from '../../lib/cn.ts'

export type PerspectiveTextDriver = 'scroll' | 'pointer' | 'static'
export type PerspectiveTextSplit = 'lines' | 'words'

export type PerspectiveText3DProps = {
  /** The text, as an alternative to `text`. */
  children?: string
  /** Extra class names for the root element. */
  className?: string
  /** Scrollable ancestor observed when `driver` is scroll; the page itself when omitted. */
  container?: RefObject<HTMLElement | null>
  /** Z-axis separation between neighbouring lines or words, in pixels. */
  depth?: number
  /** What tilts the plane: scroll progress, the pointer position, or nothing (a fixed tilt). */
  driver?: PerspectiveTextDriver
  /** CSS perspective distance, in pixels. */
  perspective?: number
  /** Maximum rotation around the X axis, in degrees. */
  rotateX?: number
  /** Maximum rotation around the Y axis, in degrees. */
  rotateY?: number
  /** Separate depth per line (split on newline) or per word. */
  split?: PerspectiveTextSplit
  /** The text to lay out in depth. */
  text?: string
}

// 来源：SmoothUI 原件的默认值与弹簧。
const POINTER_RANGE = 2
const SPRING = { bounce: 0.1, duration: 0.25, type: 'spring' as const }

/** 切成要错开深度的段：按词，或按换行（没有换行就是整段一块）。 */
export function splitDepthSegments(content: string, split: PerspectiveTextSplit): string[] {
  if (split === 'words') return content.split(/\s+/).filter((segment) => segment.length > 0)
  const lines = content.split('\n').filter((line) => line.length > 0)
  return lines.length > 0 ? lines : [content]
}

/** Text on a tilting 3D plane with its words or lines pushed apart in depth; the plane follows scroll or the pointer. */
export function PerspectiveText3D({
  children,
  className,
  container,
  depth = 40,
  driver = 'static',
  perspective = 800,
  rotateX = 8,
  rotateY = 10,
  split = 'words',
  text,
}: PerspectiveText3DProps) {
  const content = text ?? children ?? ''
  const wrapper = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const el = wrapper.current
    if (!el || driver !== 'pointer') return
    const move = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      setTilt({
        x: -((event.clientY - rect.top) / rect.height - 0.5) * rotateX * POINTER_RANGE,
        y: ((event.clientX - rect.left) / rect.width - 0.5) * rotateY * POINTER_RANGE,
      })
    }
    const leave = () => setTilt({ x: 0, y: 0 })
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [driver, rotateX, rotateY])

  const { scrollYProgress } = useScroll({ container, target: wrapper })
  const scrollX = useSpring(useTransform(scrollYProgress, [0, 1], [rotateX, -rotateX]), SPRING)
  const scrollY = useSpring(useTransform(scrollYProgress, [0, 1], [-rotateY, rotateY]), SPRING)

  const segments = splitDepthSegments(content, split)
  const mid = (segments.length - 1) / 2
  const animate =
    driver === 'pointer' ? { rotateX: tilt.x, rotateY: tilt.y } : driver === 'static' ? { rotateX, rotateY } : undefined
  return (
    <div
      // w-fit：透视原点是这个框的中心。框被 flex / grid 拉宽时原点偏到文字外，前后错开的词往一边挤、叠成一团；按文字收宽原点才落在文字中间。
      className={cn('inline-block w-fit', className)}
      data-driver={driver}
      data-slot="perspective-text-3d"
      ref={wrapper}
      style={{ perspective }}
    >
      <span className="sr-only">{content}</span>
      <motion.div
        animate={animate}
        initial={driver === 'scroll' ? undefined : { rotateX: 0, rotateY: 0 }}
        style={{
          transformStyle: 'preserve-3d',
          ...(driver === 'scroll' ? { rotateX: scrollX, rotateY: scrollY } : {}),
        }}
        transition={SPRING}
      >
        {segments.map((segment, index) => (
          <Fragment key={`${index}-${segment}`}>
            {/* 词间空格放在 inline-block 外面：放在里面是行尾空白，排版时被吞掉，词就贴在一起（原件同样的问题）。 */}
            {split === 'words' && index > 0 ? ' ' : null}
            <div
              aria-hidden="true"
              style={{
                display: split === 'lines' ? 'block' : 'inline-block',
                transform: `translateZ(${(index - mid) * depth}px)`,
              }}
            >
              {segment}
            </div>
          </Fragment>
        ))}
      </motion.div>
    </div>
  )
}

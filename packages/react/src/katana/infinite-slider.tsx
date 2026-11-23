// SPDX-License-Identifier: MIT
// 改自 SmoothUI infinite-slider（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
// 无限滚动条：行情跑马灯（Ticker tape）的底座。内容复制一份首尾相接，匀速平移一个「一份的长度 + 间隔」后回到原点，看不到接缝。
// 与原件的差别：① 原件靠 motion 的 animate 重启动画来变速，每次悬停都要重新算时长；这里用逐帧推进 + 速度平滑趋近目标速度，
// 悬停减速、暂停、恢复都是同一条路径，不会跳；② 去掉 react-use-measure 依赖，一份的长度直接读第二份的偏移；
// ③ 复制出来的那一份 aria-hidden，读屏只读一遍；④ paused 是受控的，文档站里接「实时 / 暂停」开关。
import { motion, useAnimationFrame, useMotionValue } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'

// 速度趋近目标的快慢（每秒收敛的比例）：约 0.15 秒走完大半，悬停减速不突兀。
const SPEED_EASE_PER_SECOND = 12
// 一帧最长按 50ms 算：切标签页回来时不让条一下子跳出一大段。
const MAX_FRAME_MS = 50

export type InfiniteSliderProps = {
  /** One copy of the content; the slider repeats it. */
  children: ReactNode
  /** Accessible name of the strip, for example "Index quotes". */
  label: string
  /** Scroll axis. */
  direction?: 'horizontal' | 'vertical'
  /** Speed in pixels per second. */
  speed?: number
  /** Speed while the pointer is over the strip; stops it when 0, omitted keeps the speed. */
  speedOnHover?: number
  /** Scroll the other way (left to right, or top to bottom). */
  reverse?: boolean
  /** Hold still; the strip slows to a stop and resumes from the same spot. */
  paused?: boolean
  /** Extra class name on the clipping box; give it the height for the vertical direction. */
  className?: string
}

export function InfiniteSlider({
  children,
  label,
  direction = 'horizontal',
  speed = 60,
  speedOnHover,
  reverse = false,
  paused = false,
  className,
}: InfiniteSliderProps) {
  const horizontal = direction === 'horizontal'
  const offset = useMotionValue(0)
  const second = useRef<HTMLDivElement>(null)
  const first = useRef<HTMLDivElement>(null)
  const hovering = useRef(false)
  const current = useRef(0)
  useAnimationFrame((_, delta) => {
    const a = first.current
    const b = second.current
    if (!a || !b) return
    // 一份的长度加间隔，就是第二份离第一份的偏移。
    const loop = horizontal ? b.offsetLeft - a.offsetLeft : b.offsetTop - a.offsetTop
    if (loop <= 0) return
    const target = paused ? 0 : hovering.current && speedOnHover !== undefined ? speedOnHover : speed
    const dt = Math.min(delta, MAX_FRAME_MS) / 1000
    current.current += (target - current.current) * Math.min(1, SPEED_EASE_PER_SECOND * dt)
    if (Math.abs(current.current) < 0.01 && target === 0) current.current = 0
    // 向左（上）走时偏移取负；转一圈回到 0 或 -loop 之间。
    let next = offset.get() + (reverse ? 1 : -1) * current.current * dt
    next = ((next % loop) + loop) % loop
    offset.set(next - loop)
  })
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="infinite-slider"
      data-direction={direction}
      className={cn('overflow-hidden', className)}
      onPointerEnter={() => {
        hovering.current = true
      }}
      onPointerLeave={() => {
        hovering.current = false
      }}
    >
      <motion.div
        data-slot="infinite-slider-track"
        className={cn('flex gap-(--space-4)', horizontal ? 'w-max' : 'flex-col')}
        style={horizontal ? { x: offset } : { y: offset }}
      >
        <div ref={first} className={cn('flex gap-(--space-4)', !horizontal && 'flex-col')}>
          {children}
        </div>
        <div ref={second} aria-hidden="true" className={cn('flex gap-(--space-4)', !horizontal && 'flex-col')}>
          {children}
        </div>
      </motion.div>
    </div>
  )
}

// SPDX-License-Identifier: MIT
// 改自 SmoothUI dock（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { animate, motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

// 坞：一排图标，指针靠近时按距离放大（原件的升余弦衰减：贴着指针的最大、邻居跟着长、影响半径外回到原样）。
// 用在底部或侧边的工具坞（打开回测、新建策略、看板切换），不是主导航。我们做的简化：不做原件那套「积分布局」（让放大后整排仍居中、峰值钉在指针下），
// 邻居是被放大的宽度自然挤开的，整排的中心会随指针略有漂移；选中时的弹跳保留。弹簧参数沿用原件的常量，不跟 prefers-reduced-motion（项目规定）。

/** 原件的跟手弹簧（SmoothUI dock 的 TRACK_SPRING）。 */
const TRACK_SPRING = { bounce: 0, duration: 0.18 }
/** 原件的选中弹跳：往上跳 40% 再回落，带一次小回声（BOUNCE_PEAK / BOUNCE_ECHO / BOUNCE_TIMES）。 */
const BOUNCE = { y: [0, -0.4, 0, -0.13, 0], times: [0, 0.3, 0.58, 0.8, 1], duration: 0.6 }

export type DockItem = {
  id: string
  /** Name shown as the tooltip label and spoken (required). */
  label: string
  icon: ReactNode
  /** Draws a small dot under the tile: this one is open / running. */
  active?: boolean
  onSelect?: () => void
}

export type DockProps = {
  /** The entries to show. */
  items: readonly DockItem[]
  /** What screen readers call this toolbar (required). */
  label: string
  /** Resting edge length of every tile in px. */
  baseSize?: number
  /** Space between tiles in px. */
  gap?: number
  /** Scale of the tile right under the pointer. */
  magnification?: number
  /** Radius of the pointer's influence in px; about three tile pitches reads best. */
  distance?: number
  /** Lay the tiles out in a row or a column. */
  orientation?: 'horizontal' | 'vertical'
  /** Extra classes for the root element. */
  className?: string
}

/** 升余弦衰减：指针正下是 1，影响半径处是 0，中间平滑过渡；线性衰减会让只有被悬停的那个在动。 */
export const falloff = (delta: number, distance: number) => {
  const spread = Math.abs(delta)
  return spread >= distance ? 0 : (Math.cos((Math.PI * spread) / distance) + 1) / 2
}

type TileProps = {
  item: DockItem
  pointer: MotionValue<number>
  baseSize: number
  magnification: number
  distance: number
  vertical: boolean
  index: number
  registerRef: (index: number, el: HTMLButtonElement | null) => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void
}

function Tile({
  item,
  pointer,
  baseSize,
  magnification,
  distance,
  vertical,
  index,
  registerRef,
  onKeyDown,
}: TileProps) {
  const ref = useRef<HTMLButtonElement | null>(null)
  const [hot, setHot] = useState(false)
  const bounce = useMotionValue(0)
  const scaleRaw = useTransform(pointer, (p) => {
    const el = ref.current
    if (!el || !Number.isFinite(p)) return 1
    const rect = el.getBoundingClientRect()
    const center = vertical ? rect.top + rect.height / 2 : rect.left + rect.width / 2
    return 1 + (magnification - 1) * falloff(p - center, distance)
  })
  const scale = useSpring(scaleRaw, TRACK_SPRING)
  const size = useTransform(scale, (s) => baseSize * s)
  const select = () => {
    item.onSelect?.()
    void animate(
      bounce,
      BOUNCE.y.map((v) => v * baseSize),
      { duration: BOUNCE.duration, times: BOUNCE.times },
    )
  }
  return (
    <motion.div
      className="relative flex shrink-0 items-center justify-center"
      style={vertical ? { height: size, width: baseSize } : { width: size, height: baseSize }}
    >
      <motion.button
        ref={(el) => {
          ref.current = el
          registerRef(index, el)
        }}
        type="button"
        aria-label={item.label}
        data-slot="dock-tile"
        data-active={item.active ? '' : undefined}
        onClick={select}
        onKeyDown={(event) => onKeyDown(event, index)}
        onPointerEnter={() => setHot(true)}
        onPointerLeave={() => setHot(false)}
        onFocus={() => setHot(true)}
        onBlur={() => setHot(false)}
        className={cn(
          'flex cursor-pointer items-center justify-center rounded-[var(--radius-overlay)] border border-alpha-white-6 bg-surface-3 text-ink-2',
          'transition-colors duration-100 hover:bg-surface-4 hover:text-ink',
          focusRing,
        )}
        style={{ width: size, height: size, y: vertical ? 0 : bounce, x: vertical ? bounce : 0 }}
      >
        <span className="flex items-center justify-center [&_svg]:size-1/2">{item.icon}</span>
      </motion.button>
      {item.active ? (
        <span
          aria-hidden="true"
          className={cn(
            'absolute size-1 rounded-full bg-ink-3',
            vertical ? '-right-2 top-1/2 -translate-y-1/2' : '-bottom-2 left-1/2 -translate-x-1/2',
          )}
        />
      ) : null}
      <span
        aria-hidden="true"
        className={cn(
          'k-text-caption pointer-events-none absolute z-10 rounded-[6px] border border-alpha-white-6 bg-surface-4 px-2 py-1 whitespace-nowrap text-ink-2 transition-[opacity,scale] duration-150',
          vertical ? 'top-1/2 left-full ml-3 -translate-y-1/2' : 'bottom-full left-1/2 mb-3 -translate-x-1/2',
          hot ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
        )}
      >
        {item.label}
      </span>
    </motion.div>
  )
}

export function Dock({
  items,
  label,
  baseSize = 40,
  gap = 8,
  magnification = 1.6,
  distance = 140,
  orientation = 'horizontal',
  className,
}: DockProps) {
  const vertical = orientation === 'vertical'
  const pointer = useMotionValue(Number.NaN)
  const tiles = useRef(new Map<number, HTMLButtonElement>())
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = { [vertical ? 'ArrowDown' : 'ArrowRight']: 1, [vertical ? 'ArrowUp' : 'ArrowLeft']: -1 }[event.key]
    if (next === undefined) return
    event.preventDefault()
    tiles.current.get((index + next + items.length) % items.length)?.focus()
  }
  return (
    <div
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation}
      data-slot="dock"
      className={cn(
        'inline-flex items-end rounded-[var(--radius-overlay)] border border-alpha-white-6 bg-surface-2 p-2',
        vertical ? 'flex-col items-center' : 'flex-row',
        className,
      )}
      style={{ gap }}
      onPointerMove={(event) => pointer.set(vertical ? event.clientY : event.clientX)}
      onPointerLeave={() => pointer.set(Number.NaN)}
    >
      {items.map((item, index) => (
        <Tile
          key={item.id}
          item={item}
          index={index}
          pointer={pointer}
          baseSize={baseSize}
          magnification={magnification}
          distance={distance}
          vertical={vertical}
          registerRef={(i, el) => {
            if (el) tiles.current.set(i, el)
            else tiles.current.delete(i)
          }}
          onKeyDown={onKeyDown}
        />
      ))}
    </div>
  )
}

// SPDX-License-Identifier: MIT
// 改自 SmoothUI time-machine-stack（https://github.com/educlopez/smoothui ，MIT，© 2024 Eduardo Calvo）
import { AnimatePresence, motion, usePresence } from 'motion/react'
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { cn } from '../lib/cn.ts'
import { focusRing } from '../lib/focus.ts'

// 时间机器叠层：一摞面板按深度（缩小、上移、往后推）排开，只有最前一张可读；滚轮、拖动、方向键往后翻，前一张飞过观众、后一张补上。
// 用来回看策略版本史：最前是当前版本，往后是更早的。深度只靠缩放、位移、z 轴与阴影，不靠透明度（半透明的面板不遮挡后面的，叠层就成了一堆幽灵，原件的话），
// 透明度只用在窗口外进出的那一张。数值与弹簧是原件的常量。

/** 原件的默认：每张后退 50px、上移 36px、缩小 5%、同时露出 4 张、透视 1400px。 */
const DEFAULTS = { depth: 50, offsetY: 36, scaleStep: 0.05, visibleCount: 4, perspective: 1400 }
/** 原件的手势阈值：滚轮 12、冷却 220ms，拖动 48px。 */
const WHEEL_THRESHOLD = 12
const WHEEL_COOLDOWN_MS = 220
const DRAG_THRESHOLD = 48
/** 原件的弹簧（bounce 0.1 · 0.25s）与进出场的缓出曲线。 */
const SPRING = { type: 'spring' as const, bounce: 0.1, duration: 0.25 }
const EXIT = { duration: 0.25, ease: [0.23, 1, 0.32, 1] as const }

export type TimeMachineStackItem = {
  id: string
  content: ReactNode
}

export type TimeMachineStackProps = {
  /** The panels, front first. */
  items: readonly TimeMachineStackItem[]
  /** What screen readers call the stack (required). */
  label: string
  /** Spoken position, e.g. "3 of 12" (required). */
  status: (index: number, total: number) => string
  /** Index of the front item (controlled). */
  index?: number
  /** Called with the new front index. */
  onIndexChange?: (index: number) => void
  /** How far each receding panel is pushed back, px. */
  depth?: number
  /** How far each receding panel moves up, px. */
  offsetY?: number
  /** How much each receding panel shrinks, 0 to 1. */
  scaleStep?: number
  /** How many panels show at once; the rest stay unmounted. */
  visibleCount?: number
  /** CSS perspective of the stack, px. */
  perspective?: number
  /** Extra classes for the root element. */
  className?: string
}

const clampIndex = (value: number, max: number) => Math.min(Math.max(value, 0), max)
// 一条 transform 字符串而不是 motion 的 y / z / scale 简写：简写走 CSS 变量，合成器不加速，而透视下的一摞满幅面板正是该留在主线程外的情形（原件的话）。
const toTransform = (y: number, z: number, scale: number) => `translateY(${y}px) translateZ(${z}px) scale(${scale})`

type PanelProps = {
  id: string
  front: boolean
  initial: { opacity: number; transform: string }
  animate: { opacity: number; transform: string }
  exit: { opacity: number; transform: string; transition: typeof EXIT }
  top: number
  zIndex: number
  children: ReactNode
}

// 飞出去的那张在退场动画里还挂着：用 usePresence 把它的 aria-selected 与读屏可见性摘掉，免得同时有两张「选中」。
function Panel({ id, front, top, zIndex, children, ...motionProps }: PanelProps) {
  const [present] = usePresence()
  return (
    <motion.div
      id={id}
      role="option"
      aria-selected={front && present}
      aria-hidden={present ? undefined : true}
      {...motionProps}
      transition={SPRING}
      className="absolute inset-x-0 bottom-0 overflow-hidden rounded-[var(--radius-overlay)] border border-(color:--k-separable-secondary-borderColor) bg-(--k-surface-overlay-background) shadow-(--shadow-overlay)"
      style={{ top, zIndex }}
    >
      {children}
    </motion.div>
  )
}

export function TimeMachineStack({
  items,
  label,
  status,
  index,
  onIndexChange,
  depth = DEFAULTS.depth,
  offsetY = DEFAULTS.offsetY,
  scaleStep = DEFAULTS.scaleStep,
  visibleCount = DEFAULTS.visibleCount,
  perspective = DEFAULTS.perspective,
  className,
}: TimeMachineStackProps) {
  const listId = useId()
  const lastIndex = Math.max(items.length - 1, 0)
  const controlled = index !== undefined
  const [inner, setInner] = useState(0)
  const current = clampIndex(controlled ? index : inner, lastIndex)
  const box = useRef<HTMLDivElement>(null)
  const wheelLock = useRef(false)
  const dragOrigin = useRef<number | null>(null)

  // 方向从 index 本身推：外部受控改 index 时也对。往前翻（+1）最前一张飞过观众，往回翻（-1）从前面落下。
  // 用「渲染中按 prop 变化调整 state」的写法，不在渲染里读写 ref。
  const [track, setTrack] = useState({ index: current, dir: 1 })
  let dir = track.dir
  if (track.index !== current) {
    dir = current > track.index ? 1 : -1
    setTrack({ index: current, dir })
  }

  const goTo = useCallback(
    (next: number) => {
      const clamped = clampIndex(next, lastIndex)
      if (clamped === current) return
      if (!controlled) setInner(clamped)
      onIndexChange?.(clamped)
    },
    [current, controlled, lastIndex, onIndexChange],
  )

  useEffect(() => {
    const node = box.current
    if (!node) return
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < WHEEL_THRESHOLD || wheelLock.current) return
      const next = current + (event.deltaY > 0 ? 1 : -1)
      // 到头了把滚轮还给页面，不拦文档滚动。
      if (next < 0 || next > lastIndex) return
      event.preventDefault()
      wheelLock.current = true
      goTo(next)
      setTimeout(() => {
        wheelLock.current = false
      }, WHEEL_COOLDOWN_MS)
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [current, goTo, lastIndex])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = { ArrowDown: current + 1, ArrowUp: current - 1, Home: 0, End: lastIndex }[event.key]
    if (target === undefined) return
    event.preventDefault()
    goTo(target)
  }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const origin = dragOrigin.current
    dragOrigin.current = null
    if (origin === null) return
    const delta = origin - event.clientY
    if (Math.abs(delta) >= DRAG_THRESHOLD) goTo(current + (delta > 0 ? 1 : -1))
  }

  const stateAt = (pos: number) =>
    pos < 0
      ? { opacity: 0, transform: toTransform(offsetY * 2, depth * 2, 1 + scaleStep * 2) }
      : {
          opacity: pos >= visibleCount ? 0 : 1,
          transform: toTransform(-pos * offsetY, -pos * depth, 1 - pos * scaleStep),
        }

  const visible = items.slice(current, current + visibleCount).map((item, pos) => ({ item, pos }))
  const front = visible[0]?.item
  // 后退的面板向上移，所以顶上留够位置，面板都贴着底边（不留的话深处的面板被推出盒子，叠层读成一张平卡）。
  const reservedTop = Math.max(visibleCount - 1, 0) * offsetY
  const exitState = dir === 1 ? stateAt(-1) : stateAt(visibleCount)

  return (
    <div data-slot="time-machine-stack" className={cn('flex w-full flex-col items-center gap-3', className)}>
      <div
        ref={box}
        id={listId}
        role="listbox"
        tabIndex={0}
        aria-label={label}
        aria-activedescendant={front ? `${listId}-${front.id}` : undefined}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          dragOrigin.current = event.clientY
        }}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragOrigin.current = null
        }}
        className={cn(
          'relative min-h-56 w-full flex-1 touch-none select-none rounded-[var(--radius-overlay)]',
          focusRing,
        )}
        style={{ perspective, touchAction: 'none' }}
      >
        <AnimatePresence initial={false}>
          {/* js/copying-array-methods：toReversed 替代「slice 复制再 reverse」。 */}
          {visible.toReversed().map(({ item, pos }) => {
            const state = stateAt(pos)
            return (
              <Panel
                key={item.id}
                id={`${listId}-${item.id}`}
                front={pos === 0}
                // 面板只会从两个位置进来：往前翻时在最深一格之后，往回翻时在最前面。
                initial={dir === 1 ? stateAt(visibleCount) : stateAt(-1)}
                animate={state}
                exit={{ opacity: 0, transform: exitState.transform, transition: EXIT }}
                top={reservedTop}
                zIndex={visibleCount - pos}
              >
                {item.content}
              </Panel>
            )
          })}
        </AnimatePresence>
      </div>
      <div aria-live="polite" className="sr-only">
        {front ? status(current, items.length) : ''}
      </div>
    </div>
  )
}
